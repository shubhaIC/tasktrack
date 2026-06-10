"use client";

import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabase/client';

/**
 * Simple client-side logout button.
 * Signs out the user via the client Supabase SDK and redirects to `/login`.
 */
export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-700">
      Sign out
    </button>
  );
}
