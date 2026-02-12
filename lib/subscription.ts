import { connectToDatabase } from "@/database/mongoose";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function unsubscribeEmail(email: string): Promise<{ success: boolean; matchedCount: number }> {
  const normalizedEmail = normalizeEmail(email);
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return { success: false, matchedCount: 0 };

  const result = await db.collection("user").updateOne(
    { email: normalizedEmail },
    {
      $set: {
        isSubscribed: false,
        emailNotifications: false,
        unsubscribedAt: new Date(),
      },
    },
    {
      collation: { locale: "en", strength: 2 },
    }
  );

  return { success: result.matchedCount > 0, matchedCount: result.matchedCount };
}

export async function setEmailSubscription(
  email: string,
  isSubscribed: boolean
): Promise<{ success: boolean; matchedCount: number }> {
  const normalizedEmail = normalizeEmail(email);
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return { success: false, matchedCount: 0 };

  const result = await db.collection("user").updateOne(
    { email: normalizedEmail },
    {
      $set: {
        isSubscribed,
        emailNotifications: isSubscribed,
        unsubscribedAt: isSubscribed ? null : new Date(),
      },
    },
    {
      collation: { locale: "en", strength: 2 },
    }
  );

  return { success: result.matchedCount > 0, matchedCount: result.matchedCount };
}

export async function isEmailSubscribed(email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return false;

  const user = await db.collection("user").findOne(
    { email: normalizedEmail },
    {
      projection: { isSubscribed: 1, emailNotifications: 1 },
      collation: { locale: "en", strength: 2 },
    }
  );

  if (!user) return false;
  const marketingSubscribed = user.isSubscribed !== false;
  const notificationsEnabled = user.emailNotifications !== false;
  return marketingSubscribed && notificationsEnabled;
}

export async function getEmailSubscriptionStatus(email: string): Promise<boolean | null> {
  const normalizedEmail = normalizeEmail(email);
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return null;

  const user = await db.collection("user").findOne(
    { email: normalizedEmail },
    { projection: { isSubscribed: 1, emailNotifications: 1 }, collation: { locale: "en", strength: 2 } }
  );

  if (!user) return null;
  return user.isSubscribed !== false && user.emailNotifications !== false;
}
