import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalGroups = await prisma.group.count();
    const totalExpenses = await prisma.expense.count();
    const totalSettlements = await prisma.settlement.count();
    const totalImports = await prisma.importSession.count();

    // Calculate sum of all expenses in USD (or converted base equivalents)
    const expenseSums = await prisma.expense.aggregate({
      _sum: {
        amountInBase: true
      }
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return res.json({
      totals: {
        users: totalUsers,
        groups: totalGroups,
        expenses: totalExpenses,
        settlements: totalSettlements,
        imports: totalImports,
        totalVolumeInBase: Math.round((expenseSums._sum.amountInBase || 0) * 100) / 100
      },
      recentAuditLogs
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    return res.status(500).json({ error: 'Server error retrieving system stats' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  const { limit = '50', offset = '0', action } = req.query;

  try {
    const whereClause: any = {};
    if (action) {
      whereClause.action = action as string;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.auditLog.count({ where: whereClause });

    return res.json({ logs, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({ error: 'Server error retrieving audit logs' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Server error retrieving users list' });
  }
};

export const getAllGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { members: true, expenses: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(groups);
  } catch (error) {
    console.error('Get all groups error:', error);
    return res.status(500).json({ error: 'Server error retrieving groups list' });
  }
};
