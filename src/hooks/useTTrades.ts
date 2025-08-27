import { useEffect, useRef } from "react";
import { computeTTradeSignals, Bar } from "../model/ttrades";
import { renderTTrade, clearOverlay } from "../tv/overlay";

export function useTTrade(
  chart: any,
  bars: Bar[],
  opts: { depth: 2 | 3 | 4 } = { depth: 2 }
) {
  const lastCount = useRef(0);

  useEffect(() => {
    if (!chart || bars.length === 0) return;
    // recompute only when new bars arrive
    if (bars.length === lastCount.current) return;
    lastCount.current = bars.length;

    const sig = computeTTradeSignals(bars, opts.depth);
    renderTTrade(chart, sig);

    return () => {
      /* keep overlays; they are cumulative */
    };
  }, [chart, bars, opts.depth]);
}

export function useClearTTradeOnUnmount() {
  useEffect(
    () => () => {
      clearOverlay();
    },
    []
  );
}
