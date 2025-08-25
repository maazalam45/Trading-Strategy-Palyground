# trading-strategy-playground — Clean React Refactor (uses your external library)

This refactor takes the scattered Laravel-style code and organizes it for React:

- **Single loader** that tries a fixed list of script locations (no entry / no env needed).
- **Pure `Datafeed` module** in `src/external/` (no DOM dependencies).
- **React hook** `useTradingView` for widget lifecycle (works with `ChartingLibraryWidget` or `widget`).
- **Small `TVPane` component**.
- Minimal single chart page; add grid later if you want.

## Expected TradingView paths (no config needed)

By default the loader will try the following in order:

1. `/public/js/chartingLib/charting_library.standalone.js`   ← your current working path
2. `/external/bundles/charting_library.js`
3. `/charting_library/bundles/charting_library.js`
4. `/charting_library/charting_library.js`
5. `/external/bundles/tv-chart.min.js`

If the first one exists on your server, everything works without changes.

## Run
```bash
npm i
npm run dev
```

## Where we cleaned code

- `src/external/config.ts` — replaces DOM-heavy `script.js` with just **config/helpers** (endpoints, resolution mapping).
- `src/external/helpers.ts` — `getBarsApiRequest`, `getSymbolDetailsApiRequest`, `parseFullSymbol`.
- `src/external/streaming.ts` — minimal streaming stub (timer). Replace with real WS later.
- `src/external/datafeed.ts` — Datafeed API implementation, imports helpers/streaming only.
- `src/lib/tvLoader.ts` — loads your external script from known path(s). No entry config required.
- `src/hooks/useTradingView.ts` — creates/removes widget; plugs `Datafeed`.
- `src/components/TVPane.tsx` — tiny view component.

## Notes

- Replace endpoints in `src/external/config.ts` with your real services.
- If you already have a working WebSocket, implement it in `streaming.ts` and remove the timer.
- Styling is minimal & clean; tweak `src/styles.css` as you wish.

MIT license for the refactor scaffolding.
