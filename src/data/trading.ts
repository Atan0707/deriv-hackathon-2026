import { createServerFn } from '@tanstack/react-start'
import { prisma } from '@/db'

/**
 * Execute a buy or sell trade.
 * - Buy: deducts total from wallet balance, records a "buy" entry
 * - Sell: adds total to wallet balance, records a "sell" entry
 */
export const executeTrade = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (data: {
      userId: string
      symbol: string
      quantity: number
      price: number
      type: 'buy' | 'sell'
    }) => data,
  )
  .handler(async ({ data }) => {
    const { userId, symbol, quantity, price, type } = data
    const total = quantity * price

    // Get or create wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 100,
          updatedAt: new Date(),
        },
      })
    }

    if (type === 'buy') {
      // Check sufficient balance
      if (wallet.balance < total) {
        throw new Error(
          `Insufficient balance. You have $${wallet.balance.toFixed(2)} but need $${total.toFixed(2)}.`,
        )
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: { decrement: total },
          updatedAt: new Date(),
        },
      })
    } else {
      // Sell: check if user has enough of this asset to sell
      const holdings = await prisma.buyAndSellHistory.findMany({
        where: { userId, symbol, status: 'completed' },
      })

      const netQuantity = holdings.reduce((sum, h) => {
        return h.type === 'buy' ? sum + h.quantity : sum - h.quantity
      }, 0)

      if (netQuantity < quantity) {
        throw new Error(
          `Insufficient holdings. You have ${netQuantity.toFixed(6)} ${symbol} but tried to sell ${quantity.toFixed(6)}.`,
        )
      }

      // Add to wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: { increment: total },
          updatedAt: new Date(),
        },
      })
    }

    // Record the trade
    const trade = await prisma.buyAndSellHistory.create({
      data: {
        userId,
        symbol,
        quantity,
        price,
        total,
        type,
        status: 'completed',
      },
    })

    // Fetch updated wallet
    const updatedWallet = await prisma.wallet.findUnique({
      where: { userId },
    })

    return { trade, wallet: updatedWallet }
  })

/**
 * Get trade history for a user.
 */
export const getTradeHistory = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const history = await prisma.buyAndSellHistory.findMany({
      where: { userId: data.userId },
      orderBy: { createdAt: 'desc' },
    })

    return history
  })

/**
 * Get aggregated holdings for a user.
 * Computes the net quantity and average buy price for each symbol.
 */
export const getUserHoldings = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const trades = await prisma.buyAndSellHistory.findMany({
      where: { userId: data.userId, status: 'completed' },
      orderBy: { createdAt: 'asc' },
    })

    // Aggregate by symbol
    const holdingsMap = new Map<
      string,
      { quantity: number; totalCost: number }
    >()

    for (const trade of trades) {
      const existing = holdingsMap.get(trade.symbol) || {
        quantity: 0,
        totalCost: 0,
      }

      if (trade.type === 'buy') {
        existing.totalCost += trade.total
        existing.quantity += trade.quantity
      } else {
        // On sell, reduce quantity and proportionally reduce cost basis
        const costPerUnit =
          existing.quantity > 0 ? existing.totalCost / existing.quantity : 0
        existing.quantity -= trade.quantity
        existing.totalCost = existing.quantity * costPerUnit
      }

      holdingsMap.set(trade.symbol, existing)
    }

    // Convert to array, filtering out zero-quantity holdings
    const holdings = Array.from(holdingsMap.entries())
      .filter(([, data]) => data.quantity > 0.000001) // Filter near-zero
      .map(([symbol, data]) => ({
        symbol,
        quantity: data.quantity,
        avgBuyPrice: data.quantity > 0 ? data.totalCost / data.quantity : 0,
        totalCost: data.totalCost,
      }))

    return holdings
  })
