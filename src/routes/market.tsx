import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { AuthDialog } from '@/components/AuthDialog'
import { useState } from 'react'

export const Route = createFileRoute('/market')({
  component: Market,
})

// Hardcoded instrument data
const instruments = [
  { name: 'Bitcoin', value: '$45,000' },
  { name: 'Ethereum', value: '$3,200' },
  { name: 'Solana', value: '$150' },
  { name: 'Ripple', value: '$0.50' },
  { name: 'Cardano', value: '$0.45' },
  { name: 'Dogecoin', value: '$0.08' },
  { name: 'Polkadot', value: '$7.20' },
  { name: 'Polygon', value: '$0.85' },
]

function Market() {
  const { data: session, isPending } = authClient.useSession()
  const [selectedInstrument, setSelectedInstrument] = useState(instruments[0].name)
  const [aiContent, setAiContent] = useState('')

  const getSelectedInstrumentValue = () => {
    return instruments.find(i => i.name === selectedInstrument)?.value || ''
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
      <div className="flex flex-col  gap-6">
        {/* Instrument Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {instruments.map((instrument) => (
              <option key={instrument.name} value={instrument.name}>
                {instrument.name}
              </option>
            ))}
          </select>
          <span className="text-lg font-semibold text-gray-900">
            {getSelectedInstrumentValue()}
          </span>
        </div>
        {/* Chart Card */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex gap-6">
              {/* Chart Section */}
              <div className="flex-1 h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-400">Chart here</p>
              </div>

              {/* Buy/Sell Buttons */}
              <div className="flex flex-col gap-3 justify-center">
                <button className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                  BUY
                </button>
                <button className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                  SELL
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Market Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">ai content summarizing market trends for {selectedInstrument} will go here.</p>
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
              className="w-full min-h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Want to post on X?</span>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Yes
                </button>
                <button className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">
                  No
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
