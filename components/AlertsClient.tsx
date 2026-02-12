"use client";

import { useState } from "react";
import { BarChart3, Bell, BellOff, Trash2 } from "lucide-react";

type AlertRule = {
  id: string;
  symbol: string;
  company: string;
  ruleType: "price_upper" | "price_lower" | "percent_move" | "volume_spike" | "gap_up" | "gap_down";
  threshold: number;
  cooldownMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  enabled: boolean;
};

type BacktestStats = {
  totalDays: number;
  hitDays: number;
  hitRate: number;
  lastHitDate: string | null;
};

const ruleOptions: Array<{ value: AlertRule["ruleType"]; label: string }> = [
  { value: "price_upper", label: "Price Above" },
  { value: "price_lower", label: "Price Below" },
  { value: "percent_move", label: "% Move" },
  { value: "volume_spike", label: "Volume Spike (x Avg)" },
  { value: "gap_up", label: "Gap Up %" },
  { value: "gap_down", label: "Gap Down %" },
];

const AlertsClient = ({ initialAlerts }: { initialAlerts: AlertRule[] }) => {
  const [alerts, setAlerts] = useState<AlertRule[]>(initialAlerts);
  const [statsById, setStatsById] = useState<Record<string, BacktestStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    symbol: "",
    company: "",
    ruleType: "price_upper" as AlertRule["ruleType"],
    threshold: "",
    cooldownMinutes: "60",
    quietHoursStart: "",
    quietHoursEnd: "",
  });

  const createAlert = async () => {
    const payload = {
      symbol: form.symbol.trim().toUpperCase(),
      company: form.company.trim() || form.symbol.trim().toUpperCase(),
      ruleType: form.ruleType,
      threshold: Number(form.threshold),
      cooldownMinutes: Number(form.cooldownMinutes),
      quietHoursStart: form.quietHoursStart.trim(),
      quietHoursEnd: form.quietHoursEnd.trim(),
      enabled: true,
    };
    if (!payload.symbol || !Number.isFinite(payload.threshold)) return;

    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { alert?: AlertRule };
    if (!data.alert) return;
    setAlerts((prev) => {
      const exists = prev.some((a) => a.id === data.alert?.id);
      if (exists) return prev.map((a) => (a.id === data.alert?.id ? data.alert! : a));
      return [data.alert, ...prev];
    });
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const res = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    if (!res.ok) return;
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
  };

  const deleteAlert = async (id: string) => {
    const res = await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setStatsById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const loadBacktest = async (id: string) => {
    setLoadingStats((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/alerts/backtest?id=${encodeURIComponent(id)}&lookbackDays=30`);
      if (!res.ok) return;
      const data = (await res.json()) as { stats?: BacktestStats };
      if (data.stats) {
        setStatsById((prev) => ({ ...prev, [id]: data.stats! }));
      }
    } finally {
      setLoadingStats((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="page-stack">
      <section className="watchlist-hero">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Signal Engine</p>
          <h1 className="watchlist-title mt-2">Smart Alerts</h1>
          <p className="mt-2 text-gray-400">Price, move, volume, and gap alerts with cooldown + quiet hours controls.</p>
        </div>
        <div className="watchlist-metrics">
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Total Rules</p>
            <p className="watchlist-metric-value">{alerts.length}</p>
          </div>
          <div className="watchlist-metric-card">
            <p className="watchlist-metric-label">Active Rules</p>
            <p className="watchlist-metric-value-sm">{alerts.filter((a) => a.enabled).length}</p>
          </div>
        </div>
      </section>

      <section className="watchlist-card p-4 md:p-5 space-y-3">
        <h2 className="panel-title">Create Alert Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.symbol} onChange={(e) => setForm((s) => ({ ...s, symbol: e.target.value }))} placeholder="Symbol" className="pro-input" />
          <input value={form.company} onChange={(e) => setForm((s) => ({ ...s, company: e.target.value }))} placeholder="Company" className="pro-input" />
          <select value={form.ruleType} onChange={(e) => setForm((s) => ({ ...s, ruleType: e.target.value as AlertRule["ruleType"] }))} className="pro-select">
            {ruleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input value={form.threshold} onChange={(e) => setForm((s) => ({ ...s, threshold: e.target.value }))} placeholder="Threshold" type="number" step="any" className="pro-input" />
          <input value={form.cooldownMinutes} onChange={(e) => setForm((s) => ({ ...s, cooldownMinutes: e.target.value }))} placeholder="Cooldown minutes" type="number" min="0" className="pro-input" />
          <input value={form.quietHoursStart} onChange={(e) => setForm((s) => ({ ...s, quietHoursStart: e.target.value }))} placeholder="Quiet start (HH:mm)" className="pro-input" />
          <input value={form.quietHoursEnd} onChange={(e) => setForm((s) => ({ ...s, quietHoursEnd: e.target.value }))} placeholder="Quiet end (HH:mm)" className="pro-input" />
        </div>
        <button type="button" className="watchlist-btn w-auto" onClick={() => void createAlert()}>
          Save Alert
        </button>
      </section>

      <section className="watchlist-table">
        <table className="w-full">
          <thead>
            <tr className="table-header-row">
              <th className="table-header py-3 px-4 text-left">Symbol</th>
              <th className="table-header py-3 px-4 text-left">Rule</th>
              <th className="table-header py-3 px-4 text-right">Threshold</th>
              <th className="table-header py-3 px-4 text-right">Cooldown</th>
              <th className="table-header py-3 px-4 text-left">Quiet Hours</th>
              <th className="table-header py-3 px-4 text-left">Backtest (30d)</th>
              <th className="table-header py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => {
              const stats = statsById[alert.id];
              const loading = Boolean(loadingStats[alert.id]);
              return (
                <tr key={alert.id} className="table-row">
                  <td className="table-cell py-3 px-4"><span className="watchlist-symbol-chip">{alert.symbol}</span></td>
                  <td className="table-cell py-3 px-4">{ruleOptions.find((o) => o.value === alert.ruleType)?.label || alert.ruleType}</td>
                  <td className="table-cell py-3 px-4 text-right">{alert.threshold}</td>
                  <td className="table-cell py-3 px-4 text-right">{alert.cooldownMinutes}m</td>
                  <td className="table-cell py-3 px-4 text-gray-400">{alert.quietHoursStart || "-"} {alert.quietHoursEnd ? `- ${alert.quietHoursEnd}` : ""}</td>
                  <td className="table-cell py-3 px-4 text-gray-400">
                    {stats ? `${stats.hitDays}/${stats.totalDays} (${stats.hitRate.toFixed(1)}%)` : "Not run"}
                  </td>
                  <td className="table-cell py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button type="button" className="watchlist-btn watchlist-btn-compact" onClick={() => void loadBacktest(alert.id)}>
                        <BarChart3 className="h-4 w-4" />
                        {loading ? "Running..." : "Backtest"}
                      </button>
                      <button type="button" className="watchlist-btn watchlist-btn-compact" onClick={() => void toggleEnabled(alert.id, !alert.enabled)}>
                        {alert.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        {alert.enabled ? "Enabled" : "Disabled"}
                      </button>
                      <button type="button" className="watchlist-btn watchlist-remove watchlist-btn-compact" onClick={() => void deleteAlert(alert.id)}>
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {alerts.length === 0 && (
              <tr>
                <td className="table-cell py-6 px-4 text-gray-400" colSpan={7}>
                  No alert rules configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AlertsClient;
