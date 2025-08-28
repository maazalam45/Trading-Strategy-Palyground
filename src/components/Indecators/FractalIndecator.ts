// FractalIndecator.ts
export const customIndicatorsGetter = (PineJS: any) => {
  // Fallback to an empty array if nothing has been registered yet
  const listRaw: any = (window as any).savedIndicators;
  const list: any[] = Array.isArray(listRaw)
    ? listRaw
    : listRaw
      ? [listRaw]
      : [];

  if (list.length === 0) {
    console.warn(
      "[custom_indicators_getter] window.savedIndicators is empty/undefined — returning no custom indicators."
    );
    // TradingView expects an array (or Promise resolving to an array)
    return Promise.resolve([]);
  }

  // Build indicators
  const descriptors = list
    .map((sI: any, idx: number) => {
      if (!sI?.name || !sI?.code) {
        console.error("[custom_indicators_getter] Invalid entry at", idx, sI);
        return null;
      }

      const userFactory = new Function(
        "PineJS",
        `
        return function customIndicator(context, input) {
          // Read inputs by index (order must match metainfo.inputs)
          const htf        = input(0);
          const swLen      = input(1);
          const showZone   = input(2);
          const showMid    = input(3);
          const useBody    = input(4);
          const showSigs   = input(5);
          const showLabels = input(6);

          ${sI.code} // must return { plots:[...], ... }
        }
      `
      );

      const userFn = userFactory(PineJS);
      console.log(
        `[custom_indicators_getter] Loaded "${sI.name}" at index ${idx}`
      );
      const meta = {
        _metainfoVersion: 55,
        id: `${sI.name}@tv-basicstudies-1`, // <-- important suffix
        name: sI.name, // <-- must match what you want in list
        description: sI.name,
        shortDescription: sI.name,
        isCustomIndicator: true,
        is_price_study: true,
        is_hidden_study: false, // <-- ensure listed
        packageId: "my-custom", // <-- groups in the dialog
        packageName: "My Custom Indicators",
        format: { type: "price", precision: 5 },

        plots: [
          { id: "plot_0", type: "line" },
          { id: "plot_1", type: "line" },
          { id: "plot_2", type: "shapes", target: "plot_0" },
          { id: "bg_plot", type: "bg_colorer", palette: "palette_0" },
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

        inputs: [
          {
            id: "htf",
            name: "Higher TF (C1/C2/C3)",
            type: "text",
            defval: "D",
          },
          {
            id: "swLen",
            name: "LTF Pivot Length",
            type: "integer",
            defval: 3,
            min: 2,
          },
          {
            id: "showZone",
            name: "Show T-zone box",
            type: "bool",
            defval: true,
          },
          { id: "showMid", name: "Plot 50% of C2", type: "bool", defval: true },
          { id: "useBody", name: "50% of C2 body", type: "bool", defval: true },
          {
            id: "showSigs",
            name: "Show L/S signals",
            type: "bool",
            defval: true,
          },
          {
            id: "showLabels",
            name: "Show bias labels",
            type: "bool",
            defval: true,
          },
        ],
      };

      return {
        name: sI.name, // keep same as meta.name
        metainfo: meta,
        constructor: function (context: any, input: any) {
          //@ts-ignore
          this.main = (ctx: any, inp: any) => userFn(ctx, inp, PineJS);
        },
      };

      //   return {
      //     name: sI.name,
      //     metainfo: meta,
      //     constructor: function (context: any, input: any) {
      //       // TV calls this; we must return plots each bar
      //       this.main = (ctx: any, inp: any) => userFn(ctx, inp, PineJS);
      //     },
      //   };
    })
    .filter(Boolean) as any[];

  return Promise.resolve(descriptors);
};
