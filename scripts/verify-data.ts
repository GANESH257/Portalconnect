import { prisma } from '../server/lib/prisma';

async function verifyData() {
  try {
    console.log('🔍 VERIFYING DATABASE DATA...\n');
    
    // Check latest job
    const job = await prisma.serpJob.findFirst({
      where: { keyword: 'Spine', location: 'Chesterfield, MO' },
      orderBy: { createdAt: 'desc' },
      include: {
        serpResults: {
          take: 3,
          include: {
            businessProfile: {
              include: {
                keywordRankings: { take: 5 }
              }
            }
          }
        }
      }
    });
    
    if (!job) {
      console.log('❌ NO JOB FOUND');
      return;
    }
    
    console.log('✅ Job found:', job.id);
    console.log('   Results:', job.serpResults.length);
    
    if (job.serpResults.length === 0) {
      console.log('❌ NO RESULTS');
      return;
    }
    
    for (let i = 0; i < Math.min(3, job.serpResults.length); i++) {
      const result = job.serpResults[i];
      const profile = result.businessProfile;
      const rawData: any = result.rawData || {};
      const enriched = rawData.enriched || {};
      
      console.log(`\n📊 BUSINESS ${i + 1}: ${profile?.name || result.title}`);
      console.log('   Profile ID:', profile?.id || 'MISSING');
      console.log('   Domain:', profile?.domain || 'MISSING');
      console.log('   SEO Score:', profile?.seoScore ?? 'NULL');
      console.log('   Page Speed:', profile?.pageSpeed ?? 'NULL');
      console.log('   Mobile Score:', profile?.mobileScore ?? 'NULL');
      console.log('   Domain Authority:', profile?.domainAuthority ?? 'NULL');
      console.log('   Backlinks:', profile?.backlinks ?? 'NULL');
      console.log('   Monthly Traffic:', profile?.monthlyTraffic ?? 'NULL');
      console.log('   Is Paid:', profile?.isPaid ?? 'NULL');
      
      console.log('\n   📦 ENRICHED DATA:');
      console.log('      Has enriched:', !!enriched);
      console.log('      Has analytics:', !!enriched.analytics);
      console.log('      Has schemas:', !!enriched.schemas);
      console.log('      Has onPage:', !!enriched.onPage);
      console.log('      Has onPageResults:', !!enriched.onPageResults);
      console.log('      Has gmbInfo:', !!enriched.gmbInfo);
      console.log('      Has reviews:', !!enriched.reviews);
      console.log('      Has ads:', !!rawData.ads);
      
      if (enriched.onPage) {
        const onPage = enriched.onPage?.result?.[0] || enriched.onPage || enriched.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0];
        console.log('\n   📄 ONPAGE:');
        console.log('      Has page_timing:', !!onPage?.page_timing);
        console.log('      Mobile score:', onPage?.mobile_score ?? 'NULL');
        console.log('      Has technologies:', !!onPage?.technologies);
        console.log('      Has schemas:', !!onPage?.schemas);
      }
      
      if (enriched.analytics) {
        console.log('\n   📊 ANALYTICS:');
        console.log('      GA Found:', enriched.analytics.googleAnalytics?.found ?? false);
        console.log('      FB Pixel Found:', enriched.analytics.facebookPixel?.found ?? false);
      }
      
      if (enriched.schemas) {
        console.log('\n   🏷️  SCHEMAS:');
        console.log('      LocalBusiness:', enriched.schemas.localBusiness ?? false);
        console.log('      FAQ:', enriched.schemas.faq ?? false);
      }
      
      if (rawData.ads) {
        console.log('\n   📢 ADS:');
        console.log('      Advertiser ID:', rawData.ads.advertiserId ?? 'NULL');
        console.log('      Ad Count:', rawData.ads.approxAdsCount ?? 0);
        console.log('      Matched:', rawData.ads.matched ?? false);
      }
      
      console.log('\n   🔑 KEYWORD RANKINGS:', profile?.keywordRankings?.length ?? 0);
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();

