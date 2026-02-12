import StockDetailsClient from "@/components/StockDetailsClient";
import { getAuth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id || "";
  const watchlistSymbols = userId ? await getWatchlistSymbolsByUserId(userId) : [];
  const isInWatchlist = watchlistSymbols.includes(symbol.toUpperCase());

  return (
    <StockDetailsClient
      symbol={symbol}
      isInWatchlist={isInWatchlist}
    />
  );
}
