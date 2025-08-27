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

import React, { useEffect, useState } from "react";
import { useTradingView } from "../hooks/useTradingView";
import { getBars, subscribeBarsStore } from "../state/barsStore";
import { useTTrade, useClearTTradeOnUnmount } from "../hooks/useTTrades";

type Settings = {
  c2?: boolean;
  c3?: boolean;
  c4?: boolean;
  // add other style fields if you want
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
  settings?: Settings;
}) {
  const { widget, ready, error } = useTradingView(id, symbol, interval);
  const [chart, setChart] = useState<any | null>(null);
  const [bars, setBars] = useState<any[]>([]);

  // chart instance when ready
  useEffect(() => {
    if (!ready || !widget) return;
    setChart(widget.activeChart());
  }, [ready, widget]);

  // keep bars synced with store
  useEffect(() => {
    const sync = () => setBars(getBars(symbol, interval));
    sync();
    const unsub = subscribeBarsStore(sync);
    return () => {
      unsub();
    };
  }, [symbol, interval]);

  // pick depth from settings (default C3)
  const depth: 2 | 3 | 4 = settings?.c2 ? 2 : settings?.c4 ? 4 : 3;

  // run T-Trade overlay
  useTTrade(chart, bars, { depth });
  useClearTTradeOnUnmount();

  return (
    <div className="cell">
      <div className="header">
        <span className="pill">{symbol}</span>
        <span className="pill">{interval}</span>
        <span className="pill">Advanced Charts</span>
      </div>
      {/* {error && <div className="error">Error: {error}</div>} */}
      <div
        id={id}
        style={{ position: "absolute", inset: 0, marginTop: "50px" }}
      />
    </div>
  );
}
