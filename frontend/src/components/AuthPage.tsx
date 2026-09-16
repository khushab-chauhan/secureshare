import React, { useState } from 'react';
import { 
  Layers, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,
  Loader2, 
  Shield, 
  Zap, 
  Cloud,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'register';

const FEATURES = [
  { icon: Shield, label: 'End-to-end encrypted storage', color: 'text-violet-400' },
  { icon: Zap, label: 'Instant file sharing with access control', color: 'text-amber-400' },
  { icon: Cloud, label: '5 GB free storage, scale on demand', color: 'text-sky-400' },
];

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await api.login(email, password);
      } else {
        if (!fullName.trim() || fullName.trim().length < 2) {
          throw new Error('Full name must be at least 2 characters');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        await api.register(email, password, fullName.trim());
        await api.login(email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950" />
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#5D5FEF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-[40%] right-[15%] w-[200px] h-[200px] bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5D5FEF] flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">SecureShare</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Your files.<br />
              <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#60A5FA] bg-clip-text text-transparent">
                Always secure.
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Enterprise-grade document management with end-to-end encryption,
              granular access control, and real-time collaboration.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, color }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm text-slate-300 font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 flex items-center gap-8">
          {[
            { value: '10K+', label: 'Teams' },
            { value: '99.9%', label: 'Uptime' },
            { value: 'AES-256', label: 'Encryption' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Auth Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#5D5FEF] flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">SecureShare</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {mode === 'login'
                ? 'Sign in to access your secure drive'
                : 'Get started — 5 GB free, no credit card required'}
            </p>
          </div>

          {/* Mode Toggle Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-7">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name — only for register */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Khushab Chauhan"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-[#5D5FEF] font-semibold hover:underline cursor-pointer">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5D5FEF]/20 focus:border-[#5D5FEF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1,2,3,4].map(level => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= level * 3
                          ? level <= 2 ? 'bg-rose-400' : level === 3 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">!</div>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Terms for Register */}
            {mode === 'register' && (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                By creating an account you agree to our{' '}
                <span className="text-[#5D5FEF] font-semibold cursor-pointer hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="text-[#5D5FEF] font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password || (mode === 'register' && !fullName)}
              className="w-full bg-[#5D5FEF] hover:bg-[#4D4FD9] disabled:opacity-60 text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Please wait…</span></>
              ) : (
                <><span>{mode === 'login' ? 'Sign In to SecureShare' : 'Create My Account'}</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Switch mode link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-[#5D5FEF] font-bold hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Create one free' : 'Sign in instead'}
            </button>
          </p>

        </div>
      </div>

    </div>
  );
};
