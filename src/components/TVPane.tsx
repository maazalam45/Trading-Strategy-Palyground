// import React from 'react'
// import { useTradingView } from '../hooks/useTradingView'

// type Props = { id: string, symbol: string, interval: string }

// export default function TVPane({ id, symbol, interval }: Props) {
//   const { error } = useTradingView(id, symbol, interval)

//   return (
//     <div className="cell">
//       <div className="header">
//         <span className="pill">{symbol}</span>
//         <span className="pill">{interval}</span>
//         <span className="pill">Advanced Charts</span>
//       </div>
//       {/* {error && <div className="error">Error: {error}</div>} */}
//       <div id={id} style={{ position: 'absolute', inset: 0,marginTop:"50px" }} />
//     </div>
//   )
// }

// import React, { useEffect, useState } from "react";
// import { useTradingView } from "../hooks/useTradingView";
// import { getBars, subscribeBarsStore } from "../state/barsStore";
// import { useTTrade, useClearTTradeOnUnmount } from "../hooks/useTTrades";

// type Settings = {
//   c2?: boolean;
//   c3?: boolean;
//   c4?: boolean;
//   // add other style fields if you want
// };

// export default function TVPane({
//   id,
//   symbol,
//   interval,
//   settings,
// }: {
//   id: string;
//   symbol: string;
//   interval: string;
//   settings?: Settings;
// }) {
//   const { widget, ready, error } = useTradingView(id, symbol, interval);
//   const [chart, setChart] = useState<any | null>(null);
//   const [bars, setBars] = useState<any[]>([]);

//   // chart instance when ready
//   useEffect(() => {
//     if (!ready || !widget) return;
//     setChart(widget.activeChart());
//   }, [ready, widget]);

//   // keep bars synced with store
//   useEffect(() => {
//     const sync = () => setBars(getBars(symbol, interval));
//     sync();
//     const unsub = subscribeBarsStore(sync);
//     return () => {
//       unsub();
//     };
//   }, [symbol, interval]);

//   // pick depth from settings (default C3)
//   const depth: 2 | 3 | 4 = settings?.c2 ? 2 : settings?.c4 ? 4 : 3;

//   // run T-Trade overlay
//   useTTrade(chart, bars, { depth });
//   useClearTTradeOnUnmount();

//   return (
//     <div className="cell">
//       <div className="header">
//         <span className="pill">{symbol}</span>
//         <span className="pill">{interval}</span>
//         <span className="pill">Advanced Charts</span>
//       </div>
//       {/* {error && <div className="error">Error: {error}</div>} */}
//       <div
//         id={id}
//         style={{ position: "absolute", inset: 0, marginTop: "50px" }}
//       />
//     </div>
//   );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTradingView } from "../hooks/useTradingView";
import { getBars, subscribeBarsStore } from "../state/barsStore";
// If you still want to run your T-Trade overlay, leave these:
// import { useTTrade, useClearTTradeOnUnmount } from "../hooks/useTTrades";

type C123Settings = {
  // Pine inputs you want to control from SettingsModal
  htf?: "1" | "3" | "5" | "15" | "30" | "60" | "120" | "240" | "D" | "W";
  swLen?: number;
  showZone?: boolean;
  showMid?: boolean;
  useBody?: boolean;
  showSigs?: boolean;
  showLabels?: boolean;

  // (Optional) keep your old toggle UI if you still need it:
  c2?: boolean;
  c3?: boolean;
  c4?: boolean;
};

export default function TVPane({
  id,
  symbol,
  interval,
  settings,
}: {
  id: string;
  symbol: string;
  interval: string;
  settings?: C123Settings;
}) {
  const { widget, ready, error } = useTradingView(id, symbol, interval);

  const [chart, setChart] = useState<any | null>(null);
  const [bars, setBars] = useState<any[]>([]);
  const studyRef = useRef<number | null>(null); // ← keep created study id here

  // 1) chart instance when ready
  useEffect(() => {
    if (!ready || !widget) return;
    const c = (widget as any).activeChart?.() || (widget as any).chart?.();
    setChart(c);
  }, [ready, widget]);

  // 2) keep bars synced with store (unchanged)
  useEffect(() => {
    const sync = () => setBars(getBars(symbol, interval));
    sync();
    const unsub = subscribeBarsStore(sync);
    return () => {
      unsub();
    };
  }, [symbol, interval]);

  // 3) (optional) if you still use T-Trade overlay depth toggles
  // const depth: 2 | 3 | 4 = settings?.c2 ? 2 : settings?.c4 ? 4 : 3;
  // useTTrade(chart, bars, { depth });
  // useClearTTradeOnUnmount();

  // 4) build the inputs object we’ll pass to createStudy/setStudyInputs
  const indicatorInputs = useMemo(
    () => ({
      htf: settings?.htf ?? "D",
      swLen: Number(settings?.swLen ?? 3),
      showZone: settings?.showZone ?? true,
      showMid: settings?.showMid ?? true,
      useBody: settings?.useBody ?? true,
      showSigs: settings?.showSigs ?? true,
      showLabels: settings?.showLabels ?? true,
    }),
    [settings]
  );

  // 5) create/update the custom indicator study
  // useEffect(() => {
  //   if (!chart) return;

  //   const INDICATOR_NAME = "C1–C2–C3 Helper (HTF Bias + T-zone + LTF Signals)"; // must match meta.name in your custom_indicators_getter

  //   // first time: create study with inputs, then later: update inputs only
  //   if (!studyRef.current) {
  //     try {
  //       const id = chart.createStudy(
  //         INDICATOR_NAME,
  //         /*forceOverlay*/ true,
  //         /*lock*/ false,
  //         indicatorInputs // <— keys must match meta.inputs[].id
  //       );
  //       studyRef.current = id as number;
  //     } catch (e) {
  //       console.error("[TVPane] createStudy error:", e);
  //     }
  //   } else {
  //     try {
  //       chart.setStudyInputs(studyRef.current, indicatorInputs);
  //     } catch (e) {
  //       console.error("[TVPane] setStudyInputs error:", e);
  //     }
  //   }
  // }, [chart, indicatorInputs]);
  // inside your effect that creates the study
  useEffect(() => {
    if (!chart) return;

    const NAME = "Fractal Model"; // must equal meta.name (i.e., sI.name)

    // remove previous on sym/interval changes
    if (studyRef.current) {
      try {
        chart.removeEntity(studyRef.current);
      } catch {}
      studyRef.current = null;
    }

    try {
      const id = chart.createStudy(NAME, true, false); // ← no inputs arg
      studyRef.current = id as number;
    } catch (e) {
      console.error("[TVPane] createStudy failed:", e);
    }
  }, [chart, symbol, interval]);

  // remove the setStudyInputs effect since there are no inputs

  // 6) cleanup: remove indicator when pane unmounts or chart is torn down
  useEffect(() => {
    return () => {
      if (!chart || !studyRef.current) return;
      try {
        chart.removeEntity(studyRef.current);
      } catch {}
      studyRef.current = null;
    };
  }, [chart]);

  return (
    <div className="cell">
      <div className="header">
        <span className="pill">{symbol}</span>
        <span className="pill">{interval}</span>
        <span className="pill">Advanced Charts</span>
      </div>
      {/* {error && <div className="error">Error: {String(error)}</div>} */}
      <div
        id={id}
        style={{ position: "absolute", inset: 0, marginTop: "50px" }}
      />
    </div>
  );
}
