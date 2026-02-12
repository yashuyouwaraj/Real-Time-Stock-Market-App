import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { AlertRule, type AlertRuleType } from "@/database/models/alert-rule.model";

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const rules = await AlertRule.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    alerts: rules.map((r) => ({
      id: String(r._id),
      symbol: String(r.symbol),
      company: String(r.company),
      ruleType: r.ruleType,
      threshold: Number(r.threshold),
      cooldownMinutes: Number(r.cooldownMinutes || 0),
      quietHoursStart: String(r.quietHoursStart || ""),
      quietHoursEnd: String(r.quietHoursEnd || ""),
      enabled: Boolean(r.enabled),
      createdAt: new Date(r.createdAt ?? Date.now()).toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const symbol = (typeof body?.symbol === "string" ? body.symbol : "").trim().toUpperCase();
  const company = (typeof body?.company === "string" ? body.company : "").trim() || symbol;
  const ruleType = (typeof body?.ruleType === "string" ? body.ruleType : "") as AlertRuleType;
  const threshold = Number(body?.threshold);
  const cooldownMinutes = Number(body?.cooldownMinutes ?? 60);
  const quietHoursStart = (typeof body?.quietHoursStart === "string" ? body.quietHoursStart : "").trim();
  const quietHoursEnd = (typeof body?.quietHoursEnd === "string" ? body.quietHoursEnd : "").trim();
  const enabled = body?.enabled !== false;

  if (!symbol || !ruleType || !Number.isFinite(threshold)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();
  const updated = await AlertRule.findOneAndUpdate(
    { userId, symbol, ruleType, threshold },
    { $set: { company, cooldownMinutes, quietHoursStart, quietHoursEnd, enabled } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    alert: {
      id: String(updated?._id),
      symbol: String(updated?.symbol || symbol),
      company: String(updated?.company || company),
      ruleType: (updated?.ruleType || ruleType) as AlertRuleType,
      threshold: Number(updated?.threshold ?? threshold),
      cooldownMinutes: Number(updated?.cooldownMinutes ?? cooldownMinutes),
      quietHoursStart: String(updated?.quietHoursStart || quietHoursStart),
      quietHoursEnd: String(updated?.quietHoursEnd || quietHoursEnd),
      enabled: Boolean(updated?.enabled ?? enabled),
      createdAt: new Date(updated?.createdAt ?? Date.now()).toISOString(),
    },
  });
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = (typeof body?.id === "string" ? body.id : "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body?.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body?.cooldownMinutes === "number") patch.cooldownMinutes = body.cooldownMinutes;
  if (typeof body?.quietHoursStart === "string") patch.quietHoursStart = body.quietHoursStart.trim();
  if (typeof body?.quietHoursEnd === "string") patch.quietHoursEnd = body.quietHoursEnd.trim();

  await connectToDatabase();
  await AlertRule.updateOne({ _id: id, userId }, { $set: patch });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = (typeof body?.id === "string" ? body.id : "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await AlertRule.deleteOne({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
