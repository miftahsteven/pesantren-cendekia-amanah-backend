import { PrismaClient, AdminStatus } from '@prisma/client';
import { hashPassword } from '../common/utils/crypto.js';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const email = 'admin@cendekiaamanah.sch.id';
  const password = 'B47054ii!';
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

  // Check if admin user already exists with username or email
  const existingUser = await prisma.adminUser.findFirst({
    where: {
      OR: [{ username }, { email }]
    }
  });

  let admin;
  if (existingUser) {
    admin = await prisma.adminUser.update({
      where: { id: existingUser.id },
      data: {
        name,
        username,
        email,
        passwordHash,
        status: AdminStatus.ACTIVE,
        failedLoginCount: 0
      }
    });
  } else {
    admin = await prisma.adminUser.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        status: AdminStatus.ACTIVE
      }
    });
  }

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

  console.log(`✅ Admin account updated/created successfully:`);
  console.log(`   Username : ${admin.username}`);
  console.log(`   Email    : ${admin.email}`);
  console.log(`   Password : ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
