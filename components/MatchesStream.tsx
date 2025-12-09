"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import type { Fixture } from "@/utils/api";

export default function MatchesStream({ date }: { date: string }) {
  const [fixtures, setFixtures] = useState<Fixture[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch(`/api/fixtures?date=${date}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to fetch fixtures");
        if (alive) setFixtures(json.response as Fixture[]);
      } catch (e: any) {
        if (alive) setError("❌ ERRO DE CONEXÃO: Verifique a API Key.");
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [date]);

  if (error) {
    return <div className="font-mono text-red-400">{error}</div>;
  }

  if (!fixtures) {
    return (
      <div className="animate-pulse rounded-lg border border-neon-cyan/30 bg-black/30 p-6 font-mono text-sm text-neon-cyan/90">
        <span className="text-electric-purple">$</span> PROCESSANDO DADOS... <span className="text-electric-purple">|</span>
      </div>
    );
  }

  console.log("Dados da API:", fixtures);

  if (fixtures.length === 0) {
    return (
      <div className="rounded-lg border border-red-400/40 bg-black/30 p-6 font-mono text-sm text-red-400">
        ⚠️ NENHUM JOGO ENCONTRADO NAS LIGAS SELECIONADAS PARA HOJE.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {fixtures.map((fx) => (
        <MatchCard key={fx.fixture.id} fixture={fx} />
      ))}
    </div>
  );
}