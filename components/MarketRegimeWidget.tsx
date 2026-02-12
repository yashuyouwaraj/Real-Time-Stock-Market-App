type MarketRegimeSnapshot = {
  regime: "risk_on" | "neutral" | "risk_off";
  summary: string;
  spyDp: number;
  qqqDp: number;
  vix: number | null;
  updatedAt: number;
};

const regimeStyle: Record<MarketRegimeSnapshot["regime"], string> = {
  risk_on: "border-green-500/30 bg-green-500/10 text-green-400",
  neutral: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  risk_off: "border-red-500/30 bg-red-500/10 text-red-400",
};

const MarketRegimeWidget = ({ snapshot }: { snapshot: MarketRegimeSnapshot }) => {
  const label =
    snapshot.regime === "risk_on" ? "Risk On" : snapshot.regime === "risk_off" ? "Risk Off" : "Neutral";

  return (
    <section className="watchlist-card p-5 md:p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-yellow-500/80">Market Regime</p>
          <h2 className="text-2xl font-semibold text-gray-100 mt-2">{label}</h2>
          <p className="text-gray-300 mt-2">{snapshot.summary}</p>
        </div>

        <span className={`inline-flex px-3 py-1 rounded-full border text-sm font-medium ${regimeStyle[snapshot.regime]}`}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
        <div className="watchlist-metric-card">
          <p className="watchlist-metric-label">SPY Daily %</p>
          <p className="watchlist-metric-value-sm">{snapshot.spyDp.toFixed(2)}%</p>
        </div>
        <div className="watchlist-metric-card">
          <p className="watchlist-metric-label">QQQ Daily %</p>
          <p className="watchlist-metric-value-sm">{snapshot.qqqDp.toFixed(2)}%</p>
        </div>
        <div className="watchlist-metric-card">
          <p className="watchlist-metric-label">VIX</p>
          <p className="watchlist-metric-value-sm">{snapshot.vix !== null ? snapshot.vix.toFixed(2) : "N/A"}</p>
        </div>
      </div>
    </section>
  );
};

export default MarketRegimeWidget;
