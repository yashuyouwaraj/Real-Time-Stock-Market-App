import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EarningsClient from "@/components/EarningsClient";
import { getAuth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { EarningsReminder } from "@/database/models/earnings-reminder.model";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";
import { getUpcomingEarnings } from "@/lib/actions/finnhub.actions";

export default async function EarningsPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  await connectToDatabase();
  const rows = await EarningsReminder.find({ userId: session.user.id }).sort({ reminderDate: 1, createdAt: -1 }).lean();

  const watchlistSymbols = await getWatchlistSymbolsByUserId(session.user.id);
  const upcoming = await getUpcomingEarnings(watchlistSymbols);

  const initialReminders = rows.map((row) => ({
    id: String(row._id),
    symbol: String(row.symbol),
    company: String(row.company),
    reminderDate: new Date(row.reminderDate).toISOString(),
    note: String(row.note || ""),
    enabled: Boolean(row.enabled),
  }));

  return (
    <div className="watchlist-container">
      <EarningsClient initialReminders={initialReminders} upcomingEarnings={upcoming} />
    </div>
  );
}
