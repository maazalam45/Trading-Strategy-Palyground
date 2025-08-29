export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}; // time in ms
export type TF =
  | "1"
  | "3"
  | "5"
  | "15"
  | "30"
  | "60"
  | "120"
  | "240"
  | "D"
  | "W";

export type Inputs = {
  htf: TF; // Higher TF (C1/C2/C3)
  swLen: number; // LTF pivot length
  showZone: boolean;
  showMid: boolean;
  useBody: boolean; // 50% of C2 body else wick range
  showSigs: boolean;
  showLabels: boolean;
};

export type Outputs = {
  // core levels
  zoneTop?: number;
  zoneBot?: number;
  midC2?: number;
  // bias
  bullBias: boolean;
  bearBias: boolean;
  bullInvalid: boolean;
  bearInvalid: boolean;
  // swings
  lastSwingHigh?: number;
  lastSwingLow?: number;
  inZone: boolean;
  // signals (at last bar)
  longSig: boolean;
  shortSig: boolean;
  // anchor info
  newHtfBar: boolean; // just opened a new HTF bar
  tzStartTimeMs?: number; // where the current T-zone box started (ms)
};

/** ------------------- helpers ------------------- */
const tfSec = (tf: TF): number => {
  if (tf === "D") return 86400;
  if (tf === "W") return 7 * 86400;
  return parseInt(tf, 10) * 60; // minutes
};

/** Resample LTF bars to HTF bars (time in ms). Close-open/HL aggregated Pine-style. */
export function resampleHTF(lft: Bar[], tf: TF): Bar[] {
  if (!lft.length) return [];
  const stepMs = tfSec(tf) * 1000;
  const bucket = (t: number) => Math.floor(t / stepMs) * stepMs;

  const out: Bar[] = [];
  let cur: Bar | null = null;
  let curKey = -1;

  for (const b of lft) {
    const k = bucket(b.time);
    if (k !== curKey) {
      if (cur) out.push(cur);
      curKey = k;
      cur = {
        time: k,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume ?? 0,
      };
    } else {
      cur!.high = Math.max(cur!.high, b.high);
      cur!.low = Math.min(cur!.low, b.low);
      cur!.close = b.close;
      cur!.volume = (cur!.volume ?? 0) + (b.volume ?? 0);
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** LTF pivot highs/lows (symmetric length) – returns last swing highs/lows (values). */
export function lastSwings(
  bars: Bar[],
  len: number
): { high?: number; low?: number } {
  if (bars.length < len * 2 + 1) return {};
  const idx = bars.length - len - 1; // pivot center at this index
  const c = bars[idx];

  // high pivot
  let isHigh = true;
  for (let k = 1; k <= len; k++) {
    if (bars[idx - k].high >= c.high || bars[idx + k].high >= c.high) {
      isHigh = false;
      break;
    }
  }

  // low pivot
  let isLow = true;
  for (let k = 1; k <= len; k++) {
    if (bars[idx - k].low <= c.low || bars[idx + k].low <= c.low) {
      isLow = false;
      break;
    }
  }

  return {
    high: isHigh ? c.high : undefined,
    low: isLow ? c.low : undefined,
  };
}

/** Core C1–C2–C3 logic ported from your Pine. */
export function computeC123(lftBars: Bar[], inputs: Inputs): Outputs {
  const { htf, swLen, showZone, showMid, useBody, showSigs, showLabels } =
    inputs;

  const out: Outputs = {
    bullBias: false,
    bearBias: false,
    bullInvalid: false,
    bearInvalid: false,
    inZone: false,
    longSig: false,
    shortSig: false,
    newHtfBar: false,
  };

  if (!lftBars.length) return out;

  const htfBars = resampleHTF(lftBars, htf);
  if (htfBars.length < 3) return out;

  const C3 = htfBars[htfBars.length - 1]; // current (in-progress) HTF bar
  const C2 = htfBars[htfBars.length - 2]; // last closed HTF bar
  const C1 = htfBars[htfBars.length - 3]; // prior closed HTF bar

  // Bias logic (same as Pine)
  const bullBias = C2.close > C2.open || C2.close > C1.high;
  const bearBias = C2.close < C2.open || C2.close < C1.low;

  // 50% of C2
  const midBody = C2.open + (C2.close - C2.open) * 0.5;
  const midWick = (C2.high + C2.low) * 0.5;
  const midC2 = useBody ? midBody : midWick;

  // T-zone: from C3 open to C2 mid
  const zoneTop = Math.max(C3.open, midC2);
  const zoneBot = Math.min(C3.open, midC2);

  // “new HTF bar” if the last LTF bar belongs to a new HTF bucket
  const prevLtf =
    lftBars[lftBars.length - 2]?.time ?? lftBars[lftBars.length - 1].time;
  const stepMs = tfSec(htf) * 1000;
  const isNewBucket =
    Math.floor(lftBars[lftBars.length - 1].time / stepMs) !==
    Math.floor(prevLtf / stepMs);

  // LTF last swings
  const swings = lastSwings(lftBars, swLen);
  const lastSwingHigh = swings.high;
  const lastSwingLow = swings.low;

  // In-zone at last close
  const last = lftBars[lftBars.length - 1];
  const inZone = last.close >= zoneBot && last.close <= zoneTop;

  // Signals (directional break of last minor swing while in zone)
  const longSig =
    showSigs &&
    bullBias &&
    inZone &&
    lastSwingHigh !== undefined &&
    last.close > lastSwingHigh;
  const shortSig =
    showSigs &&
    bearBias &&
    inZone &&
    lastSwingLow !== undefined &&
    last.close < lastSwingLow;

  // Invalidation (optional info)
  const curHtfHigh = C3.high;
  const curHtfLow = C3.low;
  const bullInvalid = bullBias && curHtfLow < C2.low;
  const bearInvalid = bearBias && curHtfHigh > C2.high;

  Object.assign(out, {
    zoneTop: showZone ? zoneTop : undefined,
    zoneBot: showZone ? zoneBot : undefined,
    midC2: showMid ? midC2 : undefined,
    bullBias,
    bearBias,
    bullInvalid,
    bearInvalid,
    lastSwingHigh,
    lastSwingLow,
    inZone,
    longSig,
    shortSig,
    newHtfBar: isNewBucket,
    tzStartTimeMs: isNewBucket ? last.time : undefined,
  });

  return out;
}
