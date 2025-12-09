'use client'

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshLiveButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="ml-3 inline-flex items-center rounded-md border border-cyan-500/40 bg-black/40 px-2 py-1 text-xs text-cyan-200 hover:border-cyan-400 hover:bg-black/60"
      title="Atualizar dados oficiais da API"
      aria-label="Atualizar dados oficiais da API"
    >
      {isPending ? 'Atualizando…' : '↻ Atualizar Dados Reais'}
    </button>
  );
}