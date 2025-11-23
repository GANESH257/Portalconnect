import { prisma } from '../server/lib/prisma';

async function verify() {
  const profileId = 'cmhwshk7900011vzhj7nkxfy7';
  const expectedSerpResultId = 'cmhf4fb7a004irqd55vsnghzq';
  
  const bp = await prisma.businessProfile.findUnique({
    where: { id: profileId },
    select: { id: true, name: true, serpResultId: true }
  });
  
  console.log('\n=== BUSINESS PROFILE ===');
  console.log('ID:', bp?.id);
  console.log('Name:', bp?.name);
  console.log('serpResultId:', bp?.serpResultId);
  console.log('Expected serpResultId:', expectedSerpResultId);
  console.log('Match:', bp?.serpResultId === expectedSerpResultId);
  
  if (bp?.serpResultId) {
    const sr = await prisma.serpResult.findUnique({
      where: { id: bp.serpResultId },
      select: { id: true, title: true, rawData: true }
    });
    
    if (sr) {
      const raw: any = sr.rawData || {};
      const enriched = raw.enriched || {};
      console.log('\n=== LINKED SERPRESULT ===');
      console.log('ID:', sr.id);
      console.log('Title:', sr.title);
      console.log('Has enriched:', !!enriched);
      console.log('adsCreatives count:', enriched.adsCreatives?.length || 0);
      console.log('rawData keys:', Object.keys(raw).join(', '));
      console.log('enriched keys:', Object.keys(enriched).join(', '));
    } else {
      console.log('\n❌ Linked serpResult not found!');
    }
  }
  
  await prisma.$disconnect();
}

verify().catch(console.error);

