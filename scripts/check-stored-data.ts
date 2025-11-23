import { prisma } from '../server/lib/prisma';

async function checkStoredData() {
  try {
    const job = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        serpResults: {
          include: {
            businessProfile: true
          },
          take: 20
        }
      }
    });
    
    if (!job) {
      console.log('❌ No job found');
      return;
    }
    
    console.log('✅ Job found:', job.id);
    console.log('   Total Results:', job.serpResults.length);
    console.log('   Business Profiles:', job.serpResults.filter(r => r.businessProfile).length);
    
    // Check sample results for data completeness
    let withAds = 0;
    let withAdsCreatives = 0;
    let withPaidETV = 0;
    let withAnalytics = 0;
    let withSchemas = 0;
    let withOnPageResults = 0;
    
    for (const result of job.serpResults.slice(0, 10)) {
      const rawData: any = result.rawData || {};
      const enriched = rawData.enriched || {};
      
      if (rawData.ads || enriched.ads) withAds++;
      if (enriched.adsCreatives && enriched.adsCreatives.length > 0) withAdsCreatives++;
      if (enriched.paidETV) withPaidETV++;
      if (enriched.analytics) withAnalytics++;
      if (enriched.schemas) withSchemas++;
      if (enriched.onPageResults) withOnPageResults++;
    }
    
    console.log('\n📦 Data Completeness (sample of 10):');
    console.log(`   With ads data: ${withAds}/10`);
    console.log(`   With ads creatives: ${withAdsCreatives}/10`);
    console.log(`   With paid ETV: ${withPaidETV}/10`);
    console.log(`   With analytics: ${withAnalytics}/10`);
    console.log(`   With schemas: ${withSchemas}/10`);
    console.log(`   With onPageResults: ${withOnPageResults}/10`);
    
    // Check first result in detail
    const firstResult = job.serpResults[0];
    if (firstResult && firstResult.businessProfile) {
      console.log('\n📋 Sample Business:', firstResult.businessProfile.name);
      const rawData: any = firstResult.rawData || {};
      const enriched = rawData.enriched || {};
      console.log('   Has ads:', !!rawData.ads);
      console.log('   Has adsCreatives:', !!(enriched.adsCreatives && enriched.adsCreatives.length > 0));
      if (enriched.adsCreatives) {
        console.log('   Ads creatives count:', enriched.adsCreatives.length);
      }
      console.log('   Has paidETV:', !!enriched.paidETV);
      console.log('   Has analytics:', !!enriched.analytics);
      console.log('   Has schemas:', !!enriched.schemas);
      console.log('   Has onPageResults:', !!enriched.onPageResults);
      console.log('   SEO Score:', firstResult.businessProfile.seoScore);
      console.log('   Page Speed:', firstResult.businessProfile.pageSpeed);
      console.log('   Mobile Score:', firstResult.businessProfile.mobileScore);
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkStoredData();

