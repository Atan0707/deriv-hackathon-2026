import { createServerFn } from '@tanstack/react-start'
import { prisma } from '@/db'


export const ensureWallet = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const existing = await prisma.wallet.findUnique({
      where: { userId: data.userId },
    })

    if (existing) {
      return existing
    }

    // Create wallet with 100 initial balance for users who don't have one
    const wallet = await prisma.wallet.create({
      data: {
        userId: data.userId,
        balance: 100,
        updatedAt: new Date(),
      },
    })

    return wallet
  })

/**
 * Fetches the wallet for a given user.
 */
export const getWallet = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: data.userId },
    })

    return wallet
  })
