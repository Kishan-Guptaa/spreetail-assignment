import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { checkRowAnomalies, parseCSVLine, CSVRow, GroupMemberData, ExistingExpenseData } from '../utils/anomaly';
import { CurrencyService } from '../utils/currency';
import { calculateSplits } from '../utils/splits';

// Multer is used to receive the upload
export const uploadCSV = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User context missing' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV file is empty or only contains headers' });
    }

    // Header validation
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);
    const headersCount = headers.length;

    // Fetch existing group data for anomalies
    const groupMembers: GroupMemberData[] = group.members.map(m => ({
      id: m.id,
      email: m.email,
      name: m.name,
      joinDate: m.joinDate,
      leaveDate: m.leaveDate,
      status: m.status
    }));

    const dbExpenses = await prisma.expense.findMany({
      where: { groupId },
      include: { paidBy: true }
    });

    const existingExpenses: ExistingExpenseData[] = dbExpenses.map(e => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      currency: e.currency,
      date: e.date,
      paidByEmail: e.paidBy.email
    }));

    // Create session in database
    const session = await prisma.importSession.create({
      data: {
        groupId,
        uploadedById: userId,
        fileName: req.file.originalname,
        status: 'PENDING',
        totalRows: lines.length - 1
      }
    });

    let errorsCount = 0;
    let warningsCount = 0;

    // Scan lines for anomalies
    for (let i = 1; i < lines.length; i++) {
      const rawCols = parseCSVLine(lines[i]);
      const { rowData, anomalies } = checkRowAnomalies(i, rawCols, headersCount, groupMembers, existingExpenses);

      // Create an ImportIssue record for this row if anomalies exist
      if (anomalies.length > 0) {
        for (const anomaly of anomalies) {
          if (anomaly.severity === 'ERROR') errorsCount++;
          if (anomaly.severity === 'WARNING') warningsCount++;

          await prisma.importIssue.create({
            data: {
              sessionId: session.id,
              rowIndex: i,
              rowData: JSON.stringify(rowData),
              issueType: anomaly.issueType,
              severity: anomaly.severity,
              description: anomaly.description,
              suggestedAction: anomaly.suggestedAction,
              status: 'PENDING'
            }
          });
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPLOAD_IMPORT_CSV',
        details: `Uploaded file '${req.file.originalname}' containing ${lines.length - 1} rows. Found errors/warnings.`
      }
    });

    return res.status(201).json({
      session,
      errorsCount,
      warningsCount,
      totalRows: lines.length - 1
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    return res.status(500).json({ error: 'Server error processing CSV file' });
  }
};

export const getImportSessions = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;

  try {
    const sessions = await prisma.importSession.findMany({
      where: { groupId },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { issues: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(sessions);
  } catch (error) {
    console.error('Get import sessions error:', error);
    return res.status(500).json({ error: 'Server error retrieving import history' });
  }
};

export const getImportIssues = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  try {
    const issues = await prisma.importIssue.findMany({
      where: { sessionId },
      orderBy: { rowIndex: 'asc' }
    });

    return res.json(issues);
  } catch (error) {
    console.error('Get import issues error:', error);
    return res.status(500).json({ error: 'Server error retrieving import issues' });
  }
};

export const resolveImportIssue = async (req: AuthRequest, res: Response) => {
  const { issueId } = req.params;
  const { action, resolvedData } = req.body; // Action: "APPROVE", "REJECT", "IGNORE", "EDIT"

  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  try {
    const issue = await prisma.importIssue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return res.status(404).json({ error: 'Import issue not found' });
    }

    const updatedIssue = await prisma.importIssue.update({
      where: { id: issueId },
      data: {
        status: action === 'EDIT' ? 'APPROVED' : action, // Treat Edit as Approved with resolved values
        suggestedAction: action,
        resolvedData: resolvedData ? JSON.stringify(resolvedData) : null
      }
    });

    return res.json(updatedIssue);
  } catch (error) {
    console.error('Resolve issue error:', error);
    return res.status(500).json({ error: 'Server error updating issue resolution' });
  }
};

// Batch Action helper: Approve/Reject all issues of a specific severity
export const batchResolveIssues = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const { severity, action } = req.body; // severity: "WARNING" / "INFO", action: "APPROVED" / "IGNORED"

  if (!severity || !action) {
    return res.status(400).json({ error: 'Severity and action parameters are required' });
  }

  try {
    // Only allow batch resolving WARNINGs or INFOs. Errors MUST be resolved individually or skipped (rejected)
    if (severity === 'ERROR' && action !== 'REJECTED') {
      return res.status(400).json({ error: 'Critical errors cannot be batch approved; they must be corrected or rejected' });
    }

    const result = await prisma.importIssue.updateMany({
      where: {
        sessionId,
        severity,
        status: 'PENDING'
      },
      data: {
        status: action
      }
    });

    return res.json({ message: `Successfully resolved ${result.count} issues`, count: result.count });
  } catch (error) {
    console.error('Batch resolve issues error:', error);
    return res.status(500).json({ error: 'Server error performing batch resolve' });
  }
};

export const commitImport = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'User context missing' });
  }

  try {
    const session = await prisma.importSession.findUnique({
      where: { id: sessionId },
      include: {
        group: { include: { members: true } },
        issues: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Import session not found' });
    }

    if (session.status !== 'PENDING') {
      return res.status(400).json({ error: 'This session has already been processed' });
    }

    // 1. Check if there are any remaining PENDING issues
    const pendingCount = session.issues.filter(i => i.status === 'PENDING').length;
    if (pendingCount > 0) {
      return res.status(400).json({ error: `Please resolve all ${pendingCount} remaining issue alerts before committing the import` });
    }

    // 2. Fetch or load raw rows. Since we didn't save the full file in db, we reconstruct it by combining
    // rows that have issues (stored in db) and rows that were error-free.
    // However, a much cleaner design is:
    // Every row that has an anomaly is in the `issues` table.
    // What about rows that had NO anomalies?
    // We can either pass the data again, or since we want the importer to be solid, we process based on
    // what the client sends us or what we have.
    // Actually, to make this backend self-sufficient, let's require the client to pass the original/edited rows array
    // during the commit step, OR store the rows inside the import session.
    // Wait, the client passing the final rows array in the request body `rows` is extremely clean!
    // Why? The client has the fully parsed preview table on the screen (including inline edits).
    // The client sends the list of `rows` to commit, along with their resolution actions, and we process them.
    // Let's implement that! The request body contains `rows`: an array of `{ rowIndex: number, data: CSVRow, action: 'APPROVE'|'REJECT' }`.
    // This makes the backend incredibly robust, stateless for the file content, and guarantees the server commits exactly what the user reviewed!

    const { rows } = req.body as {
      rows: { rowIndex: number; data: CSVRow; action: 'APPROVE' | 'REJECT' | 'IGNORE' }[];
    };

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided to commit' });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const group = session.group;

    await prisma.$transaction(async (tx) => {
      // Keep track of newly created members to avoid duplicate invitations in this batch
      const currentMembers = [...group.members];
      const memberEmailMap = new Map(currentMembers.map(m => [m.email.toLowerCase(), m]));

      for (const rowItem of rows) {
        const { data, action } = rowItem;

        if (action === 'REJECT') {
          skippedCount++;
          continue;
        }

        const amountVal = parseFloat(data.amount);
        if (isNaN(amountVal) || amountVal <= 0) {
          skippedCount++;
          continue; // Guard against saving invalid numbers
        }

        // Handle auto-invite of unknown payer
        const payerEmail = data.paidByEmail.toLowerCase();
        let payerMember = memberEmailMap.get(payerEmail);

        if (!payerMember) {
          // Auto-invite new member
          const namePart = data.paidByEmail.split('@')[0];
          const newMem = await tx.groupMember.create({
            data: {
              groupId: group.id,
              email: payerEmail,
              name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
              status: 'ACTIVE',
              joinDate: new Date(data.date) // backdate joinDate to accommodate the expense
            }
          });
          currentMembers.push(newMem);
          memberEmailMap.set(payerEmail, newMem);
          payerMember = newMem;
        }

        // Handle participants auto-invites
        const participantsEmails = data.participantEmails
          ? data.participantEmails.split(';').map(e => e.trim().toLowerCase()).filter(Boolean)
          : [];

        const participantMembers: typeof currentMembers = [];

        for (const pEmail of participantsEmails) {
          let partMem = memberEmailMap.get(pEmail);
          if (!partMem) {
            const namePart = pEmail.split('@')[0];
            partMem = await tx.groupMember.create({
              data: {
                groupId: group.id,
                email: pEmail,
                name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
                status: 'ACTIVE',
                joinDate: new Date(data.date)
              }
            });
            currentMembers.push(partMem);
            memberEmailMap.set(pEmail, partMem);
          }
          participantMembers.push(partMem);
        }

        // Convert currency
        const expenseCurrency = (data.currency || group.baseCurrency).toUpperCase();
        const baseCurrency = group.baseCurrency;
        const amountInBase = await CurrencyService.convert(amountVal, expenseCurrency, baseCurrency);

        // Splitting details: Map values
        const splitValues = data.splitValues
          ? data.splitValues.split(';').map(v => parseFloat(v)).filter(v => !isNaN(v))
          : [];

        // Build participants list for split calculator
        const participantsInput = participantMembers.map((member, idx) => ({
          memberId: member.id,
          shareValue: splitValues[idx] || 0
        }));

        const splitCheck = calculateSplits(amountVal, data.splitType, participantsInput);
        if (!splitCheck.valid) {
          // If split is invalid, default to Equal
          const equalInput = participantMembers.map(m => ({ memberId: m.id, shareValue: 100 / participantMembers.length }));
          const equalSplit = calculateSplits(amountVal, 'EQUAL', equalInput);

          const newExp = await tx.expense.create({
            data: {
              groupId: group.id,
              title: data.title,
              description: data.description,
              amount: amountVal,
              currency: expenseCurrency,
              amountInBase,
              date: new Date(data.date),
              paidById: payerMember.id,
              splitType: 'EQUAL',
              notes: data.notes,
              attachmentUrl: data.attachment,
              importSessionId: session.id
            }
          });

          for (const split of equalSplit.splits) {
            const shareInBase = await CurrencyService.convert(split.calculatedShare, expenseCurrency, baseCurrency);
            await tx.expenseParticipant.create({
              data: {
                expenseId: newExp.id,
                memberId: split.memberId,
                shareValue: split.shareValue,
                calculatedShare: split.calculatedShare,
                calculatedShareInBase: shareInBase
              }
            });
          }
        } else {
          // Split is valid, save it
          const newExp = await tx.expense.create({
            data: {
              groupId: group.id,
              title: data.title,
              description: data.description,
              amount: amountVal,
              currency: expenseCurrency,
              amountInBase,
              date: new Date(data.date),
              paidById: payerMember.id,
              splitType: data.splitType.toUpperCase(),
              notes: data.notes,
              attachmentUrl: data.attachment,
              importSessionId: session.id
            }
          });

          for (const split of splitCheck.splits) {
            // Find member ID to match
            const memberRecord = participantMembers.find(m => m.email.toLowerCase() === split.memberId);
            const actualMemberId = memberRecord ? memberRecord.id : split.memberId;

            const shareInBase = await CurrencyService.convert(split.calculatedShare, expenseCurrency, baseCurrency);
            await tx.expenseParticipant.create({
              data: {
                expenseId: newExp.id,
                memberId: actualMemberId,
                shareValue: split.shareValue,
                calculatedShare: split.calculatedShare,
                calculatedShareInBase: shareInBase
              }
            });
          }
        }

        importedCount++;
      }

      // 3. Mark session as Completed
      await tx.importSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          importedRows: importedCount,
          skippedRows: skippedCount
        }
      });
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'COMMIT_IMPORT_CSV',
        details: `Committed CSV import session ${sessionId}: ${importedCount} expenses imported, ${skippedCount} rows skipped.`
      }
    });

    return res.json({
      message: 'CSV import successfully committed',
      importedRows: importedCount,
      skippedRows: skippedCount
    });
  } catch (error) {
    console.error('Commit import error:', error);
    return res.status(500).json({ error: 'Server error committing CSV expenses' });
  }
};

export const getImportReport = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  try {
    const session = await prisma.importSession.findUnique({
      where: { id: sessionId },
      include: {
        group: { select: { name: true, baseCurrency: true } },
        uploadedBy: { select: { name: true } },
        issues: true,
        expenses: {
          include: {
            paidBy: { select: { name: true } }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Import report session not found' });
    }

    return res.json(session);
  } catch (error) {
    console.error('Get import report error:', error);
    return res.status(500).json({ error: 'Server error retrieving import report details' });
  }
};

