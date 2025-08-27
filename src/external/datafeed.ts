import {
  parseFullSymbol,
  getBarsApiRequest,
  getSymbolDetailsApiRequest,
} from "./helpers";
import { normalizeResolution } from "./config";
import { subscribeOnStream, unsubscribeFromStream } from "./streaming";
import { splitSymbol } from "../utils";
import { setHistory, upsertRealtime } from "../state/barsStore";

const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "1H", "4H", "1D", "1W", "1M"],
  exchanges: [],
  symbols_types: [
    { name: "crypto", value: "crypto" },
    { name: "fx", value: "forex" },
    { name: "index", value: "index" },
  ],
};

const lastBarsCache = new Map<string, any>();

const Datafeed = {
  onReady: (cb: (c: any) => void) => setTimeout(() => cb(configurationData), 0),
  resolveSymbol: async (
    symbolName: string,
    onResolve: (info: any) => void,
    onError: (err: any) => void
  ) => {
    try {
      // if you have an API, use it; otherwise infer
      const parsed = parseFullSymbol(symbolName) || {
        fromSymbol: symbolName,
        toSymbol: "",
      };
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        full_name: symbolName,
        session: "24x7",
        timezone: "Etc/UTC",
        minmov: 1,
        pricescale: 100000, // 5 dp
        has_intraday: true,
        has_no_volume: false,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 0,
        data_status: "streaming",
        type: "crypto",
        exchange: "DEMO",
      };
      onResolve(symbolInfo);
    } catch (e) {
      onError(e);
    }
  },
  getBars: async (
    symbolInfo: any,
    resolution: string,
    periodParams: { from: number; to: number },
    onHistoryCallback: (bars: any[], meta: any) => void,
    onError: (err: any) => void
  ) => {
    try {
      const res = normalizeResolution(resolution);
      const symbol = splitSymbol(symbolInfo.ticker);
      // const path = `/histo?fsym=${encodeURIComponent(symbolInfo.ticker)}&resolution=${res}&from=${periodParams.from}&to=${periodParams.to}`;
      const path = `/api/candles?fsym=${symbol.fsym}&tsym=${symbol.tsym}&toTs=${periodParams.to}&limit=2000&resolution=${res}&tt=r`;
      const raw = await getBarsApiRequest(path, "hist");
      // Map your backend payload to TV bars
      console.log(raw.bars);
      const bars = raw?.bars.map((b: any) => ({
        time: b.time * 1000,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume ?? 0,
      }));

      if (bars.length)
        lastBarsCache.set(symbolInfo.full_name, bars[bars.length - 1]);
      onHistoryCallback(bars, { noData: bars.length === 0 });

      setHistory(symbolInfo.ticker, res, bars);
    } catch (e) {
      onError(e);
    }
  },

  subscribeBars: (
    symbolInfo: any,
    resolution: string,
    onRealtime: (bar: any) => void,
    subscriberUID: string,
    onReset: () => void
  ) => {
    const res = normalizeResolution(resolution);
    const rtCb = (bar: any) => {
      // bar.time must be ms here (your WS aggregator already builds ms)
      onRealtime(bar);
      upsertRealtime(symbolInfo.ticker, res, bar);
    };
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtime,
      subscriberUID,
      onReset,
      lastBarsCache.get(symbolInfo.full_name)
    );
  },

  unsubscribeBars: (subscriberUID: string) => {
    unsubscribeFromStream(subscriberUID);
  },
};

export default Datafeed;
