import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { TableSkeleton } from '../components/Skeletons';
import { getDoodleAvatar } from '../utils/avatar';
import { 
  Users, 
  FolderKanban, 
  CreditCard, 
  Activity
} from 'lucide-react';

interface Stats {
  totals: {
    users: number;
    groups: number;
    expenses: number;
    settlements: number;
    imports: number;
    totalVolumeInBase: number;
  };
  recentAuditLogs: any[];
}

export const AdminPanel: React.FC = () => {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'logs'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [groupsList, setGroupsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsCount, setLogsCount] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/stats');
      setStats(res);
    } catch (err: any) {
      toast.error('Failed to load administrator statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/admin/users');
      setUsersList(res);
    } catch (err) {}
  };

  const fetchGroups = async () => {
    try {
      const res = await apiFetch('/admin/groups');
      setGroupsList(res);
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await apiFetch(`/admin/audit-logs?limit=15&offset=${logsOffset}`);
      setAuditLogs(res.logs);
      setLogsCount(res.total);
    } catch (err) {}
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'groups') fetchGroups();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, logsOffset]);

  if (loading) {
    return (
      <Layout title="Admin Panel">
        <TableSkeleton rows={6} />
      </Layout>
    );
  }

  return (
    <Layout title="Control Panel">
      {/* System stats grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Registered Users</span>
            <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg"><Users className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.totals.users || 0}</h3>
        </div>

        <div className="glass-card p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Group Workspaces</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><FolderKanban className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.totals.groups || 0}</h3>
        </div>

        <div className="glass-card p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Import Sessions run</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Activity className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">{stats?.totals.imports || 0}</h3>
        </div>

        <div className="glass-card p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Base Volume Processed</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CreditCard className="h-4 w-4" /></div>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-3">
            ${stats?.totals.totalVolumeInBase.toFixed(2) || '0.00'}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/50">
        {(['users', 'groups', 'logs'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 capitalize transition-colors
              ${activeTab === tab
                ? 'border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }
            `}
          >
            {tab === 'logs' ? 'Audit Logs' : `${tab}`}
          </button>
        ))}
      </div>

      {/* Tab content area */}
      <div className="space-y-6">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="glass-card-no-hover border border-white/20 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
                  <th className="p-4 font-semibold text-slate-400">User Details</th>
                  <th className="p-4 font-semibold text-slate-400">Role Status</th>
                  <th className="p-4 font-semibold text-slate-400">Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                    <td className="p-4 flex items-center gap-3">
                      <img 
                        src={getDoodleAvatar(u.name || u.email)} 
                        alt="Avatar" 
                        className="h-8 w-8 border-2 border-black dark:border-white bg-slate-100 rounded-lg" 
                      />
                      <div>
                        <span className="font-bold text-slate-950 dark:text-white block">{u.name}</span>
                        <span className="text-xs text-slate-400">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider
                        ${u.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="glass-card-no-hover border border-white/20 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
                  <th className="p-4 font-semibold text-slate-400">Group Name</th>
                  <th className="p-4 font-semibold text-slate-400">Owner</th>
                  <th className="p-4 font-semibold text-slate-400">Members Count</th>
                  <th className="p-4 font-semibold text-slate-400">Expenses Log</th>
                </tr>
              </thead>
              <tbody>
                {groupsList.map(g => (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                    <td className="p-4 font-bold text-slate-950 dark:text-white">
                      {g.name}
                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">Base: {g.baseCurrency}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold block">{g.createdBy.name}</span>
                      <span className="text-xs text-slate-400">{g.createdBy.email}</span>
                    </td>
                    <td className="p-4">{g._count.members}</td>
                    <td className="p-4">{g._count.expenses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="glass-card-no-hover border border-white/20 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-200/40 dark:bg-slate-900/40 border-b border-slate-200/50 dark:border-slate-800/50">
                    <th className="p-3 font-semibold text-slate-400">User</th>
                    <th className="p-3 font-semibold text-slate-400">Action Code</th>
                    <th className="p-3 font-semibold text-slate-400">Description</th>
                    <th className="p-3 font-semibold text-slate-400">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/30 hover:bg-slate-100/30 dark:hover:bg-slate-900/10">
                      <td className="p-3 font-semibold">{log.user?.name || 'SYSTEM'}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white uppercase tracking-wider">{log.action}</td>
                      <td className="p-3 text-slate-500">{log.details}</td>
                      <td className="p-3 text-slate-400 font-medium">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Showing {auditLogs.length} of {logsCount} logs</span>
              <div className="flex gap-2">
                <button
                  disabled={logsOffset === 0}
                  onClick={() => setLogsOffset(prev => Math.max(0, prev - 15))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={logsOffset + 15 >= logsCount}
                  onClick={() => setLogsOffset(prev => prev + 15)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-900 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
