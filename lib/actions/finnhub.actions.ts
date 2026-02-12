'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

type FinnhubProfile2 = {
  name?: string;
  ticker?: string;
  exchange?: string;
  marketCapitalization?: number;
  finnhubIndustry?: string;
};

type FinnhubQuoteResponse = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubCandleResponse = {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  t?: number[];
  v?: number[];
  s?: string;
};

type FinnhubMetricMap = Record<string, number | string | null | undefined>;

type FinnhubBasicFinancialsResponse = {
  metric?: FinnhubMetricMap;
};

type SearchResultWithExchange = FinnhubSearchResult & {
  __exchange?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const maxAttempts = 3;
  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, options);
    if (res.ok) {
      return (await res.json()) as T;
    }

    const text = await res.text().catch(() => '');
    lastError = `Fetch failed ${res.status}: ${text}`;
    const shouldRetry = res.status === 429 || res.status >= 500;

    if (!shouldRetry || attempt === maxAttempts) {
      throw new Error(lastError);
    }

    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const retryDelayMs = Number.isFinite(retryAfterSeconds)
      ? Math.max(300, retryAfterSeconds * 1000)
      : 400 * Math.pow(2, attempt - 1);

    await sleep(retryDelayMs);
  }

  throw new Error(lastError || "Fetch failed");
}

export { fetchJSON };

export async function getGeneralNewsPage(
  page = 1,
  limit = 20
): Promise<{ items: MarketNewsArticle[]; hasMore: boolean }> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 20;

  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) {
    throw new Error('FINNHUB API key is not configured');
  }

  const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
  const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

  const offset = (safePage - 1) * safeLimit;
  const maxPoolSize = Math.min(Math.max(offset + safeLimit + 20, 80), 200);

  const seen = new Set<string>();
  const unique: RawNewsArticle[] = [];

  for (const art of general || []) {
    if (!validateArticle(art)) continue;
    const key = `${art.id}-${art.url}-${art.headline}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(art);
    if (unique.length >= maxPoolSize) break;
  }

  const formatted = unique.map((a, idx) => formatArticle(a, false, undefined, idx));
  const items = formatted.slice(offset, offset + safeLimit);
  const hasMore = offset + safeLimit < formatted.length;

  return { items, hasMore };
}

async function getToken() {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB API key is not configured");
  return token;
}

export async function getQuote(symbol: string): Promise<FinnhubQuoteResponse | null> {
  try {
    const token = await getToken();
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    return await fetchJSON<FinnhubQuoteResponse>(url, 60);
  } catch (error) {
    console.error("getQuote error:", error);
    return null;
  }
}

export async function getCompanyProfile(symbol: string): Promise<FinnhubProfile2 | null> {
  try {
    const token = await getToken();
    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
    return await fetchJSON<FinnhubProfile2>(url, 1800);
  } catch (error) {
    console.error("getCompanyProfile error:", error);
    return null;
  }
}

export async function getBasicFinancials(symbol: string): Promise<FinnhubMetricMap | null> {
  try {
    const token = await getToken();
    const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
    const data = await fetchJSON<FinnhubBasicFinancialsResponse>(url, 3600);
    return data.metric || null;
  } catch (error) {
    console.error("getBasicFinancials error:", error);
    return null;
  }
}

export async function getMarketRegimeSnapshot() {
  try {
    const [spy, qqq, vix] = await Promise.all([getQuote("SPY"), getQuote("QQQ"), getQuote("VIX")]);

    const spyDp = typeof spy?.dp === "number" ? spy.dp : 0;
    const qqqDp = typeof qqq?.dp === "number" ? qqq.dp : 0;
    const vixLevel = typeof vix?.c === "number" ? vix.c : null;

    const avgRiskAssetMove = (spyDp + qqqDp) / 2;
    const lowVol = vixLevel !== null ? vixLevel < 18 : false;
    const highVol = vixLevel !== null ? vixLevel > 24 : false;

    let regime: "risk_on" | "neutral" | "risk_off" = "neutral";
    let summary = "Mixed tape. Selective risk with disciplined position sizing.";

    if (avgRiskAssetMove > 0.5 && lowVol) {
      regime = "risk_on";
      summary = "Risk-on regime: broad participation with contained volatility.";
    } else if (avgRiskAssetMove < -0.5 || highVol) {
      regime = "risk_off";
      summary = "Risk-off regime: defensive positioning favored due to weak breadth/volatility.";
    }

    return {
      regime,
      summary,
      spyDp,
      qqqDp,
      vix: vixLevel,
      updatedAt: Date.now(),
    };
  } catch (error) {
    console.error("getMarketRegimeSnapshot error:", error);
    return {
      regime: "neutral" as const,
      summary: "Regime data temporarily unavailable.",
      spyDp: 0,
      qqqDp: 0,
      vix: null,
      updatedAt: Date.now(),
    };
  }
}

export async function getAlertBacktestStats(
  symbol: string,
  ruleType: "price_upper" | "price_lower" | "percent_move" | "volume_spike" | "gap_up" | "gap_down",
  threshold: number,
  lookbackDays = 30
) {
  try {
    const token = await getToken();
    const now = Math.floor(Date.now() / 1000);
    const from = now - lookbackDays * 24 * 60 * 60;
    const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${now}&token=${token}`;
    const candles = await fetchJSON<FinnhubCandleResponse>(url, 3600);

    if (candles.s !== "ok" || !candles.c || !candles.o || !candles.h || !candles.l || !candles.v || !candles.t) {
      return { totalDays: 0, hitDays: 0, hitRate: 0, lastHitDate: null as string | null };
    }

    const totalDays = candles.c.length;
    let hitDays = 0;
    let lastHitIdx = -1;

    for (let i = 0; i < totalDays; i++) {
      const close = candles.c[i];
      const open = candles.o[i];
      const high = candles.h[i];
      const low = candles.l[i];
      const volume = candles.v[i];
      const prevClose = i > 0 ? candles.c[i - 1] : close;

      const dayPercentMove = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
      const gapPercent = prevClose ? ((open - prevClose) / prevClose) * 100 : 0;

      let hit = false;
      switch (ruleType) {
        case "price_upper":
          hit = high >= threshold;
          break;
        case "price_lower":
          hit = low <= threshold;
          break;
        case "percent_move":
          hit = Math.abs(dayPercentMove) >= Math.abs(threshold);
          break;
        case "volume_spike": {
          const start = Math.max(0, i - 5);
          const prior = candles.v.slice(start, i);
          const avg = prior.length > 0 ? prior.reduce((a, b) => a + b, 0) / prior.length : volume;
          hit = avg > 0 ? volume >= avg * threshold : false;
          break;
        }
        case "gap_up":
          hit = gapPercent >= threshold;
          break;
        case "gap_down":
          hit = gapPercent <= -Math.abs(threshold);
          break;
      }

      if (hit) {
        hitDays += 1;
        lastHitIdx = i;
      }
    }

    const hitRate = totalDays > 0 ? (hitDays / totalDays) * 100 : 0;
    const lastHitDate =
      lastHitIdx >= 0 && candles.t[lastHitIdx]
        ? new Date(candles.t[lastHitIdx] * 1000).toISOString()
        : null;

    return { totalDays, hitDays, hitRate, lastHitDate };
  } catch (error) {
    console.error("getAlertBacktestStats error:", error);
    return { totalDays: 0, hitDays: 0, hitRate: 0, lastHitDate: null as string | null };
  }
}

export type ComparisonSnapshot = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  changePercent: number;
  marketCap: number | null;
  pe: number | null;
  volume: number | null;
};

export async function getComparisonSnapshot(symbols: string[], maxSymbols = 4): Promise<ComparisonSnapshot[]> {
  const cap = Math.max(1, Math.min(maxSymbols, 200));
  const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, cap);
  if (clean.length === 0) return [];

  const rows: ComparisonSnapshot[] = [];
  const batchSize = 5;

  for (let i = 0; i < clean.length; i += batchSize) {
    const batch = clean.slice(i, i + batchSize);
    const batchRows = await Promise.all(
      batch.map(async (symbol) => {
        const [quote, profile, metrics] = await Promise.all([
          getQuote(symbol),
          getCompanyProfile(symbol),
          getBasicFinancials(symbol),
        ]);

        const peCandidate = metrics?.peNormalizedAnnual ?? metrics?.peTTM ?? null;
        const pe = typeof peCandidate === "number" ? peCandidate : null;
        const volumeCandidate = metrics?.["10DayAverageTradingVolume"] ?? null;
        const volume = typeof volumeCandidate === "number" ? volumeCandidate : null;

        return {
          symbol,
          company: profile?.name || symbol,
          sector: profile?.finnhubIndustry || "Unknown",
          price: typeof quote?.c === "number" ? quote.c : 0,
          changePercent: typeof quote?.dp === "number" ? quote.dp : 0,
          marketCap: typeof profile?.marketCapitalization === "number" ? profile.marketCapitalization * 1_000_000 : null,
          pe,
          volume,
        } as ComparisonSnapshot;
      })
    );

    rows.push(...batchRows);

    // Small pacing delay between batches to avoid API burst limits.
    if (i + batchSize < clean.length) {
      await sleep(200);
    }
  }

  return rows
    .filter((row) => row.price > 0)
    .sort((a, b) => {
      const aCap = a.marketCap ?? -1;
      const bCap = b.marketCap ?? -1;
      return bCap - aCap;
    });
}

export async function getScreenerUniverse(limit = 40): Promise<ComparisonSnapshot[]> {
  const size = Math.max(10, Math.min(limit, 60));
  const symbols = POPULAR_STOCK_SYMBOLS.slice(0, size);
  return getComparisonSnapshot(symbols, size);
}

type FinnhubEarningsItem = {
  date?: string;
  symbol?: string;
  epsEstimate?: number;
  revenueEstimate?: number;
};

type FinnhubEarningsResponse = {
  earningsCalendar?: FinnhubEarningsItem[];
};

function normalizeSymbolForEarningsMatch(input: string): string {
  const raw = (input || "").trim().toUpperCase();
  if (!raw) return "";

  // Handle "NASDAQ:AAPL" -> "AAPL"
  const withoutPrefix = raw.includes(":") ? raw.split(":").pop() || "" : raw;
  // Handle "AAPL.NS" -> "AAPL"
  const withoutSuffix = withoutPrefix.includes(".") ? withoutPrefix.split(".")[0] : withoutPrefix;

  return withoutSuffix.replace(/[^A-Z0-9-]/g, "");
}

export async function getUpcomingEarnings(symbols?: string[]): Promise<Array<{
  date: string;
  symbol: string;
  epsEstimate?: number;
  revenueEstimate?: number;
}>> {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) return [];

    const today = new Date();
    const from = today.toISOString().split("T")[0];
    const toDate = new Date(today);
    toDate.setDate(today.getDate() + 45);
    const to = toDate.toISOString().split("T")[0];

    const url = `${FINNHUB_BASE_URL}/calendar/earnings?from=${from}&to=${to}&token=${token}`;
    const data = await fetchJSON<FinnhubEarningsResponse>(url, 3600);
    const list = Array.isArray(data.earningsCalendar) ? data.earningsCalendar : [];

    const symbolSet = new Set(
      (symbols || [])
        .flatMap((s) => {
          const upper = s.trim().toUpperCase();
          const normalized = normalizeSymbolForEarningsMatch(s);
          return [upper, normalized].filter(Boolean);
        })
        .filter(Boolean)
    );

    return list
      .filter((item) => item.date && item.symbol)
      .filter((item) => {
        if (symbolSet.size === 0) return true;
        const raw = String(item.symbol).toUpperCase();
        const normalized = normalizeSymbolForEarningsMatch(raw);
        return symbolSet.has(raw) || symbolSet.has(normalized);
      })
      .sort((a, b) => {
        const aTs = new Date(String(a.date)).getTime();
        const bTs = new Date(String(b.date)).getTime();
        return aTs - bTs;
      })
      .slice(0, 100)
      .map((item) => ({
        date: String(item.date),
        symbol: String(item.symbol).toUpperCase(),
        epsEstimate: typeof item.epsEstimate === "number" ? item.epsEstimate : undefined,
        revenueEstimate: typeof item.revenueEstimate === "number" ? item.revenueEstimate : undefined,
      }));
  } catch (error) {
    console.error("getUpcomingEarnings error:", error);
    return [];
  }
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: SearchResultWithExchange[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<FinnhubProfile2>(url, 3600);
            return { sym, profile };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null as FinnhubProfile2 | null };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: SearchResultWithExchange = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
            __exchange: exchange,
          };
          return r;
        })
        .filter((x): x is SearchResultWithExchange => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? (data.result as SearchResultWithExchange[]) : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = r.__exchange;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});
