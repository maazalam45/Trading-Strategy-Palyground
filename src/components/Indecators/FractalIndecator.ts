// FractalIndecator.ts
// export const customIndicatorsGetter = (PineJS: any) => {
//   // Fallback to an empty array if nothing has been registered yet
//   const listRaw: any = (window as any).savedIndicators;
//   const list: any[] = Array.isArray(listRaw)
//     ? listRaw
//     : listRaw
//       ? [listRaw]
//       : [];

//   if (list.length === 0) {
//     console.warn(
//       "[custom_indicators_getter] window.savedIndicators is empty/undefined — returning no custom indicators."
//     );
//     // TradingView expects an array (or Promise resolving to an array)
//     return Promise.resolve([]);
//   }

//   // Build indicators
//   const descriptors = list
//     .map((sI: any, idx: number) => {
//       if (!sI?.name || !sI?.code) {
//         console.error("[custom_indicators_getter] Invalid entry at", idx, sI);
//         return null;
//       }

//       const userFactory = new Function(
//         "PineJS",
//         `
//         return function customIndicator(context, input) {
//           // Read inputs by index (order must match metainfo.inputs)
//           const htf        = input(0);
//           const swLen      = input(1);
//           const showZone   = input(2);
//           const showMid    = input(3);
//           const useBody    = input(4);
//           const showSigs   = input(5);
//           const showLabels = input(6);

//           ${sI.code} // must return { plots:[...], ... }
//         }
//       `
//       );

//       const userFn = userFactory(PineJS);
//       console.log(
//         `[custom_indicators_getter] Loaded "${sI.name}" at index ${idx}`
//       );
//       const meta = {
//         _metainfoVersion: 55,
//         id: `${sI.name}@tv-basicstudies-1`, // <-- important suffix
//         name: sI.name, // <-- must match what you want in list
//         description: sI.name,
//         shortDescription: sI.name,
//         isCustomIndicator: true,
//         is_price_study: true,
//         is_hidden_study: false, // <-- ensure listed
//         packageId: "my-custom", // <-- groups in the dialog
//         packageName: "My Custom Indicators",
//         format: { type: "price", precision: 5 },

//         plots: [
//           { id: "plot_0", type: "line" },
//           { id: "plot_1", type: "line" },
//           { id: "plot_2", type: "shapes", target: "plot_0" },
//           { id: "bg_plot", type: "bg_colorer", palette: "palette_0" },
//         ],

//         palettes: {
//           palette_0: {
//             colors: [
//               { name: "Buy", color: "#00FF00" },
//               { name: "Sell", color: "#FF0000" },
//               { name: "Neutral", color: "#00000000" },
//             ],
//           },
//         },

//         defaults: {
//           styles: {
//             plot_0: {
//               linestyle: 0,
//               linewidth: 2,
//               plottype: 2,
//               visible: true,
//               color: "#008000",
//             },
//             plot_1: {
//               linestyle: 0,
//               linewidth: 2,
//               plottype: 2,
//               visible: true,
//               color: "#800000",
//             },
//             plot_2: {
//               color: "#00FF00",
//               textColor: "#FFFFFF",
//               plottype: "shape_square",
//               location: "AboveBar",
//               visible: true,
//             },
//             bg_plot: { transparency: 10 },
//           },
//           inputs: {},
//         },

//         styles: {
//           plot_0: { title: "Line 0", color: "#008000", linewidth: 2 },
//           plot_1: { title: "Line 1", color: "#800000", linewidth: 2 },
//           plot_2: {
//             isHidden: false,
//             location: "AboveBar",
//             text: "BUY",
//             title: "Buy_Signal",
//             size: 3,
//           },
//           bg_plot: { title: "Background Color" },
//         },

//         inputs: [
//           {
//             id: "htf",
//             name: "Higher TF (C1/C2/C3)",
//             type: "text",
//             defval: "D",
//           },
//           {
//             id: "swLen",
//             name: "LTF Pivot Length",
//             type: "integer",
//             defval: 3,
//             min: 2,
//           },
//           {
//             id: "showZone",
//             name: "Show T-zone box",
//             type: "bool",
//             defval: true,
//           },
//           { id: "showMid", name: "Plot 50% of C2", type: "bool", defval: true },
//           { id: "useBody", name: "50% of C2 body", type: "bool", defval: true },
//           {
//             id: "showSigs",
//             name: "Show L/S signals",
//             type: "bool",
//             defval: true,
//           },
//           {
//             id: "showLabels",
//             name: "Show bias labels",
//             type: "bool",
//             defval: true,
//           },
//         ],
//       };

//       return {
//         name: sI.name, // keep same as meta.name
//         metainfo: meta,
//         constructor: function (context: any, input: any) {
//           //@ts-ignore
//           this.main = (ctx: any, inp: any) => userFn(ctx, inp, PineJS);
//         },
//       };

//       //   return {
//       //     name: sI.name,
//       //     metainfo: meta,
//       //     constructor: function (context: any, input: any) {
//       //       // TV calls this; we must return plots each bar
//       //       this.main = (ctx: any, inp: any) => userFn(ctx, inp, PineJS);
//       //     },
//       //   };
//     })
//     .filter(Boolean) as any[];

//   return Promise.resolve(descriptors);
// };
// FractalIndecator.ts
// FractalIndecator.ts

// FractalIndecator.ts
//@ts-nocheck
export const customIndicatorsGetter = (PineJS: any) => {
  const listRaw: any = (window as any).savedIndicators;
  const list: any[] = Array.isArray(listRaw)
    ? listRaw
    : listRaw
      ? [listRaw]
      : [];

  if (list.length === 0) {
    console.warn("[custom_indicators_getter] window.savedIndicators is empty.");
    return Promise.resolve([]);
  }

  const descriptors = list
    .map((sI: any, idx: number) => {
      if (!sI?.name || !sI?.code) {
        console.error(
          "[custom_indicators_getter] Invalid indicator at",
          idx,
          sI
        );
        return null;
      }

      // --- Build the study descriptor for each saved indicator ---
      const meta = {
        _metainfoVersion: 55,
        id: `${sI.name}@tv-basicstudies-1`,
        name: sI.name,
        description: sI.name,
        shortDescription: sI.name,
        isCustomIndicator: true,
        is_price_study: true,
        is_hidden_study: false,
        packageId: "my-custom",
        packageName: "My Custom Indicators",
        format: { type: "price", precision: 5 },

        // Order of plots must match our main() return array
        plots: [
          { id: "plot_0", type: "line" }, // C2 mid
          { id: "plot_1", type: "line" }, // T-zone bottom
          { id: "plot_2", type: "shapes", target: "plot_0" }, // signals (shape index or NaN)
          { id: "bg_plot", type: "bg_colorer", palette: "palette_0" }, // background palette index
        ],
        palettes: {
          palette_0: {
            colors: [
              { name: "Buy", color: "#00FF00" },
              { name: "Sell", color: "#FF0000" },
              { name: "Neutral", color: "#00000000" },
            ],
          },
        },
        defaults: {
          styles: {
            plot_0: {
              linestyle: 0,
              linewidth: 2,
              plottype: 2,
              visible: true,
              color: "#008000",
            },
            plot_1: {
              linestyle: 0,
              linewidth: 2,
              plottype: 2,
              visible: true,
              color: "#800000",
            },
            plot_2: {
              color: "#00FF00",
              textColor: "#FFFFFF",
              plottype: "shape_square",
              location: "AboveBar",
              visible: true,
            },
            bg_plot: { transparency: 10 },
          },
          inputs: {},
        },
        styles: {
          plot_0: { title: "Line 0", color: "#008000", linewidth: 2 },
          plot_1: { title: "Line 1", color: "#800000", linewidth: 2 },
          plot_2: {
            isHidden: false,
            location: "AboveBar",
            text: "BUY",
            title: "Buy_Signal",
            size: 3,
          },
          bg_plot: { title: "Background Color" },
        },
        inputs: [], // no inputs
      };

      return {
        name: sI.name,
        metainfo: meta,

        // The constructor must define persistent vars via context.new_var()
        constructor: function () {
          // init() is called once; create all persistent series here
          this.init = function (context: any) {
            this._context = context;

            // daily "bucket"
            this.c_day_id = context.new_var(NaN);

            // C3 running OHLC (current day)
            this.c3_o = context.new_var(NaN);
            this.c3_h = context.new_var(NaN);
            this.c3_l = context.new_var(NaN);
            this.c3_c = context.new_var(NaN);

            // C2 (last closed day)
            this.c2_o = context.new_var(NaN);
            this.c2_h = context.new_var(NaN);
            this.c2_l = context.new_var(NaN);
            this.c2_c = context.new_var(NaN);

            // C1 (prior day)
            this.c1_o = context.new_var(NaN);
            this.c1_h = context.new_var(NaN);
            this.c1_l = context.new_var(NaN);
            this.c1_c = context.new_var(NaN);

            // swings
            this.lastSwingHigh = context.new_var(NaN);
            this.lastSwingLow = context.new_var(NaN);
          };

          // main() is called on each bar; compute and return values matching metainfo.plots
          this.main = (context: any) => {
            this._context = context;
            const v = PineJS.Std;

            // Helpers
            const num = (x: any) => (Number.isFinite(x) ? x : NaN);

            // --- time → day bucket (robust across ms/sec) ---
            const t = v.time(this._context);
            const DAY_MS = 86400000;
            const tsMs = t > 1e12 ? t : t * 1000; // if seconds, convert to ms
            const dayBucket = Math.floor(tsMs / DAY_MS);

            // --- OHLC for current bar ---
            const o = v.open(this._context);
            const h = v.high(this._context);
            const l = v.low(this._context);
            const c = v.close(this._context);

            // --- read current persistent state ---
            const curDayId = this.c_day_id.get();

            // First bar or new day? shift+seed
            if (!Number.isFinite(curDayId) || dayBucket !== curDayId) {
              // C1 <- C2
              this.c1_o.set(this.c2_o.get());
              this.c1_h.set(this.c2_h.get());
              this.c1_l.set(this.c2_l.get());
              this.c1_c.set(this.c2_c.get());

              // C2 <- C3
              this.c2_o.set(this.c3_o.get());
              this.c2_h.set(this.c3_h.get());
              this.c2_l.set(this.c3_l.get());
              this.c2_c.set(this.c3_c.get());

              // C3 <- seed from current bar
              this.c3_o.set(o);
              this.c3_h.set(h);
              this.c3_l.set(l);
              this.c3_c.set(c);

              this.c_day_id.set(dayBucket);
            } else {
              // same day → update running C3
              this.c3_h.set(Math.max(this.c3_h.get(), h));
              this.c3_l.set(Math.min(this.c3_l.get(), l));
              this.c3_c.set(c);
            }

            // Re-read after updates
            const c3o = this.c3_o.get();
            const c2o = this.c2_o.get(),
              c2h = this.c2_h.get(),
              c2l = this.c2_l.get(),
              c2c = this.c2_c.get();
            const c1h = this.c1_h.get(),
              c1l = this.c1_l.get();

            const hasC2 = [c2o, c2h, c2l, c2c].every(Number.isFinite);
            const hasC1 = Number.isFinite(c1h) && Number.isFinite(c1l);

            // Bias from C2 vs C1 (or body direction if C1 unknown)
            const bullBias = hasC2 && (c2c > c2o || (hasC1 && c2c > c1h));
            const bearBias = hasC2 && (c2c < c2o || (hasC1 && c2c < c1l));

            // C2 50% (body mid)
            const midC2 = hasC2 ? c2o + (c2c - c2o) * 0.5 : NaN;

            // T-zone: C3 open ↔ C2 mid
            const zoneTop =
              Number.isFinite(midC2) && Number.isFinite(c3o)
                ? Math.max(c3o, midC2)
                : NaN;
            const zoneBot =
              Number.isFinite(midC2) && Number.isFinite(c3o)
                ? Math.min(c3o, midC2)
                : NaN;

            // LTF pivots (len=3) on chart TF
            const left = 3,
              right = 3;
            const winLen = left + 1 + right;

            // init ring buffers once
            if (!this._phBuf) this._phBuf = [];
            if (!this._plBuf) this._plBuf = [];

            // push current bar into buffers
            this._phBuf.push(h);
            this._plBuf.push(l);

            // cap window size
            if (this._phBuf.length > winLen) this._phBuf.shift();
            if (this._plBuf.length > winLen) this._plBuf.shift();

            // helper: check if mid element is strict extreme
            function isPivotHigh(buf: number[]) {
              if (buf.length < winLen) return false;
              const mid = left;
              const midVal = buf[mid];
              // strictly greater than all others in window
              for (let i = 0; i < buf.length; i++) {
                if (i === mid) continue;
                if (!(midVal > buf[i])) return false;
              }
              return true;
            }
            function isPivotLow(buf: number[]) {
              if (buf.length < winLen) return false;
              const mid = left;
              const midVal = buf[mid];
              for (let i = 0; i < buf.length; i++) {
                if (i === mid) continue;
                if (!(midVal < buf[i])) return false;
              }
              return true;
            }

            // if a pivot is confirmed, update swing series to that mid value
            if (isPivotHigh(this._phBuf)) {
              const midVal = this._phBuf[left];
              this.lastSwingHigh.set(midVal);
            }
            if (isPivotLow(this._plBuf)) {
              const midVal = this._plBuf[left];
              this.lastSwingLow.set(midVal);
            }

            const lastSwingHigh = this.lastSwingHigh.get();
            const lastSwingLow = this.lastSwingLow.get();

            // const lastSwingHigh = this.lastSwingHigh.get();
            // const lastSwingLow = this.lastSwingLow.get();

            // In-zone & signals
            const inZone =
              Number.isFinite(zoneTop) &&
              Number.isFinite(zoneBot) &&
              c <= zoneTop &&
              c >= zoneBot;
            const longSig =
              inZone &&
              bullBias &&
              Number.isFinite(lastSwingHigh) &&
              c > lastSwingHigh;
            const shortSig =
              inZone &&
              bearBias &&
              Number.isFinite(lastSwingLow) &&
              c < lastSwingLow;

            const shapeIndex = longSig ? 0 : shortSig ? 1 : NaN; // 0=Buy, 1=Sell
            const bgIndex = bullBias ? 0 : bearBias ? 1 : 2; // palette index 0/1/2

            // Allow extra user code (optional). If you don't need it, leave sI.code empty.
            // The user snippet can read o,h,l,c, midC2, zoneTop/zoneBot, lastSwingHigh/Low, etc.
            try {
              `${sI.code}`;
            } catch (e) {
              // do not throw into TV internals; just no-op
              // console.warn('custom user code error', e);
            }

            // Return values in EXACT order of metainfo.plots
            return [
              num(midC2), // plot_0 line
              num(zoneBot), // plot_1 line
              Number.isFinite(shapeIndex) ? shapeIndex : NaN, // plot_2 shapes index
              Number.isFinite(bgIndex) ? bgIndex : 2, // bg_plot palette index
            ];
          };
        },
      };
    })
    .filter(Boolean) as any[];

  return Promise.resolve(descriptors);
};

// ========================
// export const customIndicatorsGetter = (PineJS: any) => {
//   const listRaw: any = (window as any).savedIndicators;
//   const list: any[] = Array.isArray(listRaw)
//     ? listRaw
//     : listRaw
//       ? [listRaw]
//       : [];

//   if (list.length === 0) {
//     console.warn("[custom_indicators_getter] window.savedIndicators is empty.");
//     return Promise.resolve([]);
//   }

//   const descriptors = list
//     .map((sI: any, idx: number) => {
//       if (!sI?.name || !sI?.code) {
//         console.error(
//           "[custom_indicators_getter] Invalid indicator at",
//           idx,
//           sI
//         );
//         return null;
//       }

//       // Build the user indicator function: no external inputs
//       const userFactory = new Function(
//         "PineJS",
//         `
//         return function customIndicator(context) {
//           const v = PineJS.Std;

//           // current pane's tickerid (e.g., "EURUSD")
//           const ticker = v.tickerid(context);

//           // helper to fetch HTF data for this symbol
//           function sec(tf, expr) {
//             return v.security(ticker, tf, expr);
//           }

//           // --- HTF daily (C1/C2/C3) ---
//           const HTF = "D";
//           const htfOpen  = sec(HTF, ctx => v.open(ctx));
//           const htfHigh  = sec(HTF, ctx => v.high(ctx));
//           const htfLow   = sec(HTF, ctx => v.low(ctx));
//           const htfClose = sec(HTF, ctx => v.close(ctx));

//           const openC3  = htfOpen;
//           const openC2  = v.nz(v.ref(htfOpen, 1));
//           const highC2  = v.nz(v.ref(htfHigh, 1));
//           const lowC2   = v.nz(v.ref(htfLow, 1));
//           const closeC2 = v.nz(v.ref(htfClose, 1));
//           const highC1  = v.nz(v.ref(htfHigh, 2));
//           const lowC1   = v.nz(v.ref(htfLow, 2));

//           // --- Bias (body dir OR break of C1) ---
//           const bullBias = v.or(v.gt(closeC2, openC2), v.gt(closeC2, highC1));
//           const bearBias = v.or(v.lt(closeC2, openC2), v.lt(closeC2, lowC1));

//           // --- C2 50% (body mid) ---
//           const midC2 = v.add(openC2, v.mul(v.sub(closeC2, openC2), 0.5));

//           // --- T-zone: C3 open ↔ C2 mid ---
//           const zoneTop = v.max(openC3, midC2);
//           const zoneBot = v.min(openC3, midC2);

//           // --- LTF pivots (len=3) ---
//           const ph = v.pivothigh(v.high(context), 3, 3);
//           const pl = v.pivotlow(v.low(context),   3, 3);

//           // persist last swings
//           let lastSwingHigh = v.var(context, "lastSwingHigh", NaN);
//           let lastSwingLow  = v.var(context, "lastSwingLow",  NaN);
//           if (!isNaN(ph)) { lastSwingHigh = ph; PineJS.set_var(context, "lastSwingHigh", lastSwingHigh); }
//           if (!isNaN(pl)) { lastSwingLow  = pl; PineJS.set_var(context, "lastSwingLow",  lastSwingLow ); }

//           // --- In-zone & signals ---
//           const c = v.close(context);
//           const inZone   = v.and(v.lte(c, zoneTop), v.gte(c, zoneBot));
//           const longSig  = v.and(inZone, v.and(bullBias, v.and(v.not(isNaN(lastSwingHigh)), v.gt(c, lastSwingHigh))));
//           const shortSig = v.and(inZone, v.and(bearBias, v.and(v.not(isNaN(lastSwingLow)),  v.lt(c, lastSwingLow))));

//           // indices for shapes/background
//           const shapeIndex = longSig ? 0 : (shortSig ? 1 : NaN);  // 0=Buy,1=Sell
//           const bgIndex    = bullBias ? 0 : (bearBias ? 1 : 2);   // palette idx

//           // safety guards to avoid bad autoscale
//           const num = (x) => (Number.isFinite(x) ? x : NaN);
//           const idx = (x, def) => (Number.isFinite(x) ? x : def);

//           // allow user extra body to run (optional): sI.code
//           // If you don't want any user-provided extra code, remove the next line.
//           ${sI.code}

//           return {
//             plots: [
//               num(midC2),                 // plot_0 (line)
//               num(zoneBot),               // plot_1 (line)
//               Number.isFinite(shapeIndex) ? shapeIndex : NaN, // plot_2 (shapes)
//               idx(bgIndex, 2)             // bg_plot (palette index; default Neutral)
//             ]
//           };
//         }
//         `
//       );

//       const userFn = userFactory(PineJS);

//       const meta = {
//         _metainfoVersion: 55,
//         id: `${sI.name}@tv-basicstudies-1`,
//         name: sI.name,
//         description: sI.name,
//         shortDescription: sI.name,
//         isCustomIndicator: true,
//         is_price_study: true,
//         is_hidden_study: false, // ensure visible in picker
//         packageId: "my-custom",
//         packageName: "My Custom Indicators",
//         format: { type: "price", precision: 5 },

//         plots: [
//           { id: "plot_0", type: "line" },
//           { id: "plot_1", type: "line" },
//           { id: "plot_2", type: "shapes", target: "plot_0" },
//           { id: "bg_plot", type: "bg_colorer", palette: "palette_0" },
//         ],

//         palettes: {
//           palette_0: {
//             colors: [
//               { name: "Buy", color: "#00FF00" },
//               { name: "Sell", color: "#FF0000" },
//               { name: "Neutral", color: "#00000000" },
//             ],
//           },
//         },

//         defaults: {
//           styles: {
//             plot_0: {
//               linestyle: 0,
//               linewidth: 2,
//               plottype: 2,
//               visible: true,
//               color: "#008000",
//             },
//             plot_1: {
//               linestyle: 0,
//               linewidth: 2,
//               plottype: 2,
//               visible: true,
//               color: "#800000",
//             },
//             plot_2: {
//               color: "#00FF00",
//               textColor: "#FFFFFF",
//               plottype: "shape_square",
//               location: "AboveBar",
//               visible: true,
//             },
//             bg_plot: { transparency: 10 },
//           },
//           inputs: {}, // fine to keep empty; there are no inputs
//         },

//         styles: {
//           plot_0: { title: "Line 0", color: "#008000", linewidth: 2 },
//           plot_1: { title: "Line 1", color: "#800000", linewidth: 2 },
//           plot_2: {
//             isHidden: false,
//             location: "AboveBar",
//             text: "BUY",
//             title: "Buy_Signal",
//             size: 3,
//           },
//           bg_plot: { title: "Background Color" },
//         },

//         inputs: [], // no inputs
//       };

//       return {
//         name: sI.name,
//         metainfo: meta,
//         constructor: function (context: any) {
//           // TV calls this on each bar; return the plots array
//           //@ts-ignore
//           this.main = (ctx: any) => userFn(ctx, PineJS);
//         },
//       };
//     })
//     .filter(Boolean) as any[];

//   return Promise.resolve(descriptors);
// };
