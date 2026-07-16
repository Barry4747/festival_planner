import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AuthSectionProps {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const AuthSection: React.FC<AuthSectionProps> = ({
  initialMode = 'signup',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const baseRedirect =
    import.meta.env.VITE_AUTH_REDIRECT_URL ||
    import.meta.env.VITE_APP_URL ||
    window.location.origin;
  const redirectTo = baseRedirect.endsWith('/dashboard') || baseRedirect.endsWith('/dashboard/')
    ? baseRedirect
    : `${baseRedirect.replace(/\/+$/, '')}/dashboard`;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSuccess('Account created! Check your inbox to confirm your email.');
        setMode('signin');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mode toggle */}
      <div className="mb-6 flex rounded-lg border border-white/10 bg-[#111412] p-1">
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
          className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
            mode === 'signin'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Official Google Button */}
      <Button
        type="button"
        variant="google"
        onClick={handleGoogleAuth}
        disabled={googleLoading || loading}
        className="w-full py-2.5 text-sm mb-5"
      >
        <GoogleIcon />
        <span>{googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}</span>
      </Button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">or email</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
        />

        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          icon={<Lock className="h-4 w-4" />}
        />

        <Button
          type="submit"
          variant="primary"
          disabled={loading || googleLoading}
          className="w-full mt-2"
          loading={loading}
        >
          <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
