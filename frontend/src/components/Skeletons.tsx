import React from 'react';

export const StatCardSkeleton: React.FC = () => (
  <div className="glass-card-no-hover p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
      <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
    </div>
    <div className="mt-4 h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
    <div className="mt-2 h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card-no-hover p-6 h-80 animate-pulse bg-slate-200/20 dark:bg-slate-800/10"></div>
      <div className="glass-card-no-hover p-6 h-80 animate-pulse bg-slate-200/20 dark:bg-slate-800/10"></div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full space-y-4 animate-pulse">
    <div className="h-10 bg-slate-200/50 dark:bg-slate-800/30 rounded-lg"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
      </div>
    ))}
  </div>
);

export const GroupListSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="glass-card-no-hover p-6 h-48 space-y-4">
        <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded text-right ml-auto mt-6"></div>
      </div>
    ))}
  </div>
);
