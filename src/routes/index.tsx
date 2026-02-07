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

export const Route = createFileRoute('/')({
  component: App,
})

const COIN_MAP: Record<string, string> = {
  sol: 'solana',
  btc: 'bitcoin',
  xrp: 'ripple',
}

interface PriceData {
  [coinId: string]: {
    usd: number
  }
}

interface Holding {
  name: string
  balance: number
  currentPrice: number
  value: number
  pnl: number
}

// Hardcoded holdings - only currentPrice will be fetched from API
const HOLDINGS_DATA: Omit<Holding, 'currentPrice'>[] = [
  { name: 'sol', balance: 100, value: 15000, pnl: 2500 },
  { name: 'btc', balance: 0.5, value: 22500, pnl: 5000 },
  { name: 'xrp', balance: 5000, value: 2500, pnl: -500 },
]

// Fetcher function for TanStack Query
async function fetchPrices(): Promise<PriceData> {
  const coinIds = Object.values(COIN_MAP).join(',')
  const apiKey = import.meta.env.VITE_COINGECKO_API_KEY
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&x_cg_demo_api_key=${apiKey}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch prices')
  }
  return response.json()
}

function App() {
  const { data: session, isPending } = authClient.useSession()

  // Use TanStack Query with caching
  const { data: priceData, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['crypto-prices'],
    queryFn: fetchPrices,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
    refetchInterval: 60000, // Refetch every minute
  })

  // Calculate holdings with current prices
  const holdings = priceData
    ? HOLDINGS_DATA.map((holding) => {
        const coinId = COIN_MAP[holding.name]
        const currentPrice = priceData[coinId]?.usd || 0
        return { ...holding, currentPrice }
      })
    : []

  // Calculate totals from hardcoded data
  const networth = HOLDINGS_DATA.reduce((sum, h) => sum + h.value, 0)
  const holdingsPnl = HOLDINGS_DATA.reduce((sum, h) => sum + h.pnl, 0)

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
        {/* Left Column - Networth */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Networth</p>
                {isLoadingPrices ? (
                  <p className="text-3xl font-bold text-muted-foreground">Loading...</p>
                ) : (
                  <p className="text-3xl font-bold">${networth.toLocaleString()}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Holdings P&L</p>
                {isLoadingPrices ? (
                  <p className="text-3xl font-bold text-muted-foreground">Loading...</p>
                ) : (
                  <p className={`text-3xl font-bold ${holdingsPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holdingsPnl >= 0 ? '+' : ''}{holdingsPnl < 0 ? '-' : ''}${Math.abs(holdingsPnl).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Portfolio and Market */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Section */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-full border-4 border-primary mx-auto max-w-[200px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pi Chart</p>
                  <p className="text-xs text-muted-foreground">Holdings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Section */}
          <Card>
            <CardHeader>
              <CardTitle>Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-muted-foreground">Market Analysis based on Holdings</p>
              </div>
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
                  <TableHead className="w-[15%]">Name</TableHead>
                  <TableHead className="w-[20%] text-right">Balance</TableHead>
                  <TableHead className="w-[20%] text-right">Current Price</TableHead>
                  <TableHead className="w-[20%] text-right">Value</TableHead>
                  <TableHead className="w-[25%] text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingPrices ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading prices...
                    </TableCell>
                  </TableRow>
                ) : (
                  holdings.map((holding) => (
                    <TableRow key={holding.name}>
                      <TableCell className="font-medium">{holding.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{holding.balance}</TableCell>
                      <TableCell className="text-right tabular-nums">${holding.currentPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">${holding.value.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toLocaleString()}
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
