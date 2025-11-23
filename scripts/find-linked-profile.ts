import { prisma } from '../server/lib/prisma';

async function findLinkedProfile() {
  // Find serpResult with enriched data
  const sr = await prisma.serpResult.findUnique({
    where: { id: 'cmhf4fb7a004irqd55vsnghzq' },
    include: { businessProfile: true }
  });

  if (sr) {
    console.log('SerpResult ID:', sr.id);
    console.log('Title:', sr.title);
    console.log('Domain:', sr.domain);
    
    if (sr.businessProfile) {
      console.log('\n✅ Linked Business Profile:');
      console.log('   ID:', sr.businessProfile.id);
      console.log('   Name:', sr.businessProfile.name);
      console.log('\n🌐 CORRECT URL: http://localhost:8080/business/' + sr.businessProfile.id);
    } else {
      console.log('\n❌ No business profile linked');
      
      // Find all business profiles with this name
      const profiles = await prisma.businessProfile.findMany({
        where: { name: { contains: 'SPINE Center: Dr. Amit Bhandarkar' } },
        include: { serpResult: true }
      });
      
      console.log(`\nFound ${profiles.length} business profiles with this name:`);
      for (const bp of profiles) {
        console.log(`\n  Profile ID: ${bp.id}`);
        console.log(`  Name: ${bp.name}`);
        console.log(`  SerpResult ID: ${bp.serpResultId}`);
        if (bp.serpResult) {
          const srData: any = bp.serpResult.rawData || {};
          const enriched = srData.enriched || {};
          console.log(`  Has Enriched Data: ${Object.keys(enriched).length > 0 ? 'YES' : 'NO'}`);
          if (Object.keys(enriched).length > 0) {
            console.log(`  ✅ USE THIS ONE: http://localhost:8080/business/${bp.id}`);
          }
        }
      }
    }
  } else {
    console.log('❌ SerpResult not found');
  }

  await prisma.$disconnect();
}

findLinkedProfile();

