import { useEffect, useRef } from "react";
import {
  computeC123,
  type Bar,
  type Inputs,
} from "../indecators/fractalIndecator";
import { renderC123, clearC123 } from "../tv/FractalOverlay";

export function useC123(chart: any, bars: Bar[], inputs: Inputs) {
  const seen = useRef(0);

  useEffect(() => {
    if (!chart || !bars?.length) return;
    if (bars.length === seen.current) return;
    seen.current = bars.length;

    // Keep last N bars for perf
    const lft = bars.slice(-1200);
    const out = computeC123(lft, inputs);
    renderC123(chart, out, lft);
  }, [chart, bars, inputs]);
}

export function useClearC123OnUnmount() {
  useEffect(
    () => () => {
      clearC123();
    },
    []
  );
}
