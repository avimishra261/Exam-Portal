import { PrismaClient } from '@prisma/client'

import path from 'path';

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL;
  
  // If the URL is a relative SQLite file path, convert it to an absolute path pointing to the prisma folder
  if (url && url.startsWith('file:./')) {
    const dbFileName = url.replace('file:./', '');
    const absolutePath = path.join(process.cwd(), 'prisma', dbFileName);
    url = `file:${absolutePath.replace(/\\/g, '/')}`;
  } else if (!url) {
    // Fallback if env variable is completely missing
    const absolutePath = path.join(process.cwd(), 'prisma', 'dev.db');
    url = `file:${absolutePath.replace(/\\/g, '/')}`;
  }

  return new PrismaClient({
    datasources: { db: { url } },
  });
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
