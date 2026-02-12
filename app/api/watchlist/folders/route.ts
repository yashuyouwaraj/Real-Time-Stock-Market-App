import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { WatchlistFolder } from "@/database/models/watchlist-folder.model";
import { Watchlist } from "@/database/models/watchlist.model";

async function getSessionUserId() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

async function ensureDefaultFolder(userId: string) {
  const existing = await WatchlistFolder.findOne({ userId, isDefault: true }).lean();
  if (existing) return existing;

  const created = await WatchlistFolder.findOneAndUpdate(
    { userId, name: "General" },
    { $setOnInsert: { userId, name: "General", isDefault: true, createdAt: new Date() } },
    { upsert: true, new: true }
  ).lean();
  return created;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  await ensureDefaultFolder(userId);

  const folders = await WatchlistFolder.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean();
  return NextResponse.json({
    folders: folders.map((folder) => ({
      id: String(folder._id),
      name: folder.name,
      isDefault: Boolean(folder.isDefault),
      createdAt: new Date(folder.createdAt ?? Date.now()).toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawName = typeof body?.name === "string" ? body.name : "";
  const name = rawName.trim();
  if (!name) return NextResponse.json({ error: "Folder name is required" }, { status: 400 });

  await connectToDatabase();
  const existing = await WatchlistFolder.findOne({ userId, name }).lean();
  if (existing) {
    return NextResponse.json({ error: "Folder already exists" }, { status: 409 });
  }

  const created = await WatchlistFolder.create({ userId, name, isDefault: false, createdAt: new Date() });
  return NextResponse.json({
    ok: true,
    folder: {
      id: String(created._id),
      name: created.name,
      isDefault: Boolean(created.isDefault),
      createdAt: new Date(created.createdAt).toISOString(),
    },
  });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const rawFolderId = typeof body?.folderId === "string" ? body.folderId : "";
  const folderId = rawFolderId.trim();
  if (!folderId) return NextResponse.json({ error: "folderId is required" }, { status: 400 });

  await connectToDatabase();
  const folder = await WatchlistFolder.findOne({ _id: folderId, userId }).lean();
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  if (folder.isDefault) return NextResponse.json({ error: "Default folder cannot be deleted" }, { status: 400 });

  const defaultFolder = await ensureDefaultFolder(userId);
  await Watchlist.updateMany(
    { userId, folderId },
    { $set: { folderId: String(defaultFolder?._id || null) } }
  );
  await WatchlistFolder.deleteOne({ _id: folderId, userId });

  return NextResponse.json({ ok: true });
}
