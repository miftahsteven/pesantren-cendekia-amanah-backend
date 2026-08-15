import { PrismaClient, AdminStatus } from '@prisma/client';
import { hashPassword } from '../common/utils/crypto.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cendekiaamanah.sch.id';
  const password = 'Admin123!';
  const name = 'Administrator Utama';

  const passwordHash = await hashPassword(password);

  let role = await prisma.role.findFirst({
    where: { code: { in: ['SUPER_ADMIN', 'SUPERADMIN', 'ADMIN'] } }
  });

  if (!role) {
    role = await prisma.role.create({
      data: {
        name: 'Super Administrator',
        code: 'SUPER_ADMIN',
        description: 'Akses penuh ke seluruh sistem'
      }
    });
  }

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      status: AdminStatus.ACTIVE,
      failedLoginCount: 0
    },
    create: {
      name,
      email,
      username: 'admin',
      passwordHash,
      status: AdminStatus.ACTIVE
    }
  });

  await prisma.adminUserRole.upsert({
    where: {
      adminUserId_roleId: {
        adminUserId: admin.id,
        roleId: role.id
      }
    },
    update: {},
    create: {
      adminUserId: admin.id,
      roleId: role.id
    }
  });

  console.log(`✅ Default admin created/updated successfully: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
