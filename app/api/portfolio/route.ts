import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { PortfolioPosition } from "@/database/models/portfolio-position.model";

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const positions = await PortfolioPosition.find({ userId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({
    positions: positions.map((p) => ({
      id: String(p._id),
      symbol: String(p.symbol),
      company: String(p.company),
      quantity: Number(p.quantity),
      averageCost: Number(p.averageCost),
      createdAt: new Date(p.createdAt ?? Date.now()).toISOString(),
      updatedAt: new Date(p.updatedAt ?? Date.now()).toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const symbol = (typeof body?.symbol === "string" ? body.symbol : "").trim().toUpperCase();
  const company = (typeof body?.company === "string" ? body.company : "").trim() || symbol;
  const quantity = Number(body?.quantity);
  const averageCost = Number(body?.averageCost);

  if (!symbol || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(averageCost) || averageCost < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await connectToDatabase();
  const updated = await PortfolioPosition.findOneAndUpdate(
    { userId, symbol },
    { $set: { company, quantity, averageCost } },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({
    ok: true,
    position: {
      id: String(updated?._id),
      symbol: String(updated?.symbol || symbol),
      company: String(updated?.company || company),
      quantity: Number(updated?.quantity || quantity),
      averageCost: Number(updated?.averageCost || averageCost),
    },
  });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = (typeof body?.id === "string" ? body.id : "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await connectToDatabase();
  await PortfolioPosition.deleteOne({ _id: id, userId });
  return NextResponse.json({ ok: true });
}
