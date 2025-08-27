import type { TTradeSignals } from "../model/ttrades";

type Chart = any;
type Shape = any;
const ent = new Map<string, Shape>();
const sec = (ms: number) => Math.floor(ms / 1000);
const key = (...p: (string | number)[]) => p.join("|");

export function clearOverlay() {
  for (const [, s] of ent) {
    try {
      s.remove?.();
    } catch {}
  }
  ent.clear();
}

export function renderTTrade(
  chart: Chart,
  sig: TTradeSignals,
  style?: {
    colors?: {
      fractalHigh?: string;
      fractalLow?: string;
      sweepEH?: string;
      sweepEL?: string;
      bullOB?: string;
      bearOB?: string;
      eq?: string;
    };
  }
) {
  const colors = {
    fractalHigh: "#ef4444",
    fractalLow: "#10b981",
    sweepEH: "#93c5fd",
    sweepEL: "#fbcfe8",
    bullOB: "#22c55e",
    bearOB: "#ef4444",
    eq: "#eab308",
    ...(style?.colors || {}),
  };

  for (const f of sig.fractals) {
    const k = key("fr", f.time, f.kind, f.depth);
    if (ent.has(k)) continue;
    const shape = chart.createMultipointShape(
      [{ time: sec(f.time), price: f.price }],
      {
        shape: f.kind === "high" ? "arrow_down" : "arrow_up",
        text: `C${f.depth}`,
        disableSelection: true,
        overrides: {
          color: f.kind === "high" ? colors.fractalHigh : colors.fractalLow,
          fontsize: 12,
        },
      }
    );
    ent.set(k, shape);
  }

  for (const s of sig.sweeps) {
    const k = key("sw", s.timeA, s.timeB, s.kind);
    if (ent.has(k)) continue;
    const shape = chart.createMultipointShape(
      [
        { time: sec(s.timeA), price: s.level },
        { time: sec(s.timeB), price: s.level },
      ],
      {
        shape: "trend_line",
        disableSelection: true,
        overrides: {
          color: s.kind === "equalHighs" ? colors.sweepEH : colors.sweepEL,
          linewidth: 1,
          linestyle: 1,
        },
      }
    );
    ent.set(k, shape);
  }

  for (const ob of sig.orderBlocks) {
    const k = key("ob", ob.timeStart, ob.timeEnd, ob.dir);
    if (ent.has(k)) continue;
    const shape = chart.createMultipointShape(
      [
        { time: sec(ob.timeStart), price: ob.high },
        { time: sec(ob.timeStart), price: ob.low },
        { time: sec(ob.timeEnd), price: ob.low },
        { time: sec(ob.timeEnd), price: ob.high },
      ],
      {
        shape: "rectangle",
        filled: true,
        disableSelection: true,
        overrides: {
          color: ob.dir === "bull" ? colors.bullOB : colors.bearOB,
          backgroundColor:
            ob.dir === "bull" ? "rgba(34,197,94,.10)" : "rgba(239,68,68,.10)",
          linewidth: 1,
        },
      }
    );
    ent.set(k, shape);
  }

  if (sig.equilibrium) {
    const k = key("eq", sig.equilibrium.time);
    if (!ent.has(k)) {
      const t = sig.equilibrium.time;
      const shape = chart.createMultipointShape(
        [
          { time: sec(t - 60_000), price: sig.equilibrium.level },
          { time: sec(t + 60_000), price: sig.equilibrium.level },
        ],
        {
          shape: "trend_line",
          disableSelection: true,
          overrides: { color: colors.eq, linewidth: 2 },
        }
      );
      ent.set(k, shape);
    }
  }
}
