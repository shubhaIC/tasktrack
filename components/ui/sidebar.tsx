'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabaseClient } from '../../src/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/calendar', label: 'Calendar' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabaseClient.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/auth/login');
  };

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low px-5 py-8 lg:flex">
      {/* Profile section */}
      <div className="rounded-3xl border border-outline-variant bg-white p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-on-surface">{displayName}</p>
              <p className="truncate text-xs text-outline">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="shrink-0 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition hover:bg-surface-container-high"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-outline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.25 1.25 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface">Not signed in</p>
              <p className="text-xs text-outline">Guest</p>
            </div>
            <Link
              href="/auth/login"
              className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>

      {/* Branding */}
      <div className="mb-6 mt-6 px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">TaskTrack</p>
        <p className="mt-1 text-xs text-outline">Productivity Workspace</p>
      </div>

      {/* Nav — only shown when signed in */}
      {user ? (
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-500 text-white shadow-[0_6px_16px_-8px_rgba(74,87,89,0.5)]'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : (
        <p className="px-1 text-sm text-outline">Sign in to access your workspace.</p>
      )}

      {/* Bottom info */}
      <div className="mt-auto pt-8">
        <div className="rounded-3xl border border-outline-variant bg-surface-container p-5">
          <p className="text-sm font-semibold text-on-surface">All-in-one workspace</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">Create and edit tasks, meetings, and courses directly from the Dashboard.</p>
        </div>
      </div>
    </aside>
  );
}
