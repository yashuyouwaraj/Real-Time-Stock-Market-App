import { NextResponse } from "next/server";
import { getGeneralNewsPage } from "@/lib/actions/finnhub.actions";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "20");

  try {
    const data = await getGeneralNewsPage(page, limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/news error:", error);
    return NextResponse.json({ items: [], hasMore: false }, { status: 500 });
  }
}
