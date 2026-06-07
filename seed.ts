import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create or get the default batch
  let defaultBatch = await prisma.batch.findUnique({
    where: { name: 'General Batch' }
  });

  if (!defaultBatch) {
    defaultBatch = await prisma.batch.create({
      data: {
        name: 'General Batch',
        isDefault: true
      }
    });
    console.log('Created Default Batch:', defaultBatch.name);
  }

  // 2. Migrate existing users (Set status to APPROVED and add to default batch)
  const existingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' }
  });

  if (existingUsers.length > 0) {
    await prisma.user.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'APPROVED', batchId: defaultBatch.id }
    });
    console.log(`Migrated ${existingUsers.length} existing users to APPROVED state.`);
  }

  // 3. Setup the new admin avimishra261@gmail.com
  const adminEmail = 'avimishra261@gmail.com';
  let newAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (newAdmin) {
    // Ensure they are admin
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN', isSuperAdmin: true, status: 'APPROVED' }
    });
    console.log(`Updated ${adminEmail} to ADMIN.`);
  } else {
    // Create new admin
    const hashedPassword = await bcrypt.hash('password', 10);
    newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Avi',
        lastName: 'Mishra',
        role: 'ADMIN',
        isSuperAdmin: true,
        status: 'APPROVED',
        batchId: defaultBatch.id
      }
    });
    console.log(`Created new admin: ${adminEmail}`);
  }

  // 4. Optionally, demote or delete the old admin (admin@examportal.local)
  const oldAdmin = await prisma.user.findUnique({ where: { email: 'admin@examportal.local' }});
  if (oldAdmin) {
    await prisma.user.update({
      where: { id: oldAdmin.id },
      data: { isSuperAdmin: false, role: 'STUDENT' }
    });
    console.log('Demoted old admin.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
