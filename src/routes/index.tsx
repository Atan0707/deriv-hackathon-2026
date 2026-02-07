import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { authClient } from '@/lib/auth-client'
import { AuthDialog } from '@/components/AuthDialog'
import { useQuery } from '@tanstack/react-query'
import { ensureWallet } from '@/data/wallet'
import { getUserHoldings, getTradeHistory } from '@/data/trading'
import { useMemo } from 'react'

export const Route = createFileRoute('/')({
  component: App,
})

// Map ticker symbols to CoinGecko IDs for price fetching
const TICKER_TO_COINGECKO: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
}

interface PriceData {
  [coinId: string]: {
    usd: number
  }
}

// Fetcher function for TanStack Query - dynamically fetch prices for held coins
async function fetchPrices(coinIds: string[]): Promise<PriceData> {
  if (coinIds.length === 0) return {}
  const ids = coinIds.join(',')
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`,
  )
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}

function App() {
  const { data: session, isPending } = authClient.useSession()

  // Ensure wallet exists for the logged-in user
  const { data: walletData, isLoading: isLoadingWallet } = useQuery({
    queryKey: ['wallet', session?.user?.id],
    queryFn: () => ensureWallet({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
    staleTime: 30000,
  })

  // Fetch user holdings from DB
  const { data: holdingsData, isLoading: isLoadingHoldings } = useQuery({
    queryKey: ['holdings', session?.user?.id],
    queryFn: () => getUserHoldings({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
    staleTime: 30000,
  })

  // Fetch trade history
  const { data: tradeHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['trade-history', session?.user?.id],
    queryFn: () => getTradeHistory({ data: { userId: session!.user.id } }),
    enabled: !!session?.user?.id,
    staleTime: 30000,
  })

  // Determine which CoinGecko IDs to fetch prices for
  const coinIdsToFetch = useMemo(() => {
    if (!holdingsData || holdingsData.length === 0) return []
    return holdingsData
      .map((h) => TICKER_TO_COINGECKO[h.symbol])
      .filter(Boolean)
  }, [holdingsData])

  // Fetch live prices for held coins
  const { data: priceData, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['crypto-prices', coinIdsToFetch],
    queryFn: () => fetchPrices(coinIdsToFetch),
    enabled: coinIdsToFetch.length > 0,
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: 60000,
  })

  // Combine holdings with live prices
  const enrichedHoldings = useMemo(() => {
    if (!holdingsData) return []
    return holdingsData.map((h) => {
      const coinId = TICKER_TO_COINGECKO[h.symbol]
      const currentPrice = priceData?.[coinId]?.usd ?? 0
      const currentValue = h.quantity * currentPrice
      const pnl = currentValue - h.totalCost
      return {
        symbol: h.symbol,
        quantity: h.quantity,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice,
        currentValue,
        totalCost: h.totalCost,
        pnl,
      }
    })
  }, [holdingsData, priceData])

  // Calculate portfolio totals
  const networth = useMemo(() => {
    return enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0)
  }, [enrichedHoldings])

  const holdingsPnl = useMemo(() => {
    return enrichedHoldings.reduce((sum, h) => sum + h.pnl, 0)
  }, [enrichedHoldings])

  const isLoading = isLoadingHoldings || isLoadingPrices

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
              Please log in first to view your portfolio.
            </p>
            <AuthDialog />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Networth & Wallet */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Wallet Balance
                </p>
                {isLoadingWallet ? (
                  <p className="text-3xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">
                    ${walletData?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Networth</p>
                {isLoading ? (
                  <p className="text-3xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p className="text-3xl font-bold">
                    ${networth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Holdings P&L
                </p>
                {isLoading ? (
                  <p className="text-3xl font-bold text-muted-foreground">
                    Loading...
                  </p>
                ) : (
                  <p
                    className={`text-3xl font-bold ${holdingsPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {holdingsPnl >= 0 ? '+' : '-'}$
                    {Math.abs(holdingsPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Portfolio and Recent Trades */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Section */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {enrichedHoldings.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No holdings yet. Go to the Market page to start trading!</p>
                </div>
              ) : (
                <div className="aspect-square rounded-full border-4 border-primary mx-auto max-w-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Pi Chart</p>
                    <p className="text-xs text-muted-foreground">Holdings</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Trades */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : !tradeHistory || tradeHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No trades yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tradeHistory.slice(0, 10).map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(trade.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              trade.type === 'buy'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{trade.symbol}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {trade.quantity.toFixed(6)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          ${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          ${trade.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[12%]">Symbol</TableHead>
                  <TableHead className="w-[15%] text-right">Quantity</TableHead>
                  <TableHead className="w-[15%] text-right">Avg Buy Price</TableHead>
                  <TableHead className="w-[15%] text-right">Current Price</TableHead>
                  <TableHead className="w-[15%] text-right">Cost Basis</TableHead>
                  <TableHead className="w-[15%] text-right">Value</TableHead>
                  <TableHead className="w-[13%] text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      Loading holdings...
                    </TableCell>
                  </TableRow>
                ) : enrichedHoldings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No holdings yet. Start trading to see your portfolio here.
                    </TableCell>
                  </TableRow>
                ) : (
                  enrichedHoldings.map((holding) => (
                    <TableRow key={holding.symbol}>
                      <TableCell className="font-medium">
                        {holding.symbol}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {holding.quantity.toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${holding.avgBuyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${holding.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${holding.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        ${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {holding.pnl >= 0 ? '+' : '-'}$
                        {Math.abs(holding.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
