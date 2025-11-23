import { prisma } from '../server/lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    const email = 'test@test.com';
    const password = 'test12345';
    
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existing) {
      console.log('✅ User already exists, updating password...');
      // Update password to ensure it's correct (use same salt rounds as authService)
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { email },
        data: { passwordHash }
      });
      console.log('✅ Password updated');
      return existing;
    }
    
    // Create user (use same salt rounds as authService)
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        companyName: 'Test Company',
        position: 'Tester',
        phoneNumber: '123-456-7890'
      }
    });
    
    console.log('✅ Test user created:', email);
    console.log('   Password:', password);
    return user;
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

