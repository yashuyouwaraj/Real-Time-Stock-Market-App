import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { EarningsReminder } from "@/database/models/earnings-reminder.model";

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const reminders = await EarningsReminder.find({ userId }).sort({ reminderDate: 1, createdAt: -1 }).lean();

  return NextResponse.json({
    reminders: reminders.map((r) => ({
      id: String(r._id),
      symbol: String(r.symbol),
      company: String(r.company),
      reminderDate: new Date(r.reminderDate).toISOString(),
      note: String(r.note || ""),
      enabled: Boolean(r.enabled),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const symbol = (typeof body?.symbol === "string" ? body.symbol : "").trim().toUpperCase();
  const company = (typeof body?.company === "string" ? body.company : "").trim() || symbol;
  const dateRaw = typeof body?.reminderDate === "string" ? body.reminderDate : "";
  const note = (typeof body?.note === "string" ? body.note : "").trim();
  const enabled = body?.enabled !== false;

  if (!symbol || !dateRaw) {
    return NextResponse.json({ error: "symbol and reminderDate are required" }, { status: 400 });
  }

  const reminderDate = new Date(dateRaw);
  if (Number.isNaN(reminderDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  await connectToDatabase();
  const item = await EarningsReminder.findOneAndUpdate(
    { userId, symbol, reminderDate },
    { $set: { company, note, enabled } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    reminder: {
      id: String(item?._id),
      symbol: String(item?.symbol || symbol),
      company: String(item?.company || company),
      reminderDate: new Date(item?.reminderDate || reminderDate).toISOString(),
      note: String(item?.note || note),
      enabled: Boolean(item?.enabled ?? enabled),
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
  if (typeof body?.note === "string") patch.note = body.note.trim();
  if (typeof body?.reminderDate === "string") {
    const d = new Date(body.reminderDate);
    if (!Number.isNaN(d.getTime())) patch.reminderDate = d;
  }

  await connectToDatabase();
  await EarningsReminder.updateOne({ _id: id, userId }, { $set: patch });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = (typeof body?.id === "string" ? body.id : "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await EarningsReminder.deleteOne({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
