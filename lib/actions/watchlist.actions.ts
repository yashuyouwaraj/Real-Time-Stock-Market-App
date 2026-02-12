'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';

async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  // Better Auth stores users in the "user" collection
  const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
  if (!user) return null;
  return (user.id as string) || String(user._id || '');
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistSymbolsByUserId(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByUserId error:', err);
    return [];
  }
}

export async function getWatchlistItemsByEmail(email: string): Promise<{ symbol: string; company: string; addedAt: Date }[]> {
  if (!email) return [];

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1, company: 1, addedAt: 1 })
      .sort({ addedAt: -1 })
      .lean();
    return items.map((i) => ({
      symbol: String(i.symbol),
      company: String(i.company),
      addedAt: new Date(i.addedAt ?? Date.now()),
    }));
  } catch (err) {
    console.error('getWatchlistItemsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistItemsByUserId(userId: string): Promise<{ symbol: string; company: string; addedAt: Date }[]> {
  if (!userId) return [];

  try {
    await connectToDatabase();
    const items = await Watchlist.find({ userId }, { symbol: 1, company: 1, addedAt: 1 })
      .sort({ addedAt: -1 })
      .lean();
    return items.map((i) => ({
      symbol: String(i.symbol),
      company: String(i.company),
      addedAt: new Date(i.addedAt ?? Date.now()),
    }));
  } catch (err) {
    console.error('getWatchlistItemsByUserId error:', err);
    return [];
  }
}
