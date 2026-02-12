import { NextResponse } from "next/server";
import { getComparisonSnapshot } from "@/lib/actions/finnhub.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = (searchParams.get("symbols") || "").trim();
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ rows: [] });
  }

  try {
    const rows = await getComparisonSnapshot(symbols);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("GET /api/compare error:", error);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}
