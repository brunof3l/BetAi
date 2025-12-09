import type { Fixture, TeamStanding } from "@/utils/api";

export type Insight = {
  label: string;
  probability: number; // 0..1
};

// Simple heuristic analyzer (placeholder) to simulate AI insight
export function analyzeFixture(fixture: Fixture): Insight {
  const base = seededProb(fixture.fixture.id);
  const leagueBoost = fixture.league.id === 39 ? 0.08 : fixture.league.id === 140 ? 0.05 : fixture.league.id === 71 ? 0.06 : 0.03;
  const prob = clamp(base + leagueBoost, 0.1, 0.95);

  const labels = [
    "🎯 ALTA PROBABILIDADE: Mais de 9.5 Escanteios",
    "🔥 Tendência: Mais de 2.5 Gols",
    "🛡️ Jogo Fechado: Menos de 2.5 Gols",
    "⚡ Primeiro Tempo: Mais de 4.5 Escanteios",
    "🏃 Cartões: Mais de 3.5 Cartões",
  ];
  const label = labels[fixture.fixture.id % labels.length];
  return { label, probability: prob };
}

// --- Updated types to support multiple predictions ---






// Hybrid analyzer: tries provided stats; falls back to simulated stats


// --- Auditoria de previsões vs resultado real ---
export type ValidationResult = "WIN" | "LOSS" | "UNKNOWN";


// --- Simulador de Stats com seed por teamId ---


function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function seededProb(seed: number) {
  // deterministic pseudo-random based on fixture id
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) * 0.7 + 0.2; // range ~0.2..0.9
}

function seededFloat(seed: number) {
  const x = Math.sin(seed * 9301.123) * 10000;
  return x - Math.floor(x);
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

function toSafeNumber(n: unknown | null | undefined): number {
  const v = typeof n === "number" ? n : 0;
  return Number.isFinite(v) ? v : 0;
}

function extractTotalFromStats(stats: any, keys: string[]): number | null {
  if (!stats) return null;
  // Array forma: [{ team, statistics: [{ type, value }, ...] }, { ... }]
  if (Array.isArray(stats)) {
    try {
      const sum = stats.reduce((acc: number, t: any) => {
        const list = t?.statistics || t?.stats || [];
        const add = list.reduce((inner: number, row: any) => {
          const type = String(row?.type || row?.name || "");
          const val = row?.value ?? row?.total ?? row?.number;
          const num = typeof val === "number" ? val : parseFloat(val);
          if (keys.some((k) => type.toLowerCase().includes(k.toLowerCase()))) {
            return inner + (Number.isFinite(num) ? num : 0);
          }
          return inner;
        }, 0);
        return acc + add;
      }, 0);
      return Number.isFinite(sum) ? sum : null;
    } catch {
      return null;
    }
  }
  // Objeto plano: { Corners: 10, "Corner Kicks": 9 }
  try {
    const total = Object.entries(stats).reduce((acc, [k, v]) => {
      if (keys.some((kk) => k.toLowerCase().includes(kk.toLowerCase()))) {
        const num = typeof v === "number" ? v : parseFloat(String(v));
        return acc + (Number.isFinite(num) ? num : 0);
      }
      return acc;
    }, 0);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}

function extractCardsTotal(stats: any): number | null {
  const total = extractTotalFromStats(stats, ["Yellow Cards", "Red Cards", "Cartões", "Amarelos", "Vermelhos"]);
  return total;
}

export type Probability = "Alta" | "Média" | "Baixa";

export type TeamFormStats = {
  goalsAvg5For?: number;
  goalsAvg5Against?: number;
  cornersAvg5?: number;
  cardAvg?: number; // average cards per team
  winProbability?: number; // percent chance of winning (0-100)
};

export type MatchStats = {
  home: TeamFormStats;
  away: TeamFormStats;
};

export type PredictionType = "WIN" | "CARDS" | "CORNERS" | "GOALS";

export type Prediction = {
  type: PredictionType;
  tip: string; // e.g., "Mais de 9.5 Escanteios", "Vitória do [Time]"
  probability: Probability; // Alta/Média/Baixa
};

// Removed duplicate import
export function generateSimulatedStats(teamId?: number): TeamFormStats {
  const id = teamId ?? 1;
  const profile = id % 3; // 0: agressivo, 1: ofensivo, 2: retranqueiro
  const r1 = seededFloat(id * 1.123 + 7);
  const r2 = seededFloat(id * 2.357 + 19);
  const r3 = seededFloat(id * 3.789 + 31);
  const r4 = seededFloat(id * 4.321 + 47);

  const rng = (min: number, max: number, r: number) => round1(min + r * (max - min));

  let goalsAvg5For: number;
  let goalsAvg5Against: number;
  let cornersAvg5: number;
  let cardAvg: number;

  if (profile === 0) {
    // Time Agressivo: alta média de cartões, ataque médio
    goalsAvg5For = rng(1.1, 1.7, r1);
    goalsAvg5Against = rng(1.0, 1.6, r2);
    cornersAvg5 = rng(4.5, 6.2, r3);
    cardAvg = rng(2.8, 3.8, r4);
  } else if (profile === 1) {
    // Time Ofensivo: muitos gols e escanteios, poucos cartões
    goalsAvg5For = rng(1.8, 2.6, r1);
    goalsAvg5Against = rng(1.2, 1.8, r2);
    cornersAvg5 = rng(5.8, 8.2, r3);
    cardAvg = rng(1.0, 2.0, r4);
  } else {
    // Time Retranqueiro: poucos gols, defesa forte, poucos escanteios
    goalsAvg5For = rng(0.6, 1.2, r1);
    goalsAvg5Against = rng(0.6, 1.1, r2);
    cornersAvg5 = rng(3.5, 5.0, r3);
    cardAvg = rng(1.2, 2.2, r4);
  }

  // Probabilidade de vitória influenciada por gols pró/contra e um pequeno ruído determinístico
  const winRaw = (profile === 1 ? 0.55 : profile === 0 ? 0.5 : 0.48)
    + (goalsAvg5For - goalsAvg5Against) * (profile === 1 ? 0.08 : 0.06)
    + seededFloat(id * 5.432 + 13) * (profile === 1 ? 0.20 : 0.12);
  const winProbability = Math.round(clamp(winRaw, 0.05, 0.95) * 100);

  return { goalsAvg5For, goalsAvg5Against, cornersAvg5, cardAvg, winProbability };
}

export function analyzeMatch(
  fixture: Fixture,
  stats?: MatchStats | null,
  standings?: { home?: TeamStanding | null; away?: TeamStanding | null }
): Prediction[] {
  const tips: Prediction[] = [];

  // Real logic using standings if available
  if (standings?.home && standings?.away) {
    const h = standings.home!;
    const a = standings.away!;

    const safeDiv = (num: number, den: number) => (den > 0 ? num / den : 0);
    const hPPG = safeDiv(h.points, h.played);
    const aPPG = safeDiv(a.points, a.played);

    const countWins = (form?: string | null) => (form ?? "").split("").filter((c) => c === "W").length;
    const hWins = countWins(h.form);
    const aWins = countWins(a.form);

    // Real winner logic
    if (hPPG > aPPG + 0.5 && hWins >= 3) {
      tips.push({ type: "WIN", tip: `Vitória do ${fixture.teams.home.name}`, probability: hPPG - aPPG > 0.8 ? "Alta" : "Média" });
    } else if (aPPG > hPPG + 0.5 && aWins >= 3) {
      tips.push({ type: "WIN", tip: `Vitória do ${fixture.teams.away.name}`, probability: aPPG - hPPG > 0.8 ? "Alta" : "Média" });
    }

    // Real goals logic
    const hGoalsAvg = safeDiv(h.goalsFor + h.goalsAgainst, h.played);
    const aGoalsAvg = safeDiv(a.goalsFor + a.goalsAgainst, a.played);
    const meanGoals = (hGoalsAvg + aGoalsAvg) / 2;
    if (meanGoals > 2.8) {
      tips.push({ type: "GOALS", tip: "Mais de 2.5 Gols", probability: meanGoals > 3.2 ? "Alta" : "Média" });
    } else if (meanGoals < 2.0) {
      tips.push({ type: "GOALS", tip: "Menos de 2.5 Gols", probability: meanGoals < 1.8 ? "Alta" : "Média" });
    }

    // Hybrid corners logic using table rank as weight (DNA da liga não disponível)
    const rankWeight = (rank: number) => (rank <= 5 ? 1.2 : rank <= 10 ? 1.1 : 1.0);
    const cornerWeightAvg = (rankWeight(h.rank) + rankWeight(a.rank)) / 2;
    if (cornerWeightAvg >= 1.15) {
      tips.push({ type: "CORNERS", tip: "Mais de 9.5 Escanteios", probability: cornerWeightAvg >= 1.22 ? "Alta" : "Média" });
    }

    return tips.slice(0, 3);
  }

  const s = stats ?? {
    home: generateSimulatedStats(fixture.teams.home.id),
    away: generateSimulatedStats(fixture.teams.away.id),
  };

  const variantSeed = (fixture.fixture.id ?? 0) % 3;
  const pick = (opts: string[]) => opts[variantSeed % opts.length];

  // Over (mais rigoroso)
  const avgGoalsTotal = (s.home.goalsAvg5For ?? 1.2) + (s.away.goalsAvg5For ?? 1.1);
  if (avgGoalsTotal >= 2.8) {
    const text = pick(["Tendência de Gols", "Chances Claras", "Jogo Aberto"]) + ": Mais de 2.5 Gols";
    tips.push({ type: "GOALS", tip: text, probability: avgGoalsTotal >= 3.2 ? "Alta" : "Média" });
  }

  // BTTS (Ambas Marcam)
  const strongAttackHome = (s.home.goalsAvg5For ?? 0) >= 1.5;
  const strongAttackAway = (s.away.goalsAvg5For ?? 0) >= 1.4;
  if (strongAttackHome && strongAttackAway) {
    tips.push({ type: "GOALS", tip: "Ambas as Equipes Marcam: Sim", probability: (s.home.goalsAvg5For ?? 0) >= 1.8 && (s.away.goalsAvg5For ?? 0) >= 1.8 ? "Alta" : "Média" });
  }

  // Under (Menos de) baseado em defesa forte
  const strongDefenseHome = (s.home.goalsAvg5Against ?? 9) <= 1.0;
  const strongDefenseAway = (s.away.goalsAvg5Against ?? 9) <= 1.0;
  if (strongDefenseHome && strongDefenseAway) {
    const text = "Jogo Truncado: Menos de 2.5 Gols";
    const lowFor = ((s.home.goalsAvg5For ?? 0) + (s.away.goalsAvg5For ?? 0)) < 2.4;
    tips.push({ type: "GOALS", tip: text, probability: (strongDefenseHome && strongDefenseAway && lowFor) ? "Alta" : "Média" });
  }

  // Corners
  const avgCornersTotal = (s.home.cornersAvg5 ?? 4.5) + (s.away.cornersAvg5 ?? 4.5);
  if (avgCornersTotal >= 9.6) {
    const text = pick(["Pressão nas Laterais", "Muitos Cruzamentos", "Bolas Paradas em Alta"]) + ": Mais de 9.5 Escanteios";
    tips.push({ type: "CORNERS", tip: text, probability: avgCornersTotal >= 10.8 ? "Alta" : "Média" });
  }

  // Cartões (somente se soma > 5.5)
  const avgCardsTotal = (s.home.cardAvg ?? 2.0) + (s.away.cardAvg ?? 2.0);
  if (avgCardsTotal > 5.5) {
    const text = "Jogo Pegado (Cartões): Mais de 5.5 Cartões";
    tips.push({ type: "CARDS", tip: text, probability: avgCardsTotal >= 6.5 ? "Alta" : "Média" });
  }

  // Vitória (apenas > 75%)
  const homeWinProb = s.home.winProbability ?? 50;
  const awayWinProb = s.away.winProbability ?? 50;
  if (homeWinProb > 75 && homeWinProb - (awayWinProb ?? 0) >= 8) {
    tips.push({ type: "WIN", tip: `Domínio dos Mandantes: Vitória do ${fixture.teams.home.name}`, probability: homeWinProb >= 85 ? "Alta" : "Média" });
  } else if (awayWinProb > 75 && awayWinProb - (homeWinProb ?? 0) >= 8) {
    tips.push({ type: "WIN", tip: `Força dos Visitantes: Vitória do ${fixture.teams.away.name}` , probability: awayWinProb >= 85 ? "Alta" : "Média" });
  } else {
    // Chance Dupla quando mandante é levemente favorito
    const diff = (homeWinProb - awayWinProb);
    if (homeWinProb >= 60 && homeWinProb < 75 && diff >= 5 && diff <= 12) {
      tips.push({ type: "WIN", tip: "Chance Dupla: Casa ou Empate", probability: diff >= 8 ? "Média" : "Baixa" });
    }
  }

  // Limitar a 3 dicas para manter variedade
  return tips.slice(0, 3);
}

function parseOverThreshold(tip: string): number | null {
  // Extract e.g., 2.5 from "Mais de 2.5 Gols"/"Mais de 9.5 Escanteios"/"Mais de 4.5 Cartões"
  const m = tip.match(/Mais de\s*(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function parseUnderThreshold(tip: string): number | null {
  const m = tip.match(/Menos de\s*(\d+(?:\.\d+)?)/i);
  return m ? parseFloat(m[1]) : null;
}

function totalGoalsFromFixture(fix: Fixture): number {
  const home = fix.goals?.home == null ? 0 : fix.goals?.home;
  const away = fix.goals?.away == null ? 0 : fix.goals?.away;
  return home + away;
}

function getStatisticTotal(fix: Fixture, statKey: "Corners" | "Cartões"): number | null {
  // Attempt to read fixture.statistics for totals
  // We don't know exact shape; try common patterns
  const stats: any = (fix as any).statistics;
  if (!stats) return null;

  // Possible formats:
  // - [{ team: {...}, statistics: [{ type: 'Corners', value: 10 }, ...] }, { ... }]
  // - { corners: 10, cards: 6 }
  // - { totals: { corners: 10, cards: 6 } }
  try {
    if (Array.isArray(stats)) {
      const sum = stats.reduce((acc: number, teamBlock: any) => {
        const arr = teamBlock?.statistics ?? teamBlock?.stats ?? [];
        const found = arr.find((s: any) => {
          const t = String(s?.type ?? s?.name ?? "");
          return t.toLowerCase().includes(statKey.toLowerCase());
        });
        const v = found?.value ?? found?.total ?? found?.count;
        const num = typeof v === "number" ? v : v == null ? 0 : parseInt(v, 10);
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
      return sum || null;
    }

    if (typeof stats === "object" && stats) {
      const kCorners = ["corners", "corner", "escanteios", "escanteio"];
      const kCards = ["cards", "card", "cartoes", "cartões"];
      const lookup = (obj: any, keys: string[]) => {
        for (const key of keys) {
          if (typeof obj[key] === "number") return obj[key];
          if (typeof obj[key] === "string") {
            const n = parseInt(obj[key], 10);
            if (!isNaN(n)) return n;
          }
        }
        if (obj.totals) return lookup(obj.totals, keys);
        if (obj.total) return lookup(obj.total, keys);
        return null;
      };
      const keys = statKey === "Corners" ? kCorners : kCards;
      return lookup(stats, keys);
    }
  } catch {}
  return null;
}

export function validatePrediction(prediction: Prediction, fix: Fixture): ValidationResult {
  const type = prediction.type;

  // Winner & Chance Dupla
  if (type === "WIN") {
    const home = fix.goals?.home == null ? 0 : fix.goals?.home;
    const away = fix.goals?.away == null ? 0 : fix.goals?.away;
    // Chance Dupla: Casa ou Empate
    if (/Casa ou Empate/i.test(prediction.tip)) {
      return home >= away ? "WIN" : "LOSS";
    }
    // Vitória simples
    const winner = home > away ? fix.teams.home.name : away > home ? fix.teams.away.name : null;
    if (!winner) return "LOSS";
    const expectsHome = /Vitória do\s+(.+)/i.test(prediction.tip) ? prediction.tip.includes(fix.teams.home.name) : false;
    const expectsAway = /Vitória do\s+(.+)/i.test(prediction.tip) ? prediction.tip.includes(fix.teams.away.name) : false;
    if (expectsHome && winner === fix.teams.home.name) return "WIN";
    if (expectsAway && winner === fix.teams.away.name) return "WIN";
    return "LOSS";
  }

  // GOALS: BTTS, Over, Under
  if (type === "GOALS") {
    const total = totalGoalsFromFixture(fix);
    // BTTS
    if (/Ambas as Equipes Marcam/i.test(prediction.tip)) {
      const home = fix.goals?.home == null ? 0 : fix.goals?.home;
      const away = fix.goals?.away == null ? 0 : fix.goals?.away;
      return home > 0 && away > 0 ? "WIN" : "LOSS";
    }
    // Under
    const thrUnder = parseUnderThreshold(prediction.tip);
    if (thrUnder != null) {
      return total < thrUnder ? "WIN" : "LOSS";
    }
    // Over
    const thrOver = parseOverThreshold(prediction.tip);
    if (thrOver != null) {
      return total > thrOver ? "WIN" : "LOSS";
    }
    return "UNKNOWN";
  }

  // Corners
  if (type === "CORNERS") {
    const thr = parseOverThreshold(prediction.tip);
    const totalCorners = getStatisticTotal(fix, "Corners");
    if (totalCorners == null || thr == null) return "UNKNOWN";
    return totalCorners > thr ? "WIN" : "LOSS";
  }

  // Cards
  if (type === "CARDS") {
    const thr = parseOverThreshold(prediction.tip);
    const totalCards = getStatisticTotal(fix, "Cartões");
    if (totalCards == null || thr == null) return "UNKNOWN";
    return totalCards > thr ? "WIN" : "LOSS";
  }

  return "UNKNOWN";
}