import { prisma } from '../server/lib/prisma';

async function findCorrectProfile() {
  // Check the business profile from verification script
  const bp = await prisma.businessProfile.findUnique({
    where: { id: 'cmhf4fb7a004irqd55vsnghzq' },
    include: {
      serpResult: true
    }
  });

  if (bp) {
    console.log('✅ Business Profile Found:');
    console.log('  ID:', bp.id);
    console.log('  Name:', bp.name);
    console.log('  SerpResult ID:', bp.serpResultId);
    
    if (bp.serpResultId) {
      const sr = await prisma.serpResult.findUnique({
        where: { id: bp.serpResultId },
        select: {
          id: true,
          title: true,
          rawData: true
        }
      });
      
      if (sr) {
        const enriched = (sr.rawData as any)?.enriched;
        const hasEnriched = enriched && Object.keys(enriched).length > 0;
        console.log('\n📊 SerpResult:');
        console.log('  ID:', sr.id);
        console.log('  Title:', sr.title);
        console.log('  Has Enriched Data:', hasEnriched);
        if (hasEnriched) {
          console.log('  ✅ Enriched Keys:', Object.keys(enriched).join(', '));
        }
      }
    }
  } else {
    console.log('❌ Business profile not found');
  }

  await prisma.$disconnect();
}

findCorrectProfile();

