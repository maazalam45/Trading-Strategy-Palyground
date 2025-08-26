import { getCandleURL, getSymbolDetailsURL } from "./config";

export async function getBarsApiRequest(
  path: string,
  type: "hist"
): Promise<any> {
  const url = getCandleURL(type, path);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function getSymbolDetailsApiRequest(symbol: string): Promise<any> {
  const r = await fetch(getSymbolDetailsURL(symbol));
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export function parseFullSymbol(fullSymbol: string) {
  // try formats like "EURUSD" or "EUR/USD"
  const m = fullSymbol.match(/^([A-Za-z]{3,4})(?:\/)?([A-Za-z]{3,4})$/);
  if (!m) return null;
  return { fromSymbol: m[1], toSymbol: m[2] };
}

export function getLanguageFromURL() {
  try {
    const m = location.search.match(/[?&]lang=([^&#]*)/);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  } catch {
    return null;
  }
}
