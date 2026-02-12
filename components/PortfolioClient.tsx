"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

type PortfolioPosition = {
  id: string;
  symbol: string;
  company: string;
  quantity: number;
  averageCost: number;
};

const PortfolioClient = ({ initialPositions }: { initialPositions: PortfolioPosition[] }) => {
  const [positions, setPositions] = useState<PortfolioPosition[]>(initialPositions);
  const [form, setForm] = useState({ symbol: "", company: "", quantity: "", averageCost: "" });

  const totals = useMemo(() => {
    const invested = positions.reduce((acc, p) => acc + p.quantity * p.averageCost, 0);
    const shares = positions.reduce((acc, p) => acc + p.quantity, 0);
    return { invested, shares, count: positions.length };
  }, [positions]);

  const savePosition = async () => {
    const symbol = form.symbol.trim().toUpperCase();
    const company = form.company.trim() || symbol;
    const quantity = Number(form.quantity);
    const averageCost = Number(form.averageCost);

    if (!symbol || !Number.isFinite(quantity) || !Number.isFinite(averageCost)) return;

    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, company, quantity, averageCost }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { position?: PortfolioPosition };
    if (!data.position) return;

    setPositions((prev) => {
      const exists = prev.some((p) => p.symbol === data.position?.symbol);
      if (exists) return prev.map((p) => (p.symbol === data.position?.symbol ? data.position! : p));
      return [data.position, ...prev];
    });

    setForm({ symbol: "", company: "", quantity: "", averageCost: "" });
  };

  const removePosition = async (id: string) => {
    const res = await fetch("/api/portfolio", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Holdings</p>
          <h1 className="watchlist-title mt-2">Portfolio Tracker</h1>
          <p className="mt-2 text-gray-400">Track your positions, average cost, and total capital deployed.</p>
        </div>
        <div className="watchlist-metrics">
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Positions</p>
            <p className="watchlist-metric-value">{totals.count}</p>
          </div>
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Invested Capital</p>
            <p className="watchlist-metric-value-sm">${totals.invested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-100">Add / Update Position</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.symbol} onChange={(e) => setForm((s) => ({ ...s, symbol: e.target.value }))} placeholder="Symbol (AAPL)" className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} placeholder="Company name" className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: e.target.value }))} placeholder="Quantity" type="number" min="0" step="any" className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
          <input value={form.averageCost} onChange={(e) => setForm((s) => ({ ...s, averageCost: e.target.value }))} placeholder="Average cost" type="number" min="0" step="any" className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-200 text-sm" />
        </div>
        <button type="button" onClick={() => void savePosition()} className="watchlist-btn w-auto">
          Save Position
        </button>
      </section>

      <section className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Company</th>
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-right">Quantity</th>
              <th className="table-header py-3 px-4 text-right">Avg Cost</th>
              <th className="table-header py-3 px-4 text-right">Invested</th>
              <th className="table-header py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p) => (
              <tr key={p.id} className="table-row">
                <td className="table-cell py-3 px-4">{p.company}</td>
                <td className="table-cell py-3 px-4 text-gray-300">
                  <span className="watchlist-symbol-chip">{p.symbol}</span>
                </td>
                <td className="table-cell py-3 px-4 text-right">{p.quantity.toLocaleString()}</td>
                <td className="table-cell py-3 px-4 text-right">${p.averageCost.toFixed(2)}</td>
                <td className="table-cell py-3 px-4 text-right">${(p.quantity * p.averageCost).toFixed(2)}</td>
                <td className="table-cell py-3 px-4 text-right">
                  <button type="button" className="watchlist-btn watchlist-remove watchlist-btn-compact" onClick={() => void removePosition(p.id)}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr>
                <td className="table-cell py-6 px-4 text-gray-400" colSpan={6}>
                  No positions yet. Add your first holding above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PortfolioClient;
