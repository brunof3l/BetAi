'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import type { Fixture, TeamStanding } from "@/utils/api";
import { analyzeMatch, generateSimulatedStats, type MatchStats, type Prediction, validatePrediction, type ValidationResult } from "@/utils/analyzer";

type Props = {
  fixture: Fixture;
  statsByTeamId?: Record<number, TeamStanding>;
};

function isFinishedStatus(status?: string | null) {
  const s = (status || "").toUpperCase();
  return s === "FT" || s === "AET" || s === "PEN";
}

export default function MatchCard({ fixture, statsByTeamId }: Props) {
  // Local timer for live matches
  const [seconds, setSeconds] = useState(0);
  const [localStats, setLocalStats] = useState<MatchStats | null>(null);
  const [glow, setGlow] = useState(false);

  const shortStatus = fixture.fixture?.status?.short ?? "NS";
  const isLive = shortStatus === "1H" || shortStatus === "2H" || shortStatus === "LIVE" || shortStatus === "ET";
  const isFinished = isFinishedStatus(shortStatus);
  const isFT = shortStatus === "FT";
  const isPreGame = shortStatus === "NS" || shortStatus === "TBD";
  const isHT = shortStatus === "HT";

  // Format date/time for pre-game display (DD/MM • HH:MM)
  const kickoff = useMemo(() => new Date(fixture.fixture?.date ?? Date.now()), [fixture.fixture?.date]);
  const kickoffDateLabel = useMemo(() => {
    const dd = String(kickoff.getDate()).padStart(2, "0");
    const mm = String(kickoff.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  }, [kickoff]);
  const kickoffTimeLabel = useMemo(() => {
    const hh = String(kickoff.getHours()).padStart(2, "0");
    const min = String(kickoff.getMinutes()).padStart(2, "0");
    return `${hh}:${min}`;
  }, [kickoff]);
  const preGameDateTime = `${kickoffDateLabel} • ${kickoffTimeLabel}`;

  // Initialize local stats for live simulation
  useEffect(() => {
    const initial: MatchStats = {
      home: generateSimulatedStats(fixture.teams.home.id),
      away: generateSimulatedStats(fixture.teams.away.id),
    };
    setLocalStats(initial);
  }, [fixture.teams.home.id, fixture.teams.away.id]);

  // Live timer ticking
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isLive]);

  // Simulate dynamic changes every 30s and re-analyze
  const lastRankRef = useRef<number>(0);
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setLocalStats((prev) => {
        if (!prev) return prev;
        const next: MatchStats = JSON.parse(JSON.stringify(prev));
        // 25% chance to add a corner or a goal
        const roll = Math.random();
        if (roll < 0.25) {
          if (roll < 0.125) {
            next.home.cornersAvg5 = (next.home.cornersAvg5 ?? 4.5) + 0.2;
          } else {
            next.away.cornersAvg5 = (next.away.cornersAvg5 ?? 4.5) + 0.2;
          }
        }
        if (roll > 0.75) {
          if (roll < 0.875) {
            next.home.goalsAvg5For = (next.home.goalsAvg5For ?? 1.2) + 0.1;
          } else {
            next.away.goalsAvg5For = (next.away.goalsAvg5For ?? 1.2) + 0.1;
          }
        }
        return next;
      });
    }, 30000);
    return () => clearInterval(id);
  }, [isLive]);

  const homeStanding = statsByTeamId?.[fixture.teams.home.id];
  const awayStanding = statsByTeamId?.[fixture.teams.away.id];

  const predictions: Prediction[] = useMemo(() => analyzeMatch(fixture, localStats, { home: homeStanding ?? null, away: awayStanding ?? null }), [fixture, localStats, homeStanding, awayStanding]);

  // Glow when the highest-confidence rank increases (Alta > Média)
  useEffect(() => {
    const rank = predictions.some((p) => p.probability === "Alta") ? 2 : predictions.some((p) => p.probability === "Média") ? 1 : 0;
    if (rank > lastRankRef.current) {
      setGlow(true);
      lastRankRef.current = rank;
      const t = setTimeout(() => setGlow(false), 1500);
      return () => clearTimeout(t);
    }
  }, [predictions]);

  const labelColor = predictions.some((p) => p.probability === "Alta")
    ? "text-green-400"
    : predictions.some((p) => p.probability === "Média")
    ? "text-yellow-300"
    : "text-cyan-300";

  // Form Guide helpers (real from standings; fallback to simulated)
  const parseFormGuide = (form?: string | null): Array<'W' | 'D' | 'L'> => {
    const s = (form ?? '').trim();
    if (!s) return [];
    return s.split("")
      .filter((c) => c === 'W' || c === 'D' || c === 'L')
      .slice(0, 5) as Array<'W' | 'D' | 'L'>;
  };

  const fallbackForm = (teamId: number): Array<'W' | 'D' | 'L'> => {
    const sim = generateSimulatedStats(teamId);
    const pWin = Math.min(Math.max((sim.winProbability ?? 50) / 100, 0.1), 0.9);
    const pDraw = 0.18;
    const arr: Array<'W' | 'D' | 'L'> = [];
    for (let i = 0; i < 5; i++) {
      const r = Math.random();
      if (r < pWin) arr.push('W');
      else if (r < pWin + pDraw) arr.push('D');
      else arr.push('L');
    }
    return arr;
  };

  const glowClass = glow ? "ring-2 ring-green-400/60 shadow-[0_0_20px_rgba(34,197,94,0.6)]" : "";

  const minuteDisplay = () => {
    const base = fixture.fixture?.status?.elapsed ?? 0;
    const total = base + (isLive ? Math.floor(seconds / 60) : 0);
    return `${total}'${isLive && seconds % 2 === 0 ? "" : ""}`;
  };

  const iconFor = (type: Prediction["type"]) => {
    switch (type) {
      case "WIN":
        return "🏆";
      case "CARDS":
        return "🟨";
      case "CORNERS":
        return "🚩";
      case "GOALS":
        return "⚽";
      default:
        return "🧠";
    }
  };

  const outcomeIcon = (r: ValidationResult) => {
    switch (r) {
      case "WIN":
        return <span className="text-green-400">✅</span>;
      case "LOSS":
        return <span className="text-red-400">❌</span>;
      case "UNKNOWN":
      default:
        return <span className="text-gray-400">⚪ ?</span>;
    }
  };

  const validations: ValidationResult[] = useMemo(() => {
    if (!isFT) return [];
    return predictions.map((p) => validatePrediction(p, fixture));
  }, [isFT, predictions, fixture]);

  const successCount = useMemo(() => validations.filter((v) => v === "WIN").length, [validations]);
  const knownCount = useMemo(() => validations.filter((v) => v !== "UNKNOWN").length, [validations]);

  const renderFormDots = (arr: Array<'W' | 'D' | 'L'>) => (
    <div className="mt-1 flex gap-1">
      {arr.map((r, idx) => (
        <span
          key={idx}
          title={r === 'W' ? 'Vitória' : r === 'D' ? 'Empate' : 'Derrota'}
          className={`h-2.5 w-2.5 rounded-sm ${r === 'W' ? 'bg-green-500/80' : r === 'D' ? 'bg-gray-500/80' : 'bg-red-600/80'} text-white font-bold flex items-center justify-center text-[10px]`}
        >
          {r === 'W' ? 'V' : r === 'D' ? 'E' : 'D'}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`relative rounded-xl border border-cyan-500/30 bg-[#0b1120] p-4 text-white transition-all duration-300 ${glowClass} ${isFinished ? "opacity-80" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs text-cyan-300/80">{fixture.league.name}</div>
          {fixture.league.country ? (
            <span className="rounded-sm border border-cyan-500/30 bg-black/30 px-1.5 py-[1px] text-[10px] text-cyan-200">
              {fixture.league.country}
            </span>
          ) : null}
        </div>
        <div className={`${isHT || isLive ? "text-green-400" : isFinished ? "text-purple-300" : "text-cyan-300"} ${isHT ? "italic text-[11px]" : "text-xs"}`}>
          {isHT
            ? "Intervalo"
            : isLive
            ? `Ao Vivo ${minuteDisplay()}`
            : isFinished
            ? shortStatus
            : isPreGame
            ? <span className="font-mono">{preGameDateTime}</span>
            : shortStatus}
        </div>
      </div>

      {/* Teams and score */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex-1 text-right pr-3">
          <div className="text-base">{fixture.teams.home.name}</div>
          {renderFormDots(parseFormGuide(homeStanding?.form).length ? parseFormGuide(homeStanding?.form) : fallbackForm(fixture.teams.home.id))}
        </div>
        <div className="w-20 text-center">
          {isFinished ? (
            <div className="text-2xl font-semibold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]">
              {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
            </div>
          ) : (
            <div className="text-xl font-semibold text-cyan-200">
              {fixture.goals?.home ?? 0} - {fixture.goals?.away ?? 0}
            </div>
          )}
        </div>
        <div className="flex-1 pl-3">
          <div className="text-base">{fixture.teams.away.name}</div>
          {renderFormDots(parseFormGuide(awayStanding?.form).length ? parseFormGuide(awayStanding?.form) : fallbackForm(fixture.teams.away.id))}
        </div>
      </div>

      {/* AI Insight */}
      <div className="mt-3 rounded-lg border border-cyan-500/20 bg-[#0b1328] p-3">
        <div className={`mb-2 text-xs tracking-wide ${labelColor}`}>AI INSIGHT</div>

        {predictions.length === 0 ? (
          <div className="text-sm text-cyan-200">Jogo Equilibrado - Sem entradas de valor</div>
        ) : (
          <div>
            {predictions.map((p, idx) => (
              <div key={`${p.type}-${idx}`} className={`flex items-center gap-2 py-1 ${idx > 0 ? "border-t border-cyan-500/20" : ""}`}>
                <span className="text-base leading-none">{iconFor(p.type)}</span>
                <span className="text-sm">{p.tip}</span>
                <span className={`ml-auto text-xs ${p.probability === "Alta" ? "text-green-400" : p.probability === "Média" ? "text-yellow-300" : "text-cyan-300"}`}>
                  {p.probability}
                </span>
                {isFT ? <span className="ml-2">{outcomeIcon(validations[idx])}</span> : null}
              </div>
            ))}
          </div>
        )}

        {isFT && knownCount > 0 ? (
          <div className="mt-2 flex justify-end">
            <span className="rounded-md border border-cyan-500/30 bg-[#0b1120] px-2 py-1 text-[11px] text-cyan-200">
              Acertos: {successCount}/{knownCount}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}