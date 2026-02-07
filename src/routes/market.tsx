import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import { AuthDialog } from '@/components/AuthDialog'
import { TradingViewChart } from '@/components/TradingViewChart'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/market')({
  component: Market,
})

// Map instrument names to CoinGecko IDs
const COIN_MAP: Record<string, string> = {
  Bitcoin: 'bitcoin',
  Ethereum: 'ethereum',
  Solana: 'solana',
  Ripple: 'ripple',
  Cardano: 'cardano',
  Dogecoin: 'dogecoin',
  Polkadot: 'polkadot',
  Polygon: 'matic-network',
}

const instruments = Object.keys(COIN_MAP)

// Ticker symbols for display
const TICKER_MAP: Record<string, string> = {
  Bitcoin: 'BTC',
  Ethereum: 'ETH',
  Solana: 'SOL',
  Ripple: 'XRP',
  Cardano: 'ADA',
  Dogecoin: 'DOGE',
  Polkadot: 'DOT',
  Polygon: 'MATIC',
}

interface PriceData {
  [coinId: string]: {
    usd: number
    usd_24h_change?: number
  }
}

// Fetcher function for CoinGecko prices
async function fetchMarketPrices(): Promise<PriceData> {
  const coinIds = Object.values(COIN_MAP).join(',')
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${apiKey}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}

function Market() {
  const { data: session, isPending } = authClient.useSession()
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0])
  const [amount, setAmount] = useState('')
  const [aiContent, setAiContent] = useState('')

  // Fetch live prices from CoinGecko
  const { data: priceData, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['market-prices'],
    queryFn: fetchMarketPrices,
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 30000,
  })

  // Get current price for selected instrument
  const currentPrice = useMemo(() => {
    if (!priceData) return null
    const coinId = COIN_MAP[selectedInstrument]
    return priceData[coinId]?.usd ?? null
  }, [priceData, selectedInstrument])

  // Get 24h change for selected instrument
  const priceChange24h = useMemo(() => {
    if (!priceData) return null
    const coinId = COIN_MAP[selectedInstrument]
    return priceData[coinId]?.usd_24h_change ?? null
  }, [priceData, selectedInstrument])

  // Calculate estimated total
  const estimatedTotal = useMemo(() => {
    const qty = parseFloat(amount)
    if (!qty || !currentPrice) return 0
    return qty * currentPrice
  }, [amount, currentPrice])

  const formatPrice = (price: number) => {
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  }

  if (isPending) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-6">
            <h2 className="text-2xl font-bold">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please log in first to view market data.
            </p>
            <AuthDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Instrument Selector + Price Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
            >
              {instruments.map((name) => (
                <option key={name} value={name}>
                  {name} ({TICKER_MAP[name]})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-3">
              {isLoadingPrices ? (
                <span className="text-2xl font-bold text-gray-400 animate-pulse">Loading...</span>
              ) : currentPrice !== null ? (
                <>
                  <span className="text-2xl font-bold text-gray-900 tabular-nums">
                    ${formatPrice(currentPrice)}
                  </span>
                  {priceChange24h !== null && (
                    <Badge
                      variant={priceChange24h >= 0 ? 'default' : 'destructive'}
                      className={`text-xs font-medium ${priceChange24h >= 0 ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}
                    >
                      {priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-400">--</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Chart + Trading Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chart Section - 3/4 width */}
          <Card className="lg:col-span-3">
            <CardContent className="p-4">
              <TradingViewChart symbol={selectedInstrument} height={480} />
            </CardContent>
          </Card>

          {/* Trading Panel - 1/4 width */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-0">
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 rounded-none rounded-t-xl h-12">
                    <TabsTrigger
                      value="buy"
                      className="rounded-none rounded-tl-xl h-full text-sm font-semibold data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-none cursor-pointer"
                    >
                      BUY
                    </TabsTrigger>
                    <TabsTrigger
                      value="sell"
                      className="rounded-none rounded-tr-xl h-full text-sm font-semibold data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-none cursor-pointer"
                    >
                      SELL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="mt-0">
                    <TradingForm
                      side="buy"
                      ticker={TICKER_MAP[selectedInstrument]}
                      currentPrice={currentPrice}
                      isLoadingPrice={isLoadingPrices}
                      amount={amount}
                      setAmount={setAmount}
                      estimatedTotal={estimatedTotal}
                      formatPrice={formatPrice}
                    />
                  </TabsContent>
                  <TabsContent value="sell" className="mt-0">
                    <TradingForm
                      side="sell"
                      ticker={TICKER_MAP[selectedInstrument]}
                      currentPrice={currentPrice}
                      isLoadingPrice={isLoadingPrices}
                      amount={amount}
                      setAmount={setAmount}
                      estimatedTotal={estimatedTotal}
                      formatPrice={formatPrice}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Market Analysis Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">AI content summarizing market trends for {selectedInstrument} will go here.</p>
          </CardContent>
        </Card>

        {/* AI Trading Content Generation */}
        <Card>
          <CardHeader>
            <CardTitle>AI Trading Content Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={aiContent}
              onChange={(e) => setAiContent(e.target.value)}
              placeholder="AI-generated trading content will appear here..."
              className="w-full min-h-32 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
            />
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Want to post on X?</span>
              <div className="flex gap-2">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Yes
                </Button>
                <Button size="sm" variant="outline">
                  No
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Reusable trading form component
function TradingForm({
  side,
  ticker,
  currentPrice,
  isLoadingPrice,
  amount,
  setAmount,
  estimatedTotal,
  formatPrice,
}: {
  side: 'buy' | 'sell'
  ticker: string
  currentPrice: number | null
  isLoadingPrice: boolean
  amount: string
  setAmount: (v: string) => void
  estimatedTotal: number
  formatPrice: (n: number) => string
}) {
  const isBuy = side === 'buy'
  const presetPercentages = [25, 50, 75, 100]

  return (
    <div className="p-4 space-y-4">
      {/* Market Price */}
      <div className="space-y-1">
        <Label className="text-xs text-gray-500 uppercase tracking-wide">Market Price</Label>
        {isLoadingPrice ? (
          <p className="text-lg font-semibold text-gray-400 animate-pulse">Loading...</p>
        ) : currentPrice !== null ? (
          <p className="text-lg font-semibold tabular-nums">${formatPrice(currentPrice)}</p>
        ) : (
          <p className="text-lg font-semibold text-gray-400">--</p>
        )}
      </div>

      <Separator />

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs text-gray-500 uppercase tracking-wide">
          Amount ({ticker})
        </Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tabular-nums text-base h-11"
          min="0"
          step="any"
        />
        {/* Preset buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {presetPercentages.map((pct) => (
            <button
              key={pct}
              onClick={() => {
                // For demo purposes, set some preset amount
                if (currentPrice) {
                  const budget = 10000 // hypothetical $10k budget
                  const qty = (budget * pct / 100) / currentPrice
                  setAmount(qty.toFixed(6))
                }
              }}
              className="text-xs py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium transition-colors cursor-pointer"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Order Summary */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Order type</span>
          <span className="font-medium">Market</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Amount</span>
          <span className="font-medium tabular-nums">
            {amount ? `${parseFloat(amount).toFixed(6)} ${ticker}` : `-- ${ticker}`}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Est. total</span>
          <span className="font-semibold tabular-nums">
            {estimatedTotal > 0 ? `$${formatPrice(estimatedTotal)}` : '--'}
          </span>
        </div>
      </div>

      <Separator />

      {/* Submit Button */}
      <Button
        className={`w-full h-12 text-base font-semibold cursor-pointer ${
          isBuy
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        disabled={!amount || parseFloat(amount) <= 0 || currentPrice === null}
      >
        {isBuy ? 'Buy' : 'Sell'} {ticker}
      </Button>

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-400 text-center leading-tight">
        Orders are simulated. No real transactions will be executed.
      </p>
    </div>
  )
}
