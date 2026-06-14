import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { calculateSplits } from '../utils/splits';
import { CurrencyService } from '../utils/currency';

export const createExpense = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { title, description, amount, currency, date, paidById, splitType, participants, notes, attachmentUrl } = req.body;
  const userId = req.user?.id;

  if (!title || !amount || !paidById || !splitType || !participants || !participants.length) {
    return res.status(400).json({ error: 'Missing required expense fields' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const expenseDate = date ? new Date(date) : new Date();

    // 1. Verify payer is active on expense date
    const payer = group.members.find(m => m.id === paidById);
    if (!payer) {
      return res.status(400).json({ error: 'Payer is not a member of this group' });
    }
    if (payer.status === 'INACTIVE') {
      return res.status(400).json({ error: 'Payer is currently marked as inactive' });
    }
    const payerJoin = new Date(payer.joinDate).getTime();
    const payerLeave = payer.leaveDate ? new Date(payer.leaveDate).getTime() : null;
    const expTime = expenseDate.getTime();
    if (expTime < payerJoin || (payerLeave && expTime > payerLeave)) {
      return res.status(400).json({ error: `Payer was not active on the expense date (${expenseDate.toISOString().split('T')[0]})` });
    }

    // 2. Verify all participants are active on expense date
    const participantIds = participants.map((p: any) => p.memberId);
    for (const memberId of participantIds) {
      const part = group.members.find(m => m.id === memberId);
      if (!part) {
        return res.status(400).json({ error: `Participant with memberId ${memberId} is not in group` });
      }
      const pJoin = new Date(part.joinDate).getTime();
      const pLeave = part.leaveDate ? new Date(part.leaveDate).getTime() : null;
      if (expTime < pJoin || (pLeave && expTime > pLeave)) {
        return res.status(400).json({ error: `Participant '${part.name}' was not active in group on expense date` });
      }
    }

    // 3. Convert currencies
    const expenseCurrency = currency || group.baseCurrency;
    const amountInBase = await CurrencyService.convert(amount, expenseCurrency, group.baseCurrency);

    // 4. Calculate splits
    const splitCheck = calculateSplits(amount, splitType, participants);
    if (!splitCheck.valid) {
      return res.status(400).json({ error: splitCheck.error });
    }

    // 5. Create expense and participants in a transaction
    const expense = await prisma.$transaction(async (tx) => {
      const newExpense = await tx.expense.create({
        data: {
          groupId,
          title,
          description,
          amount,
          currency: expenseCurrency,
          amountInBase,
          date: expenseDate,
          paidById,
          splitType,
          notes,
          attachmentUrl
        }
      });

      // Save participants
      for (const split of splitCheck.splits) {
        const shareInBase = await CurrencyService.convert(split.calculatedShare, expenseCurrency, group.baseCurrency);
        await tx.expenseParticipant.create({
          data: {
            expenseId: newExpense.id,
            memberId: split.memberId,
            shareValue: split.shareValue,
            calculatedShare: split.calculatedShare,
            calculatedShareInBase: shareInBase
          }
        });
      }

      return newExpense;
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_EXPENSE',
        details: `Created expense '${expense.title}' of ${amount} ${expenseCurrency} in group ${group.name}`
      }
    });

    return res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({ error: 'Server error creating expense' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { search, limit = '20', offset = '0' } = req.query;

  try {
    const whereClause: any = { groupId };

    if (search) {
      whereClause.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: {
        paidBy: true,
        participants: {
          include: { member: true }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.expense.count({ where: whereClause });

    return res.json({ expenses, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({ error: 'Server error retrieving expenses' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, amount, currency, date, paidById, splitType, participants, notes, attachmentUrl } = req.body;
  const userId = req.user?.id;

  try {
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
      include: { group: { include: { members: true } } }
    });

    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expenseDate = date ? new Date(date) : existingExpense.date;
    const group = existingExpense.group;

    // Verify payer is active on date
    const payer = group.members.find(m => m.id === (paidById || existingExpense.paidById));
    if (!payer) {
      return res.status(400).json({ error: 'Payer not found in group' });
    }
    const payerJoin = new Date(payer.joinDate).getTime();
    const payerLeave = payer.leaveDate ? new Date(payer.leaveDate).getTime() : null;
    const expTime = expenseDate.getTime();
    if (expTime < payerJoin || (payerLeave && expTime > payerLeave)) {
      return res.status(400).json({ error: 'Payer was not active on the expense date' });
    }

    // Convert currency if changed
    const expenseCurrency = currency || existingExpense.currency;
    const expenseAmount = amount !== undefined ? amount : existingExpense.amount;
    const amountInBase = await CurrencyService.convert(expenseAmount, expenseCurrency, group.baseCurrency);

    // Update transaction
    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: {
          title,
          description,
          amount: expenseAmount,
          currency: expenseCurrency,
          amountInBase,
          date: expenseDate,
          paidById: paidById || existingExpense.paidById,
          notes,
          attachmentUrl
        }
      });

      if (splitType && participants) {
        // Recalculate splits
        const splitCheck = calculateSplits(expenseAmount, splitType, participants);
        if (!splitCheck.valid) {
          throw new Error(splitCheck.error);
        }

        // Delete old participants
        await tx.expenseParticipant.deleteMany({ where: { expenseId: id } });

        // Add new participants
        for (const split of splitCheck.splits) {
          const shareInBase = await CurrencyService.convert(split.calculatedShare, expenseCurrency, group.baseCurrency);
          await tx.expenseParticipant.create({
            data: {
              expenseId: id,
              memberId: split.memberId,
              shareValue: split.shareValue,
              calculatedShare: split.calculatedShare,
              calculatedShareInBase: shareInBase
            }
          });
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_EXPENSE',
        details: `Updated expense '${existingExpense.title}' (${id})`
      }
    });

    return res.json({ message: 'Expense updated successfully' });
  } catch (error: any) {
    console.error('Update expense error:', error);
    return res.status(500).json({ error: error.message || 'Server error updating expense' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await prisma.expense.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_EXPENSE',
        details: `Deleted expense '${expense.title}'`
      }
    });

    return res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Server error deleting expense' });
  }
};

// Settlements operations
export const recordSettlement = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { payerId, payeeId, amount, currency, date, notes } = req.body;
  const userId = req.user?.id;

  if (!payerId || !payeeId || !amount) {
    return res.status(400).json({ error: 'Missing required settlement fields' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const payer = group.members.find(m => m.id === payerId);
    const payee = group.members.find(m => m.id === payeeId);

    if (!payer || !payee) {
      return res.status(400).json({ error: 'Payer and Payee must be group members' });
    }

    const settlementCurrency = currency || group.baseCurrency;
    const amountInBase = await CurrencyService.convert(amount, settlementCurrency, group.baseCurrency);

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        payeeId,
        amount,
        currency: settlementCurrency,
        amountInBase,
        date: date ? new Date(date) : new Date(),
        notes,
        status: 'SETTLED'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RECORD_SETTLEMENT',
        details: `Recorded settlement: ${payer.name} paid ${amount} ${settlementCurrency} to ${payee.name}`
      }
    });

    return res.status(201).json(settlement);
  } catch (error) {
    console.error('Record settlement error:', error);
    return res.status(500).json({ error: 'Server error recording settlement' });
  }
};

export const getSettlements = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;

  try {
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        payer: true,
        payee: true
      },
      orderBy: { date: 'desc' }
    });

    return res.json(settlements);
  } catch (error) {
    console.error('Get settlements error:', error);
    return res.status(500).json({ error: 'Server error retrieving settlements' });
  }
};

// Balances Board and Debt Simplification
export const getGroupBalances = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // 1. Fetch all expenses
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        participants: true
      }
    });

    // 2. Fetch all settlements
    const settlements = await prisma.settlement.findMany({
      where: { groupId }
    });

    // Initialize balance sheet (in Base Currency)
    const netBalances: Record<string, number> = {};
    const baseCurr = group.baseCurrency;

    for (const member of group.members) {
      netBalances[member.id] = 0;
    }

    // Process expenses
    for (const exp of expenses) {
      // Add paid amount to payer
      if (netBalances[exp.paidById] !== undefined) {
        netBalances[exp.paidById] += exp.amountInBase;
      }
      // Subtract share from each participant
      for (const part of exp.participants) {
        if (netBalances[part.memberId] !== undefined) {
          netBalances[part.memberId] -= part.calculatedShareInBase;
        }
      }
    }

    // Process settlements
    for (const set of settlements) {
      // Payer's balance increases (they paid their debt, meaning their net balance goes up closer to 0)
      if (netBalances[set.payerId] !== undefined) {
        netBalances[set.payerId] += set.amountInBase;
      }
      // Payee's balance decreases (they received cash, meaning their outstanding credit goes down closer to 0)
      if (netBalances[set.payeeId] !== undefined) {
        netBalances[set.payeeId] -= set.amountInBase;
      }
    }

    // Build user friendly balances list
    const memberBalances = group.members.map(member => ({
      memberId: member.id,
      name: member.name,
      email: member.email,
      status: member.status,
      netBalance: Math.round(netBalances[member.id] * 100) / 100
    }));

    // DEBT SIMPLIFICATION ALGORITHM
    // Separate debtors and creditors
    const debtors: { memberId: string; name: string; balance: number }[] = [];
    const creditors: { memberId: string; name: string; balance: number }[] = [];

    for (const m of memberBalances) {
      if (m.netBalance < -0.01) {
        debtors.push({ memberId: m.memberId, name: m.name, balance: Math.abs(m.netBalance) });
      } else if (m.netBalance > 0.01) {
        creditors.push({ memberId: m.memberId, name: m.name, balance: m.netBalance });
      }
    }

    // Sort: largest debtors and creditors first
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const suggestions: {
      payerId: string;
      payerName: string;
      payeeId: string;
      payeeName: string;
      amount: number;
      currency: string;
    }[] = [];

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settlementAmount = Math.min(debtor.balance, creditor.balance);

      if (settlementAmount > 0.01) {
        suggestions.push({
          payerId: debtor.memberId,
          payerName: debtor.name,
          payeeId: creditor.memberId,
          payeeName: creditor.name,
          amount: Math.round(settlementAmount * 100) / 100,
          currency: baseCurr
        });
      }

      debtor.balance -= settlementAmount;
      creditor.balance -= settlementAmount;

      if (debtor.balance < 0.01) dIdx++;
      if (creditor.balance < 0.01) cIdx++;
    }

    return res.json({
      baseCurrency: baseCurr,
      balances: memberBalances,
      settlementSuggestions: suggestions
    });
  } catch (error) {
    console.error('Get group balances error:', error);
    return res.status(500).json({ error: 'Server error calculating balances' });
  }
};

// Drill down balance details: Contributing transactions between two members
export const getBalanceBreakdown = async (req: AuthRequest, res: Response) => {
  const { groupId } = req.params;
  const { memberA, memberB } = req.query; // member ids

  if (!memberA || !memberB) {
    return res.status(400).json({ error: 'Member A and Member B parameters are required' });
  }

  try {
    const memAId = memberA as string;
    const memBId = memberB as string;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const memberAName = group.members.find(m => m.id === memAId)?.name || 'Member A';
    const memberBName = group.members.find(m => m.id === memBId)?.name || 'Member B';

    // 1. Fetch expenses paid by A where B is participant
    const expensesPaidByA = await prisma.expense.findMany({
      where: {
        groupId,
        paidById: memAId,
        participants: { some: { memberId: memBId } }
      },
      include: {
        participants: { where: { memberId: memBId } }
      }
    });

    // 2. Fetch expenses paid by B where A is participant
    const expensesPaidByB = await prisma.expense.findMany({
      where: {
        groupId,
        paidById: memBId,
        participants: { some: { memberId: memAId } }
      },
      include: {
        participants: { where: { memberId: memAId } }
      }
    });

    // 3. Fetch settlements between A and B
    const settlementsPaidByA = await prisma.settlement.findMany({
      where: { groupId, payerId: memAId, payeeId: memBId }
    });

    const settlementsPaidByB = await prisma.settlement.findMany({
      where: { groupId, payerId: memBId, payeeId: memAId }
    });

    // Merge and structure contribution timeline
    const timeline: {
      id: string;
      type: 'EXPENSE_OWED' | 'EXPENSE_LENT' | 'SETTLEMENT_PAID' | 'SETTLEMENT_RECEIVED';
      title: string;
      amount: number; // in original currency
      currency: string;
      amountInBase: number;
      date: Date;
    }[] = [];

    // If A paid, and B participated: A lent money to B
    for (const exp of expensesPaidByA) {
      const share = exp.participants[0];
      timeline.push({
        id: exp.id,
        type: 'EXPENSE_LENT',
        title: exp.title,
        amount: share.calculatedShare,
        currency: exp.currency,
        amountInBase: share.calculatedShareInBase,
        date: exp.date
      });
    }

    // If B paid, and A participated: A owes money to B
    for (const exp of expensesPaidByB) {
      const share = exp.participants[0];
      timeline.push({
        id: exp.id,
        type: 'EXPENSE_OWED',
        title: exp.title,
        amount: share.calculatedShare,
        currency: exp.currency,
        amountInBase: share.calculatedShareInBase,
        date: exp.date
      });
    }

    // Settlements A paid to B (reduces A's debt to B / offsets B's share)
    for (const set of settlementsPaidByA) {
      timeline.push({
        id: set.id,
        type: 'SETTLEMENT_PAID',
        title: set.notes || 'Settlement Payment',
        amount: set.amount,
        currency: set.currency,
        amountInBase: set.amountInBase,
        date: set.date
      });
    }

    // Settlements B paid to A
    for (const set of settlementsPaidByB) {
      timeline.push({
        id: set.id,
        type: 'SETTLEMENT_RECEIVED',
        title: set.notes || 'Settlement Payment Received',
        amount: set.amount,
        currency: set.currency,
        amountInBase: set.amountInBase,
        date: set.date
      });
    }

    // Sort timeline oldest to newest
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance A owes B (negative means A owes B, positive means A is owed by B)
    let runningBalanceInBase = 0;
    const timelineWithRunningBalance = timeline.map(item => {
      let adjustment = 0;
      if (item.type === 'EXPENSE_LENT') {
        adjustment = item.amountInBase; // B owes A more
      } else if (item.type === 'EXPENSE_OWED') {
        adjustment = -item.amountInBase; // A owes B more
      } else if (item.type === 'SETTLEMENT_PAID') {
        adjustment = item.amountInBase; // A paid B, reducing A's debt to B (so A's net increases)
      } else if (item.type === 'SETTLEMENT_RECEIVED') {
        adjustment = -item.amountInBase; // B paid A, reducing B's debt to A (so A's net decreases)
      }

      runningBalanceInBase += adjustment;
      return {
        ...item,
        runningBalanceInBase: Math.round(runningBalanceInBase * 100) / 100
      };
    });

    return res.json({
      memberA: { id: memAId, name: memberAName },
      memberB: { id: memBId, name: memberBName },
      baseCurrency: group.baseCurrency,
      finalNetBalanceInBase: Math.round(runningBalanceInBase * 100) / 100,
      timeline: timelineWithRunningBalance
    });
  } catch (error) {
    console.error('Get balance breakdown error:', error);
    return res.status(500).json({ error: 'Server error retrieving balance details' });
  }
};
