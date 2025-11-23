/* Quick Prisma connectivity test */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 as ok');
    console.log('OK', result);
  } catch (e) {
    console.error('ERR', e.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
