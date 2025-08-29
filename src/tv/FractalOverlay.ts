import { Outputs } from "../indecators/fractalIndecator";

type Chart = any;
type Shape = any;

const ent = new Map<string, Shape>();
const sec = (ms: number) => Math.floor(ms / 1000);
const k = (...p: (string | number)[]) => p.join("|");

function drawLine(
  chart: any,
  p1: { t: number; price: number },
  p2: { t: number; price: number },
  color: string,
  width = 2,
  style = 0
) {
  const opts = {
    shape: "trend_line",
    disableSelection: true,
    overrides: { color, linewidth: width, linestyle: style },
  };
  if (typeof chart?.createMultipointShape === "function") {
    return chart.createMultipointShape(
      [
        { time: p1.t, price: p1.price },
        { time: p2.t, price: p2.price },
      ],
      opts
    );
  }
  if (typeof chart?.createShape === "function") {
    return chart.createShape(
      [
        { time: p1.t, price: p1.price },
        { time: p2.t, price: p2.price },
      ],
      opts
    );
  }
  console.error("[c123Overlay] shapes API not found");
  return null;
}

function drawBox(
  chart: any,
  leftSec: number,
  rightSec: number,
  top: number,
  bottom: number,
  color = "rgba(148,163,184,.85)"
) {
  const opts = {
    shape: "rectangle",
    disableSelection: true,
    filled: true,
    overrides: { color: "#94a3b8", backgroundColor: color, linewidth: 1 },
  };
  if (typeof chart?.createMultipointShape === "function") {
    return chart.createMultipointShape(
      [
        { time: leftSec, price: top },
        { time: leftSec, price: bottom },
        { time: rightSec, price: bottom },
        { time: rightSec, price: top },
      ],
      opts
    );
  }
  if (typeof chart?.createShape === "function") {
    return chart.createShape(
      [
        { time: leftSec, price: top },
        { time: leftSec, price: bottom },
        { time: rightSec, price: bottom },
        { time: rightSec, price: top },
      ],
      opts
    );
  }
  return null;
}

export function clearC123() {
  for (const [, s] of ent)
    try {
      s.remove?.();
    } catch {}
  ent.clear();
}

/** Render/update overlays using the computed outputs + latest bars window */
export function renderC123(
  chart: any,
  out: Outputs,
  bars: { time: number; close: number }[]
) {
  if (!bars.length) return;
  const last = bars[bars.length - 1];
  const t = sec(last.time);

  // Midline (C2 50%)
  if (out.midC2 != null) {
    const id = k("mid", t);
    if (!ent.has(id)) {
      const s = drawLine(
        chart,
        { t: t - 3600, price: out.midC2 },
        { t: t + 3600, price: out.midC2 },
        "#f59e0b",
        2,
        0
      );
      if (s) ent.set(id, s);
    }
  }

  // T-zone box (live updating on each bar)
  if (out.zoneTop != null && out.zoneBot != null) {
    const startSec = sec(out.tzStartTimeMs ?? bars[0].time);
    const boxId = k("tz", startSec);
    const right = t;
    // delete/replace on new HTF bar
    if (out.newHtfBar && ent.has(boxId)) {
      try {
        ent.get(boxId)?.remove?.();
      } catch {}
      ent.delete(boxId);
    }
    if (!ent.has(boxId)) {
      const s = drawBox(
        chart,
        startSec,
        right,
        out.zoneTop,
        out.zoneBot,
        "rgba(148,163,184,.85)"
      );
      if (s) ent.set(boxId, s);
    } else {
      // no direct resize API across builds -> recreate each call:
      try {
        ent.get(boxId)?.remove?.();
      } catch {}
      ent.delete(boxId);
      const s = drawBox(
        chart,
        startSec,
        right,
        out.zoneTop,
        out.zoneBot,
        "rgba(148,163,184,.85)"
      );
      if (s) ent.set(boxId, s);
    }
  }

  // Signals L/S (triangles)
  if (out.longSig) {
    const id = k("sigL", last.time);
    if (!ent.has(id)) {
      const s =
        chart.createMultipointShape?.([{ time: t, price: last.close }], {
          shape: "arrow_up",
          text: "L",
          disableSelection: true,
          overrides: { color: "#10b981", fontsize: 12 },
        }) ??
        chart.createShape?.([{ time: t, price: last.close }], {
          shape: "arrow_up",
          text: "L",
          disableSelection: true,
          overrides: { color: "#10b981", fontsize: 12 },
        });
      if (s) ent.set(id, s);
    }
  }
  if (out.shortSig) {
    const id = k("sigS", last.time);
    if (!ent.has(id)) {
      const s =
        chart.createMultipointShape?.([{ time: t, price: last.close }], {
          shape: "arrow_down",
          text: "S",
          disableSelection: true,
          overrides: { color: "#ef4444", fontsize: 12 },
        }) ??
        chart.createShape?.([{ time: t, price: last.close }], {
          shape: "arrow_down",
          text: "S",
          disableSelection: true,
          overrides: { color: "#ef4444", fontsize: 12 },
        });
      if (s) ent.set(id, s);
    }
  }

  // Bias labels & invalidations (simple tags near zone)
  if (out.bullInvalid || out.bearInvalid) {
    const id = k("inv", t, out.bullInvalid ? "BULL" : "BEAR");
    if (!ent.has(id)) {
      const s = chart.createMultipointShape?.(
        [
          {
            time: t,
            price: out.bullInvalid
              ? (out.zoneBot ?? last.close)
              : (out.zoneTop ?? last.close),
          },
        ],
        {
          shape: "text",
          text: out.bullInvalid ? "Bull invalidation" : "Bear invalidation",
          disableSelection: true,
          overrides: { color: "#f97316", fontsize: 12 },
        }
      );
      if (s) ent.set(id, s);
    }
  }

  if (out.newHtfBar) {
    const id = k(
      "bias",
      t,
      out.bullBias ? "BULL" : out.bearBias ? "BEAR" : "NEUTRAL"
    );
    if (!ent.has(id)) {
      const color = out.bullBias
        ? "#10b981"
        : out.bearBias
          ? "#ef4444"
          : "#94a3b8";
      const s = chart.createMultipointShape?.(
        [{ time: t, price: out.zoneTop ?? last.close }],
        {
          shape: "text",
          text: out.bullBias
            ? "Bias: BULL"
            : out.bearBias
              ? "Bias: BEAR"
              : "Bias: NEUTRAL",
          disableSelection: true,
          overrides: { color, fontsize: 12 },
        }
      );
      if (s) ent.set(id, s);
    }
  }
}
