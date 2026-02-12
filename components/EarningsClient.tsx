"use client";

import { useMemo, useState } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";

type EarningsReminderRow = {
  id: string;
  symbol: string;
  company: string;
  reminderDate: string;
  note: string;
  enabled: boolean;
};

type UpcomingEarningsRow = {
  date: string;
  symbol: string;
  epsEstimate?: number;
  revenueEstimate?: number;
};

const EarningsClient = ({
  initialReminders,
  upcomingEarnings,
}: {
  initialReminders: EarningsReminderRow[];
  upcomingEarnings: UpcomingEarningsRow[];
}) => {
  const [reminders, setReminders] = useState<EarningsReminderRow[]>(initialReminders);
  const [form, setForm] = useState({ symbol: "", company: "", reminderDate: "", note: "" });

  const activeCount = useMemo(() => reminders.filter((r) => r.enabled).length, [reminders]);

  const createReminder = async () => {
    const symbol = form.symbol.trim().toUpperCase();
    const company = form.company.trim() || symbol;
    if (!symbol || !form.reminderDate) return;

    const res = await fetch("/api/earnings-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        company,
        reminderDate: form.reminderDate,
        note: form.note.trim(),
        enabled: true,
      }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { reminder?: EarningsReminderRow };
    if (!data.reminder) return;

    setReminders((prev) => {
      const exists = prev.some((r) => r.id === data.reminder?.id);
      if (exists) return prev.map((r) => (r.id === data.reminder?.id ? data.reminder! : r));
      return [...prev, data.reminder];
    });
    setForm({ symbol: "", company: "", reminderDate: "", note: "" });
  };

  const toggleReminder = async (id: string, enabled: boolean) => {
    const res = await fetch("/api/earnings-reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    if (!res.ok) return;
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
  };

  const deleteReminder = async (id: string) => {
    const res = await fetch("/api/earnings-reminders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="page-stack">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Earnings</p>
          <h1 className="watchlist-title mt-2">Earnings Calendar & Reminders</h1>
          <p className="mt-2 text-gray-400">Track upcoming earnings and set custom reminder dates per stock.</p>
        </div>
        <div className="watchlist-metrics">
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Active Reminders</p>
            <p className="watchlist-metric-value">{activeCount}</p>
          </div>
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Upcoming Earnings</p>
            <p className="watchlist-metric-value-sm">{upcomingEarnings.length}</p>
          </div>
        </div>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="panel-title">Create Reminder</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.symbol} onChange={(e) => setForm((s) => ({ ...s, symbol: e.target.value }))} placeholder="Symbol (AAPL)" className="pro-input" />
          <input value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} placeholder="Company name" className="pro-input" />
          <input value={form.reminderDate} onChange={(e) => setForm((s) => ({ ...s, reminderDate: e.target.value }))} type="date" className="pro-input" />
          <input value={form.note} onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))} placeholder="Optional note" className="pro-input" />
        </div>
        <button type="button" className="watchlist-btn w-auto" onClick={() => void createReminder()}>
          Save Reminder
        </button>
      </section>

      <section className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-left">Company</th>
              <th className="table-header py-3 px-4 text-left">Reminder Date</th>
              <th className="table-header py-3 px-4 text-left">Note</th>
              <th className="table-header py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((r) => (
              <tr key={r.id} className="table-row">
                <td className="table-cell py-3 px-4">
                  <span className="watchlist-symbol-chip">{r.symbol}</span>
                </td>
                <td className="table-cell py-3 px-4">{r.company}</td>
                <td className="table-cell py-3 px-4 text-gray-300">
                  {new Date(r.reminderDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="table-cell py-3 px-4 text-gray-400">{r.note || "-"}</td>
                <td className="table-cell py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      className="watchlist-btn watchlist-btn-compact"
                      onClick={() => void toggleReminder(r.id, !r.enabled)}
                    >
                      {r.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                    <button
                      type="button"
                      className="watchlist-btn watchlist-remove watchlist-btn-compact"
                      onClick={() => void deleteReminder(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reminders.length === 0 && (
              <tr>
                <td className="table-cell py-6 px-4 text-gray-400" colSpan={5}>
                  No reminders configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="panel-title">Upcoming Earnings (Watchlist)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {upcomingEarnings.map((e) => (
            <div key={`${e.symbol}-${e.date}`} className="rounded-xl border border-gray-600 bg-gray-800 p-4">
              <div className="flex items-center justify-between">
                <span className="watchlist-symbol-chip">{e.symbol}</span>
                <span className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                EPS Est: {typeof e.epsEstimate === "number" ? e.epsEstimate.toFixed(2) : "N/A"}
              </p>
              <p className="text-sm text-gray-400">
                Revenue Est: {typeof e.revenueEstimate === "number" ? e.revenueEstimate.toLocaleString() : "N/A"}
              </p>
            </div>
          ))}
          {upcomingEarnings.length === 0 && <p className="text-gray-400">No upcoming earnings found for watchlist symbols.</p>}
        </div>
      </section>
    </div>
  );
};

export default EarningsClient;
