"use client";

import { useState } from "react";

type ScreenerRow = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  pe: number | null;
  volume: number | null;
};

const ScreenerClient = ({ initialRows }: { initialRows: ScreenerRow[] }) => {
  const [rows, setRows] = useState<ScreenerRow[]>(initialRows);
  const [filters, setFilters] = useState({
    minMarketCap: "",
    maxPe: "",
    minVolume: "",
    minChange: "",
    sector: "",
  });
  const [loading, setLoading] = useState(false);

  const runScreener = async () => {
    const params = new URLSearchParams({ limit: "40" });
    if (filters.minMarketCap.trim()) params.set("minMarketCap", filters.minMarketCap.trim());
    if (filters.maxPe.trim()) params.set("maxPe", filters.maxPe.trim());
    if (filters.minVolume.trim()) params.set("minVolume", filters.minVolume.trim());
    if (filters.minChange.trim()) params.set("minChange", filters.minChange.trim());
    if (filters.sector.trim()) params.set("sector", filters.sector.trim());

    setLoading(true);
    try {
      const res = await fetch(`/api/screener?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows?: ScreenerRow[] };
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Discovery</p>
          <h1 className="watchlist-title mt-2">Stock Screener</h1>
          <p className="mt-2 text-gray-400">Filter symbols by valuation, momentum, volume, and sector.</p>
        </div>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-100">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input placeholder="Min Market Cap (USD)" value={filters.minMarketCap} onChange={(e) => setFilters((f) => ({ ...f, minMarketCap: e.target.value }))} className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input placeholder="Max P/E" value={filters.maxPe} onChange={(e) => setFilters((f) => ({ ...f, maxPe: e.target.value }))} className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input placeholder="Min Volume" value={filters.minVolume} onChange={(e) => setFilters((f) => ({ ...f, minVolume: e.target.value }))} className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input placeholder="Min % Change" value={filters.minChange} onChange={(e) => setFilters((f) => ({ ...f, minChange: e.target.value }))} className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input placeholder="Sector contains..." value={filters.sector} onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))} className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
        </div>
        <button type="button" className="watchlist-btn w-auto" onClick={() => void runScreener()}>
          {loading ? "Screening..." : "Run Screener"}
        </button>
      </section>

      <section className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-left">Company</th>
              <th className="table-header py-3 px-4 text-left">Sector</th>
              <th className="table-header py-3 px-4 text-right">Price</th>
              <th className="table-header py-3 px-4 text-right">% Change</th>
              <th className="table-header py-3 px-4 text-right">Market Cap</th>
              <th className="table-header py-3 px-4 text-right">P/E</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="table-row">
                <td className="table-cell py-3 px-4"><span className="watchlist-symbol-chip">{row.symbol}</span></td>
                <td className="table-cell py-3 px-4">{row.company}</td>
                <td className="table-cell py-3 px-4 text-gray-400">{row.sector}</td>
                <td className="table-cell py-3 px-4 text-right">${row.price.toFixed(2)}</td>
                <td className={`table-cell py-3 px-4 text-right ${row.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {row.changePercent.toFixed(2)}%
                </td>
                <td className="table-cell py-3 px-4 text-right">
                  {row.marketCap !== null ? `$${(row.marketCap / 1_000_000_000).toFixed(2)}B` : "N/A"}
                </td>
                <td className="table-cell py-3 px-4 text-right">{row.pe !== null ? row.pe.toFixed(2) : "N/A"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="table-cell py-6 px-4 text-gray-400" colSpan={7}>
                  No stocks matched your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default ScreenerClient;
