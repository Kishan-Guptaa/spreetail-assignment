import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Layout } from '../components/Layout';
import { GroupListSkeleton } from '../components/Skeletons';
import { CreateGroupModal } from '../components/Dialogs';
import { Plus, Users, FolderKanban, Coins } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string | null;
  baseCurrency: string;
  createdAt: string;
  members: { id: string; name: string }[];
}

export const Groups: React.FC = () => {
  const { apiFetch } = useAuth();
  const toast = useToast();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/groups');
      setGroups(res);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch groups list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (groupData: { name: string; description: string; baseCurrency: string }) => {
    try {
      await apiFetch('/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      toast.success('Group created successfully!');
      fetchGroups();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create group');
    }
  };

  return (
    <Layout title="My Groups">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-slate-400">Collaborative workspaces to split expenses and clear debts</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-5 w-5" />
          New Group
        </button>
      </div>

      {loading ? (
        <GroupListSkeleton />
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="glass-card p-6 flex flex-col justify-between h-48 border border-white/20 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {group.name}
                  </h3>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Coins className="h-3.5 w-3.5" />
                    {group.baseCurrency}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 mt-1">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 pt-4 mt-4">
                <span className="text-xs text-slate-400">
                  Created {new Date(group.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <Users className="h-4 w-4" />
                  {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="glass-card-no-hover p-12 text-center border border-dashed border-slate-300/40 dark:border-slate-800/40 py-20 flex flex-col items-center">
          <FolderKanban className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Groups Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
            Create a shared workspace to start split-billing groceries, bills, travel accommodations, or dinners with colleagues.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-5 w-5" /> Create Group Now
          </button>
        </div>
      )}

      <CreateGroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </Layout>
  );
};
