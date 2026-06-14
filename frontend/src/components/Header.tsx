import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="glass-panel !rounded-none border-b-[3px] border-t-0 border-l-0 border-r-0 border-black dark:border-white sticky top-0 z-30 flex items-center justify-between px-6 py-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0px_4px_0px_0px_rgba(255,255,255,1)] bg-[#fdfbf6] dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        {/* Menu toggle button for mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 border-2 border-black dark:border-white text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none lg:hidden rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Architects Daughter', cursive" }}>
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme toggler */}
        <button
          onClick={toggleTheme}
          className="p-2.5 border-2 border-black dark:border-white text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-lg"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};
