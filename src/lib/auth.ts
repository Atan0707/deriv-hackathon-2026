import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [tanstackStartCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Create a wallet with 100 balance for every new user
          await prisma.wallet.create({
            data: {
              userId: user.id,
              balance: 100,
              updatedAt: new Date(),
            },
          })
        },
      },
    },
  },
})
