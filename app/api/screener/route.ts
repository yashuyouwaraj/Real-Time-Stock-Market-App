import { NextResponse } from "next/server";
import { getScreenerUniverse } from "@/lib/actions/finnhub.actions";

function toNumberOrNull(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const limit = Number(searchParams.get("limit") || "40");
  const minMarketCap = toNumberOrNull(searchParams.get("minMarketCap"));
  const maxPe = toNumberOrNull(searchParams.get("maxPe"));
  const minVolume = toNumberOrNull(searchParams.get("minVolume"));
  const minChange = toNumberOrNull(searchParams.get("minChange"));
  const sector = (searchParams.get("sector") || "").trim().toLowerCase();

  try {
    const rows = await getScreenerUniverse(limit);
    const filtered = rows.filter((row) => {
      if (minMarketCap !== null && (row.marketCap ?? 0) < minMarketCap) return false;
      if (maxPe !== null && (row.pe === null || row.pe > maxPe)) return false;
      if (minVolume !== null && (row.volume ?? 0) < minVolume) return false;
      if (minChange !== null && row.changePercent < minChange) return false;
      if (sector && !row.sector.toLowerCase().includes(sector)) return false;
      return true;
    });

    return NextResponse.json({ rows: filtered });
  } catch (error) {
    console.error("GET /api/screener error:", error);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}
