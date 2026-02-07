import { useEffect, useRef } from 'react'
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts'

interface TradingViewChartProps {
  symbol?: string
  height?: number
}

// Generate sample historical candlestick data
function generateCandlestickData(symbol: string): CandlestickData<Time>[] {
  const data: CandlestickData<Time>[] = []
  const now = new Date()
  let price = symbol.includes('Bitcoin')
    ? 45000
    : symbol.includes('Ethereum')
      ? 3200
      : symbol.includes('Solana')
        ? 150
        : symbol.includes('Ripple')
          ? 0.5
          : symbol.includes('Cardano')
            ? 0.45
            : symbol.includes('Dogecoin')
              ? 0.08
              : symbol.includes('Polkadot')
                ? 7.2
                : 0.85

  for (let i = 0; i < 500; i++) {
    const date = new Date(now)
    date.setHours(date.getHours() - (500 - i))

    const volatility = price * 0.02
    const change = (Math.random() - 0.5) * volatility

    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    data.push({
      time: (Math.floor(date.getTime() / 1000)) as Time,
      open,
      high,
      low,
      close,
    })
    price = close
  }

  return data
}

export function TradingViewChart({ symbol = 'Bitcoin', height = 400 }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#334155',
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 213, 0.3)' },
        horzLines: { color: 'rgba(197, 203, 213, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 213, 0.8)',
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 213, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    })

    chartRef.current = chart

    // Add candlestick series using v5 API
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    })
    seriesRef.current = series

    // Set candlestick data
    series.setData(generateCandlestickData(symbol))

    // Fit content to view
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height, symbol])

  return <div ref={chartContainerRef} className="w-full rounded-lg" />
}
