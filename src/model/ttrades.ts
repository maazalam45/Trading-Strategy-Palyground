export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
export type Fractal = {
  time: number;
  price: number;
  kind: "high" | "low";
  depth: 2 | 3 | 4;
};
export type Sweep = {
  timeA: number;
  timeB: number;
  kind: "equalHighs" | "equalLows";
  level: number;
};
export type OrderBlock = {
  timeStart: number;
  timeEnd: number;
  high: number;
  low: number;
  dir: "bull" | "bear";
};
export type TTradeSignals = {
  fractals: Fractal[];
  sweeps: Sweep[];
  orderBlocks: OrderBlock[];
  equilibrium?: { time: number; level: number };
};

const nearEq = (a: number, b: number, t = 1e-4) => Math.abs(a - b) <= t;
const body = (b: Bar) => Math.abs(b.close - b.open);

export function computeFractals(bars: Bar[], depth: 2 | 3 | 4): Fractal[] {
  const out: Fractal[] = [];
  const n = bars.length;
  const d = depth;
  for (let i = d; i < n - d; i++) {
    const c = bars[i];
    let isH = true,
      isL = true;
    for (let k = 1; k <= d; k++) {
      if (!(bars[i - k].high < c.high && bars[i + k].high < c.high))
        isH = false;
      if (!(bars[i - k].low > c.low && bars[i + k].low > c.low)) isL = false;
      if (!isH && !isL) break;
    }
    if (isH) out.push({ time: c.time, price: c.high, kind: "high", depth });
    if (isL) out.push({ time: c.time, price: c.low, kind: "low", depth });
  }
  return out;
}

export function computeSweeps(fr: Fractal[], tol = 0.0002): Sweep[] {
  const out: Sweep[] = [];
  const highs = fr
    .filter((f) => f.kind === "high")
    .sort((a, b) => a.time - b.time);
  const lows = fr
    .filter((f) => f.kind === "low")
    .sort((a, b) => a.time - b.time);
  for (let i = 1; i < highs.length; i++)
    if (nearEq(highs[i].price, highs[i - 1].price, tol))
      out.push({
        kind: "equalHighs",
        timeA: highs[i - 1].time,
        timeB: highs[i].time,
        level: (highs[i].price + highs[i - 1].price) / 2,
      });
  for (let i = 1; i < lows.length; i++)
    if (nearEq(lows[i].price, lows[i - 1].price, tol))
      out.push({
        kind: "equalLows",
        timeA: lows[i - 1].time,
        timeB: lows[i].time,
        level: (lows[i].price + lows[i - 1].price) / 2,
      });
  return out;
}

export function computeOrderBlocks(
  bars: Bar[],
  minBodyPct = 0.3
): OrderBlock[] {
  const out: OrderBlock[] = [];
  for (let i = 2; i < bars.length; i++) {
    const b1 = bars[i - 1],
      b2 = bars[i];
    const range = Math.max(b1.high, b2.high) - Math.min(b1.low, b2.low) || 1;
    if (
      b1.close > b1.open &&
      b2.close > b2.open &&
      body(b1) / range > minBodyPct &&
      body(b2) / range > minBodyPct
    ) {
      for (let j = Math.max(0, i - 6); j < i; j++) {
        const c = bars[j];
        if (c.close < c.open) {
          out.push({
            dir: "bull",
            timeStart: c.time,
            timeEnd: b1.time,
            high: c.high,
            low: c.low,
          });
          break;
        }
      }
    }
    if (
      b1.close < b1.open &&
      b2.close < b2.open &&
      body(b1) / range > minBodyPct &&
      body(b2) / range > minBodyPct
    ) {
      for (let j = Math.max(0, i - 6); j < i; j++) {
        const c = bars[j];
        if (c.close > c.open) {
          out.push({
            dir: "bear",
            timeStart: c.time,
            timeEnd: b1.time,
            high: c.high,
            low: c.low,
          });
          break;
        }
      }
    }
  }
  return out;
}

export function computeEquilibrium(bars: Bar[], lookback = 50) {
  if (!bars.length) return undefined;
  const start = Math.max(0, bars.length - lookback);
  let hi = -Infinity,
    lo = Infinity;
  for (let i = start; i < bars.length; i++) {
    hi = Math.max(hi, bars[i].high);
    lo = Math.min(lo, bars[i].low);
  }
  return { time: bars[bars.length - 1].time, level: (hi + lo) / 2 };
}

export function computeTTradeSignals(
  bars: Bar[],
  depth: 2 | 3 | 4
): TTradeSignals {
  const fractals = computeFractals(bars, depth);
  const sweeps = computeSweeps(fractals);
  const orderBlocks = computeOrderBlocks(bars);
  const equilibrium = computeEquilibrium(bars);
  return { fractals, sweeps, orderBlocks, equilibrium };
}
