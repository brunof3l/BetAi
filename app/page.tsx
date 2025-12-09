import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getDailyMatches, classifyMatches, getLeagueStandings, type Fixture, type TeamStanding } from "@/utils/api";
import LeagueFilterPanel from "@/components/LeagueFilterPanel";

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Fixar data em HOJE
  const today = new Date();
  const dateStr = toDateStr(today);

  const fixtures: Fixture[] = await getDailyMatches(dateStr);
  const { liveMatches, upcomingMatches, finishedMatches } = classifyMatches(fixtures);

  // Build standings map por liga para os jogos de hoje
  const leagueIds = Array.from(new Set(fixtures.map((fx) => fx.league.id)));
  const standingsArrays = await Promise.all(
    leagueIds.map((lgId) => {
      const season = fixtures.find((f) => f.league.id === lgId)?.league.season ?? today.getFullYear();
      return getLeagueStandings(lgId, season);
    })
  );
  const statsByTeamId: Record<number, TeamStanding> = {};
  for (const table of standingsArrays) {
    for (const row of table) {
      statsByTeamId[row.teamId] = row;
    }
  }

  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const todayLabel = `${dd}/${mm}`;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-cyan-300">Painel de Jogos</h1>

      {/* Header focado em JOGOS DE HOJE */}
      <h2 className="mt-4 text-center text-cyan-300 text-xl font-semibold tracking-wide drop-shadow-[0_0_6px_rgba(34,211,238,0.7)]">
        📅 JOGOS DE HOJE • {todayLabel}
      </h2>

      {/* Painéis: Ao vivo, Próximos, Finalizados */}
      <LeagueFilterPanel
        liveMatches={liveMatches}
        upcomingMatches={upcomingMatches}
        finishedMatches={finishedMatches}
        statsByTeamId={statsByTeamId}
      />
    </main>
  );
}
