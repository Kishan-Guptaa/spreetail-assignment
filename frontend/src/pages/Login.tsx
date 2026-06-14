import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Mail, Lock, Eye, EyeOff, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Input Validation
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Invalid email or password');
      toast.error(result.error || 'Authentication failed');
    }
  };

  const handleDemoLogin = async (demoType: 'user' | 'admin') => {
    setLoading(true);
    setErrorMsg('');
    
    const demoEmail = demoType === 'admin' ? 'admin@expenseflow.com' : 'john@example.com';
    const demoPassword = demoType === 'admin' ? 'admin123' : 'password123';

    const result = await login(demoEmail, demoPassword);
    setLoading(false);

    if (result.success) {
      toast.success(`Logged in as Demo ${demoType === 'admin' ? 'Admin' : 'User'}`);
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error || 'Demo login failed');
      toast.error('Demo authentication failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="bg-mesh" />

      <div className="w-full max-w-md glass-panel p-8 relative">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 border-2 border-black dark:border-white bg-[#ffe484] dark:bg-[#ffd54f] flex items-center justify-center text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] mb-3 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Architects Daughter', cursive" }}>Welcome to ExpenseFlow</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">Sign in to manage your shared balances</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 border-2 border-black dark:border-white bg-[#ff6b6b]/20 dark:bg-[#ff6b6b]/30 text-rose-600 dark:text-rose-400 text-sm font-bold shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input pl-11"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base shadow-md"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Fast Login Area */}
        <div className="mt-8 pt-6 border-t border-black dark:border-neutral-800 space-y-3">
          <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">Fast Access Demo</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('user')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold border-2 border-black dark:border-white text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-850 transition-all shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-lg"
            >
              <UserIcon className="h-4 w-4 text-brand-700 dark:text-[#ffd54f]" />
              Demo User
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold border-2 border-black dark:border-white text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-850 transition-all shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none rounded-lg"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-[#ffd54f]" />
              Demo Admin
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
