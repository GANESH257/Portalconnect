import { prisma } from '../server/lib/prisma';

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        companyName: true,
        position: true,
        createdAt: true
      }
    });
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
      console.log('\n⚠️  No users found in database');
    } else {
      console.log(`\n✅ Found ${users.length} user(s)`);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

