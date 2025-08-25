// Defaults
export const DEFAULT_SYMBOL = 'EURUSD'  // match your working demo
export const DEFAULT_INTERVAL = '15'

// Where static assets (fonts/css) are, if any. This does not need to host JS bundle.
export const LIBRARY_PATH = '/charting_library/'

// Hardcoded script candidates (NO entry file required). First one wins.
export const SCRIPT_CANDIDATES: string[] = [
  // Prefer your local /external folder first:
  '/js/chartingLib/charting_library.standalone.js',
  '/external/bundles/charting_library.js',
  // If you also expose it via Laravel public path:
  '/charting_library/bundles/charting_library.js',
  '/charting_library/charting_library.js',
  '/external/bundles/tv-chart.min.js',
];
