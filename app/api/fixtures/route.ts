import { NextResponse } from "next/server";
import { getDailyMatches } from "@/utils/api";
import mock from "@/utils/mock/fixtures.json";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    // Use API when API_FOOTBALL_KEY (or RAPIDAPI_KEY) is present; otherwise fall back to mock
    const useReal = !!(process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY);
    const response = useReal ? await getDailyMatches(date) : (mock.response as any);

    return NextResponse.json({ response });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}