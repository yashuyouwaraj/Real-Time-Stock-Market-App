import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { AlertRule } from "@/database/models/alert-rule.model";
import { getAlertBacktestStats } from "@/lib/actions/finnhub.actions";

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  const lookbackDays = Number(searchParams.get("lookbackDays") || "30");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  const alert = await AlertRule.findOne({ _id: id, userId }).lean();
  if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

  const stats = await getAlertBacktestStats(
    String(alert.symbol),
    alert.ruleType,
    Number(alert.threshold),
    Number.isFinite(lookbackDays) ? lookbackDays : 30
  );

  return NextResponse.json({ stats });
}
