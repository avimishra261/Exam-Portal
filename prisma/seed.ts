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
        isSuperAdmin: true,
        status: 'APPROVED'
      }
    })
    console.log('Seeded Super Admin user:', adminEmail)
  } else if (!existing.isSuperAdmin) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { isSuperAdmin: true, status: 'APPROVED' }
    })
    console.log('Updated existing admin to Super Admin')
  }

  // Seed Test 1: CS Mock
  const csTestExists = await prisma.exam.findFirst({ where: { title: 'CS 1 Computer Science and Information Technology Mock' } })
  if (!csTestExists) {
    await prisma.exam.create({
      data: {
        title: 'CS 1 Computer Science and Information Technology Mock',
        description: 'A mock test mimicking the exact layout of the GATE CS exam.',
        durationMinutes: 180,
        fullscreenChances: 5,
        maxAttempts: 3,
        createdById: existing?.id,
        questions: {
          create: [
            {
              text: 'The average marks obtained by a class in an examination were calculated as 30.8. However, while checking the marks entered, the teacher found that the marks of one student were entered incorrectly as 24 instead of 42. After correcting the marks, the average becomes 31.4. How many students does the class have?',
              type: 'MCQ',
              maxMarks: 1,
              options: {
                create: [
                  { text: '25', isCorrect: false },
                  { text: '30', isCorrect: true },
                  { text: '32', isCorrect: false },
                  { text: '28', isCorrect: false },
                ]
              }
            },
            {
              text: 'Which of the following is NOT a valid state in a process state transition diagram?',
              type: 'MCQ',
              maxMarks: 1,
              options: {
                create: [
                  { text: 'Running', isCorrect: false },
                  { text: 'Waiting', isCorrect: false },
                  { text: 'Suspended Ready', isCorrect: false },
                  { text: 'Sleeping', isCorrect: true },
                ]
              }
            },
            {
              text: 'Calculate the value of lim x->0 (sin x) / x',
              type: 'NAT',
              maxMarks: 2,
              correctNumeric: 1
            }
          ]
        }
      }
    })
    console.log('Seeded CS Mock Test')
  }

  // Seed Test 2: General Aptitude Mock
  const aptTestExists = await prisma.exam.findFirst({ where: { title: 'General Aptitude Mock Test' } })
  if (!aptTestExists) {
    await prisma.exam.create({
      data: {
        title: 'General Aptitude Mock Test',
        description: 'Practice test for the General Aptitude section.',
        durationMinutes: 60,
        fullscreenChances: 5,
        maxAttempts: 3,
        createdById: existing?.id,
        questions: {
          create: [
            {
              text: 'If A = B and B = C, then A = C.',
              type: 'MCQ',
              maxMarks: 1,
              options: {
                create: [
                  { text: 'True', isCorrect: true },
                  { text: 'False', isCorrect: false },
                ]
              }
            },
            {
              text: 'What is 15% of 200?',
              type: 'NAT',
              maxMarks: 1,
              correctNumeric: 30
            }
          ]
        }
      }
    })
    console.log('Seeded General Aptitude Mock Test')
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
