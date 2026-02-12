import Link from "next/link";
import { connectToDatabase } from "@/database/mongoose";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const { email, valid } = verifyUnsubscribeToken(token || "");

  let success = false;
  if (valid && email) {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (db) {
      const result = await db.collection("user").updateOne({ email }, { $set: { emailNotifications: false } });
      success = result.matchedCount > 0;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-gray-800 border border-gray-600 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-gray-100 mb-3">
          {success ? "You are unsubscribed" : "Unsubscribe link is invalid"}
        </h1>
        <p className="text-gray-400 mb-6">
          {success
            ? "This email address will no longer receive Signalist news notifications."
            : "This link is expired or malformed. Please use the latest unsubscribe link from your email inbox."}
        </p>
        <Link href="/" className="search-btn">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
