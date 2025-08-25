import { parseFullSymbol } from './helpers'
import { normalizeResolution, getWebSocketURL } from './config'

type SubCb = (bar: any) => void
const sockets: Record<string, WebSocket> = {}

export function subscribeOnStream(
  symbolInfo: any,
  resolution: string,
  onRealtimeCallback: SubCb,
  subscriberUID: string,
  onResetCacheNeededCallback: () => void,
  lastBar: any
) {
  // Minimal stub that simulates ticks (replace with real WS if you have one)
  const wsUrl = getWebSocketURL()
  try { sockets[subscriberUID]?.close() } catch {}
  // NOTE: Using a timer instead of WS to keep example self-running
  const int = setInterval(() => {
    const lastTime = lastBar?.time || Math.floor(Date.now()/1000)
    const nextTime = lastTime + 60 // fake 1min
    const close = (lastBar?.close || 100) + (Math.random()-0.5)*0.5
    const high = Math.max(close, (lastBar?.close || 100)) + Math.random()*0.3
    const low  = Math.min(close, (lastBar?.close || 100)) - Math.random()*0.3
    const bar = { time: nextTime, open: lastBar?.close || close, high, low, close, volume: Math.floor(100+Math.random()*100) }
    onRealtimeCallback(bar)
    lastBar = bar
  }, 1500) as unknown as any
  sockets[subscriberUID] = { close(){ clearInterval(int) } } as any
}

export function unsubscribeFromStream(subscriberUID: string) {
  try { sockets[subscriberUID]?.close() } catch {}
  delete sockets[subscriberUID]
}
