import { createContext, useContext, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { MessageSquare, ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SwarmContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SwarmContext = createContext<SwarmContextType | undefined>(undefined)

export const useSwarm = () => {
  const context = useContext(SwarmContext)
  if (!context) {
    throw new Error('useSwarm must be used within SwarmSidebarProvider')
  }
  return context
}

const SwarmSidebarInner = () => {
  const { isOpen, toggle, close } = useSwarm()

  return (
    <>
      {/* Toggle Button - always visible, smoothly animates position */}
      <Button
        onClick={toggle}
        className={`fixed top-24 z-50 transition-all duration-500 ease-in-out ${
          isOpen ? 'right-80' : 'right-4'
        }`}
        size="icon"
        variant="outline"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
      </Button>

      {/* Sidebar - slides in from right */}
      <div
        className={`
          fixed top-16 right-0 bottom-0 w-80 z-30
          transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <Card className="h-full flex flex-col rounded-none border-l border-gray-200/50 shadow-xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Swarm Assistant</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={close}
              className="h-8 w-8 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Swarm chatbot coming soon...</p>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200/50">
            <input
              type="text"
              placeholder="Ask Swarm..."
              disabled
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </Card>
      </div>
    </>
  )
}

export const SwarmSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SwarmContext.Provider value={{ isOpen, toggle: () => setIsOpen(!isOpen), close: () => setIsOpen(false) }}>
      <div className={`transition-[padding-right] duration-500 ease-in-out ${isOpen ? 'pr-80' : 'pr-0'}`}>
        {children}
      </div>
      <SwarmSidebarInner />
    </SwarmContext.Provider>
  )
}

const SwarmSidebar = () => {
  return null // Sidebar is now rendered inside the provider
}

export default SwarmSidebar
