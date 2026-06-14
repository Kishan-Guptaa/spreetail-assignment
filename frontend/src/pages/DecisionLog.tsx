import React from 'react';
import { Layout } from '../components/Layout';
import { BookOpen, Shield, Calendar, DollarSign, Copy } from 'lucide-react';

export const DecisionLog: React.FC = () => {
  const policies = [
    {
      title: '1. Duplicate Expense Policy',
      icon: Copy,
      color: 'text-indigo-500 bg-indigo-500/10',
      description: 'Identifies duplicates by checking matching details. Also handles cases where the details are identical but values differ.',
      rules: [
        'Exact Duplicate: Flags rows matching an existing entry in the group with the exact same Title, Date, Paid By member, and Amount.',
        'Different Amount Duplicate: Flags rows sharing the same Title, Date, and Paid By member but with a DIFFERENT amount. This prevents duplicate bookings with minor typos.'
      ]
    },
    {
      title: '2. Negative Amount Policy',
      icon: DollarSign,
      color: 'text-rose-500 bg-rose-500/10',
      description: 'Maintains positive balances by preventing values at or below zero.',
      rules: [
        'Strict Positive Bounds: All transactions categorized as Expenses must specify an amount > 0.00.',
        'Validation Level: Marked as a CRITICAL ERROR. The importer blocks uploading these rows until edited/corrected by the user.'
      ]
    },
    {
      title: '3. Currency Conversion Policy',
      icon: Shield,
      color: 'text-brand-500 bg-brand-500/10',
      description: 'Manages multi-currency balances across standard base conversions.',
      rules: [
        'Original Ledgering: Retains and stores the original currency (USD, EUR, INR) and total amount.',
        'Conversion: Computes and stores the base currency equivalent (based on group settings) using rates configured in the database, allowing uniform split balances calculation.'
      ]
    },
    {
      title: '4. Dynamic Membership Policy',
      icon: Calendar,
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Verifies active memberships during date checks, ensuring members only pay for expenses active during their participation window.',
      rules: [
        'Active Duration Bounds: Checks whether the expense date is within the member\'s joinDate and leaveDate range.',
        'Validation Level: Generates a WARNING if members are inactive on the date, allowing manual override or auto-backdating join times.'
      ]
    },
    {
      title: '5. Settlement Detection Policy',
      icon: BookOpen,
      color: 'text-amber-500 bg-amber-500/10',
      description: 'Catches cash repayments mislabeled as expenses.',
      rules: [
        'Keyword Checks: Scans titles/descriptions for flags like "settle", "repaid", "paid back", "cleared", "payment".',
        'Validation Level: Marked as INFO. Suggests importing the row as a Settlement ledger payment instead of a shared expense.'
      ]
    }
  ];

  return (
    <Layout title="System Decisions Log">
      <div className="glass-card p-6 border border-white/20 mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Architectural Policy Log</h3>
        <p className="text-sm text-slate-400">
          Official engineering manual detailing how ExpenseFlow validates transaction rules, manages floats, and processes CSV data structures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy, i) => (
          <div key={i} className="glass-card p-6 border border-white/20 h-fit space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${policy.color}`}>
                <policy.icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{policy.title}</h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {policy.description}
            </p>

            <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Rules</span>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {policy.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">{rule}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};
