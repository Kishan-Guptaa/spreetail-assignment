import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoodleAvatar } from '../utils/avatar';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  BookOpen, 
  ShieldAlert, 
  LogOut,
  Zap,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'Groups', icon: Users },
    { to: '/import', label: 'CSV Import', icon: FileSpreadsheet },
    { to: '/decisions', label: 'Decision Log', icon: BookOpen },
  ];

  // If user is admin, show the Admin Panel link
  if (user?.role === 'ADMIN') {
    navItems.push({ to: '/admin', label: 'Admin Panel', icon: ShieldAlert });
  }

  const baseSidebarClasses = "fixed inset-y-0 left-0 z-40 w-64 glass-panel !rounded-none border-r-[3px] border-black dark:border-white flex flex-col justify-between py-6 px-4 transition-transform duration-300 lg:translate-x-0 lg:static shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_0px_0px_0px_rgba(255,255,255,1)]";
  const finalSidebarClasses = isOpen 
    ? `${baseSidebarClasses} translate-x-0` 
    : `${baseSidebarClasses} -translate-x-full`;

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={finalSidebarClasses}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 mb-8">
            <div className="h-10 w-10 border-2 border-black dark:border-white bg-[#ffe484] dark:bg-[#ffd54f] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-white" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                ExpenseFlow
              </h1>
              <span className="text-xs text-slate-500 dark:text-slate-400">Expense Management</span>
            </div>
            <button 
              onClick={onClose}
              className="ml-auto text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 font-bold text-sm transition-all duration-200 border-[2.5px] rounded-lg
                  ${isActive 
                    ? 'bg-[#ffe484] text-black border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]' 
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200 border-transparent hover:border-black dark:hover:border-white hover:bg-white dark:hover:bg-neutral-800 hover:shadow-[2px_2px_0px_0px_#000] dark:hover:shadow-[2px_2px_0px_0px_#fff]'
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User profile section */}
        <div className="border-t border-black dark:border-neutral-850 pt-6 px-2 space-y-4">
          <div className="flex items-center gap-3">
            <img 
              src={getDoodleAvatar(user?.name || user?.email)} 
              alt="Avatar" 
              className="h-10 w-10 border-2 border-black dark:border-white bg-slate-200 rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                {user?.name}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 border-2 border-transparent hover:border-rose-500 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-sm transition-all duration-200 rounded-lg"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};
