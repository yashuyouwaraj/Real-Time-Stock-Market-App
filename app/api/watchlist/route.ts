import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getAuth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const items = await Watchlist.find({ userId }, { symbol: 1, company: 1, addedAt: 1 })
    .sort({ addedAt: -1 })
    .lean();

  return NextResponse.json({
    items: items.map((i) => ({
      symbol: String(i.symbol),
      company: String(i.company),
      addedAt: new Date(i.addedAt ?? Date.now()).toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawSymbol = typeof body?.symbol === 'string' ? body.symbol : '';
  const rawCompany = typeof body?.company === 'string' ? body.company : '';
  const symbol = rawSymbol.trim().toUpperCase();
  const company = rawCompany.trim() || symbol;

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  await connectToDatabase();
  await Watchlist.updateOne(
    { userId, symbol },
    { $setOnInsert: { company, addedAt: new Date() } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, symbol });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawSymbol = typeof body?.symbol === 'string' ? body.symbol : '';
  const symbol = rawSymbol.trim().toUpperCase();

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  await connectToDatabase();
  await Watchlist.deleteOne({ userId, symbol });

  return NextResponse.json({ ok: true, symbol });
}
