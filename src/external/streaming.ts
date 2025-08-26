// import { parseFullSymbol } from './helpers'
// import { normalizeResolution, getWebSocketURL } from './config'

// type SubCb = (bar: any) => void
// const sockets: Record<string, WebSocket> = {}

// export function subscribeOnStream(
//   symbolInfo: any,
//   resolution: string,
//   onRealtimeCallback: SubCb,
//   subscriberUID: string,
//   onResetCacheNeededCallback: () => void,
//   lastBar: any
// ) {
//   // Minimal stub that simulates ticks (replace with real WS if you have one)
//   const wsUrl = getWebSocketURL()
//   try { sockets[subscriberUID]?.close() } catch {}
//   // NOTE: Using a timer instead of WS to keep example self-running
//   const int = setInterval(() => {
//     const lastTime = lastBar?.time || Math.floor(Date.now()/1000)
//     const nextTime = lastTime + 60 // fake 1min
//     const close = (lastBar?.close || 100) + (Math.random()-0.5)*0.5
//     const high = Math.max(close, (lastBar?.close || 100)) + Math.random()*0.3
//     const low  = Math.min(close, (lastBar?.close || 100)) - Math.random()*0.3
//     const bar = { time: nextTime, open: lastBar?.close || close, high, low, close, volume: Math.floor(100+Math.random()*100) }
//     onRealtimeCallback(bar)
//     lastBar = bar
//   }, 1500) as unknown as any
//   sockets[subscriberUID] = { close(){ clearInterval(int) } } as any
// }

// export function unsubscribeFromStream(subscriberUID: string) {
//   try { sockets[subscriberUID]?.close() } catch {}
//   delete sockets[subscriberUID]
// }

import { normalizeResolution, getWebSocketURL } from "./config";

type SubCb = (bar: {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}) => void;

type SubKey = string; // `${symbol}|${resolution}`

/** Keep one socket to your WS endpoint. */
let ws: WebSocket | null = null;
let isOpen = false;
let reconnectTimer: any = null;

/** Per sub: latest bar we’re building (for trade/tick style feeds) */
const builders = new Map<
  SubKey,
  {
    lastBar: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    } | null;
    cb: SubCb;
  }
>();

/** Track reference counts so we only unsubscribe when last listener leaves. */
const refs = new Map<SubKey, number>();

/** Convert TV resolution string to seconds (e.g., '1', '5', '60', '1D'). */
function resToSec(resolution: string): number {
  const r = normalizeResolution(resolution);
  if (r.endsWith("D")) return parseInt(r) * 86400;
  if (r.endsWith("W")) return parseInt(r) * 7 * 86400;
  if (r.endsWith("M")) return parseInt(r) * 30 * 86400;
  return parseInt(r, 10) * 60;
}

/** Round a unix-seconds timestamp to the start of the current bar. */
function floorToBarStart(tsSec: number, stepSec: number): number {
  return Math.floor(tsSec / stepSec) * stepSec;
}

/** ---- Adjust these to match your server protocol ---- */

/** What to send to subscribe/unsubscribe. */
function buildSubscribeMessage(symbol: string, resolution: string) {
  // Example generic: { action:'subscribe', channel:'kline', symbol, interval: '1m' }
  return JSON.stringify({
    action: "subscribe",
    channel: "kline", // or 'trades' depending on your backend
    symbol,
    interval: normalizeResolution(resolution), // e.g. '1', '5', '1D' -> adapt if server expects '1m','5m','1d'
  });
}
function buildUnsubscribeMessage(symbol: string, resolution: string) {
  return JSON.stringify({
    action: "unsubscribe",
    channel: "kline",
    symbol,
    interval: normalizeResolution(resolution),
  });
}

/**
 * Parse an incoming WS message into either:
 *  - a complete/partial candle (preferred), or
 *  - a trade tick we aggregate locally.
 *
 * Return **one of**:
 *  { type: 'kline', t: seconds, o,h,l,c, v, isFinal?: boolean }
 *  { type: 'trade', t: seconds, price: number, size?: number }
 */
function parseMessage(ev: MessageEvent):
  | null
  | (
      | {
          type: "kline";
          t: number;
          o: number;
          h: number;
          l: number;
          c: number;
          v?: number;
          isFinal?: boolean;
          symbol?: string;
          interval?: string;
        }
      | {
          type: "trade";
          t: number;
          price: number;
          size?: number;
          symbol?: string;
        }
    ) {
  try {
    const data = JSON.parse(
      typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data)
    );

    // ---- Example 1: Binance-like kline payload ----
    // if (data.e === 'kline' && data.k) {
    //   return {
    //     type: 'kline',
    //     t: Math.floor(data.k.t / 1000),  // start time (sec)
    //     o: parseFloat(data.k.o),
    //     h: parseFloat(data.k.h),
    //     l: parseFloat(data.k.l),
    //     c: parseFloat(data.k.c),
    //     v: parseFloat(data.k.v),
    //     isFinal: !!data.k.x,
    //     symbol: data.s,
    //     interval: data.k.i,
    //   };
    // }

    // ---- Example 2: generic candle ----
    if (data.type === "kline" || data.type === "candle") {
      return {
        type: "kline",
        t: (data.t ?? data.time) as number, // seconds
        o: data.o,
        h: data.h,
        l: data.l,
        c: data.c,
        v: data.v,
        isFinal: Boolean(data.isFinal),
        symbol: data.symbol,
        interval: data.interval,
      };
    }

    // ---- Example 3: trade tick ----
    if (data.type === "trade") {
      return {
        type: "trade",
        t: Math.floor(Number(data.ts ?? data.t ?? Date.now()) / 1000),
        price: Number(data.price),
        size: Number(data.size ?? data.q ?? 0),
        symbol: data.symbol,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/** --------------------------------------------------- */

function ensureSocket() {
  if (
    ws &&
    (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
  )
    return;

  if (ws) {
    try {
      ws.close();
    } catch {}
  }

  ws = new WebSocket(getWebSocketURL());
  isOpen = false;

  ws.onopen = () => {
    ws?.send(
      JSON.stringify({
        action: "authenticate",
        token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2F3c3Rlc3R0cC40eGJyb2tlcnMuY29tIiwiaWF0IjoxNzU2MjEzMzkxLCJleHAiOjE3NTYyMTM0NTEsIm5iZiI6MTc1NjIxMzM5MSwianRpIjoiamJQbHdIMkNwMkU5bUg1VSIsInN1YiI6IjUiLCJwcnYiOiJkYTA0N2M4NTczYmJkZDcyYjQwY2YyOWRiMWZiNDk5OTc5MDhiOWZlIiwidXNlcl9pZCI6NX0.18CmGhK3eoo3EuZZaNHz0hpsKMJtk_3M-eDvG1s8P0Y",
        account_id: "1",
      })
    );
    isOpen = true;
    // re-subscribe all active channels on reconnect
    for (const key of builders.keys()) {
      const [symbol, resolution] = key.split("|");
      try {
        ws!.send(buildSubscribeMessage(symbol, resolution));
      } catch {}
    }
  };

  ws.onmessage = (ev) => {
    const msg = parseMessage(ev);
    if (!msg) return;

    if (msg.type === "kline") {
      // Already aggregated candle — just forward as TV bar
      const bar = {
        time: msg.t * 1000,
        open: msg.o,
        high: msg.h,
        low: msg.l,
        close: msg.c,
        volume: msg.v ?? 0,
      };

      // If server includes symbol/interval, route by that; otherwise broadcast to all
      if (msg.symbol && msg.interval) {
        const keyExact = `${msg.symbol}|${msg.interval}`;
        const builder = builders.get(keyExact);
        if (builder) builder.cb(bar);
      } else {
        // broadcast to all subscribers (less optimal but safe fallback)
        builders.forEach(({ cb }) => cb(bar));
      }

      return;
    }

    if (msg.type === "trade") {
      // Aggregate into current bar per subscription key
      const nowSec = msg.t;
      for (const [key, state] of builders) {
        const [, res] = key.split("|");
        const step = resToSec(res);
        const bucket = floorToBarStart(nowSec, step) * 1000; // ms

        if (!state.lastBar || state.lastBar.time !== bucket) {
          // new bar
          const bar = {
            time: bucket,
            open: state.lastBar ? state.lastBar.close : msg.price,
            high: msg.price,
            low: msg.price,
            close: msg.price,
            volume: msg.size ?? 0,
          };
          state.lastBar = bar;
          state.cb(bar);
        } else {
          // update bar
          const b = state.lastBar;
          b.high = Math.max(b.high, msg.price);
          b.low = Math.min(b.low, msg.price);
          b.close = msg.price;
          b.volume = (b.volume ?? 0) + (msg.size ?? 0);
          state.cb({ ...b });
        }
      }
    }
  };

  ws.onclose = () => {
    isOpen = false;
    // attempt reconnect with simple backoff
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => ensureSocket(), 1500);
  };

  ws.onerror = () => {
    try {
      ws?.close();
    } catch {}
  };
}

export function subscribeOnStream(
  symbolInfo: any,
  resolution: string,
  onRealtimeCallback: SubCb,
  subscriberUID: string,
  _onResetCacheNeededCallback: () => void,
  lastBar: any
) {
  const res = normalizeResolution(resolution);
  const key: SubKey = `${symbolInfo.ticker || symbolInfo.name || symbolInfo.full_name}|${res}`;

  // store listener / last bar (used if server only pushes trades)
  builders.set(key, {
    lastBar: lastBar
      ? {
          time: lastBar.time,
          open: lastBar.open,
          high: lastBar.high,
          low: lastBar.low,
          close: lastBar.close,
          volume: lastBar.volume ?? 0,
        }
      : null,
    cb: onRealtimeCallback,
  });

  refs.set(key, (refs.get(key) || 0) + 1);

  ensureSocket();

  // send subscribe when socket is ready (or onopen will re-send all)
  if (isOpen) {
    try {
      ws!.send(buildSubscribeMessage(symbolInfo.ticker, res));
    } catch {}
  }
}

export function unsubscribeFromStream(subscriberUID: string) {
  // We don’t get the key back directly from UID in this simplified version,
  // so callers should pass a (symbol,resolution) aware UID OR we remove all.
  // If you already track subscriberUID -> (symbol,res), replace this logic.
  // Here we’ll unsubscribe everything for safety (adjust to your app’s tracker).
  for (const [key, count] of refs) {
    const left = count - 1;
    if (left <= 0) {
      refs.delete(key);
      const [symbol, res] = key.split("|");
      if (isOpen) {
        try {
          ws?.send(buildUnsubscribeMessage(symbol, res));
        } catch {}
      }
      builders.delete(key);
    } else {
      refs.set(key, left);
    }
  }
  // optional: close socket if nothing left
  if (refs.size === 0 && ws) {
    try {
      ws.close();
    } catch {}
    ws = null;
  }
}
