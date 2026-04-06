import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

/**
 * Prisma v7 requires a driver adapter for all databases.
 * For local SQLite we use @prisma/adapter-libsql.
 * DATABASE_URL must be set to: file:./dev.db
 */
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
})

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.__prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma

export default prisma
