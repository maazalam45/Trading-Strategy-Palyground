import { useEffect, useRef, useState } from "react";
import { loadTradingView } from "../lib/tvLoader";
import { LIBRARY_PATH } from "../config/tv";
import Datafeed from "../external/datafeed";
import { customIndicatorsGetter } from "../components/Indecators/FractalIndecator";

export function useTradingView(
  containerId: string,
  symbol: string,
  interval: string,
  extra?: Record<string, any>
) {
  const widgetRef = useRef<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadTradingView();
        if (!mounted) return;

        (window as any).savedIndicators = (window as any).savedIndicators ?? [];
        (window as any).savedIndicators.push({
          name: "C1–C2–C3 Helper (HTF Bias + T-zone + LTF Signals)",
          code: `
    // Example minimal body — replace with your compiled JS that returns plots[]
    // Access inputs via htf, swLen, showZone, showMid, useBody, showSigs, showLabels
    const close = PineJS.Std.close(context);
    // return plots matching the metainfo.plots order:
    return {
      plots: [
        close,          // plot_0
        close - 0.001,  // plot_1
        NaN,            // plot_2 (shapes) => use numeric index or NaN
        2               // bg_plot palette index: 0 Buy, 1 Sell, 2 Neutral
      ]
    };
  `,
        });
        const TV = (window as any).TradingView;
        const WidgetCtor = TV.ChartingLibraryWidget || TV.widget;
        const widget = new WidgetCtor({
          container: containerId,
          library_path: LIBRARY_PATH,
          autosize: true,
          theme: "Dark",
          locale: "en",
          symbol,
          interval,
          datafeed: Datafeed, // <-- cleaned datafeed (pure module, no DOM)
          // disabled_features: ["use_localstorage_for_settings"],
          enabled_features: [],

          custom_indicators_getter: customIndicatorsGetter,
          // any extras preserved
          ...extra,
        });
        (widget.onChartReady || widget.onready)?.(
          () => mounted && setReady(true)
        );
        widgetRef.current = widget;
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load TradingView");
      }
    })();

    return () => {
      mounted = false;
      try {
        widgetRef.current?.remove?.();
      } catch {}
      widgetRef.current = null;
    };
  }, [containerId, symbol, interval]);

  return { widget: widgetRef.current, ready, error };
}
