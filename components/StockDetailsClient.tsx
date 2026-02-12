"use client";

import { useMemo } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
  BASELINE_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";
import { createTradingViewSymbol } from "@/lib/tradingview-market";

const StockDetailsClient = ({
  symbol,
  isInWatchlist,
}: {
  symbol: string;
  isInWatchlist: boolean;
  userCountry?: string | null;
  initialExchange?: string | null;
}) => {
  const scriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-";
  const tradingViewSymbol = useMemo(() => createTradingViewSymbol(symbol, "NASDAQ"), [symbol]);
  const timezone = "America/New_York";

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(tradingViewSymbol)}
            height={170}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(tradingViewSymbol, timezone)}
            className="custom-chart"
            height={600}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(tradingViewSymbol, timezone)}
            className="custom-chart"
            height={600}
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="watchlist-card p-4 md:p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <WatchlistButton symbol={symbol.toUpperCase()} company={symbol.toUpperCase()} isInWatchlist={isInWatchlist} />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.12em] text-gray-500">Market</label>
              <div className="h-10 px-3 rounded-md border border-gray-600 bg-gray-800 text-gray-300 text-sm w-full flex items-center">
                NASDAQ
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Symbol: <span className="text-gray-300 font-medium">{tradingViewSymbol}</span>
            </p>
          </div>

          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(tradingViewSymbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(tradingViewSymbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(tradingViewSymbol)}
            height={464}
          />
        </div>
      </section>
    </div>
  );
};

export default StockDetailsClient;
