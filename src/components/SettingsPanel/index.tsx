import React, { useEffect, useMemo, useRef, useState } from "react";
import "./settings-panel.css";

/** ---------- types ---------- */
type Bias = "Bullish" | "Bearish" | "Neutral";
type FractalMode = "Automatic" | "Manual";
type Tf =
  | "1 minute" | "3 minutes" | "5 minutes" | "15 minutes" | "30 minutes"
  | "1 hour"  | "2 hours"   | "4 hours"   | "1 day"      | "1 week";

type LineStyle = "Solid" | "Dotted" | "Dashed";
type LabelSize = "Tiny" | "Small" | "Normal" | "Large";
type HTFSize = "Small" | "Medium" | "Large";

type TimeRange = { enabled: boolean; from: string; to: string };
type LineCfg   = { enabled: boolean; color: string; style: LineStyle; width: number };

export type SettingsState = {
  // warnings
  show: boolean;

  // general
  alerts: boolean;
  history: number;
  fractalMode: FractalMode;
  c2: boolean;
  c3: boolean;
  c4: boolean;
  bias: Bias;

  // time filter
  applyBelow: Tf;
  filter1: TimeRange;
  filter2: TimeRange;
  filter3: TimeRange;

  // HTF candles
  htfSize: HTFSize;
  htfHide: boolean;
  htfOffset: number;
  colorBody1: string; colorBody2: string;
  colorBorder1: string; colorBorder2: string;
  colorWick1: string; colorWick2: string;
  htfOpen:  LineCfg;
  ocTime:   LineCfg;
  lhLines:  LineCfg;

  // model style
  showTTFMLabels: boolean;
  ttfmLabelSize: LabelSize;
  candle1Sweep:  LineCfg;
  bullishCISD:   LineCfg;
  bearishCISD:   LineCfg;
  candleEquil:   LineCfg;
  tSpotEnabled:  boolean;

  // orderblock projections
  projEnabled: boolean;
  projValues: string; // free-form "-1, -2, -2.5, ..."
  projLabels: boolean;
  projLabelSize: LabelSize;
  projStyle: LineStyle;
  projWidth: number;

  // formation liquidity
  flStyle: LineStyle;
  flWidth: number;
};

const DEFAULTS: SettingsState = {
  show: true,
  alerts: true,
  history: 1,
  fractalMode: "Automatic",
  c2: true, c3: true, c4: true,
  bias: "Bearish",

  applyBelow: "1 hour",
  filter1: { enabled: true,  from: "02:00", to: "05:00" },
  filter2: { enabled: true,  from: "08:00", to: "11:00" },
  filter3: { enabled: false, from: "13:30", to: "16:15" },

  htfSize: "Small",
  htfHide: false,
  htfOffset: 0,
  colorBody1: "#8fd19e", colorBody2: "#111111",
  colorBorder1: "#b8c1d1", colorBorder2: "#111111",
  colorWick1: "#95a0b6", colorWick2: "#8c92a3",
  htfOpen:  { enabled: true,  color: "#9aa0b6", style: "Solid",  width: 1 },
  ocTime:   { enabled: true,  color: "#9aa0b6", style: "Solid",  width: 1 },
  lhLines:  { enabled: false, color: "#9aa0b6", style: "Dotted", width: 1 },

  showTTFMLabels: true,
  ttfmLabelSize: "Small",
  candle1Sweep: { enabled: true,  color: "#000000", style: "Solid",  width: 1 },
  bullishCISD:  { enabled: true,  color: "#3b82f6", style: "Solid",  width: 2 },
  bearishCISD:  { enabled: true,  color: "#ef4444", style: "Solid",  width: 2 },
  candleEquil:  { enabled: true,  color: "#000000", style: "Dotted", width: 1 },
  tSpotEnabled: true,

  projEnabled: true,
  projValues: "-1, -2, -2.5, -3",
  projLabels: true,
  projLabelSize: "Normal",
  projStyle: "Solid",
  projWidth: 1,

  flStyle: "Dotted",
  flWidth: 1,
};

const TF_OPTIONS: Tf[] = [
  "1 minute","3 minutes","5 minutes","15 minutes","30 minutes",
  "1 hour","2 hours","4 hours","1 day","1 week",
];

/** ---------- small helpers ---------- */
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="sm-title">{children}</div>
);

function Check({label, checked, onChange}: {label: string; checked: boolean; onChange:(v:boolean)=>void}) {
  return (
    <label className="sm-check">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Select<T extends string>({value, onChange, options}: {
  value: T; onChange: (v:T)=>void; options: readonly T[];
}) {
  return (
    <select className="sm-select" value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function LineRow({cfg, onChange, label, withToggle=true}:{
  label: string;
  cfg: LineCfg;
  onChange: (next: LineCfg)=>void;
  withToggle?: boolean;
}) {
  const set = (patch: Partial<LineCfg>) => onChange({...cfg, ...patch});
  return (
    <div className="sm-row sm-line">
      {withToggle ? <Check label={label} checked={cfg.enabled} onChange={v=>set({enabled:v})}/> : <div className="sm-label">{label}</div>}
      <input type="color" value={cfg.color} onChange={e=>set({color:e.target.value})} className="sm-color"/>
      <Select value={cfg.style} onChange={(v)=>set({style:v})} options={["Solid","Dotted","Dashed"] as const}/>
      <div className="sm-inline">
        <span className="sm-muted">Width</span>
        <input type="number" min={1} max={10} value={cfg.width} onChange={e=>set({width: Number(e.target.value) || 1})} className="sm-input sm-narrow"/>
      </div>
    </div>
  );
}

function TimeRangeRow({label, value, onChange}:{
  label: string; value: TimeRange; onChange:(v:TimeRange)=>void;
}) {
  const set = (patch: Partial<TimeRange>) => onChange({...value, ...patch});
  return (
    <div className="sm-row sm-time">
      <Check label={label} checked={value.enabled} onChange={v=>set({enabled:v})}/>
      <div className="sm-time-box">
        <input type="time" value={value.from} onChange={e=>set({from:e.target.value})}/>
        <span>—</span>
        <input type="time" value={value.to} onChange={e=>set({to:e.target.value})}/>
      </div>
    </div>
  );
}

/** ---------- modal shell (no external library) ---------- */
function ModalShell({
  open, onClose, title, children, footer,
}:{
  open: boolean; onClose: ()=>void; title: string; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // focus trap (basic)
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="sm-overlay" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className="sm-modal"
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e)=>e.stopPropagation()}
      >
        <div className="sm-header">
          <div className="sm-titlebar">{title}</div>
          <button className="sm-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="sm-body">{children}</div>
        {footer ? <div className="sm-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** ---------- main exported component ---------- */
export default function SettingsModal({
  open,
  initial = DEFAULTS,
  onClose,
  onSubmit,
}:{
  open: boolean;
  initial?: SettingsState;
  onClose: ()=>void;
  onSubmit?: (s: SettingsState)=>void;
}) {
  const [s, setS] = useState<SettingsState>(initial);
  useEffect(()=>{ if (open) setS(initial); }, [open]); // reset when re-opened
  const set = <K extends keyof SettingsState>(k:K, v:SettingsState[K]) => setS(p=>({...p,[k]:v}));
  const isDirty = useMemo(()=>JSON.stringify(s)!==JSON.stringify(initial), [s, initial]);

  const submit = () => { onSubmit?.(s); onClose(); };
  const defaults = () => setS(DEFAULTS);

  return (
    <ModalShell open={open} onClose={onClose} title="Settings">
      {/* Warnings & Errors */}
      <section className="sm-card">
        <SectionTitle>WARNINGS AND ERROR MESSAGES</SectionTitle>
        <div className="sm-row"><Check label="Show?" checked={s.show} onChange={v=>set("show",v)}/></div>
      </section>

      {/* General Settings */}
      <section className="sm-card">
        <SectionTitle>GENERAL SETTINGS</SectionTitle>
        <div className="sm-row"><Check label="Alerts?" checked={s.alerts} onChange={v=>set("alerts",v)}/></div>

        <div className="sm-row">
          <div className="sm-label">History</div>
          <input className="sm-input sm-narrow" type="number" min={0} step={1}
                 value={s.history} onChange={e=>set("history", Number(e.target.value)||0)} />
        </div>

        <div className="sm-row sm-wrap">
          <div className="sm-inline">
            <div className="sm-label">Fractal</div>
            <Select value={s.fractalMode} onChange={(v)=>set("fractalMode", v)} options={["Automatic","Manual"] as const}/>
          </div>
          <Check label="C2" checked={s.c2} onChange={v=>set("c2",v)}/>
          <Check label="C3" checked={s.c3} onChange={v=>set("c3",v)}/>
          <Check label="C4" checked={s.c4} onChange={v=>set("c4",v)}/>

          <div className="sm-inline">
            <div className="sm-label">Bias</div>
            <Select value={s.bias} onChange={(v)=>set("bias",v)} options={["Bullish","Bearish","Neutral"] as const}/>
          </div>
        </div>
      </section>

      {/* Time Filter */}
      <section className="sm-card">
        <SectionTitle>TIME FILTER</SectionTitle>
        <div className="sm-row">
          <div className="sm-label">Apply below</div>
          <Select value={s.applyBelow} onChange={(v)=>set("applyBelow", v)} options={TF_OPTIONS as any}/>
        </div>
        <TimeRangeRow label="Filter 1" value={s.filter1} onChange={v=>set("filter1",v)}/>
        <TimeRangeRow label="Filter 2" value={s.filter2} onChange={v=>set("filter2",v)}/>
        <TimeRangeRow label="Filter 3" value={s.filter3} onChange={v=>set("filter3",v)}/>
      </section>

      {/* HTF Candles */}
      <section className="sm-card">
        <SectionTitle>HTF CANDLES</SectionTitle>

        <div className="sm-row sm-wrap">
          <div className="sm-inline">
            <div className="sm-label">Size</div>
            <Select value={s.htfSize} onChange={v=>set("htfSize",v)} options={["Small","Medium","Large"] as const}/>
          </div>
          <Check label="Hide?" checked={s.htfHide} onChange={v=>set("htfHide",v)}/>
          <div className="sm-inline">
            <div className="sm-label">Offset</div>
            <input className="sm-input sm-narrow" type="number" value={s.htfOffset}
                   onChange={e=>set("htfOffset", Number(e.target.value)||0)}/>
          </div>
        </div>

        <div className="sm-row sm-wrap">
          <div className="sm-inline"><div className="sm-label">Body</div>
            <input type="color" value={s.colorBody1} onChange={e=>set("colorBody1", e.target.value)} className="sm-color"/>
            <input type="color" value={s.colorBody2} onChange={e=>set("colorBody2", e.target.value)} className="sm-color"/>
          </div>
          <div className="sm-inline"><div className="sm-label">Border</div>
            <input type="color" value={s.colorBorder1} onChange={e=>set("colorBorder1", e.target.value)} className="sm-color"/>
            <input type="color" value={s.colorBorder2} onChange={e=>set("colorBorder2", e.target.value)} className="sm-color"/>
          </div>
          <div className="sm-inline"><div className="sm-label">Wick</div>
            <input type="color" value={s.colorWick1} onChange={e=>set("colorWick1", e.target.value)} className="sm-color"/>
            <input type="color" value={s.colorWick2} onChange={e=>set("colorWick2", e.target.value)} className="sm-color"/>
          </div>
        </div>

        <LineRow label="HTF Open" cfg={s.htfOpen} onChange={v=>set("htfOpen",v)}/>
        <LineRow label="O/C Time" cfg={s.ocTime}  onChange={v=>set("ocTime",v)}/>
        <LineRow label="L/H Lines" cfg={s.lhLines} onChange={v=>set("lhLines",v)}/>
      </section>

      {/* Model Style */}
      <section className="sm-card">
        <SectionTitle>MODEL STYLE</SectionTitle>
        <div className="sm-row">
          <Check label="Show TTFM Labels?" checked={s.showTTFMLabels} onChange={v=>set("showTTFMLabels",v)}/>
          <Select value={s.ttfmLabelSize} onChange={(v)=>set("ttfmLabelSize", v)} options={["Tiny","Small","Normal","Large"] as const}/>
        </div>

        <LineRow label="Candle 1 Sweep" cfg={s.candle1Sweep} onChange={v=>set("candle1Sweep",v)}/>
        <LineRow label="Bullish CISD"  cfg={s.bullishCISD}  onChange={v=>set("bullishCISD",v)}/>
        <LineRow label="Bearish CISD"  cfg={s.bearishCISD}  onChange={v=>set("bearishCISD",v)}/>
        <LineRow label="Candle Equilibrium" cfg={s.candleEquil} onChange={v=>set("candleEquil",v)}/>

        <div className="sm-row">
          <Check label="T‑Spot" checked={s.tSpotEnabled} onChange={v=>set("tSpotEnabled", v)}/>
          <div className="sm-swatch"></div>
          <div className="sm-swatch"></div>
        </div>
      </section>

      {/* Orderblock Projections */}
      <section className="sm-card">
        <SectionTitle>ORDERBLOCK PROJECTIONS</SectionTitle>
        <div className="sm-row">
          <Check label="Projections" checked={s.projEnabled} onChange={v=>set("projEnabled", v)}/>
          <input className="sm-input sm-wide" placeholder="-1, -2, -2.5, …"
                 value={s.projValues} onChange={e=>set("projValues", e.target.value)} />
        </div>
        <div className="sm-row sm-wrap">
          <Check label="Labels?" checked={s.projLabels} onChange={v=>set("projLabels", v)}/>
          <Select value={s.projLabelSize} onChange={(v)=>set("projLabelSize", v)} options={["Tiny","Small","Normal","Large"] as const}/>
        </div>
        <div className="sm-row">
          <Select value={s.projStyle} onChange={(v)=>set("projStyle", v)} options={["Solid","Dotted","Dashed"] as const}/>
          <div className="sm-inline">
            <span className="sm-muted">Width</span>
            <input className="sm-input sm-narrow" type="number" min={1} max={10}
                   value={s.projWidth} onChange={e=>set("projWidth", Number(e.target.value)||1)} />
          </div>
        </div>
      </section>

      {/* Formation Liquidity */}
      <section className="sm-card">
        <SectionTitle>FORMATION LIQUIDITY</SectionTitle>
        <div className="sm-row">
          <Select value={s.flStyle} onChange={(v)=>set("flStyle", v)} options={["Dotted","Solid","Dashed"] as const}/>
          <div className="sm-inline">
            <span className="sm-muted">Width</span>
            <input className="sm-input sm-narrow" type="number" min={1} max={10}
                   value={s.flWidth} onChange={e=>set("flWidth", Number(e.target.value)||1)} />
          </div>
        </div>
      </section>

      {/* footer */}
      <div className="sm-actions">
        <button className="sm-btn" onClick={defaults}>Defaults</button>
        <div className="sm-spacer" />
        <button className="sm-btn ghost" onClick={onClose}>Cancel</button>
        <button className="sm-btn primary" onClick={submit} disabled={!isDirty}>OK</button>
      </div>
    </ModalShell>
  );
}
