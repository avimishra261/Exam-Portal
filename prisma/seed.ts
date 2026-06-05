import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } },
})

async function main() {
  const adminEmail = 'admin@examportal.local'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const hashedPassword = await bcrypt.hash('password', 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isSuperAdmin: true
      }
    })
    console.log('Seeded Super Admin user:', adminEmail)
  } else if (!existing.isSuperAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isSuperAdmin: true }
    })
    console.log('Updated existing admin to Super Admin')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
