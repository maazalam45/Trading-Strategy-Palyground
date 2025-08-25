import { SCRIPT_CANDIDATES } from '../config/tv'

/**
 * Loads TradingView JS once. No entry file, no env required.
 * It will try a small, fixed list of locations (matching your current setup).
 */
export function loadTradingView(): Promise<void> {
  if ((window as any).TradingView) return Promise.resolve()

  const queue = [...SCRIPT_CANDIDATES]

  return new Promise((resolve, reject) => {
    const next = () => {
      const src = queue.shift()
      if (!src) return reject(new Error('TradingView script not found at known locations'))
      inject(src)
    }

    const inject = (src: string) => {
      const s = document.createElement('script')
      s.src = src
      s.onload = () => (window as any).TradingView
        ? resolve()
        : reject(new Error('Loaded but window.TradingView missing'))
      s.onerror = () => next()
      document.body.appendChild(s)
    }

    next()
  })
}
