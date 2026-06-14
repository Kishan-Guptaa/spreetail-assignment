import { Router } from 'express';
import multer from 'multer';
import { protect, adminOnly } from '../middleware/auth';
import { register, login, getProfile } from '../controllers/auth';
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  inviteMember,
  updateMember,
  getDashboardSummary
} from '../controllers/groups';
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  recordSettlement,
  getSettlements,
  getGroupBalances,
  getBalanceBreakdown
} from '../controllers/expenses';
import {
  uploadCSV,
  getImportSessions,
  getImportIssues,
  resolveImportIssue,
  batchResolveIssues,
  commitImport,
  getImportReport
} from '../controllers/imports';
import {
  getSystemStats,
  getAuditLogs,
  getAllUsers,
  getAllGroups
} from '../controllers/admin';

// Configure Multer for CSV uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = Router();

// --- AUTH ROUTING ---
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', protect, getProfile);

// --- GROUP ROUTING ---
router.post('/groups', protect, createGroup);
router.get('/groups/dashboard/summary', protect, getDashboardSummary);
router.get('/groups', protect, getGroups);
router.get('/groups/:id', protect, getGroupById);
router.put('/groups/:id', protect, updateGroup);
router.delete('/groups/:id', protect, deleteGroup);
router.post('/groups/:id/members', protect, inviteMember);
router.put('/groups/:id/members/:memberId', protect, updateMember);

// --- EXPENSE & SETTLEMENT ROUTING ---
router.post('/groups/:groupId/expenses', protect, createExpense);
router.get('/groups/:groupId/expenses', protect, getExpenses);
router.put('/expenses/:id', protect, updateExpense);
router.delete('/expenses/:id', protect, deleteExpense);
router.post('/groups/:groupId/settlements', protect, recordSettlement);
router.get('/groups/:groupId/settlements', protect, getSettlements);
router.get('/groups/:groupId/balances', protect, getGroupBalances);
router.get('/groups/:groupId/balance-breakdown', protect, getBalanceBreakdown);

// --- CSV IMPORT ROUTING ---
router.post('/groups/:groupId/import', protect, upload.single('file'), uploadCSV);
router.get('/groups/:groupId/import-sessions', protect, getImportSessions);
router.get('/imports/:sessionId/issues', protect, getImportIssues);
router.put('/imports/issues/:issueId', protect, resolveImportIssue);
router.put('/imports/:sessionId/batch-resolve', protect, batchResolveIssues);
router.post('/imports/:sessionId/commit', protect, commitImport);
router.get('/imports/:sessionId/report', protect, getImportReport);

// --- ADMIN PANEL ROUTING ---
router.get('/admin/stats', protect, adminOnly, getSystemStats);
router.get('/admin/audit-logs', protect, adminOnly, getAuditLogs);
router.get('/admin/users', protect, adminOnly, getAllUsers);
router.get('/admin/groups', protect, adminOnly, getAllGroups);

export default router;
