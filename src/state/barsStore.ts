// Keep TV-style bars (time in ms) per symbol|resolution
export type TVBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

const key = (s: string, r: string) => `${s}|${r}`;
const store = new Map<string, TVBar[]>();
const listeners = new Set<() => void>();

export function setHistory(symbol: string, res: string, bars: TVBar[]) {
  store.set(
    key(symbol, res),
    bars.slice().sort((a, b) => a.time - b.time)
  );
  emit();
}

export function upsertRealtime(symbol: string, res: string, bar: TVBar) {
  const k = key(symbol, res);
  const arr = store.get(k) ?? [];
  const i = arr.findIndex((b) => b.time === bar.time);
  if (i >= 0) arr[i] = bar;
  else arr.push(bar);
  store.set(k, arr);
  emit();
}

export function getBars(symbol: string, res: string) {
  return store.get(key(symbol, res)) ?? [];
}

export function subscribeBarsStore(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((fn) => fn());
}
