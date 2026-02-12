"use client";

import { useState } from "react";

type ComparisonRow = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  pe: number | null;
  volume: number | null;
};

const CompareClient = ({ initialRows }: { initialRows: ComparisonRow[] }) => {
  const [symbolsInput, setSymbolsInput] = useState(initialRows.map((r) => r.symbol).join(","));
  const [rows, setRows] = useState<ComparisonRow[]>(initialRows);
  const [loading, setLoading] = useState(false);

  const runCompare = async () => {
    const symbols = symbolsInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 4);

    if (symbols.length === 0) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/compare?symbols=${encodeURIComponent(symbols.join(","))}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows?: ComparisonRow[] };
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Compare</p>
          <h1 className="watchlist-title mt-2">Stock Comparison</h1>
          <p className="mt-2 text-gray-400">Compare up to 4 symbols across price, change, valuation, and size.</p>
        </div>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-100">Symbols</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value)}
            placeholder="AAPL, MSFT, NVDA, AMZN"
            className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm md:flex-1"
          />
          <button type="button" className="watchlist-btn w-auto" onClick={() => void runCompare()}>
            {loading ? "Loading..." : "Compare"}
          </button>
        </div>
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
                  No comparison data. Enter symbols and run compare.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default CompareClient;
