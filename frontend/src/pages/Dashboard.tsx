import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { DashboardSkeleton } from '../components/Skeletons';
import { CreateGroupModal } from '../components/Dialogs';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Users, 
  FileSpreadsheet, 
  CreditCard,
  Plus,
  ArrowRight,
  HandCoins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface DashboardData {
  totalGroups: number;
  totalExpensesCount: number;
  youOwe: number;
  youAreOwed: number;
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    amountInBase: number;
    date: string;
    paidBy: string;
    groupName: string;
    groupId: string;
  }[];
  monthlySpending: { name: string; amount: number }[];
}

export const Dashboard: React.FC = () => {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/groups/dashboard/summary');
      setData(res);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch dashboard summaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateGroup = async (groupData: { name: string; description: string; baseCurrency: string }) => {
    try {
      await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      toast.success('Group created successfully!');
      fetchDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create group');
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <DashboardSkeleton />
      </Layout>
    );
  }

  const recentExpenses = data?.recentExpenses || [];
  const monthlySpending = data?.monthlySpending || [];

  return (
    <Layout title="Dashboard">
      {/* Welcome Card & Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Groups */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-550 dark:text-slate-400">Total Groups</span>
            <div className="p-2 border-2 border-black bg-[#ffe484] text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{data?.totalGroups || 0}</h3>
            <p className="text-xs text-slate-500 mt-1 font-bold">Active shared spaces</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-550 dark:text-slate-400">Total Expenses</span>
            <div className="p-2 border-2 border-black bg-[#a2e0ff] text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{data?.totalExpensesCount || 0}</h3>
            <p className="text-xs text-slate-500 mt-1 font-bold">Across all workspaces</p>
          </div>
        </div>

        {/* You Owe */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-550 dark:text-slate-400">You Owe</span>
            <div className="p-2 border-2 border-black bg-[#ff6b6b] text-white shadow-[2px_2px_0px_0px_#000] rounded-xl">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              ${data?.youOwe ? data.youOwe.toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-bold">Conversions in base USD</p>
          </div>
        </div>

        {/* You Are Owed */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-550 dark:text-slate-400">You Are Owed</span>
            <div className="p-2 border-2 border-black bg-[#88fcb2] text-black shadow-[2px_2px_0px_0px_#000] rounded-xl">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ${data?.youAreOwed ? data.youAreOwed.toFixed(2) : '0.00'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-bold">Conversions in base USD</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="glass-card p-6">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Quick Operations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-[2.5px] border-black dark:border-white text-slate-800 dark:text-slate-200 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-black dark:border-white bg-[#ffe484] text-black rounded-lg">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left font-bold">
                <p className="text-sm text-slate-950 dark:text-white">Create Group</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Start new share workspace</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            to="/import"
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-[2.5px] border-black dark:border-white text-slate-800 dark:text-slate-200 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-black dark:border-white bg-[#a2e0ff] text-black rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div className="text-left font-bold">
                <p className="text-sm text-slate-950 dark:text-white">CSV Data Import</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Bulk upload expense exports</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/groups"
            className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border-[2.5px] border-black dark:border-white text-slate-800 dark:text-slate-200 shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 border-2 border-black dark:border-white bg-[#88fcb2] text-black rounded-lg">
                <HandCoins className="h-5 w-5" />
              </div>
              <div className="text-left font-bold">
                <p className="text-sm text-slate-950 dark:text-white">Settle Balances</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Record payment transactions</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Main Graphs & Recent timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Spending Graph */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between h-[360px]">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Spending</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-bold">Accumulated share across all groups in USD</p>
          </div>
          <div className="w-full h-64 mt-4">
            {monthlySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffe484" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ffe484" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d5cebe" />
                  <XAxis dataKey="name" stroke="#000000" className="dark:stroke-white font-bold" fontSize={11} tickLine={false} />
                  <YAxis stroke="#000000" className="dark:stroke-white font-bold" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fdfbf6', 
                      borderRadius: '12px',
                      border: '2.5px solid #000',
                      boxShadow: '3px 3px 0px 0px #000'
                    }} 
                    labelClassName="text-slate-900 font-black"
                  />
                  <Area type="monotone" dataKey="amount" stroke="#000000" className="dark:stroke-white" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No recent expenses recorded to display trend.
              </div>
            )}
          </div>
        </div>

        {/* Recent timeline logs */}
        <div className="glass-card p-6 h-[360px] flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest expenses across groups</p>
          </div>
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 scrollbar-thin">
            {recentExpenses.length > 0 ? (
              recentExpenses.map(expense => (
                <div key={expense.id} className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-b-0">
                  <div className="mt-1 h-2 w-2 rounded-full bg-brand-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {expense.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      Paid by <span className="font-medium text-slate-600 dark:text-slate-300">{expense.paidBy}</span> in {expense.groupName}
                    </p>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full mt-1.5 inline-block">
                      {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ${expense.amountInBase.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm py-12">
                No activity yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </Layout>
  );
};
