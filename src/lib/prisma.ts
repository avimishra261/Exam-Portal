import { PrismaClient } from '@prisma/client'
import path from 'path';

// FORCE the environment variable into the Node process so Prisma's engine ALWAYS sees it
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
process.env.DATABASE_URL = `file:${dbPath}`;

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobalUltimate: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobalUltimate ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobalUltimate = prisma
