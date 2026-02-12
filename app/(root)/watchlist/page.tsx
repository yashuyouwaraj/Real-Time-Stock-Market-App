import WatchlistClient from "@/components/WatchlistClient";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlistItemsByUserId } from "@/lib/actions/watchlist.actions";

export default async function WatchlistPage() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  const items = await getWatchlistItemsByUserId(session.user.id);
  const serialized = items.map((item) => ({
    symbol: item.symbol,
    company: item.company,
    folderId: item.folderId,
    addedAt: item.addedAt.toISOString(),
  }));

  return (
    <div className="watchlist-container">
      <WatchlistClient initialItems={serialized} />
    </div>
  );
}
