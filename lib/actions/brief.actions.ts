'use server';

import { connectToDatabase } from "@/database/mongoose";
import { DailyBrief } from "@/database/models/daily-brief.model";

export async function getDailyBriefsByUserId(userId: string) {
  if (!userId) return [];
  try {
    await connectToDatabase();
    const rows = await DailyBrief.find({ userId }).sort({ dateKey: -1, createdAt: -1 }).limit(20).lean();
    return rows.map((row) => ({
      id: String(row._id),
      dateKey: String(row.dateKey),
      headline: String(row.headline),
      briefHtml: String(row.briefHtml),
      regime: row.regime,
      createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    }));
  } catch (error) {
    console.error("getDailyBriefsByUserId error:", error);
    return [];
  }
}
