import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/')({
  component: App,
})

// Hardcoded data
const portfolioData = {
  networth: 100,
  holdingsPnl: -50,
  holdings: [
    { name: 'sol', balance: 100, currentPrice: 150, value: 15000, pnl: 2500 },
    { name: 'btc', balance: 0.5, currentPrice: 45000, value: 22500, pnl: 5000 },
    { name: 'xrp', balance: 5000, currentPrice: 0.5, value: 2500, pnl: -500 },
  ],
}

function App() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Networth */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Networth</p>
                <p className="text-3xl font-bold">${portfolioData.networth}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Holdings P&L</p>
                <p className={`text-3xl font-bold ${portfolioData.holdingsPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioData.holdingsPnl >= 0 ? '+' : ''}{portfolioData.holdingsPnl < 0 ? '-' : ''}${Math.abs(portfolioData.holdingsPnl)}
                </p>
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
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.holdings.map((holding) => (
                  <TableRow key={holding.name}>
                    <TableCell className="font-medium">{holding.name}</TableCell>
                    <TableCell className="text-right">{holding.balance}</TableCell>
                    <TableCell className="text-right">${holding.currentPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${holding.value.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-semibold ${holding.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${holding.pnl.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
