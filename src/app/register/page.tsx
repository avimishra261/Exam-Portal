import prisma from '@/lib/prisma';
import RegisterClient from './RegisterClient';

export default async function RegisterPage() {
  const batches = await prisma.batch.findMany({
    select: { id: true, name: true, isDefault: true },
    orderBy: { createdAt: 'desc' }
  });

  return <RegisterClient batches={batches} />;
}
