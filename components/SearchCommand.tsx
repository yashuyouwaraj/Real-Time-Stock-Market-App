"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";
import WatchlistButton from "@/components/WatchlistButton";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks, watchlistSymbols = [] }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const normalizedWatchlist = useMemo(
    () => watchlistSymbols.map((s) => s.trim().toUpperCase()).filter(Boolean),
    [watchlistSymbols]
  );
  const [watchlistState, setWatchlistState] = useState<string[]>(normalizedWatchlist);
  const watchlistSet = useMemo(() => new Set(watchlistState), [watchlistState]);

  const normalizeStocks = useCallback(
    (list: StockWithWatchlistStatus[], set: Set<string>) =>
      list.map((stock) => ({
        ...stock,
        isInWatchlist: set.has(stock.symbol.toUpperCase()),
      })),
    []
  );

  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(
    () => normalizeStocks(initialStocks, new Set(normalizedWatchlist))
  );

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSearch = useCallback(async () => {
    if(!isSearchMode) return setStocks(normalizeStocks(initialStocks, watchlistSet));

    setLoading(true)
    try {
        const results = await searchStocks(searchTerm.trim());
        setStocks(normalizeStocks(results, watchlistSet));
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }, [initialStocks, isSearchMode, normalizeStocks, searchTerm, watchlistSet]);

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm, debouncedSearch]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(normalizeStocks(initialStocks, watchlistSet));
  }

  useEffect(() => {
    setStocks((prev) => normalizeStocks(prev, watchlistSet));
  }, [watchlistSet, normalizeStocks]);

  useEffect(() => {
    setWatchlistState(normalizedWatchlist);
  }, [normalizedWatchlist]);

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    const upper = symbol.toUpperCase();
    setWatchlistState((prev) => {
      if (isAdded) {
        return prev.includes(upper) ? prev : [...prev, upper];
      }
      return prev.filter((s) => s !== upper);
    });
    setStocks((prev) =>
      prev.map((stock) =>
        stock.symbol.toUpperCase() === upper ? { ...stock, isInWatchlist: isAdded } : stock
      )
    );
  };

  return (
    <>
      {renderAs === 'text' ? (
          <span onClick={() => setOpen(true)} className="search-text">
            {label}
          </span>
      ): (
          <Button onClick={() => setOpen(true)} className="search-btn">
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
              <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
          ) : displayStocks?.length === 0 ? (
              <div className="search-list-indicator">
                {isSearchMode ? 'No results found' : 'No stocks available'}
              </div>
            ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? 'Search results' : 'Popular stocks'}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks?.map((stock) => (
                  <li key={stock.symbol} className="search-item">
                    <div className="search-item-link">
                      <Link
                          href={`/stocks/${stock.symbol}`}
                          onClick={handleSelectStock}
                          className="flex items-center gap-3 flex-1"
                      >
                        <TrendingUp className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="search-item-name">
                            {stock.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stock.symbol} | {stock.exchange } | {stock.type}
                          </div>
                        </div>
                      </Link>
                      <WatchlistButton
                        symbol={stock.symbol}
                        company={stock.name}
                        isInWatchlist={stock.isInWatchlist}
                        type="icon"
                        onWatchlistChange={handleWatchlistChange}
                      />
                    </div>
                  </li>
              ))}
            </ul>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}
