'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../src/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/dashboard');
  };

  const inputClass = 'mt-2 w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface placeholder-outline focus:border-brand-500 focus:bg-white focus:outline-none';

  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-outline-variant bg-white p-10 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold text-on-surface">Login</h1>
        <p className="mt-2 text-on-surface-variant">Sign in to your TaskTrack account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-on-surface">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-on-surface">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          New to TaskTrack?{' '}
          <Link href="/auth/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
