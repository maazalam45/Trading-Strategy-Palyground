import React from 'react'
import { useTradingView } from '../hooks/useTradingView'

type Props = { id: string, symbol: string, interval: string }

export default function TVPane({ id, symbol, interval }: Props) {
  const { error } = useTradingView(id, symbol, interval)

  return (
    <div className="cell">
      <div className="header">
        <span className="pill">{symbol}</span>
        <span className="pill">{interval}</span>
        <span className="pill">Advanced Charts</span>
      </div>
      {/* {error && <div className="error">Error: {error}</div>} */}
      <div id={id} style={{ position: 'absolute', inset: 0,marginTop:"50px" }} />
    </div>
  )
}
