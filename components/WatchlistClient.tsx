"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";

type WatchlistItemRow = {
  symbol: string;
  company: string;
  addedAt: string;
};

const WatchlistClient = ({ initialItems }: { initialItems: WatchlistItemRow[] }) => {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItemRow[]>(initialItems);
  const latestAdded = items[0]?.addedAt;
  const latestAddedLabel = latestAdded
    ? new Date(latestAdded).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (isAdded) return;
    setItems((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const openStockDetails = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  const refreshWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items?: Array<{ symbol: string; company: string; addedAt: string }>;
      };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error("watchlist refresh failed:", error);
    }
  };

  useEffect(() => {
    const onWatchlistUpdated = () => {
      void refreshWatchlist();
    };

    window.addEventListener("watchlist:updated", onWatchlistUpdated);
    return () => window.removeEventListener("watchlist:updated", onWatchlistUpdated);
  }, []);

  if (items.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty watchlist-card">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Start starring stocks from the search panel to see them here.
          </p>
          <Link href="/" className="search-btn">
            Explore stocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist w-full space-y-6">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Portfolio Radar</p>
          <h1 className="watchlist-title mt-2">Your Watchlist</h1>
          <p className="mt-2 text-gray-400">Track saved symbols and jump back to details quickly.</p>
        </div>
        <div className="watchlist-metrics">
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Saved Stocks</p>
            <p className="watchlist-metric-value">{items.length}</p>
          </div>
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Latest Added</p>
            <p className="watchlist-metric-value-sm">{latestAddedLabel}</p>
          </div>
        </div>
      </section>

      <div className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Company</th>
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-left">Added</th>
              <th className="table-header py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.symbol}
                className="table-row"
                onClick={() => openStockDetails(item.symbol)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStockDetails(item.symbol);
                  }
                }}
                tabIndex={0}
              >
                <td className="table-cell py-3 px-4">
                  <Link href={`/stocks/${item.symbol}`} className="watchlist-company-link">
                    <span>{item.company}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-70" />
                  </Link>
                </td>
                <td className="table-cell py-3 px-4 text-gray-300">
                  <span className="watchlist-symbol-chip">{item.symbol}</span>
                </td>
                <td className="table-cell py-3 px-4 text-gray-400">
                  {new Date(item.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td
                  className="table-cell py-3 px-4 text-right"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <WatchlistButton
                    symbol={item.symbol}
                    company={item.company}
                    isInWatchlist={true}
                    showTrashIcon
                    onWatchlistChange={handleWatchlistChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchlistClient;
