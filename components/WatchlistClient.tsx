"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FolderPlus, Star } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";

type WatchlistFolder = {
  id: string;
  name: string;
  isDefault: boolean;
};

type WatchlistItemRow = {
  symbol: string;
  company: string;
  folderId: string | null;
  addedAt: string;
};

const WatchlistClient = ({ initialItems }: { initialItems: WatchlistItemRow[] }) => {
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItemRow[]>(initialItems);
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [newFolderName, setNewFolderName] = useState("");

  const latestAdded = items[0]?.addedAt;
  const latestAddedLabel = latestAdded
    ? new Date(latestAdded).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  const loadFolders = async () => {
    try {
      const res = await fetch("/api/watchlist/folders", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { folders?: WatchlistFolder[] };
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch (error) {
      console.error("watchlist folders load failed:", error);
    }
  };

  const refreshWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items?: Array<{ symbol: string; company: string; folderId: string | null; addedAt: string }>;
      };
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error("watchlist refresh failed:", error);
    }
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    if (isAdded) return;
    setItems((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  const openStockDetails = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;

    try {
      const res = await fetch("/api/watchlist/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return;
      setNewFolderName("");
      await loadFolders();
    } catch (error) {
      console.error("create folder failed:", error);
    }
  };

  const handleFolderAssign = async (symbol: string, folderId: string) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, folderId }),
      });
      if (!res.ok) return;

      setItems((prev) =>
        prev.map((item) => (item.symbol === symbol ? { ...item, folderId: folderId || null } : item))
      );
    } catch (error) {
      console.error("assign folder failed:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;

    fetch("/api/watchlist/folders", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { folders?: WatchlistFolder[] };
        if (!cancelled) {
          setFolders(Array.isArray(data.folders) ? data.folders : []);
        }
      })
      .catch((error) => {
        console.error("watchlist folders load failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onWatchlistUpdated = () => {
      void refreshWatchlist();
      void loadFolders();
    };

    window.addEventListener("watchlist:updated", onWatchlistUpdated);
    return () => window.removeEventListener("watchlist:updated", onWatchlistUpdated);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeFolder === "all") return items;
    return items.filter((item) => item.folderId === activeFolder);
  }, [activeFolder, items]);

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
          <p className="mt-2 text-gray-400">Track saved symbols, group them by folder, and jump into details quickly.</p>
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

      <section className="watchlist-card p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-sm border ${activeFolder === "all" ? "border-yellow-500 text-yellow-500" : "border-gray-600 text-gray-400"}`}
              onClick={() => setActiveFolder("all")}
            >
              All
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm border ${activeFolder === folder.id ? "border-yellow-500 text-yellow-500" : "border-gray-600 text-gray-400"}`}
                onClick={() => setActiveFolder(folder.id)}
              >
                {folder.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder"
              className="h-9 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm"
            />
            <button type="button" className="watchlist-btn w-auto px-3" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4" />
              Add Folder
            </button>
          </div>
        </div>
      </section>

      <div className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Company</th>
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-left">Folder</th>
              <th className="table-header py-3 px-4 text-left">Added</th>
              <th className="table-header py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
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
                <td className="table-cell py-3 px-4" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                  <select
                    value={item.folderId || ""}
                    onChange={(e) => void handleFolderAssign(item.symbol, e.target.value)}
                    className="h-9 px-2 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm"
                  >
                    <option value="">None</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
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
