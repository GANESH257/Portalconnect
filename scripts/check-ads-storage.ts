import { prisma } from '../server/lib/prisma';

async function checkAds() {
  const sr = await prisma.serpResult.findUnique({
    where: { id: 'cmhf4fb7a004irqd55vsnghzq' },
    select: { id: true, title: true, rawData: true }
  });

  if (sr) {
    const raw: any = sr.rawData || {};
    const enriched = raw.enriched || {};
    const ads = raw.ads || {};
    
    console.log('\n=== SERPRESULT ADS CHECK ===');
    console.log('ID:', sr.id);
    console.log('Title:', sr.title);
    console.log('Has enriched.adsCreatives:', !!(enriched.adsCreatives && Array.isArray(enriched.adsCreatives)));
    console.log('adsCreatives length:', enriched.adsCreatives?.length || 0);
    console.log('Has rawData.ads:', !!ads);
    console.log('ads.matched:', ads.matched);
    console.log('ads.creatives length:', ads.creatives?.length || 0);
    
    if (enriched.adsCreatives && enriched.adsCreatives.length > 0) {
      console.log('\n=== FIRST AD CREATIVE ===');
      console.log(JSON.stringify(enriched.adsCreatives[0], null, 2));
    }
  }

  await prisma.$disconnect();
}

checkAds().catch(console.error);

