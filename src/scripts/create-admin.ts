import readline from 'readline';
import { PrismaClient, AdminStatus } from '@prisma/client';
import { hashPassword } from '../common/utils/crypto.js';

const prisma = new PrismaClient();

function prompt(query: string, hideInput = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    if (hideInput) {
      // Simple hidden mask
      process.stdout.write(query);
      let buffer = '';
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', function handler(char) {
        const str = char.toString('utf8');
        if (str === '\n' || str === '\r' || str === '\u0004') {
          process.stdin.setRawMode(false);
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(buffer);
        } else if (str === '\u0003') {
          process.exit(1);
        } else if (str === '\b' || str === '\x7f') {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          buffer += str;
          process.stdout.write('*');
        }
      });
    } else {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    }
  });
}

async function bootstrapAdmin() {
  console.log('====================================================');
  console.log('  Cendekia Amanah — Admin Bootstrap CLI');
  console.log('====================================================');

  const name = (await prompt('Masukkan Nama Lengkap Admin: ')) || 'Administrator Cendekia';
  const email = (await prompt('Masukkan Email Admin: ')) || 'admin@cendekiaamanah.sch.id';
  const password = await prompt('Masukkan Password: ', true);

  if (!password || password.length < 8) {
    console.error('❌ Password minimal 8 karakter!');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' }
  });

  if (!superAdminRole) {
    console.error('❌ Role SUPER_ADMIN belum tersedia. Jalankan `npm run prisma:seed` terlebih dahulu.');
    process.exit(1);
  }

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      status: AdminStatus.ACTIVE
    },
    create: {
      name,
      email,
      passwordHash,
      status: AdminStatus.ACTIVE
    }
  });

  await prisma.adminUserRole.upsert({
    where: {
      adminUserId_roleId: {
        adminUserId: admin.id,
        roleId: superAdminRole.id
      }
    },
    update: {},
    create: {
      adminUserId: admin.id,
      roleId: superAdminRole.id
    }
  });

  console.log('✅ Admin berhasil dibuat / diperbarui:');
  console.log(`   ID    : ${admin.id}`);
  console.log(`   Nama  : ${admin.name}`);
  console.log(`   Email : ${admin.email}`);
  console.log(`   Role  : SUPER_ADMIN`);
}

bootstrapAdmin()
  .catch((e) => {
    console.error('❌ Error creating admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
