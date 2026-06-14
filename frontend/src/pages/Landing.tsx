import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Users, Scale, ArrowRight, ArrowUpRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const crewMembers = [
  {
    id: 1,
    name: "Johnny Cap",
    role: "The Memory Loss Spender",
    doodle: "/doodles/doodle_1.png",
    quote: "Oh, did we go out last night? I thought you treated me!",
    habit: "Always forgets to check his ledger, relies on automatic graph settlements.",
    rating: "9/10 Forgetfulness",
    color: "bg-[#ffe484]"
  },
  {
    id: 2,
    name: "Baby Lily",
    role: "The Passive Invitee",
    doodle: "/doodles/doodle_2.png",
    quote: "Goo goo, ga ga (translate: Split the milk 4 ways).",
    habit: "Gets auto-invited to trips but has zero transaction volume.",
    rating: "1/10 Activity",
    color: "bg-[#a2e0ff]"
  },
  {
    id: 3,
    name: "Uncle Bob",
    role: "The Cash Negotiator",
    doodle: "/doodles/doodle_3.png",
    quote: "Here is $3.25 in quarters. We are square, right?",
    habit: "Keeps triggering SETTLEMENT_FLAG warnings by naming transactions 'cash repayment'.",
    rating: "8/10 Cash Dependency",
    color: "bg-[#ff6b6b]"
  },
  {
    id: 4,
    name: "Brad Cheeseman",
    role: "The Gourmet Splitter",
    doodle: "/doodles/doodle_4.png",
    quote: "I bought $400 of imported truffle cheese. We all split it equally, yes?",
    habit: "Uploads massive CSV logs filled with gourmet items, causing high average group debt.",
    rating: "10/10 Truffle Bias",
    color: "bg-[#88fcb2]"
  },
  {
    id: 5,
    name: "Mrs. Gable",
    role: "The Salad Veteran",
    doodle: "/doodles/doodle_5.png",
    quote: "I only had a glass of water, but sure, let's split the steak dinner evenly.",
    habit: "The ultimate group peacemaker. Quietly pays for everyone's duplicate expenses.",
    rating: "10/10 Generosity",
    color: "bg-[#ffe484]"
  },
  {
    id: 6,
    name: "Sarah Mathers",
    role: "The Six-Decimal Accountant",
    doodle: "/doodles/doodle_6.png",
    quote: "Your share is $14.235689 in EUR, converted at yesterday's exchange rate.",
    habit: "Rejects transactions if split percentages sum to 99.999% instead of 100%.",
    rating: "10/10 Precision",
    color: "bg-[#a2e0ff]"
  },
  {
    id: 7,
    name: "Emily Spacebuns",
    role: "The Timeline Rebel",
    doodle: "/doodles/doodle_7.png",
    quote: "I know I joined the group today, but can I backdate my flight cost to last month?",
    habit: "Regularly triggers the MEMBER_INACTIVE rule warning by entering transactions outside roster date range.",
    rating: "9/10 Roster Violation",
    color: "bg-[#ff6b6b]"
  },
  {
    id: 8,
    name: "Timmy Slice",
    role: "The Pro-Rata Master",
    doodle: "/doodles/doodle_8.png",
    quote: "I ate 2.5 slices of pizza, Brad ate 3, so I will pay exactly 31.25% of the bill.",
    habit: "Prefers split-by-shares over standard splits. Keeps calculators on tabs.",
    rating: "8/10 Calculation Time",
    color: "bg-[#88fcb2]"
  },
  {
    id: 9,
    name: "Dave Ironfist",
    role: "The Log Auditor",
    doodle: "/doodles/doodle_9.png",
    quote: "This CSV header is missing a column. DENIED.",
    habit: "Catches 13 categories of database anomalies before they hit the ledger.",
    rating: "10/10 Audit Severity",
    color: "bg-[#ffe484]"
  }
];

export const Landing: React.FC = () => {
  const { token } = useAuth();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const [selectedCrew, setSelectedCrew] = useState(crewMembers[0]);

  // Hero Mock Dashboard State
  const [heroTab, setHeroTab] = useState<'ledger' | 'balances' | 'graph'>('ledger');
  const [heroExpenses, setHeroExpenses] = useState([
    { id: '1', title: '🍕 Pizza Feast', amount: 90, paidBy: 'Johnny Cap', date: 'June 10' },
    { id: '2', title: '⛽ Gas Refuel', amount: 60, paidBy: 'Mrs. Gable', date: 'June 11' },
  ]);
  const [hasAddedMockExpense, setHasAddedMockExpense] = useState(false);

  // Core Engine Sandbox State
  const [sandboxTab, setSandboxTab] = useState<'simplifier' | 'scanner' | 'timeline'>('simplifier');
  const [isSimplified, setIsSimplified] = useState(false);
  const [isCsvAudited, setIsCsvAudited] = useState(false);
  const [timelineDate, setTimelineDate] = useState<'june10' | 'june20'>('june10');

  const calculateHeroBalances = () => {
    const membersList = ['Johnny Cap', 'Mrs. Gable', 'Brad Cheeseman'];
    const balancesMap: Record<string, number> = {
      'Johnny Cap': 0,
      'Mrs. Gable': 0,
      'Brad Cheeseman': 0,
    };

    heroExpenses.forEach((exp) => {
      const share = exp.amount / 3;
      membersList.forEach((m) => {
        balancesMap[m] -= share;
      });
      balancesMap[exp.paidBy] += exp.amount;
    });

    return balancesMap;
  };

  const heroBalances = calculateHeroBalances();

  const handleAddMockExpense = () => {
    if (hasAddedMockExpense) {
      setHeroExpenses([
        { id: '1', title: '🍕 Pizza Feast', amount: 90, paidBy: 'Johnny Cap', date: 'June 10' },
        { id: '2', title: '⛽ Gas Refuel', amount: 60, paidBy: 'Mrs. Gable', date: 'June 11' },
      ]);
      setHasAddedMockExpense(false);
    } else {
      setHeroExpenses((prev) => [
        ...prev,
        { id: '3', title: '☕ Coffee Split', amount: 30, paidBy: 'Brad Cheeseman', date: 'June 12' },
      ]);
      setHasAddedMockExpense(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };



  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-between bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Animated blob backgrounds */}
      <div className="bg-mesh">
        <div className="blob-1"></div>
        <div className="blob-2"></div>
        <div className="blob-3"></div>
      </div>

      {/* Navigation Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-20"
      >
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-10 w-10 border-2 border-black dark:border-white bg-[#ffe484] dark:bg-[#ffd54f] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] group-hover:scale-115 group-hover:rotate-6 transition-transform duration-300 rounded-xl">
            <Zap className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-black text-black dark:text-white">
            ExpenseFlow
          </h1>
        </div>
        <div>
          {token ? (
            <Link to="/dashboard" className="btn-primary py-2 px-6 group">
              Enter App <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white font-bold text-sm transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary py-2 px-6 group">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 py-20 z-10">

        {/* Left Column (Text) */}
        <motion.div
          className="flex-1 space-y-8 text-center lg:text-left z-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white bg-[#ffe484] dark:bg-[#ffd54f] text-black text-sm font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] rounded-xl">
              <Sparkles className="h-4 w-4 animate-pulse" /> Next-Gen Shared Expenses
            </div>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-5xl sm:text-6xl lg:text-7.5xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight drop-shadow-xl"
          >
            Split expenses.<br />
            Detect anomalies.<br />
            <span className="highlight-yellow inline-block mt-2 dark:text-black">
              Flow seamlessly.
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-bold leading-relaxed"
          >
            Manage group balances, split bills using complex math, import CSV spreadsheets, and automatically catch database anomalies like duplicate expenses and blank fields.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
          >
            <Link to={token ? "/dashboard" : "/register"} className="w-full sm:w-auto btn-primary text-lg px-8 py-4 group hover:-translate-y-1 transition-all">
              Start Free Trial <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/decisions" className="w-full sm:w-auto btn-secondary text-lg px-8 py-4 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group">
              View Rules & Decisions <ArrowUpRight className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Column (Interactive Mock Dashboard Window) */}
        <motion.div
          className="flex-1 w-full relative z-10"
          style={{ y: y1 }}
        >
          <div className="glass-panel w-full overflow-hidden flex flex-col h-[400px] text-slate-800 dark:text-neutral-100 bg-[#fdfbf6] dark:bg-neutral-900 border-[3px] border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
            {/* Window Header */}
            <div className="border-b-[3px] border-black dark:border-white bg-[#ffe484] dark:bg-neutral-850 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-black" />
                <div className="h-3.5 w-3.5 rounded-full bg-amber-400 border-2 border-black" />
                <div className="h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                <span className="ml-2 font-black text-xs text-black dark:text-white uppercase tracking-wider font-mono">spaceland-trip-ledger</span>
              </div>
              <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-white px-2 py-0.5 text-[10px] font-black uppercase text-black dark:text-white rounded-md shadow-[1.5px_1.5px_0px_0px_#000] dark:shadow-[1.5px_1.5px_0px_0px_#fff]">
                Interactive Demo ⚡
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Mini Sidebar */}
              <div className="w-1/4 border-r-2 border-black dark:border-white bg-white/40 dark:bg-neutral-950/40 p-3 flex flex-col gap-2.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-neutral-500">Roster</div>
                <div className="flex items-center gap-2">
                  <img src="/doodles/doodle_1.png" className="w-6 h-6 object-contain" alt="Johnny" />
                  <span className="text-xs font-bold truncate">Johnny C.</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/doodles/doodle_5.png" className="w-6 h-6 object-contain" alt="Mrs. Gable" />
                  <span className="text-xs font-bold truncate">Mrs. Gable</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/doodles/doodle_4.png" className="w-6 h-6 object-contain" alt="Brad" />
                  <span className="text-xs font-bold truncate">Brad C.</span>
                </div>
              </div>

              {/* Main Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
                {/* Mock Tabs */}
                <div className="flex border-b-2 border-black dark:border-white bg-slate-100 dark:bg-neutral-800">
                  {(['ledger', 'balances', 'graph'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setHeroTab(tab)}
                      className={`flex-1 py-2 text-xs font-black capitalize transition-colors border-r-2 border-black dark:border-white last:border-r-0 ${heroTab === tab
                          ? 'bg-[#ffe484] dark:bg-[#ffd54f] text-black font-black'
                          : 'text-slate-500 hover:text-black dark:hover:text-white'
                        }`}
                    >
                      {tab === 'ledger' && '📜 Ledger'}
                      {tab === 'balances' && '⚖️ Balances'}
                      {tab === 'graph' && '⚡ Solver'}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-4 overflow-y-auto scrollbar-thin flex flex-col justify-between">
                  <div className="space-y-2">
                    {heroTab === 'ledger' && (
                      <div className="space-y-2.5">
                        {heroExpenses.map((exp) => (
                          <div key={exp.id} className="border-2 border-black dark:border-white p-2 bg-slate-50 dark:bg-neutral-850 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
                            <div>
                              <div className="text-xs font-black">{exp.title}</div>
                              <div className="text-[10px] text-slate-400">Paid by {exp.paidBy}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black">${exp.amount}</div>
                              <div className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold uppercase">Equal Split</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {heroTab === 'balances' && (
                      <div className="space-y-2">
                        {Object.entries(heroBalances).map(([name, bal]) => (
                          <div key={name} className="flex items-center justify-between border-b border-dashed border-slate-200 dark:border-neutral-800 pb-1.5 text-xs">
                            <span className="font-bold">{name}</span>
                            <span className={`font-black ${bal > 0 ? 'text-emerald-600 dark:text-emerald-400' : bal < 0 ? 'text-rose-500 dark:text-rose-450' : 'text-slate-400'}`}>
                              {bal > 0 ? `Gets back $${bal.toFixed(2)}` : bal < 0 ? `Owes $${Math.abs(bal).toFixed(2)}` : 'Settled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {heroTab === 'graph' && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase">Simplified Settlement suggestions:</div>
                        {heroBalances['Brad Cheeseman'] < 0 ? (
                          <div className="border-2 border-black dark:border-white p-2.5 bg-indigo-50/50 dark:bg-neutral-850 rounded-lg flex flex-col gap-2 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold">Brad C.</span> owes <span className="font-bold">Johnny C.</span>
                              </div>
                              <span className="font-black text-indigo-650 dark:text-indigo-450">${Math.abs(heroBalances['Johnny Cap'] > 0 ? heroBalances['Johnny Cap'] : 0).toFixed(2)}</span>
                            </div>
                            {heroBalances['Mrs. Gable'] > 0 && (
                              <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-350 dark:border-neutral-700 pt-1.5">
                                <div>
                                  <span className="font-bold">Brad C.</span> owes <span className="font-bold">Mrs. Gable</span>
                                </div>
                                <span className="font-black text-indigo-650 dark:text-indigo-450">${Math.abs(heroBalances['Mrs. Gable']).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-xs text-slate-400 py-4">No settlements needed.</div>
                        )}
                        <div className="text-[10px] font-handwritten text-indigo-600 dark:text-indigo-400 text-center font-bold">
                          ⚡ Greedy Solver computes the minimum possible transfers to settle the balances tab!
                        </div>
                      </div>
                    )}
                  </div>

                  {heroTab === 'ledger' && (
                    <button
                      onClick={handleAddMockExpense}
                      className="w-full border-2 border-black dark:border-white bg-[#a2e0ff] hover:bg-[#85cdff] dark:bg-neutral-800 text-black dark:text-white text-xs font-black py-2 rounded-lg shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
                    >
                      {hasAddedMockExpense ? '🔄 Reset Demo Ledger' : '➕ Add $30 Coffee (Paid by Brad)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative floating blur behind card */}
          <motion.div
            style={{ y: y2 }}
            className="absolute -inset-10 bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-full mix-blend-multiply dark:mix-blend-screen"
          />
        </motion.div>
      </main>

      {/* Traditional vs ExpenseFlow Comparison Grid */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 z-10 animate-fade-in border-t border-slate-200/20">
        <div className="text-center mb-12">
          <span className="highlight-cyan text-xs font-black uppercase text-black dark:text-black px-3 py-1">
            Product Battle
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 mb-4">
            Traditional Splitting vs. ExpenseFlow
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-bold max-w-2xl mx-auto">
            Why settle for standard math grids when you can audit, timeline-restrict, and automate your settlements?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Traditional App Box */}
          <div className="glass-card-no-hover p-8 border-slate-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <h3 className="text-2xl font-black text-rose-500 mb-6 font-handwritten text-3xl">Traditional Split Apps</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold flex-shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Timeline Blindness</span>
                  Charges members for costs incurred before they joined or after they departed the group.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold flex-shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Zero Audit Control</span>
                  Accepts duplicates, empty cells, and broken split rows in CSV uploads, forcing manual line deletes.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold flex-shrink-0 mt-0.5">✕</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Complex Settlement Chains</span>
                  Calculates separate IOUs among every member pair, leading to circular transit bank payments.
                </p>
              </li>
            </ul>
          </div>

          {/* ExpenseFlow Box */}
          <div className="glass-card p-8 bg-[#fdfbf6] dark:bg-neutral-900 relative">
            <div className="absolute top-4 right-4 bg-emerald-300 dark:bg-emerald-500 text-black border-2 border-black dark:border-white px-2 py-0.5 text-[10px] font-black uppercase rounded shadow-[1.5px_1.5px_0px_0px_#000] dark:shadow-[1.5px_1.5px_0px_0px_#fff]">
              Winner ⚡
            </div>

            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-6 font-handwritten text-3xl">ExpenseFlow Engine</h3>

            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-500/25 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Roster-Restricted Calendars</span>
                  Automatically monitors user check-in/checkout calendars to calculate precise pro-rata splits.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-500/25 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Real-Time In-Line Diagnostics</span>
                  Audits incoming spreadsheets on upload, providing visual highlighter error logs and quick resolution panels.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-500/25 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                <p className="text-sm text-slate-650 dark:text-slate-400 font-bold leading-relaxed">
                  <span className="text-slate-900 dark:text-white block font-black">Graph Collapsing Solver</span>
                  Simplifies debts using an advanced greedy search algorithm, merging double legs into a direct payout.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Core Engine Sandbox */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 z-10 animate-fade-in border-t border-slate-200/20">
        <div className="text-center mb-12">
          <span className="highlight-yellow text-xs font-black uppercase text-black dark:text-black px-3 py-1">
            Engine Playground
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 mb-4">
            Try the Core Split Engines
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-bold max-w-2xl mx-auto">
            Interact with our sandbox simulator below to see how ExpenseFlow automates group debt management.
          </p>
        </div>

        {/* Sandbox Notebook Container */}
        <div className="glass-panel grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[480px]">
          {/* Left Control Column */}
          <div className="lg:col-span-4 border-r-0 lg:border-r-[3px] border-b-[3px] lg:border-b-0 border-black dark:border-white bg-slate-50 dark:bg-neutral-900/50 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-xl font-bold uppercase tracking-wider border-b-2 border-black dark:border-white pb-3 font-handwritten text-3xl">
                Control Center
              </h3>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setSandboxTab('simplifier')}
                  className={`w-full text-left p-4 border-2 border-black dark:border-white rounded-xl transition-all flex items-center justify-between ${sandboxTab === 'simplifier'
                      ? 'bg-[#ffe484] dark:bg-[#ffd54f] text-black shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] scale-102'
                      : 'bg-white dark:bg-neutral-800 text-slate-705 dark:text-slate-300 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff] hover:bg-slate-100 dark:hover:bg-neutral-700/50'
                    }`}
                >
                  <div>
                    <div className="font-black text-sm">🧮 Debt Simplifier</div>
                    <div className="text-[10px] opacity-75 font-semibold mt-1">Greedy solver collapses transit debts.</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setSandboxTab('scanner')}
                  className={`w-full text-left p-4 border-2 border-black dark:border-white rounded-xl transition-all flex items-center justify-between ${sandboxTab === 'scanner'
                      ? 'bg-[#a2e0ff] dark:bg-[#4ea8de] text-black shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] scale-102'
                      : 'bg-white dark:bg-neutral-800 text-slate-705 dark:text-slate-300 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff] hover:bg-slate-100 dark:hover:bg-neutral-700/50'
                    }`}
                >
                  <div>
                    <div className="font-black text-sm">⚠️ CSV Anomaly Scanner</div>
                    <div className="text-[10px] opacity-75 font-semibold mt-1">Audit inputs for duplicates & date ranges.</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setSandboxTab('timeline')}
                  className={`w-full text-left p-4 border-2 border-black dark:border-white rounded-xl transition-all flex items-center justify-between ${sandboxTab === 'timeline'
                      ? 'bg-[#88fcb2] dark:bg-[#4ad66d] text-black shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] scale-102'
                      : 'bg-white dark:bg-neutral-800 text-slate-705 dark:text-slate-300 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff] hover:bg-slate-100 dark:hover:bg-neutral-700/50'
                    }`}
                >
                  <div>
                    <div className="font-black text-sm">📅 Dynamic Timeline Splitter</div>
                    <div className="text-[10px] opacity-75 font-semibold mt-1">Auto-include members by join/leave dates.</div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="text-xs font-handwritten text-slate-500 dark:text-slate-400 mt-6 pt-4 border-t border-dashed border-slate-300 dark:border-neutral-800">
              💡 Click any option above to inspect simulated data and watch the solver react dynamically!
            </div>
          </div>

          {/* Right Sandbox Display Area */}
          <div className="lg:col-span-8 p-8 bg-white dark:bg-neutral-900 flex flex-col justify-between relative">
            {/* Notebook margins line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-red-400/20 pointer-events-none" />

            <div className="pl-6 space-y-6 flex-1 flex flex-col justify-between">
              {sandboxTab === 'simplifier' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="highlight-yellow text-xs font-black text-black">Feature 01</span>
                      <h4 className="text-2xl font-black">Graph Simplifier Solver</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                      In a normal group, transit IOUs grow complex (Alice owes Bob, Bob owes Charlie). Our greedy solver traverses the ledger debt vectors, offsets balances, and gives you the absolute lowest path of settlements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                    {/* Raw Debts */}
                    <div className="border-2 border-black dark:border-white p-4 rounded-xl bg-slate-50 dark:bg-neutral-850 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] relative">
                      <div className="text-xs font-black uppercase tracking-wider text-rose-500 mb-2">Before Optimization</div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span>Brad owes Johnny</span> <span className="font-bold">$40.00</span></div>
                        <div className="flex justify-between"><span>Brad owes Mrs. Gable</span> <span className="font-bold">$10.00</span></div>
                        <div className="flex justify-between"><span>Mrs. Gable owes Johnny</span> <span className="font-bold">$20.00</span></div>
                        <div className="flex justify-between"><span>Emily owes Mrs. Gable</span> <span className="font-bold">$20.00</span></div>
                        <div className="flex justify-between border-t border-dashed border-slate-350 dark:border-neutral-700 pt-1.5 font-black text-rose-600 dark:text-rose-400">
                          <span>5 Transactions</span> <span>Total: $100.00</span>
                        </div>
                      </div>
                    </div>

                    {/* Simplified Debts */}
                    <div className="border-2 border-black dark:border-white p-4 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/10 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] transition-all">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">After Solver Execution</div>
                      {isSimplified ? (
                        <div className="space-y-1.5 text-xs animate-fade-in">
                          <div className="flex justify-between"><span>Brad owes Johnny</span> <span className="font-bold">$50.00</span></div>
                          <div className="flex justify-between"><span>Emily owes Johnny</span> <span className="font-bold">$30.00</span></div>
                          <div className="flex justify-between"><span>Mrs. Gable is fully settled!</span> <span className="font-bold">$0.00</span></div>
                          <div className="flex justify-between border-t border-dashed border-emerald-300 dark:border-emerald-800 pt-1.5 font-black text-emerald-600">
                            <span>2 Transactions</span> <span>Total: $80.00</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-slate-400 text-xs font-handwritten text-xl text-center">
                          Click the solver button below!
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSimplified(!isSimplified)}
                    className="btn-primary w-full md:w-auto self-start px-6"
                  >
                    {isSimplified ? '🔄 Reset Graph' : '⚡ Run Greedy Solver'}
                  </button>
                </div>
              )}

              {sandboxTab === 'scanner' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="highlight-cyan text-xs font-black text-black">Feature 02</span>
                      <h4 className="text-2xl font-black">Audit CSV Spreadsheet Engine</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                      Avoid dirty database entries. Upload spreadsheets from other ledger managers, and our audit diagnostics flags missing columns, double purchases, and date anomalies before they write to Postgres.
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] my-4 text-xs bg-slate-50 dark:bg-neutral-850">
                    <div className="grid grid-cols-12 font-black border-b-2 border-black dark:border-white bg-[#a2e0ff] dark:bg-neutral-800 text-black dark:text-white p-2">
                      <div className="col-span-3">Title</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-2 pl-2">Paid By</div>
                      <div className="col-span-5 pl-2">Audit Warnings</div>
                    </div>

                    <div className="p-2 space-y-2">
                      <div className="grid grid-cols-12 items-center p-1.5 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                        <div className="col-span-3 font-bold">Cabin Stay</div>
                        <div className="col-span-2 text-right font-mono">$300.00</div>
                        <div className="col-span-2 pl-2">Brad</div>
                        <div className="col-span-5 pl-2 text-emerald-500 font-bold">✅ Clean</div>
                      </div>

                      <div className={`grid grid-cols-12 items-center p-1.5 rounded transition-all duration-300 border ${isCsvAudited
                          ? 'opacity-40 line-through bg-rose-50/10 dark:bg-rose-950/10 border-slate-200 dark:border-neutral-800'
                          : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                        }`}>
                        <div className="col-span-3 font-bold">Cabin Stay</div>
                        <div className="col-span-2 text-right font-mono">$300.00</div>
                        <div className="col-span-2 pl-2">Brad</div>
                        <div className="col-span-5 pl-2 text-rose-500 font-bold">
                          {isCsvAudited ? '🗑️ Auto-Ignored Duplicate' : '⚠️ Duplicate of row 1 detected'}
                        </div>
                      </div>

                      <div className="grid grid-cols-12 items-center p-1.5 rounded bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800">
                        <div className="col-span-3 font-bold">Dinner Party</div>
                        <div className="col-span-2 text-right font-mono">$45.00</div>
                        <div className="col-span-2 pl-2">Emily</div>
                        <div className="col-span-5 pl-2 font-bold">
                          {isCsvAudited ? (
                            <span className="text-emerald-500">✅ Roster active date extended to June 14</span>
                          ) : (
                            <span className="text-rose-500">⚠️ Emily inactive on transaction date (June 14)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCsvAudited(!isCsvAudited)}
                    className="btn-primary w-full md:w-auto self-start px-6 bg-[#a2e0ff] hover:bg-[#85cdff]"
                  >
                    {isCsvAudited ? '🔄 Reload Dirty CSV' : '🔍 Run Audit & Fix Diagnostics'}
                  </button>
                </div>
              )}

              {sandboxTab === 'timeline' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="highlight-pink text-xs font-black text-white">Feature 03</span>
                      <h4 className="text-2xl font-black">Dynamic Timeline Roster Splits</h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                      Friends join trips late or leave early. Traditional apps require complex math to exclude people from splits. ExpenseFlow automatically monitors each user's membership calendar, dividing expenses only among active participants.
                    </p>
                  </div>

                  <div className="border-2 border-black dark:border-white p-4 rounded-xl bg-slate-50 dark:bg-neutral-850 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] space-y-4 my-2">
                    {/* Toggle Selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">Select Expense Date:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTimelineDate('june10')}
                          className={`px-3 py-1 text-xs font-bold border-2 border-black dark:border-white rounded-lg transition-all ${timelineDate === 'june10'
                              ? 'bg-[#ffe484] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          📅 June 10
                        </button>
                        <button
                          onClick={() => setTimelineDate('june20')}
                          className={`px-3 py-1 text-xs font-bold border-2 border-black dark:border-white rounded-lg transition-all ${timelineDate === 'june20'
                              ? 'bg-[#ffe484] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                          📅 June 20
                        </button>
                      </div>
                    </div>

                    {/* Member Active Status Display */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="border border-slate-300 dark:border-neutral-700 p-2.5 bg-white dark:bg-neutral-900 rounded-lg">
                        <div className="font-bold flex items-center justify-between">
                          <span>Mrs. Gable</span>
                          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-1 rounded">Active June 1-30</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Split portion: {timelineDate === 'june10' ? '$45.00 (50%)' : '$90.00 (100%)'}</div>
                      </div>

                      <div className={`border p-2.5 rounded-lg transition-all ${timelineDate === 'june10'
                          ? 'border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                          : 'border-rose-350 bg-rose-50/20 opacity-60 dark:bg-rose-950/10'
                        }`}>
                        <div className="font-bold flex items-center justify-between">
                          <span>Johnny Cap</span>
                          {timelineDate === 'june10' ? (
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-1 rounded">Active June 1-15</span>
                          ) : (
                            <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1 rounded">Left June 15</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Split portion: {timelineDate === 'june10' ? '$45.00 (50%)' : '$0.00 (EXCLUDED)'}
                        </div>
                      </div>
                    </div>

                    {/* Explanatory handwritten label */}
                    <div className="text-center font-handwritten text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                      {timelineDate === 'june10'
                        ? 'Both members are active on June 10. Split is calculated 50/50.'
                        : 'Johnny Cap left on June 15. The solver automatically excludes him on June 20, leaving Mrs. Gable with 100% of the cost.'
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Timeline Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-16 z-10 animate-fade-in">
        <div className="text-center mb-12">
          <span className="highlight-cyan text-xs font-black uppercase text-black dark:text-black px-3 py-1">
            Core Workflow
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 mb-4">
            How ExpenseFlow Works
          </h2>
          <p className="text-lg text-slate-750 dark:text-slate-300 font-bold max-w-2xl mx-auto">
            Manage shared debt easily without the headache of manual logs. Here is the actual split journey:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="glass-card p-6 flex flex-col justify-between h-72">
            <div>
              <div className="text-4xl font-black text-slate-300 dark:text-slate-700 mb-3" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                01
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Launch Group
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Create a shared space for travel, house split-sheets, or dinners. Invite members with custom join/leave dates.
              </p>
            </div>
            <div className="text-[11px] font-handwritten text-indigo-650 dark:text-indigo-400 font-black mt-4 border-t border-dashed border-slate-300 dark:border-neutral-800 pt-2">
              📝 Tip: Membership rules restrict members from splitting costs on dates they weren't in the group!
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-card p-6 flex flex-col justify-between h-72">
            <div>
              <div className="text-4xl font-black text-slate-300 dark:text-slate-700 mb-3" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                02
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Log Expenses
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Log purchases manually or bulk-upload CSV spreadsheets exported from bank apps or Splitwise.
              </p>
            </div>
            <div className="text-[11px] font-handwritten text-indigo-650 dark:text-indigo-400 font-black mt-4 border-t border-dashed border-slate-300 dark:border-neutral-800 pt-2">
              📎 Tip: Supports split calculations by equal shares, percentages, or exact values.
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-card p-6 flex flex-col justify-between h-72">
            <div>
              <div className="text-4xl font-black text-slate-300 dark:text-slate-700 mb-3" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                03
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Catch Anomalies
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Our rule engine scans transactions to detect duplicate items, blank rows, and wrong currency splits automatically.
              </p>
            </div>
            <div className="text-[11px] font-handwritten text-indigo-650 dark:text-indigo-400 font-black mt-4 border-t border-dashed border-slate-300 dark:border-neutral-800 pt-2">
              ⚡ Tip: Correct issues inline on the import diagnostics wizard before committing!
            </div>
          </div>

          {/* Step 4 */}
          <div className="glass-card p-6 flex flex-col justify-between h-72">
            <div>
              <div className="text-4xl font-black text-slate-300 dark:text-slate-700 mb-3" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                04
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Simplify & Settle
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                The greedy graph solver simplifies debt matrices. Pay off group balances in the minimum number of cash operations.
              </p>
            </div>
            <div className="text-[11px] font-handwritten text-indigo-650 dark:text-indigo-400 font-black mt-4 border-t border-dashed border-slate-300 dark:border-neutral-800 pt-2">
              💵 Tip: Uncle Bob will try to pay you in cash, but logging settlements online is faster!
            </div>
          </div>
        </div>
      </section>

      {/* Doodle Crew Interactive Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-24 z-10 animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
            Meet the ExpenseFlow Crew
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 font-bold max-w-2xl mx-auto">
            Click on any Flowmate avatar below to see their spending personality, habits, and typical group drama!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Avatar Selector Grid */}
          <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
            <h3 className="text-xl font-bold mb-6 text-center border-b-2 border-black dark:border-white pb-3 font-handwritten text-2xl">
              Tap to Inspect Profile
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {crewMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedCrew(member)}
                  className={`p-2 border-2 border-black dark:border-white transition-all duration-150 flex flex-col items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg ${selectedCrew.id === member.id
                      ? 'bg-[#ffe484] dark:bg-[#ffd54f] text-black shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] scale-105'
                      : 'bg-white dark:bg-neutral-900 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff]'
                    }`}
                >
                  <img
                    src={member.doodle}
                    alt={member.name}
                    className="h-16 w-16 object-contain"
                  />
                  <span className="text-xs font-bold truncate max-w-full">
                    {member.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Profile Detail Card */}
          <div className="lg:col-span-7 glass-panel p-8 flex flex-col md:flex-row gap-6 items-center md:items-stretch relative overflow-hidden animate-fade-in">
            {/* Spiral binding effect on the left for notebook feel */}
            <div className="absolute left-0 top-0 bottom-0 w-3 border-r-[3px] border-black/30 dark:border-white/30 flex flex-col justify-around py-4 opacity-50 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 w-4 rounded-full border-2 border-black dark:border-white bg-[#d5cebe] -translate-x-2 shadow-inner" />
              ))}
            </div>

            <div className="flex-1 flex flex-col justify-between pl-4 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="highlight-pink text-xs font-black uppercase text-white dark:text-black">
                    {selectedCrew.role}
                  </span>
                  <span className="ml-auto text-xs font-black bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-md">
                    {selectedCrew.rating}
                  </span>
                </div>
                <h4 className="text-3xl font-black mt-2 text-slate-900 dark:text-white" style={{ fontFamily: "'Architects Daughter', cursive" }}>
                  {selectedCrew.name}
                </h4>
                <p className="font-handwritten text-2xl text-indigo-600 dark:text-indigo-400 mt-2 bg-[#fdfbf6] dark:bg-neutral-850 p-3 border-l-4 border-indigo-500 italic rounded-md">
                  "{selectedCrew.quote}"
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  <span className="highlight-yellow font-black text-black">Expense Habits:</span> {selectedCrew.habit}
                </p>
              </div>

              {/* Try avatar info */}
              <div className="pt-2 flex gap-3">
                <span className="text-xs font-bold text-slate-400 self-center">
                  All avatars in ExpenseFlow are dynamically generated from this crew! Sign up to claim yours.
                </span>
              </div>
            </div>

            {/* Large Doodle Avatar Picture */}
            <div className="w-40 h-40 md:w-48 md:h-48 flex-shrink-0 border-4 border-black dark:border-white bg-white flex items-center justify-center p-4 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-xl">
              <img
                src={selectedCrew.doodle}
                alt={selectedCrew.name}
                className="w-full h-full object-contain animate-pulse"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Premium Neo-Brutalist Footer */}
      <footer className="w-full bg-white dark:bg-neutral-900 border-t-4 border-black dark:border-white z-10 pt-16 pb-8 transition-colors duration-500 mt-20 relative">
        {/* Notebook bindings simulation on top border of footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 bg-transparent px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 w-3 rounded-full border-2 border-black dark:border-white bg-[#ffe484] dark:bg-neutral-800 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#fff]" />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-dashed border-slate-350 dark:border-neutral-800">
          {/* Logo & Branding column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2 group cursor-pointer w-fit">
              <div className="h-9 w-9 border-2 border-black dark:border-white bg-[#ffe484] dark:bg-[#ffd54f] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] group-hover:rotate-6 transition-transform rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
              <h4 className="text-xl font-black text-black dark:text-white">
                ExpenseFlow
              </h4>
            </div>
            <p className="text-sm font-bold text-slate-605 dark:text-slate-400 leading-relaxed max-w-sm">
              The premium, roster-aware expense sharing system with smart CSV diagnostics and greedy balance collapsed graphs.
            </p>
            <div className="flex gap-3 pt-2">
              <a href="#" className="h-8 w-8 rounded-lg border-2 border-black dark:border-white bg-slate-50 dark:bg-neutral-805 flex items-center justify-center text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                <Zap className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg border-2 border-black dark:border-white bg-slate-50 dark:bg-neutral-850 flex items-center justify-center text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                <Users className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg border-2 border-black dark:border-white bg-slate-50 dark:bg-neutral-850 flex items-center justify-center text-black dark:text-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all">
                <Scale className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product links column */}
          <div className="md:col-span-2 space-y-4">
            <h5 className="text-xs font-black uppercase text-slate-400 dark:text-neutral-500 tracking-wider">Product</h5>
            <ul className="space-y-2.5 text-sm font-bold">
              <li><Link to="/dashboard" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link to="/decisions" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Rules & Decisions</Link></li>
              <li><Link to="/login" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Core Features column */}
          <div className="md:col-span-3 space-y-4">
            <h5 className="text-xs font-black uppercase text-slate-400 dark:text-neutral-500 tracking-wider">Core Engine</h5>
            <ul className="space-y-2.5 text-sm font-bold">
              <li><a href="#" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Dynamic Split Timeline</a></li>
              <li><a href="#" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Smart CSV Importer</a></li>
              <li><a href="#" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Greedy Graph Collapser</a></li>
              <li><a href="#" className="text-slate-600 hover:text-brand-500 dark:text-slate-400 dark:hover:text-white transition-colors">Inline Diagnostics Log</a></li>
            </ul>
          </div>

          {/* Newsletter column */}
          <div className="md:col-span-3 space-y-4">
            <h5 className="text-xs font-black uppercase text-slate-400 dark:text-neutral-500 tracking-wider">Join Newsletter</h5>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
              Get updates about new audit rules, graph collapser upgrades, and sandbox extensions.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full bg-slate-50 dark:bg-neutral-805 border-2 border-black dark:border-white px-3 py-1.5 focus:outline-none text-xs rounded-lg font-bold"
              />
              <button
                type="submit"
                className="btn-primary w-full text-xs py-2 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
              >
                Subscribe 📬
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright and legal bar */}
        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 dark:text-slate-500">
          <div>
            © 2026 ExpenseFlow Inc. Designed for premium shared expense ledger management.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 dark:hover:text-white transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-white transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-600 dark:hover:text-white transition-colors">Security Audit</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
