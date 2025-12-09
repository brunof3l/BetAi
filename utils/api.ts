/*
 Data client for API-Football (v3) using RapidAPI headers.
 Base URL: https://v3.football.api-sports.io
 Reads RAPIDAPI_KEY from .env.local (server-side only).
*/

const BASE_URL = "https://v3.football.api-sports.io";
const RAPIDAPI_HOST = "v3.football.api-sports.io"; // per request instruction

// Major leagues to limit free quota usage
export const MAJOR_LEAGUES: Record<string, number> = {
  premierLeague: 39,
  laLiga: 140,
  brasileirao: 71,
};

export type ApiResponse<T> = {
  response: T;
  errors?: unknown;
};

export type FixtureTeam = {
  id: number;
  name: string;
  logo?: string;
  winner?: boolean;
};

export type FixtureLeague = {
  id: number;
  name: string;
  country?: string;
  logo?: string;
  season?: number;
};

export type Fixture = {
  fixture: {
    id: number;
    date: string;
    timestamp?: number;
    venue?: { id?: number; name?: string; city?: string };
    status?: { long?: string; short?: string; elapsed?: number };
  };
  league: FixtureLeague;
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals?: { home: number | null; away: number | null };
  importance?: number; // computed for UI sorting
};

export type TeamStatisticsEntry = {
  type: string;
  value: number | string | null;
};

export type FixtureStatisticsItem = {
  team: { id: number; name: string; logo?: string };
  statistics: TeamStatisticsEntry[];
};

function getHeaders() {
  const key = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;
  if (!key) {
    throw new Error("Missing API_FOOTBALL_KEY (or RAPIDAPI_KEY) in environment (.env.local)");
  }
  return {
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": RAPIDAPI_HOST,
    Accept: "application/json",
  } as const;
}

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.append(k, String(v));
  }
  return sp.toString();
}

async function request<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}${params ? `?${toQuery(params)}` : ""}`;
  const res = await fetch(url, {
    headers: getHeaders(),
    // Next.js fetch caches GET by default in server components; disable for live data
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Fetch fixtures for a specific date limited to major leagues
export async function getDailyFixtures(date: string): Promise<Fixture[]> {
  // Legacy function retained for compatibility (major leagues example)
  const seasonYear = new Date(date).getFullYear();
  const leagueIds = [MAJOR_LEAGUES.premierLeague, MAJOR_LEAGUES.laLiga, MAJOR_LEAGUES.brasileirao];
  const results = await Promise.all(
    leagueIds.map((league) =>
      request<Fixture[]>("/fixtures", { date, league, season: seasonYear }).then((r) => r.response)
    )
  );
  const merged = results.flat();
  return merged.sort((a, b) => (a.fixture.timestamp ?? 0) - (b.fixture.timestamp ?? 0));
}

// Europe-only matches for season 2024/2025, ordered by league priority
import { TARGET_LEAGUES, leaguePriority } from "@/config/leagues";
export async function getDailyMatches(date: string): Promise<Fixture[]> {
  // Single request for the date to reduce quota usage
  const all = await request<Fixture[]>("/fixtures", { date }).then((r) => r.response);
  const filtered = all.filter((fx) => TARGET_LEAGUES.includes(fx.league.id));
  return filtered.sort((a, b) => {
    const pa = leaguePriority[a.league.id] ?? 100;
    const pb = leaguePriority[b.league.id] ?? 100;
    if (pa !== pb) return pa - pb;
    return (a.fixture.timestamp ?? 0) - (b.fixture.timestamp ?? 0);
  });
}

// Fetch team statistics for a given fixture and team
export async function getTeamStats(teamId: number, fixtureId: number): Promise<TeamStatisticsEntry[] | null> {
  const stats = await request<FixtureStatisticsItem[]>("/fixtures/statistics", { fixture: fixtureId }).then((r) => r.response);
  const forTeam = stats.find((s) => s.team.id === teamId);
  return forTeam?.statistics ?? null;
}

export type FixtureStatusShort =
  | "NS" // Not Started
  | "TBD"
  | "1H"
  | "HT"
  | "2H"
  | "ET"
  | "BT"
  | "P"
  | "LIVE"
  | "FT"
  | "AET"
  | "PEN"
  | "SUSP"
  | "INT"
  | "PST";

export function classifyMatches(all: Fixture[]) {
  const liveSet = new Set<FixtureStatusShort>(["1H", "HT", "2H", "ET", "BT", "P", "LIVE"]);
  const upcomingSet = new Set<FixtureStatusShort>(["NS", "TBD"]);
  const finishedSet = new Set<FixtureStatusShort>(["FT", "AET", "PEN"]);
  const liveMatches: Fixture[] = [];
  const upcomingMatches: Fixture[] = [];
  const finishedMatches: Fixture[] = [];

  for (const fx of all) {
    const short = (fx.fixture.status?.short || "NS") as FixtureStatusShort;
    const long = fx.fixture.status?.long || "";

    const isLive = liveSet.has(short) || /Added Time/i.test(long);
    const isUpcoming = upcomingSet.has(short);
    const isFinished = finishedSet.has(short);

    if (isLive) {
      liveMatches.push(fx);
    } else if (isFinished) {
      finishedMatches.push(fx);
    } else if (isUpcoming) {
      upcomingMatches.push(fx);
    } else {
      // Other statuses (suspended, postponed, etc.): if in the future, show in upcoming
      if ((fx.fixture.timestamp ?? 0) > Date.now() / 1000) {
        upcomingMatches.push(fx);
      }
    }
  }

  // sort each group by priority then time
  const byPriorityThenTimeAsc = (a: Fixture, b: Fixture) => {
    const pa = leaguePriority[a.league.id] ?? 100;
    const pb = leaguePriority[b.league.id] ?? 100;
    if (pa !== pb) return pa - pb;
    return (a.fixture.timestamp ?? 0) - (b.fixture.timestamp ?? 0);
  };
  const byPriorityThenTimeDesc = (a: Fixture, b: Fixture) => {
    const pa = leaguePriority[a.league.id] ?? 100;
    const pb = leaguePriority[b.league.id] ?? 100;
    if (pa !== pb) return pa - pb;
    return (b.fixture.timestamp ?? 0) - (a.fixture.timestamp ?? 0);
  };
  
  liveMatches.sort(byPriorityThenTimeAsc);
  upcomingMatches.sort(byPriorityThenTimeAsc);
  finishedMatches.sort(byPriorityThenTimeDesc);

  return { liveMatches, upcomingMatches, finishedMatches };
}

export type TeamStanding = {
  teamId: number;
  teamName: string;
  rank: number;
  points: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  form: string; // e.g., "WWLDL"
};

type ApiStandingsItem = {
  rank: number;
  team: { id: number; name: string };
  points: number;
  form?: string | null;
  all: { played: number; goals: { for: number; against: number } };
};

type StandingsResponse = {
  league: {
    id: number;
    season: number;
    standings: ApiStandingsItem[][]; // usually [ [ ...table rows... ] ]
  };
}[];

const standingsCache: Record<string, TeamStanding[]> = {};

export async function getLeagueStandings(leagueId: number, season: number): Promise<TeamStanding[]> {
  const key = `${leagueId}-${season}`;
  if (standingsCache[key]) return standingsCache[key];
  const res = await request<StandingsResponse>("/standings", { league: leagueId, season }).then((r) => r.response);
  const rows = res?.[0]?.league?.standings?.[0] ?? [];
  const table: TeamStanding[] = rows.map((r) => ({
    teamId: r.team.id,
    teamName: r.team.name,
    rank: r.rank,
    points: r.points,
    played: r.all.played,
    goalsFor: r.all.goals.for,
    goalsAgainst: r.all.goals.against,
    form: (r.form ?? "").toString(),
  }));
  standingsCache[key] = table;
  return table;
}

export default {
  getDailyFixtures,
  getTeamStats,
  getDailyMatches,
};