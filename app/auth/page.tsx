import Link from 'next/link';

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-outline-variant bg-white p-10 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">Account</p>
        <h1 className="mt-3 text-3xl font-semibold text-on-surface">Authentication</h1>
        <p className="mt-3 text-on-surface-variant">Connect with Supabase Auth for secure signup, login, and password reset.</p>
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/login"
            className="block rounded-2xl bg-brand-500 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="block rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-3 text-center text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
