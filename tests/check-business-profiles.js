import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessProfiles() {
  try {
    const count = await prisma.businessProfile.count();
    console.log('Total business profiles in database:', count);
    
    if (count > 0) {
      const profiles = await prisma.businessProfile.findMany({
        take: 5,
        select: {
          id: true,
          name: true,
          domain: true,
          placeId: true,
          cid: true,
          createdAt: true
        }
      });
      console.log('Sample business profiles:', profiles);
    }
  } catch (error) {
    console.error('Error checking business profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessProfiles();
