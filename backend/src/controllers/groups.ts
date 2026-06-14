import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const createGroup = async (req: AuthRequest, res: Response) => {
  const { name, description, baseCurrency } = req.body;
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  const userName = req.user?.name;

  if (!userId || !userEmail || !userName) {
    return res.status(401).json({ error: 'User context missing' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const group = await prisma.$transaction(async (tx) => {
      // 1. Create group
      const newGroup = await tx.group.create({
        data: {
          name,
          description,
          baseCurrency: baseCurrency || 'USD',
          createdById: userId
        }
      });

      // 2. Add creator as first GroupMember
      await tx.groupMember.create({
        data: {
          groupId: newGroup.id,
          userId: userId,
          email: userEmail,
          name: userName,
          joinDate: new Date(),
          status: 'ACTIVE'
        }
      });

      return newGroup;
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_GROUP',
        details: `Created group ${group.name} (${group.id}) with base currency ${group.baseCurrency}`
      }
    });

    return res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    return res.status(500).json({ error: 'Server error creating group' });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: 'User context missing' });
  }

  try {
    // Find all groups where the user is listed in members
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            email: {
              equals: userEmail,
              mode: 'insensitive'
            }
          }
        }
      },
      include: {
        members: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    return res.status(500).json({ error: 'Server error retrieving groups' });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: 'User context missing' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify user belongs to the group
    const isMember = group.members.some(m => m.email.toLowerCase() === userEmail.toLowerCase());
    if (!isMember && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to access this group' });
    }

    return res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    return res.status(500).json({ error: 'Server error retrieving group details' });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, baseCurrency } = req.body;
  const userId = req.user?.id;

  try {
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify creator or admin
    if (group.createdById !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only group creator can update details' });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: { name, description, baseCurrency }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_GROUP',
        details: `Updated group details for ${group.name} (${group.id})`
      }
    });

    return res.json(updatedGroup);
  } catch (error) {
    console.error('Update group error:', error);
    return res.status(500).json({ error: 'Server error updating group' });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.createdById !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only group creator can delete group' });
    }

    await prisma.group.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_GROUP',
        details: `Deleted group ${group.name} (${group.id})`
      }
    });

    return res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return res.status(500).json({ error: 'Server error deleting group' });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
  const { id } = req.params; // groupId
  const { email, name, joinDate, leaveDate, status } = req.body;
  const userId = req.user?.id;

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify active membership of inviter
    const userEmail = req.user?.email || '';
    const isMember = group.members.some(m => m.email.toLowerCase() === userEmail.toLowerCase());
    if (!isMember && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to invite members to this group' });
    }

    // Check if email already member
    const existing = group.members.find(m => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: `Member with email ${email} is already in the group` });
    }

    // If there is an existing User account, link it
    const registeredUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    const parsedJoinDate = joinDate ? new Date(joinDate) : new Date();
    const parsedLeaveDate = leaveDate ? new Date(leaveDate) : null;

    const newMember = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: registeredUser?.id || null,
        email: email.toLowerCase(),
        name,
        joinDate: parsedJoinDate,
        leaveDate: parsedLeaveDate,
        status: status || 'ACTIVE'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'INVITE_MEMBER',
        details: `Invited ${name} (${email}) to group ${group.name}`
      }
    });

    return res.status(201).json(newMember);
  } catch (error) {
    console.error('Invite member error:', error);
    return res.status(500).json({ error: 'Server error inviting member' });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  const { id, memberId } = req.params; // groupId, memberId
  const { name, joinDate, leaveDate, status } = req.body;
  const userId = req.user?.id;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: { group: true }
    });

    if (!member || member.groupId !== id) {
      return res.status(404).json({ error: 'Member not found in this group' });
    }

    const updatedMember = await prisma.groupMember.update({
      where: { id: memberId },
      data: {
        name,
        joinDate: joinDate ? new Date(joinDate) : undefined,
        leaveDate: leaveDate === null ? null : (leaveDate ? new Date(leaveDate) : undefined),
        status
      }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_MEMBER',
        details: `Updated member details of ${member.name} in group ${member.group.name}`
      }
    });

    return res.json(updatedMember);
  } catch (error) {
    console.error('Update member error:', error);
    return res.status(500).json({ error: 'Server error updating member' });
  }
};

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    return res.status(401).json({ error: 'User context missing' });
  }

  try {
    const userEmailLower = userEmail.toLowerCase();

    // 1. Fetch all groups where user is a member
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            email: { equals: userEmailLower, mode: 'insensitive' }
          }
        }
      },
      include: {
        members: true
      }
    });

    const groupIds = groups.map(g => g.id);

    // If no groups, return empty stats
    if (groupIds.length === 0) {
      return res.json({
        totalGroups: 0,
        totalExpensesCount: 0,
        youOwe: 0,
        youAreOwed: 0,
        recentExpenses: [],
        monthlySpending: []
      });
    }

    // 2. Fetch all expenses in user groups
    const expenses = await prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        paidBy: true,
        participants: { include: { member: true } },
        group: true
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // 3. Fetch all settlements in user groups
    const settlements = await prisma.settlement.findMany({
      where: { groupId: { in: groupIds } }
    });

    // Calculate balances group-by-group in USD
    let youOweTotalUsd = 0;
    let youAreOwedTotalUsd = 0;

    // Default conversion rates matrix helper
    const rates: Record<string, number> = {
      USD: 1.0,
      EUR: 1.08, // EUR to USD
      INR: 0.012  // INR to USD
    };

    const convertToUsd = (amount: number, from: string): number => {
      const rate = rates[from.toUpperCase()] || 1.0;
      return amount * rate;
    };

    for (const group of groups) {
      const gBase = group.baseCurrency;
      const userMember = group.members.find(m => m.email.toLowerCase() === userEmailLower);
      if (!userMember) continue;

      let netBalanceInBase = 0;

      // Filter expenses for this group
      const gExpenses = await prisma.expense.findMany({
        where: { groupId: group.id },
        include: { participants: true }
      });

      for (const exp of gExpenses) {
        if (exp.paidById === userMember.id) {
          netBalanceInBase += exp.amountInBase;
        }
        const userPart = exp.participants.find(p => p.memberId === userMember.id);
        if (userPart) {
          netBalanceInBase -= userPart.calculatedShareInBase;
        }
      }

      // Filter settlements for this group
      const gSettlements = settlements.filter(s => s.groupId === group.id);
      for (const set of gSettlements) {
        if (set.payerId === userMember.id) {
          netBalanceInBase += set.amountInBase;
        }
        if (set.payeeId === userMember.id) {
          netBalanceInBase -= set.amountInBase;
        }
      }

      const netBalanceInUsd = convertToUsd(netBalanceInBase, gBase);
      if (netBalanceInUsd < -0.01) {
        youOweTotalUsd += Math.abs(netBalanceInUsd);
      } else if (netBalanceInUsd > 0.01) {
        youAreOwedTotalUsd += netBalanceInUsd;
      }
    }

    // 4. Generate Monthly spending statistics (past 6 months)
    // Find all expenses in past 6 months where user participated
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userMemberships = await prisma.groupMember.findMany({
      where: { email: { equals: userEmailLower, mode: 'insensitive' } }
    });
    const userMemberIds = userMemberships.map(m => m.id);

    const userParticipations = await prisma.expenseParticipant.findMany({
      where: {
        memberId: { in: userMemberIds },
        expense: {
          date: { gte: sixMonthsAgo }
        }
      },
      include: {
        expense: { include: { group: true } }
      }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySpendingMap: Record<string, number> = {};

    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlySpendingMap[key] = 0;
    }

    for (const part of userParticipations) {
      const expDate = new Date(part.expense.date);
      const key = `${months[expDate.getMonth()]} ${expDate.getFullYear().toString().slice(-2)}`;
      
      if (monthlySpendingMap[key] !== undefined) {
        const amountUsd = convertToUsd(part.calculatedShareInBase, part.expense.group.baseCurrency);
        monthlySpendingMap[key] += amountUsd;
      }
    }

    const monthlySpending = Object.entries(monthlySpendingMap).map(([month, amount]) => ({
      name: month,
      amount: Math.round(amount * 100) / 100
    }));

    const totalExpensesCount = await prisma.expense.count({
      where: { groupId: { in: groupIds } }
    });

    return res.json({
      totalGroups: groups.length,
      totalExpensesCount,
      youOwe: Math.round(youOweTotalUsd * 100) / 100,
      youAreOwed: Math.round(youAreOwedTotalUsd * 100) / 100,
      recentExpenses: expenses.map(e => ({
        id: e.id,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        amountInBase: e.amountInBase,
        date: e.date,
        paidBy: e.paidBy.name,
        groupName: e.group.name,
        groupId: e.groupId
      })),
      monthlySpending
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    return res.status(500).json({ error: 'Server error retrieving dashboard analytics' });
  }
};

