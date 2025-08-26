export type Resolution =
  | "1M"
  | "5M"
  | "15M"
  | "30M"
  | "1H"
  | "4H"
  | "1D"
  | "1W"
  | "1M";

// If you used to compute resolution elsewhere, centralize here:
export function normalizeResolution(res: string): Resolution {
  const map: Record<string, Resolution> = {
    "1": "1M",
    "5": "5M",
    "15": "15M",
    "30": "30M",
    "60": "1H",
    "1H": "1H",
    "120": "4H",
    "240": "4H",
    "1D": "1D",
    D: "1D",
    "1W": "1W",
    W: "1W",
    "1M": "1M",
    M: "1M",
  };
  return (map[res] || "15") as Resolution;
}

// Candle & symbol endpoints centralized (adapt to your backend)
const CANDLE_HOST = "https://candle.4xbrokers.com"; // replace with your host if needed
const UDF_HOST = "https://candles.4xbrokers.com"; // replace with your host

export function getCandleURL(kind: "hist", path: string) {
  // Example: build url using kind/path/resolution etc. Keep simple for now:
  return `${CANDLE_HOST}${path}`;
}

export function getSymbolDetailsURL(symbol: string) {
  return `${UDF_HOST}/udf/get-trading-symbol-details?symbolName=${encodeURIComponent(symbol)}`;
}

export function getWebSocketURL() {
  // If you have a specific WS endpoint, put it here
  return "wss://awstestsocket.4xbrokers.com/";
}

// Symbol formatting if needed
export function formatPair(base: string, quote: string) {
  return `${base}/${quote}`;
}
