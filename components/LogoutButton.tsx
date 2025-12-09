'use client'

import { signOut, useSession } from 'next-auth/react';

export default function LogoutButton() {
  // Avoid SSR build-time issues on special routes like not-found
  if (typeof window === 'undefined') return null;

  const { data: session } = useSession();

  if (!session) return null;

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="rounded-md border border-electric-purple/50 bg-black/50 px-2 py-1 text-xs text-electric-purple hover:bg-black/70 shadow-[0_0_12px_rgba(189,0,255,0.5)]"
      title={`Sair (${session.user?.email ?? 'usuário'})`}
    >
      Sair
    </button>
  );
}