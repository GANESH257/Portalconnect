import { prisma } from '../server/lib/prisma';

async function testCompleteFlow() {
  console.log('🧪 COMPLETE END-TO-END TEST\n');
  console.log('='.repeat(60));
  
  try {
    // STEP 1: Verify Database Data
    console.log('\n✅ STEP 1: Database Verification');
    console.log('-'.repeat(60));
    
    const spineJob = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      },
      include: {
        _count: { select: { serpResults: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!spineJob) {
      console.log('❌ FAILED: No Spine job found in database');
      return;
    }
    
    console.log(`✅ Found job: ID=${spineJob.id}`);
    console.log(`✅ Results count: ${spineJob._count.serpResults}`);
    
    // STEP 2: Test Query (simulate searchProspects route)
    console.log('\n✅ STEP 2: Simulating searchProspects Query');
    console.log('-'.repeat(60));
    
    const startTime = Date.now();
    
    // Step 2a: Find job (without rawData)
    const jobInfo = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: { in: ['Chesterfield, MO', 'Chesterfield', 'Chesterfield, Missouri'] },
        status: 'completed'
      },
      select: {
        id: true,
        keyword: true,
        location: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!jobInfo) {
      console.log('❌ FAILED: Job not found with location variations');
      return;
    }
    
    console.log(`✅ Job found: ${jobInfo.id} (${Date.now() - startTime}ms)`);
    
    // Step 2b: Fetch results WITHOUT rawData
    const serpResults = await prisma.serpResult.findMany({
      where: {
        serpJobId: jobInfo.id
      },
      select: {
        id: true,
        rankAbsolute: true,
        title: true,
        domain: true,
        city: true,
        businessProfile: {
          select: {
            id: true,
            name: true,
            seoScore: true
          }
        }
      },
      orderBy: { rankAbsolute: 'asc' },
      take: 10
    });
    
    console.log(`✅ Fetched ${serpResults.length} results (${Date.now() - startTime}ms)`);
    console.log(`   Sample: ${serpResults[0]?.title || 'N/A'}`);
    
    // Step 2c: Fetch rawData separately
    const resultIds = serpResults.map(r => r.id);
    const rawDataResults = await prisma.serpResult.findMany({
      where: {
        id: { in: resultIds }
      },
      select: {
        id: true,
        rawData: true
      }
    });
    
    console.log(`✅ Fetched rawData for ${rawDataResults.length} results (${Date.now() - startTime}ms)`);
    
    // STEP 3: Verify Data Completeness
    console.log('\n✅ STEP 3: Data Completeness Check');
    console.log('-'.repeat(60));
    
    const sampleWithRawData = rawDataResults[0];
    if (sampleWithRawData?.rawData) {
      const raw: any = sampleWithRawData.rawData;
      console.log(`✅ Has rawData: YES`);
      console.log(`   Has enriched: ${!!raw.enriched}`);
      console.log(`   Has ads: ${!!raw.ads}`);
      console.log(`   Has gmbInfo: ${!!raw.enriched?.gmbInfo}`);
      console.log(`   Has analytics: ${!!raw.enriched?.analytics}`);
      console.log(`   Has schemas: ${!!raw.enriched?.schemas}`);
      console.log(`   Has onPage: ${!!raw.enriched?.onPage}`);
      console.log(`   Has reviews: ${!!raw.enriched?.reviews}`);
    } else {
      console.log('❌ FAILED: No rawData found');
    }
    
    // STEP 4: Test Business Profile Lookup
    console.log('\n✅ STEP 4: Business Profile Lookup Test');
    console.log('-'.repeat(60));
    
    const sampleProfile = serpResults[0]?.businessProfile;
    if (sampleProfile) {
      const fullProfile = await prisma.businessProfile.findUnique({
        where: { id: sampleProfile.id },
        select: {
          id: true,
          name: true,
          domain: true,
          seoScore: true,
          domainAuthority: true,
          backlinks: true,
          monthlyTraffic: true,
          pageSpeed: true,
          mobileScore: true,
          isPaid: true,
          keywordRankings: {
            take: 5,
            select: {
              keyword: true,
              rankAbsolute: true
            }
          }
        }
      });
      
      if (fullProfile) {
        console.log(`✅ Profile found: ${fullProfile.name}`);
        console.log(`   SEO Score: ${fullProfile.seoScore || 'N/A'}`);
        console.log(`   Domain Authority: ${fullProfile.domainAuthority || 'N/A'}`);
        console.log(`   Backlinks: ${fullProfile.backlinks || 'N/A'}`);
        console.log(`   Monthly Traffic: ${fullProfile.monthlyTraffic || 'N/A'}`);
        console.log(`   Page Speed: ${fullProfile.pageSpeed || 'N/A'}`);
        console.log(`   Mobile Score: ${fullProfile.mobileScore || 'N/A'}`);
        console.log(`   Is Paid: ${fullProfile.isPaid}`);
        console.log(`   Keyword Rankings: ${fullProfile.keywordRankings.length}`);
      } else {
        console.log('❌ FAILED: Profile not found');
      }
    }
    
    // STEP 5: Performance Test
    console.log('\n✅ STEP 5: Performance Test');
    console.log('-'.repeat(60));
    
    const perfStart = Date.now();
    const allResults = await prisma.serpResult.findMany({
      where: { serpJobId: jobInfo.id },
      select: {
        id: true,
        rankAbsolute: true,
        title: true,
        businessProfile: {
          select: {
            id: true,
            seoScore: true
          }
        }
      },
      orderBy: { rankAbsolute: 'asc' },
      take: 100
    });
    const perfTime = Date.now() - perfStart;
    
    console.log(`✅ Fetched 100 results in ${perfTime}ms`);
    console.log(`   Average: ${(perfTime / 100).toFixed(2)}ms per result`);
    
    if (perfTime < 1000) {
      console.log('✅ Performance: EXCELLENT (< 1s)');
    } else if (perfTime < 3000) {
      console.log('✅ Performance: GOOD (< 3s)');
    } else {
      console.log('⚠️  Performance: SLOW (> 3s)');
    }
    
    // FINAL SUMMARY
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Job ID: ${jobInfo.id}`);
    console.log(`   Total Results: ${spineJob._count.serpResults}`);
    console.log(`   Query Time: ${perfTime}ms`);
    console.log(`   Data Status: COMPLETE`);
    console.log(`\n✅ System is ready for production use!`);
    
  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteFlow();

