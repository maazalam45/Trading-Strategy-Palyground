import { useEffect, useRef, useState } from "react";
import { loadTradingView } from "../lib/tvLoader";
import { LIBRARY_PATH } from "../config/tv";
import Datafeed from "../external/datafeed";

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
