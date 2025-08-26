export function splitSymbol(ticker: string): { fsym: string; tsym: string } {
  // Example: "EURUSD" → fsym=EUR, tsym=USD
  if (ticker.length === 6) {
    return { fsym: ticker.slice(0, 3), tsym: ticker.slice(3, 6) };
  }
  // Example: "BTC/USDT" → fsym=BTC, tsym=USDT
  if (ticker.includes("/")) {
    const [fsym, tsym] = ticker.split("/");
    return { fsym, tsym };
  }
  // fallback: whole string as fsym, USD default
  return { fsym: ticker, tsym: "USD" };
}
