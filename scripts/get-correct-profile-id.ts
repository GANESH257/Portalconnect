import { prisma } from '../server/lib/prisma';

async function getCorrectProfileId() {
  const sr = await prisma.serpResult.findUnique({
    where: { id: 'cmhf4fb7a004irqd55vsnghzq' },
    include: { businessProfile: true }
  });

  if (sr && sr.businessProfile) {
    console.log('✅ CORRECT Business Profile ID:', sr.businessProfile.id);
    console.log('✅ Business Name:', sr.businessProfile.name);
    console.log('✅ SerpResult ID:', sr.id);
    console.log('\n🌐 Test URL: http://localhost:8080/business/' + sr.businessProfile.id);
  } else {
    console.log('❌ No business profile linked to serpResult cmhf4fb7a004irqd55vsnghzq');
    
    // Find business profile by name
    const bp = await prisma.businessProfile.findFirst({
      where: { name: { contains: 'SPINE Center: Dr. Amit Bhandarkar' } },
      include: { serpResult: true }
    });
    
    if (bp) {
      console.log('\n✅ Found Business Profile by name:');
      console.log('   ID:', bp.id);
      console.log('   SerpResult ID:', bp.serpResultId);
      console.log('\n🌐 Test URL: http://localhost:8080/business/' + bp.id);
    }
  }

  await prisma.$disconnect();
}

getCorrectProfileId();

