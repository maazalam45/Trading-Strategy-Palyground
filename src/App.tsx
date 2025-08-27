import React, { useState } from "react";
import TVPane from "./components/TVPane";
import SettingsModal, { SettingsState } from "./components/SettingsPanel";

export default function App() {
  const [symbol, setSymbol] = useState("EURUSD");
  const [interval, setIntervalTF] = useState("1H");
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="toolbar">
        <button onClick={() => setSettingsOpen(true)}>Settings</button>

        {/* <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
          <TVPane
            id="tv_0"
            symbol="EURUSD"
            interval="1"
            settings={{
              c2: settings?.c2,
              c3: settings?.c3,
              c4: settings?.c4,
            }}
          />
        </div> */}

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          initial={settings ?? undefined}
          onSubmit={(s) => {
            setSettings(s);
            setSettingsOpen(false);
          }}
        />
        <div>
          <label>Symbol </label>
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label>TF </label>
          <select
            value={interval}
            onChange={(e) => setIntervalTF(e.target.value)}
          >
            {["1", "5", "15", "30", "60", "1H", "4H", "1D", "1W", "1M"].map(
              (tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              )
            )}
          </select>
        </div>
        {/* <div style={{ marginLeft: "auto", opacity: 0.8 }}>
          Use built‑in toolbar for Ruler, Price/Date Range, Line, Trendline,
          Fib…
        </div> */}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr" }}>
        <TVPane
          id="tv_chart_container"
          symbol={symbol}
          interval={interval}
          settings={{
            c2: settings?.c2,
            c3: settings?.c3,
            c4: settings?.c4,
          }}
        />
        {/* <TVPane id="tv_chart_container" symbol={symbol} interval={interval} /> */}
      </div>
    </>
  );
}
