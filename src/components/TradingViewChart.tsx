import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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

// Map instrument names to CoinGecko coin IDs
const COINGECKO_ID_MAP: Record<string, string> = {
  Bitcoin: 'bitcoin',
  Ethereum: 'ethereum',
  Solana: 'solana',
  Ripple: 'ripple',
  Cardano: 'cardano',
  Dogecoin: 'dogecoin',
  Polkadot: 'polkadot',
  Polygon: 'matic-network',
}


async function fetchCandlestickData(symbol: string): Promise<CandlestickData<Time>[]> {
  const coinId = COINGECKO_ID_MAP[symbol] || 'bitcoin'
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY

  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=30&precision=full&x_cg_demo_api_key=${apiKey}`
  )

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  // CoinGecko OHLC format: [[timestamp_ms, open, high, low, close], ...]
  const ohlc: number[][] = await response.json()

  return ohlc.map((candle) => ({
    time: (Math.floor(candle[0] / 1000)) as Time,
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
  }))
}

export function TradingViewChart({ symbol = 'Bitcoin', height = 400 }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create chart once on mount
  useEffect(() => {
    if (!chartContainerRef.current) return

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

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    })
    seriesRef.current = series

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [height])

  // Fetch data when symbol changes and update the series
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchCandlestickData(symbol)
      .then((data) => {
        if (cancelled) return
        seriesRef.current?.setData(data)
        chartRef.current?.timeScale().fitContent()
        setIsLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to fetch candlestick data:', err)
        setError('Failed to load chart data')
        setIsLoading(false)
      })

    // Set up periodic updates — refetch OHLC data every 60 seconds
    // CoinGecko OHLC cache updates every 15 minutes, so 60s is a reasonable poll interval
    const interval = setInterval(async () => {
      try {
        const coinId = COINGECKO_ID_MAP[symbol] || 'bitcoin'
        const apiKey = import.meta.env.VITE_COINGECKO_API_KEY
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1&precision=full&x_cg_demo_api_key=${apiKey}`
        )
        if (!response.ok) return
        const ohlc: number[][] = await response.json()
        const latest = ohlc[ohlc.length - 1]
        if (latest && seriesRef.current) {
          seriesRef.current.update({
            time: (Math.floor(latest[0] / 1000)) as Time,
            open: latest[1],
            high: latest[2],
            low: latest[3],
            close: latest[4],
          })
        }
      } catch {
        // Silently ignore live update errors
      }
    }, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [symbol])

  return (
    <div className="relative w-full rounded-lg">
      <div ref={chartContainerRef} className="w-full rounded-lg" />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading chart data...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </div>
  )
}
