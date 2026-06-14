import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { ConfirmDialog } from '../components/Dialogs';
import { TableSkeleton } from '../components/Skeletons';
import { 
  Users, 
  CreditCard, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Trash2, 
  Calendar,
  Sparkles,
  CalendarDays,
  X
} from 'lucide-react';

interface GroupMember {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  joinDate: string;
  leaveDate: string | null;
  status: string;
}

interface ExpenseParticipant {
  memberId: string;
  shareValue: number;
  calculatedShare: number;
  member: GroupMember;
}

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  amountInBase: number;
  date: string;
  paidById: string;
  paidBy: GroupMember;
  splitType: string;
  participants: ExpenseParticipant[];
}

interface Settlement {
  id: string;
  payerId: string;
  payer: GroupMember;
  payeeId: string;
  payee: GroupMember;
  amount: number;
  currency: string;
  amountInBase: number;
  date: string;
  notes: string | null;
}

interface BalanceBreakdownItem {
  id: string;
  type: 'EXPENSE_OWED' | 'EXPENSE_LENT' | 'SETTLEMENT_PAID' | 'SETTLEMENT_RECEIVED';
  title: string;
  amount: number;
  currency: string;
  amountInBase: number;
  date: string;
  runningBalanceInBase: number;
}

export const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiFetch, user } = useAuth();
  const toast = useToast();

  const [group, setGroup] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlements' | 'members'>('expenses');

  // Lists
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const expensesLimit = 10;
  const [expensesOffset, setExpensesOffset] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Modals Toggles
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  // Deletions
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Balance breakdown ledger state
  const [breakdownLedger, setBreakdownLedger] = useState<{
    memberA: { id: string; name: string };
    memberB: { id: string; name: string };
    baseCurrency: string;
    finalNetBalanceInBase: number;
    timeline: BalanceBreakdownItem[];
  } | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // Form States - Add Expense
  const [expTitle, setExpTitle] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('USD');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaidBy, setExpPaidBy] = useState('');
  const [expSplitType, setExpSplitType] = useState('EQUAL');
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, { selected: boolean; value: string }>>({});

  // Form States - Invite Member
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memJoinDate, setMemJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [memLeaveDate, setMemLeaveDate] = useState('');

  // Form States - Settle Payment
  const [settlePayer, setSettlePayer] = useState('');
  const [settlePayee, setSettlePayee] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleCurrency, setSettleCurrency] = useState('USD');

  // Load Group Metadata & Sub-Lists
  const fetchGroupDetails = async () => {
    try {
      const groupData = await apiFetch(`/groups/${id}`);
      setGroup(groupData);
      setExpCurrency(groupData.baseCurrency);
      setSettleCurrency(groupData.baseCurrency);

      // Pre-populate paid by with creator or first member
      if (groupData.members.length > 0) {
        setExpPaidBy(groupData.members[0].id);
        
        // Setup default participants selected state
        const initialParticipants: Record<string, { selected: boolean; value: string }> = {};
        groupData.members.forEach((m: any) => {
          initialParticipants[m.id] = { selected: true, value: '' };
        });
        setSelectedParticipants(initialParticipants);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load group details');
      navigate('/groups');
    }
  };

  const fetchExpenses = async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/groups/${id}/expenses?search=${searchTerm}&limit=${expensesLimit}&offset=${expensesOffset}`);
      setExpenses(res.expenses);
      setTotalExpenses(res.total);
    } catch (err) {
      console.error('Fetch expenses failed:', err);
    }
  };

  const fetchSettlements = async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/groups/${id}/settlements`);
      setSettlements(res);
    } catch (err) {
      console.error('Fetch settlements failed:', err);
    }
  };

  const fetchBalancesAndDebts = async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/groups/${id}/balances`);
      setBalances(res.balances);
      setSuggestions(res.settlementSuggestions);
    } catch (err) {
      console.error('Fetch balances failed:', err);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  useEffect(() => {
    if (!group) return;
    fetchExpenses();
    fetchSettlements();
    fetchBalancesAndDebts();
  }, [group, searchTerm, expensesLimit, expensesOffset]);

  // Tab change handler
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    // Refresh relevant datasets
    if (tab === 'expenses') fetchExpenses();
    if (tab === 'settlements') fetchSettlements();
    if (tab === 'balances') fetchBalancesAndDebts();
  };

  // Add Expense Submission
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Expense amount must be a positive number');
      return;
    }

    // Filter participants
    const participantsList = Object.entries(selectedParticipants)
      .filter(([_, value]) => value.selected)
      .map(([memberId, config]) => ({
        memberId,
        shareValue: parseFloat(config.value) || 0
      }));

    if (participantsList.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    // Split valid check
    if (expSplitType === 'PERCENTAGE') {
      const pctSum = participantsList.reduce((acc, curr) => acc + curr.shareValue, 0);
      if (Math.abs(pctSum - 100) > 0.01) {
        toast.error(`Percentages must sum to exactly 100%. Current sum: ${pctSum}%`);
        return;
      }
    }
    if (expSplitType === 'EXACT') {
      const valSum = participantsList.reduce((acc, curr) => acc + curr.shareValue, 0);
      if (Math.abs(valSum - amt) > 0.01) {
        toast.error(`Split amounts (${valSum}) must equal the total expense amount (${amt})`);
        return;
      }
    }

    try {
      await apiFetch(`/groups/${id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          title: expTitle,
          description: expDescription,
          amount: amt,
          currency: expCurrency,
          date: expDate,
          paidById: expPaidBy,
          splitType: expSplitType,
          participants: participantsList
        })
      });

      toast.success('Expense recorded successfully!');
      setAddExpenseOpen(false);
      // Reset Form
      setExpTitle('');
      setExpDescription('');
      setExpAmount('');
      setExpDate(new Date().toISOString().split('T')[0]);
      
      // Refresh Lists
      fetchExpenses();
      fetchBalancesAndDebts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense');
    }
  };

  // Invite Member Submission
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName || !memEmail) return;

    try {
      await apiFetch(`/groups/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          name: memName,
          email: memEmail,
          joinDate: memJoinDate,
          leaveDate: memLeaveDate || null
        })
      });

      toast.success(`Invited ${memName} successfully!`);
      setAddMemberOpen(false);
      setMemName('');
      setMemEmail('');
      
      // Reload Group
      fetchGroupDetails();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite member');
    }
  };

  // Record Settlement Submission
  const handleRecordSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (!settlePayer || !settlePayee || isNaN(amt) || amt <= 0) {
      toast.error('Please complete all settlement fields correctly');
      return;
    }

    if (settlePayer === settlePayee) {
      toast.error('Payer and recipient must be different members');
      return;
    }

    try {
      await apiFetch(`/groups/${id}/settlements`, {
        method: 'POST',
        body: JSON.stringify({
          payerId: settlePayer,
          payeeId: settlePayee,
          amount: amt,
          currency: settleCurrency,
          notes: 'Settled payment'
        })
      });

      toast.success('Settlement payment recorded successfully');
      setSettleOpen(false);
      setSettleAmount('');
      
      // Refresh Lists
      fetchSettlements();
      fetchBalancesAndDebts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record settlement');
    }
  };

  // Open Settlement with presets
  const openSettlePreset = (payerId: string, payeeId: string, amount: number) => {
    setSettlePayer(payerId);
    setSettlePayee(payeeId);
    setSettleAmount(amount.toString());
    setSettleOpen(true);
  };

  // Delete Expense handlers
  const triggerDeleteExpense = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteConfirmOpen(true);
  };

  const executeDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await apiFetch(`/expenses/${expenseToDelete}`, { method: 'DELETE' });
      toast.success('Expense deleted successfully');
      fetchExpenses();
      fetchBalancesAndDebts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete expense');
    } finally {
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    }
  };

  // Fetch drill-down balance breakdown ledger
  const inspectBalanceLedger = async (memberId: string) => {
    const userMember = group?.members.find((m: any) => m.email.toLowerCase() === user?.email.toLowerCase());
    if (!userMember || userMember.id === memberId) return;

    setBreakdownLoading(true);
    setBreakdownOpen(true);

    try {
      const dataLedger = await apiFetch(`/groups/${id}/balance-breakdown?memberA=${userMember.id}&memberB=${memberId}`);
      setBreakdownLedger(dataLedger);
    } catch (err: any) {
      toast.error('Failed to load ledger details');
      setBreakdownOpen(false);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Helper: check if member is active today
  const isMemberActive = (member: GroupMember) => {
    const now = Date.now();
    const join = new Date(member.joinDate).getTime();
    const leave = member.leaveDate ? new Date(member.leaveDate).getTime() : null;
    return now >= join && (!leave || now <= leave) && member.status === 'ACTIVE';
  };

  if (!group) {
    return (
      <Layout title="Loading...">
        <div className="glass-card-no-hover p-12 text-center">
          <TableSkeleton rows={5} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={group.name}>
      {/* Group Info Header Panel */}
      <div className="glass-card p-6 border border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <p className="text-slate-500 dark:text-slate-400 text-sm">{group.description || 'No description provided.'}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 py-1 px-2.5 rounded-full">
                <Calendar className="h-3.5 w-3.5" /> Created {new Date(group.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 py-1 px-2.5 rounded-full">
                <Users className="h-3.5 w-3.5" /> {group.members.length} Members
              </span>
              <span className="flex items-center gap-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 py-1 px-2.5 rounded-full font-semibold">
                Base: {group.baseCurrency}
              </span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setAddExpenseOpen(true)}
              className="flex-1 md:flex-none btn-primary py-2 px-4 text-sm"
            >
              <Plus className="h-4 w-4" /> Add Expense
            </button>
            <button
              onClick={() => {
                setSettlePayer('');
                setSettlePayee('');
                setSettleAmount('');
                setSettleOpen(true);
              }}
              className="flex-1 md:flex-none btn-secondary py-2 px-4 text-sm"
            >
              <ArrowLeftRight className="h-4 w-4" /> Record Payment
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/50">
        {(['expenses', 'balances', 'settlements', 'members'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-5 py-3.5 text-sm font-semibold border-b-2 capitalize transition-colors
              ${activeTab === tab
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search expenses by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-input pl-9 text-sm py-2"
                />
              </div>
            </div>

            {/* Expenses List */}
            {expenses.length > 0 ? (
              <div className="glass-card-no-hover border border-white/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
                        <th className="p-4 font-semibold text-slate-400">Date</th>
                        <th className="p-4 font-semibold text-slate-400">Title</th>
                        <th className="p-4 font-semibold text-slate-400">Paid By</th>
                        <th className="p-4 font-semibold text-slate-400">Split Method</th>
                        <th className="p-4 font-semibold text-slate-400 text-right">Amount</th>
                        <th className="p-4 font-semibold text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/30 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="p-4 font-medium">
                            {new Date(expense.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 dark:text-white block">{expense.title}</span>
                            <span className="text-xs text-slate-400">{expense.description || 'No description'}</span>
                          </td>
                          <td className="p-4">{expense.paidBy?.name}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400">
                              {expense.splitType}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <span className="font-bold text-slate-950 dark:text-white block">
                              {expense.currency} {expense.amount.toFixed(2)}
                            </span>
                            {expense.currency !== group.baseCurrency && (
                              <span className="text-xs text-slate-400">
                                {group.baseCurrency} {expense.amountInBase.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => triggerDeleteExpense(expense.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Delete Expense"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="p-4 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-200/10 dark:bg-slate-900/10 text-xs text-slate-400">
                  <span>Showing {expenses.length} of {totalExpenses} expenses</span>
                  <div className="flex gap-2">
                    <button
                      disabled={expensesOffset === 0}
                      onClick={() => setExpensesOffset(prev => Math.max(0, prev - expensesLimit))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={expensesOffset + expensesLimit >= totalExpenses}
                      onClick={() => setExpensesOffset(prev => prev + expensesLimit)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card-no-hover p-12 text-center border border-dashed border-slate-200/40 dark:border-slate-800/40 py-16 flex flex-col items-center">
                <CreditCard className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">No Expenses Recorded</h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4">You haven't uploaded or recorded any expenses for this group yet.</p>
                <button onClick={() => setAddExpenseOpen(true)} className="btn-primary py-2 px-4 text-xs">
                  Record First Expense
                </button>
              </div>
            )}
          </div>
        )}

        {/* BALANCES TAB */}
        {activeTab === 'balances' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balances board */}
            <div className="lg:col-span-2 glass-card p-6 border border-white/20">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Balances Sheet</h3>
              <div className="space-y-3">
                {balances.map(balance => {
                  const isCurrentUser = balance.email.toLowerCase() === user?.email.toLowerCase();
                  
                  return (
                    <div 
                      key={balance.memberId}
                      onClick={() => !isCurrentUser && inspectBalanceLedger(balance.memberId)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200
                        ${isCurrentUser 
                          ? 'border-brand-500/20 bg-brand-500/5 dark:bg-brand-950/5' 
                          : 'border-slate-200/60 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200/60 dark:bg-slate-800/60 border border-white/20 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300 uppercase">
                          {balance.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {balance.name} {isCurrentUser && <span className="text-xs text-brand-500 font-semibold">(You)</span>}
                          </h4>
                          <span className="text-xs text-slate-400 block mt-0.5">{balance.email}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        {balance.netBalance > 0.01 ? (
                          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            Gets back {group.baseCurrency} {balance.netBalance.toFixed(2)}
                          </p>
                        ) : balance.netBalance < -0.01 ? (
                          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                            Owes {group.baseCurrency} {Math.abs(balance.netBalance).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-slate-400">Settled Up</p>
                        )}
                        {!isCurrentUser && (
                          <span className="text-[10px] text-slate-400 underline block mt-0.5">Click to view ledger breakdown</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Settle Suggestions panel */}
            <div className="glass-card p-6 border border-white/20 h-fit">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" /> Debt Payouts
              </h3>
              <p className="text-xs text-slate-400 mb-4">Optimal settlements calculated via Splitwise Greedy Solver</p>

              <div className="space-y-3">
                {suggestions.length > 0 ? (
                  suggestions.map((sug, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/40 dark:bg-slate-900/20 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-slate-900 dark:text-white">{sug.payerName}</span> owes{' '}
                            <span className="font-bold text-slate-900 dark:text-white">{sug.payeeName}</span>
                          </p>
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
                            {sug.currency} {sug.amount.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => openSettlePreset(sug.payerId, sug.payeeId, sug.amount)}
                          className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Everyone in the group is fully settled up! No payments are required.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SETTLEMENTS TAB */}
        {activeTab === 'settlements' && (
          <div className="space-y-4">
            {settlements.length > 0 ? (
              <div className="glass-card-no-hover border border-white/20 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
                      <th className="p-4 font-semibold text-slate-400">Date</th>
                      <th className="p-4 font-semibold text-slate-400">Transfer</th>
                      <th className="p-4 font-semibold text-slate-400">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map(set => (
                      <tr key={set.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                        <td className="p-4">
                          {new Date(set.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {set.payer?.name} paid {set.payee?.name}
                          </p>
                          <span className="text-xs text-slate-400">{set.notes || 'Settlement Transaction'}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-950 dark:text-white">
                          {set.currency} {set.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass-card-no-hover p-12 text-center border border-dashed border-slate-200/40 dark:border-slate-800/40 py-16 flex flex-col items-center">
                <ArrowLeftRight className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">No Payments Recorded</h4>
                <p className="text-xs text-slate-400 max-w-sm">No debt settlements have been registered for this group yet.</p>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Roster</h3>
              <button
                onClick={() => setAddMemberOpen(true)}
                className="btn-secondary py-2 px-3 text-xs"
              >
                <Plus className="h-4 w-4" /> Invite Member
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.members.map((member: GroupMember) => {
                const active = isMemberActive(member);
                
                return (
                  <div key={member.id} className="glass-card p-4 flex justify-between items-center border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-sm uppercase">
                          {member.name.charAt(0)}
                        </div>
                        <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</h4>
                        <span className="text-xs text-slate-400 mt-0.5 block">{member.email}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className={`px-2 py-0.5 font-bold rounded-md ${active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {active ? 'Active' : 'Inactive'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Joined: {new Date(member.joinDate).toLocaleDateString()}
                      </p>
                      {member.leaveDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Left: {new Date(member.leaveDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Add Expense */}
      {addExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAddExpenseOpen(false)} />
          <div className="relative w-full max-w-lg glass-panel p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-thin">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Expense</h3>
              <button onClick={() => setAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flight tickets"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Currency</label>
                  <select
                    value={expCurrency}
                    onChange={(e) => setExpCurrency(e.target.value)}
                    className="w-full glass-input text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Paid By *</label>
                  <select
                    value={expPaidBy}
                    onChange={(e) => setExpPaidBy(e.target.value)}
                    className="w-full glass-input text-sm"
                  >
                    {group.members.filter(isMemberActive).map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Split Method *</label>
                  <select
                    value={expSplitType}
                    onChange={(e) => setExpSplitType(e.target.value)}
                    className="w-full glass-input text-sm"
                  >
                    <option value="EQUAL">Equal</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="EXACT">Exact Amount</option>
                    <option value="SHARES">Shares</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description</label>
                <input
                  type="text"
                  placeholder="Optional details"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full glass-input text-sm"
                />
              </div>

              {/* Dynamic Split Participants selectors */}
              <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase">Split Calculations Sheet</label>
                <div className="space-y-3">
                  {group.members.filter(isMemberActive).map((m: any) => {
                    const participantState = selectedParticipants[m.id] || { selected: false, value: '' };
                    
                    return (
                      <div key={m.id} className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={participantState.selected}
                            onChange={(e) => setSelectedParticipants(prev => ({
                              ...prev,
                              [m.id]: { ...prev[m.id], selected: e.target.checked }
                            }))}
                            className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800"
                          />
                          {m.name}
                        </label>

                        {/* Split input values (only show fields for non-EQUAL split type) */}
                        {expSplitType !== 'EQUAL' && participantState.selected && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder={expSplitType === 'PERCENTAGE' ? '%' : (expSplitType === 'SHARES' ? 'shares' : '$')}
                              value={participantState.value}
                              onChange={(e) => setSelectedParticipants(prev => ({
                                ...prev,
                                [m.id]: { ...prev[m.id], value: e.target.value }
                              }))}
                              className="w-20 glass-input text-xs py-1 px-2 text-right"
                            />
                            <span className="text-xs text-slate-400">
                              {expSplitType === 'PERCENTAGE' ? '%' : (expSplitType === 'SHARES' ? 'shares' : expCurrency)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setAddExpenseOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Invite Member */}
      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAddMemberOpen(false)} />
          <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Group Member</h3>
              <button onClick={() => setAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Member Name"
                  value={memName}
                  onChange={(e) => setMemName(e.target.value)}
                  className="w-full glass-input text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  value={memEmail}
                  onChange={(e) => setMemEmail(e.target.value)}
                  className="w-full glass-input text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Join Date *</label>
                  <input
                    type="date"
                    required
                    value={memJoinDate}
                    onChange={(e) => setMemJoinDate(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Leave Date (Optional)</label>
                  <input
                    type="date"
                    value={memLeaveDate}
                    onChange={(e) => setMemLeaveDate(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setAddMemberOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Invite Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Settlement Payment */}
      {settleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSettleOpen(false)} />
          <div className="relative w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Settlement</h3>
              <button onClick={() => setSettleOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Payer (Who Sent Money) *</label>
                <select
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  className="w-full glass-input text-sm"
                >
                  <option value="">Select Payer</option>
                  {group.members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Recipient (Who Got Paid) *</label>
                <select
                  value={settlePayee}
                  onChange={(e) => setSettlePayee(e.target.value)}
                  className="w-full glass-input text-sm"
                >
                  <option value="">Select Recipient</option>
                  {group.members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount Paid *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Currency</label>
                  <select
                    value={settleCurrency}
                    onChange={(e) => setSettleCurrency(e.target.value)}
                    className="w-full glass-input text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setSettleOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG: Balance Ledger Drill-down */}
      {breakdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setBreakdownOpen(false)} />
          
          <div className="relative w-full max-w-lg h-full glass-panel border-l border-white/10 dark:border-white/5 flex flex-col justify-between p-6 shadow-2xl animate-slide-left overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ledger Drill-down</h3>
                <p className="text-xs text-slate-400 mt-0.5">Contributing transactions timeline</p>
              </div>
              <button onClick={() => setBreakdownOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {breakdownLoading ? (
              <div className="flex-1 flex flex-col justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
                <span className="text-xs text-slate-400 mt-3">Loading transactions history...</span>
              </div>
            ) : breakdownLedger ? (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Ledger info summary */}
                <div className="p-4 rounded-xl border border-white/20 bg-slate-100/40 dark:bg-slate-900/20 text-center mb-6">
                  <p className="text-xs text-slate-400">Current running net debt</p>
                  <h4 className={`text-2xl font-extrabold mt-1.5 
                    ${breakdownLedger.finalNetBalanceInBase > 0.01 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : breakdownLedger.finalNetBalanceInBase < -0.01 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-slate-400'
                    }`}>
                    {breakdownLedger.finalNetBalanceInBase > 0.01 
                      ? `${breakdownLedger.memberB.name} owes you ${breakdownLedger.baseCurrency} ${breakdownLedger.finalNetBalanceInBase.toFixed(2)}`
                      : breakdownLedger.finalNetBalanceInBase < -0.01 
                        ? `You owe ${breakdownLedger.memberB.name} ${breakdownLedger.baseCurrency} ${Math.abs(breakdownLedger.finalNetBalanceInBase).toFixed(2)}`
                        : 'You are fully settled up!'
                    }
                  </h4>
                </div>

                {/* Ledger entries list */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                  {breakdownLedger.timeline.length > 0 ? (
                    breakdownLedger.timeline.map((item, index) => {
                      let typeLabel = '';
                      let amtClass = '';
                      let amountPrefix = '';

                      if (item.type === 'EXPENSE_OWED') {
                        typeLabel = 'Expense Owed';
                        amtClass = 'text-rose-600 dark:text-rose-400';
                        amountPrefix = '-';
                      } else if (item.type === 'EXPENSE_LENT') {
                        typeLabel = 'Expense Lent';
                        amtClass = 'text-emerald-600 dark:text-emerald-400';
                        amountPrefix = '+';
                      } else if (item.type === 'SETTLEMENT_PAID') {
                        typeLabel = 'Settlement Paid';
                        amtClass = 'text-emerald-600 dark:text-emerald-400';
                        amountPrefix = '+';
                      } else if (item.type === 'SETTLEMENT_RECEIVED') {
                        typeLabel = 'Settlement Recv';
                        amtClass = 'text-rose-600 dark:text-rose-400';
                        amountPrefix = '-';
                      }

                      return (
                        <div key={item.id || index} className="flex gap-3 border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-b-0">
                          <CalendarDays className="h-4 w-4 text-slate-400 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-semibold uppercase">{typeLabel}</span>
                              <span className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-extrabold ${amtClass}`}>
                              {amountPrefix}{item.currency} {item.amount.toFixed(2)}
                            </span>
                            {item.currency !== breakdownLedger.baseCurrency && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {amountPrefix}{breakdownLedger.baseCurrency} {item.amountInBase.toFixed(2)}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 block mt-1">
                              Running: {breakdownLedger.baseCurrency} {item.runningBalanceInBase.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-20 text-slate-400 text-xs">
                      No mutual expenses or payments found between these two members.
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
                  <button
                    onClick={() => setBreakdownOpen(false)}
                    className="w-full btn-secondary py-2.5"
                  >
                    Close Ledger
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Expense"
        message="Are you sure you want to permanently delete this expense? This action will restore member balances and cannot be undone."
        confirmLabel="Delete"
        type="danger"
        onConfirm={executeDeleteExpense}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setExpenseToDelete(null);
        }}
      />
    </Layout>
  );
};
