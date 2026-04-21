import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './seed.utils';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_SUPER_ADMIN_USERNAME || 'admin';
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@123456';
  const nickname = process.env.SEED_SUPER_ADMIN_NICKNAME || 'Super Admin';

  const existing = await prisma.adminUser.findUnique({
    where: {
      username
    }
  });

  if (existing) {
    await prisma.adminUser.update({
      where: {
        id: existing.id
      },
      data: {
        nickname,
        role: 'super_admin',
        status: 'enabled'
      }
    });

    console.log(`Super admin already exists: ${username}`);
    return;
  }

  await prisma.adminUser.create({
    data: {
      username,
      passwordHash: await hashPassword(password),
      nickname,
      role: 'super_admin',
      status: 'enabled'
    }
  });

  console.log(`Super admin created: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
