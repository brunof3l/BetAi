"use client";

import { useMemo, useState } from "react";
import type { Fixture, TeamStanding } from "@/utils/api";
import MatchCard from "@/components/MatchCard";
import { leaguePriority } from "@/config/leagues";

function flagForCountry(country?: string): string {
  const c = (country || "").toLowerCase();
  const map: Record<string, string> = {
    england: "🇬🇧",
    uk: "🇬🇧",
    "united kingdom": "🇬🇧",
    italy: "🇮🇹",
    spain: "🇪🇸",
    germany: "🇩🇪",
    france: "🇫🇷",
    netherlands: "🇳🇱",
    portugal: "🇵🇹",
    brazil: "🇧🇷",
    argentina: "🇦🇷",
    mexico: "🇲🇽",
    usa: "🇺🇸",
    "united states": "🇺🇸",
    japan: "🇯🇵",
    korea: "🇰🇷",
    "south korea": "🇰🇷",
    turkey: "🇹🇷",
    greece: "🇬🇷",
    belgium: "🇧🇪",
    scotland: "🏴",
    "saudi arabia": "🇸🇦",
    uae: "🇦🇪",
    "united arab emirates": "🇦🇪",
    qatar: "🇶🇦",
    china: "🇨🇳",
  };
  return map[c] || "🌐";
}

type Props = {
  liveMatches: Fixture[];
  upcomingMatches: Fixture[];
  finishedMatches: Fixture[];
  statsByTeamId?: Record<number, TeamStanding>;
};

export default function LeagueFilterPanel({ liveMatches, upcomingMatches, finishedMatches, statsByTeamId }: Props) {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);

  const leagues = useMemo(() => {
    const all = [...liveMatches, ...upcomingMatches, ...finishedMatches];
    const byId = new Map<number, Fixture["league"]>();
    for (const fx of all) {
      byId.set(fx.league.id, fx.league);
    }
    const arr = Array.from(byId.values());
    arr.sort((a, b) => (leaguePriority[a.id] ?? 5) - (leaguePriority[b.id] ?? 5) || a.name.localeCompare(b.name));
    return arr;
  }, [liveMatches, upcomingMatches, finishedMatches]);

  const isActive = (id: number | null) => selectedLeagueId === id;
  const btnClass = (active: boolean) =>
    active
      ? "whitespace-nowrap rounded-md border border-neon-cyan/60 bg-black/60 px-3 py-1 text-sm text-neon-cyan shadow-[0_0_12px_rgba(0,243,255,0.5)]"
      : "whitespace-nowrap rounded-md border border-cyan-500/40 bg-black/40 px-3 py-1 text-sm text-cyan-200 hover:border-cyan-400 hover:bg-black/60";

  const filterList = (list: Fixture[]) =>
    selectedLeagueId == null ? list : list.filter((fx) => fx.league.id === selectedLeagueId);

  return (
    <div className="mt-6">
      {/* Scrollable League Filter Bar */}
      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar">
        <div className="flex gap-2 py-2">
          <button type="button" className={btnClass(isActive(null))} onClick={() => setSelectedLeagueId(null)}>
            🌐 Todos
          </button>
          {leagues.map((lg) => (
            <button
              key={lg.id}
              type="button"
              className={btnClass(isActive(lg.id))}
              onClick={() => setSelectedLeagueId(lg.id)}
              title={lg.country ? `${lg.country} • ${lg.name}` : lg.name}
            >
              {flagForCountry(lg.country)} {lg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Section */}
      <section className="mt-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]">Ao Vivo</h2>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filterList(liveMatches).length === 0 ? (
            <div className="text-cyan-400">Nenhum jogo ao vivo agora para este filtro.</div>
          ) : (
            filterList(liveMatches).map((fx) => <MatchCard key={fx.fixture.id} fixture={fx} statsByTeamId={statsByTeamId} />)
          )}
        </div>
      </section>

      {/* Separator */}
      <div className="my-8 h-px w-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400 opacity-40" />

      {/* Upcoming Section */}
      <section className="mt-4">
        <h2 className="text-xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(0,255,157,0.6)]">Próximos</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filterList(upcomingMatches).length === 0 ? (
            <div className="text-cyan-400">Sem jogos agendados neste filtro.</div>
          ) : (
            filterList(upcomingMatches).map((fx) => <MatchCard key={fx.fixture.id} fixture={fx} statsByTeamId={statsByTeamId} />)
          )}
        </div>
      </section>

      {/* Separator */}
      <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      {/* Finished Section */}
      <section className="mt-4">
        <h2 className="text-xl font-bold text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]">🏁 RESULTADOS DE HOJE</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filterList(finishedMatches).length === 0 ? (
            <div className="text-cyan-400">Sem resultados encerrados neste filtro.</div>
          ) : (
            filterList(finishedMatches).map((fx) => <MatchCard key={fx.fixture.id} fixture={fx} statsByTeamId={statsByTeamId} />)
          )}
        </div>
      </section>
    </div>
  );
}