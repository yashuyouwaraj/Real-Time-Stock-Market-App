export type SupportedExchange = "NASDAQ";

const DEFAULT_EXCHANGE: SupportedExchange = "NASDAQ";

function normalizeTradingViewSymbolInput(rawSymbol: string) {
  const trimmed = (rawSymbol || "").trim().toUpperCase();
  const withoutAmpersand = trimmed.replace(/&/g, "");
  const noSpaces = withoutAmpersand.replace(/\s+/g, "");
  return noSpaces.replace(/[^A-Z0-9.\-:]/g, "");
}

export function sanitizeTradingSymbol(rawSymbol: string) {
  const clean = normalizeTradingViewSymbolInput(rawSymbol).replace(/:/g, "");
  return clean || "AAPL";
}

export function createTradingViewSymbol(symbol: string, exchange: SupportedExchange = DEFAULT_EXCHANGE) {
  const raw = normalizeTradingViewSymbolInput(symbol);
  if (/^NASDAQ:[A-Z0-9.\-]{1,20}$/.test(raw)) return raw;

  const safeSymbol = sanitizeTradingSymbol(symbol);
  const candidate = `${exchange}:${safeSymbol}`;
  const valid = /^NASDAQ:[A-Z0-9.\-]{1,20}$/.test(candidate);
  if (valid) return candidate;
  return `${DEFAULT_EXCHANGE}:${safeSymbol}`;
}
