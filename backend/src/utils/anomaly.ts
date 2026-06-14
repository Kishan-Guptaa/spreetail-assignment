import { calculateSplits } from './splits';

export interface CSVRow {
  date: string;
  title: string;
  description: string;
  amount: string;
  currency: string;
  paidByEmail: string;
  splitType: string;
  participantEmails: string; // Comma-separated emails
  splitValues: string; // Comma-separated values (corresponding to splitType)
  notes: string;
  attachment: string;
}

export interface Anomaly {
  issueType: string; // "MALFORMED_ROW" | "BLANK_FIELD" | "NEGATIVE_AMOUNT" | "INVALID_DATE" | "FUTURE_DATE" | "INVALID_CURRENCY" | "UNKNOWN_MEMBER" | "MEMBER_INACTIVE" | "MISSING_PAYER" | "SETTLEMENT_FLAG" | "INCORRECT_SPLIT" | "DUPLICATE" | "DUPLICATE_DIFFERENT_AMOUNT";
  severity: "ERROR" | "WARNING" | "INFO";
  description: string;
  suggestedAction: string;
}

export interface GroupMemberData {
  id: string;
  email: string;
  name: string;
  joinDate: Date;
  leaveDate: Date | null;
  status: string;
}

export interface ExistingExpenseData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: Date;
  paidByEmail: string;
}

/**
 * Robust CSV Line Parser that handles quotes and commas correctly.
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Check an individual CSV row for all specified anomalies.
 */
export function checkRowAnomalies(
  rowIndex: number,
  rawColumns: string[],
  headersCount: number,
  members: GroupMemberData[],
  existingExpenses: ExistingExpenseData[]
): { rowData: Partial<CSVRow>; anomalies: Anomaly[] } {
  const anomalies: Anomaly[] = [];

  // 1. Malformed Row
  if (rawColumns.length !== headersCount) {
    return {
      rowData: {},
      anomalies: [
        {
          issueType: 'MALFORMED_ROW',
          severity: 'ERROR',
          description: `Row has ${rawColumns.length} columns, but header specifies ${headersCount} columns`,
          suggestedAction: 'Reject this row or edit details manually'
        }
      ]
    };
  }

  // Header indices map:
  // 0: Date, 1: Title, 2: Description, 3: Amount, 4: Currency, 5: PaidByEmail, 6: SplitType, 7: ParticipantEmails, 8: SplitValues, 9: Notes, 10: Attachment
  const rowData: CSVRow = {
    date: rawColumns[0] || '',
    title: rawColumns[1] || '',
    description: rawColumns[2] || '',
    amount: rawColumns[3] || '',
    currency: rawColumns[4] || '',
    paidByEmail: rawColumns[5] || '',
    splitType: rawColumns[6] || 'EQUAL',
    participantEmails: rawColumns[7] || '',
    splitValues: rawColumns[8] || '',
    notes: rawColumns[9] || '',
    attachment: rawColumns[10] || ''
  };

  // 2. Blank Fields
  const blankFields: string[] = [];
  if (!rowData.title) blankFields.push('Title');
  if (!rowData.amount) blankFields.push('Amount');
  if (!rowData.date) blankFields.push('Date');
  if (!rowData.paidByEmail) blankFields.push('PaidByEmail');

  if (blankFields.length > 0) {
    anomalies.push({
      issueType: 'BLANK_FIELD',
      severity: 'ERROR',
      description: `Missing required field(s): ${blankFields.join(', ')}`,
      suggestedAction: 'Provide values for the missing fields'
    });
  }

  // 3. Missing Payer
  if (!rowData.paidByEmail) {
    anomalies.push({
      issueType: 'MISSING_PAYER',
      severity: 'ERROR',
      description: 'Payer email is missing',
      suggestedAction: 'Provide a valid group member email as the payer'
    });
  }

  // 4. Negative or Zero Amount
  const amountNum = parseFloat(rowData.amount);
  if (rowData.amount && (isNaN(amountNum) || amountNum <= 0)) {
    anomalies.push({
      issueType: 'NEGATIVE_AMOUNT',
      severity: 'ERROR',
      description: `Amount '${rowData.amount}' must be a positive number greater than 0`,
      suggestedAction: 'Correct the amount to a positive number'
    });
  }

  // 5. Invalid Currency
  const validCurrencies = ['USD', 'INR', 'EUR'];
  const currencyUpper = rowData.currency.toUpperCase();
  if (rowData.currency && !validCurrencies.includes(currencyUpper)) {
    anomalies.push({
      issueType: 'INVALID_CURRENCY',
      severity: 'WARNING',
      description: `Currency '${rowData.currency}' is unsupported. Supported: USD, INR, EUR. Will fallback to group base currency if approved`,
      suggestedAction: 'Change currency to USD, INR, or EUR'
    });
  }

  // 6. Invalid Date
  let expenseDate: Date | null = null;
  if (rowData.date) {
    const timestamp = Date.parse(rowData.date);
    if (isNaN(timestamp)) {
      anomalies.push({
        issueType: 'INVALID_DATE',
        severity: 'ERROR',
        description: `Date '${rowData.date}' could not be parsed. Use YYYY-MM-DD`,
        suggestedAction: 'Format date as YYYY-MM-DD'
      });
    } else {
      expenseDate = new Date(timestamp);
    }
  }

  // 7. Future Dates
  if (expenseDate && expenseDate.getTime() > Date.now()) {
    anomalies.push({
      issueType: 'FUTURE_DATE',
      severity: 'WARNING',
      description: `Expense date '${rowData.date}' is in the future`,
      suggestedAction: 'Approve if this is planned, or adjust to today/past date'
    });
  }

  // 8. Unknown Payer & Participant Members mapping
  const activeMembersEmails = members.map(m => m.email.toLowerCase());
  const memberMap = new Map(members.map(m => [m.email.toLowerCase(), m]));

  if (rowData.paidByEmail && !activeMembersEmails.includes(rowData.paidByEmail.toLowerCase())) {
    anomalies.push({
      issueType: 'UNKNOWN_MEMBER',
      severity: 'WARNING',
      description: `Payer email '${rowData.paidByEmail}' is not in the group. Will auto-invite on import if approved`,
      suggestedAction: 'Select an existing group member or approve to auto-invite'
    });
  }

  const participantsList = rowData.participantEmails
    ? rowData.participantEmails.split(';').map(e => e.trim().toLowerCase()).filter(Boolean)
    : [];

  const unknownParticipants = participantsList.filter(email => !activeMembersEmails.includes(email));
  if (unknownParticipants.length > 0) {
    anomalies.push({
      issueType: 'UNKNOWN_MEMBER',
      severity: 'WARNING',
      description: `Participant email(s) not in group: ${unknownParticipants.join(', ')}`,
      suggestedAction: 'Approve to invite them to the group, or remove them from participants'
    });
  }

  // 9. Member Not Active During Expense Date
  if (expenseDate) {
    // Check payer
    const payerMember = memberMap.get(rowData.paidByEmail.toLowerCase());
    if (payerMember) {
      const joinTime = new Date(payerMember.joinDate).getTime();
      const leaveTime = payerMember.leaveDate ? new Date(payerMember.leaveDate).getTime() : null;
      const expenseTime = expenseDate.getTime();

      if (expenseTime < joinTime || (leaveTime && expenseTime > leaveTime)) {
        anomalies.push({
          issueType: 'MEMBER_INACTIVE',
          severity: 'WARNING',
          description: `Payer '${payerMember.name}' was not active in this group on ${rowData.date} (Joined: ${payerMember.joinDate.toISOString().split('T')[0]})`,
          suggestedAction: 'Approve if adjusting membership, or modify expense date'
        });
      }
    }

    // Check participants
    for (const pEmail of participantsList) {
      const partMember = memberMap.get(pEmail);
      if (partMember) {
        const joinTime = new Date(partMember.joinDate).getTime();
        const leaveTime = partMember.leaveDate ? new Date(partMember.leaveDate).getTime() : null;
        const expenseTime = expenseDate.getTime();

        if (expenseTime < joinTime || (leaveTime && expenseTime > leaveTime)) {
          anomalies.push({
            issueType: 'MEMBER_INACTIVE',
            severity: 'WARNING',
            description: `Participant '${partMember.name}' was not active in the group on ${rowData.date}`,
            suggestedAction: 'Approve to override, or exclude participant from this split'
          });
        }
      }
    }
  }

  // 10. Settlement Entered as Expense
  const settlementKeywords = ['settle', 'settlement', 'repaid', 'payment', 'paid back', 'paid off', 'cleared'];
  const textToCheck = `${rowData.title} ${rowData.description}`.toLowerCase();
  const matchesKeyword = settlementKeywords.some(keyword => textToCheck.includes(keyword));
  if (matchesKeyword) {
    anomalies.push({
      issueType: 'SETTLEMENT_FLAG',
      severity: 'INFO',
      description: `Keywords suggest this is a settlement rather than an expense`,
      suggestedAction: 'Check box to record as a Settlement transaction'
    });
  }

  // 11. Incorrect Split Totals
  if (!isNaN(amountNum) && amountNum > 0 && rowData.splitType) {
    const splitValuesList = rowData.splitValues
      ? rowData.splitValues.split(';').map(v => parseFloat(v)).filter(v => !isNaN(v))
      : [];

    // Map participants: we'll simulate splitting on active members or draft emails.
    // If a participant doesn't have a value specified, assume 0 (unless Equal split)
    const splitParticipants = participantsList.map((email, idx) => ({
      memberId: email,
      shareValue: splitValuesList[idx] || 0
    }));

    if (rowData.splitType.toUpperCase() !== 'EQUAL' && splitParticipants.length > 0) {
      const splitCheck = calculateSplits(amountNum, rowData.splitType, splitParticipants);
      if (!splitCheck.valid) {
        anomalies.push({
          issueType: 'INCORRECT_SPLIT',
          severity: 'ERROR',
          description: splitCheck.error || 'Split validation failed',
          suggestedAction: 'Edit split values or choose EQUAL split'
        });
      }
    }
  }

  // 12. Duplicate Expense or Different Amount for Duplicate Entries
  if (rowData.title && !isNaN(amountNum) && expenseDate && rowData.paidByEmail) {
    const payerEmailLower = rowData.paidByEmail.toLowerCase();
    const dateStr = expenseDate.toISOString().split('T')[0];

    const duplicateExact = existingExpenses.find(e => {
      const eDateStr = new Date(e.date).toISOString().split('T')[0];
      return (
        e.title.toLowerCase() === rowData.title.toLowerCase() &&
        Math.abs(e.amount - amountNum) < 0.01 &&
        e.paidByEmail.toLowerCase() === payerEmailLower &&
        eDateStr === dateStr
      );
    });

    if (duplicateExact) {
      anomalies.push({
        issueType: 'DUPLICATE',
        severity: 'WARNING',
        description: `An identical expense '${rowData.title}' of ${rowData.amount} ${rowData.currency} paid by ${rowData.paidByEmail} exists on ${dateStr}`,
        suggestedAction: 'Reject duplicate import, or import as separate transaction'
      });
    } else {
      // 13. Different amount for duplicate entries
      const duplicateDiffAmount = existingExpenses.find(e => {
        const eDateStr = new Date(e.date).toISOString().split('T')[0];
        return (
          e.title.toLowerCase() === rowData.title.toLowerCase() &&
          e.paidByEmail.toLowerCase() === payerEmailLower &&
          eDateStr === dateStr &&
          Math.abs(e.amount - amountNum) >= 0.01
        );
      });

      if (duplicateDiffAmount) {
        anomalies.push({
          issueType: 'DUPLICATE_DIFFERENT_AMOUNT',
          severity: 'WARNING',
          description: `A similar expense '${rowData.title}' exists on ${dateStr} by ${rowData.paidByEmail} but with a different amount of ${duplicateDiffAmount.amount} ${duplicateDiffAmount.currency}`,
          suggestedAction: 'Approve to import (amount mismatch) or Reject duplicate'
        });
      }
    }
  }

  return {
    rowData,
    anomalies
  };
}
