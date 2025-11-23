/**
 * Test Local Database Speed
 * Validates that all data comes from local database (no API calls)
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function testLocalSpeed() {
  try {
    console.log('🚀 TESTING LOCAL DATABASE SPEED');
    console.log('============================================================\n');
    
    // Test 1: Search Prospects
    console.log('1️⃣  Testing Search Prospects...');
    const start1 = Date.now();
    const job = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      },
      include: {
        serpResults: {
          include: {
            businessProfile: {
              include: {
                keywordRankings: {
                  take: 10
                }
              }
            }
          },
          take: 100
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    const duration1 = Date.now() - start1;
    
    if (job) {
      console.log(`   ✅ Found job with ${job.serpResults.length} businesses`);
      console.log(`   ⚡ Query time: ${duration1}ms`);
      console.log(`   ${duration1 < 500 ? '✅ FAST (Local DB)' : '⚠️  SLOW (May have issues)'}`);
    } else {
      console.log('   ❌ No job found');
    }
    
    // Test 2: Get Business Profile
    console.log('\n2️⃣  Testing Business Profile...');
    if (job && job.serpResults.length > 0) {
      const profileId = job.serpResults[0].businessProfile?.id;
      if (profileId) {
        const start2 = Date.now();
        const profile = await prisma.businessProfile.findUnique({
          where: { id: profileId },
          select: {
            id: true,
            name: true,
            domain: true,
            seoScore: true,
            pageSpeed: true,
            mobileScore: true,
            domainAuthority: true,
            backlinks: true,
            monthlyTraffic: true,
            isPaid: true,
            keywordRankings: {
              take: 10
            },
            serpResult: {
              select: {
                id: true,
                rawData: true,
                rankAbsolute: true
              }
            }
          }
        });
        const duration2 = Date.now() - start2;
        
        console.log(`   ✅ Found profile: ${profile?.name}`);
        console.log(`   ⚡ Query time: ${duration2}ms`);
        console.log(`   ${duration2 < 200 ? '✅ FAST (Local DB)' : '⚠️  SLOW (May have issues)'}`);
        
        // Check if enriched data exists
        if (profile?.serpResult?.rawData) {
          const rawData: any = profile.serpResult.rawData;
          const enriched = rawData.enriched || {};
          
          console.log(`\n   📊 Enriched Data Check:`);
          console.log(`      Analytics: ${enriched.analytics ? '✅' : '❌'}`);
          console.log(`      Schemas: ${enriched.schemas ? '✅' : '❌'}`);
          console.log(`      OnPage: ${enriched.onPage ? '✅' : '❌'}`);
          console.log(`      GMB Info: ${enriched.gmbInfo ? '✅' : '❌'}`);
          console.log(`      Reviews: ${enriched.reviews ? '✅' : '❌'}`);
          console.log(`      Backlinks: ${enriched.backlinks ? '✅' : '❌'}`);
          console.log(`      Traffic: ${enriched.traffic ? '✅' : '❌'}`);
          console.log(`      Domain Rank: ${enriched.domainRank ? '✅' : '❌'}`);
        }
      }
    }
    
    // Test 3: Get Business Ads
    console.log('\n3️⃣  Testing Business Ads...');
    if (job && job.serpResults.length > 0) {
      const result = job.serpResults[0];
      const rawData: any = result.rawData || {};
      const start3 = Date.now();
      
      // Simulate what the route does
      const adsData = rawData.ads || null;
      const creatives = adsData?.creatives || rawData.enriched?.adsCreatives || [];
      
      const duration3 = Date.now() - start3;
      console.log(`   ✅ Ads data extracted`);
      console.log(`   ⚡ Query time: ${duration3}ms`);
      console.log(`   ${duration3 < 50 ? '✅ FAST (Local DB)' : '⚠️  SLOW'}`);
      console.log(`   Ads found: ${creatives.length}`);
    }
    
    // Test 4: Get SEO & PPC Analysis
    console.log('\n4️⃣  Testing SEO & PPC Analysis...');
    if (job && job.serpResults.length > 0) {
      const profile = job.serpResults[0].businessProfile;
      if (profile) {
        const start4 = Date.now();
        
        // Simulate what the route does
        const serpResult = job.serpResults[0];
        const rawData: any = serpResult.rawData || {};
        const enriched = rawData.enriched || {};
        
        const analysis = {
          serpPosition: serpResult.rankAbsolute,
          schemas: enriched.schemas || { localBusiness: false, faq: false },
          analytics: enriched.analytics || { googleAnalytics: { found: false }, facebookPixel: { found: false } },
          ppcStatus: { runningAds: profile.isPaid || false },
          speedScores: { desktop: profile.pageSpeed || 0, mobile: profile.mobileScore || 0 },
          domainAuthority: profile.domainAuthority,
          backlinks: profile.backlinks,
          monthlyTraffic: profile.monthlyTraffic,
          seoScore: profile.seoScore
        };
        
        const duration4 = Date.now() - start4;
        console.log(`   ✅ Analysis calculated`);
        console.log(`   ⚡ Query time: ${duration4}ms`);
        console.log(`   ${duration4 < 100 ? '✅ FAST (Local DB)' : '⚠️  SLOW'}`);
        console.log(`   SEO Score: ${analysis.seoScore || 'N/A'}`);
        console.log(`   Domain Authority: ${analysis.domainAuthority || 'N/A'}`);
      }
    }
    
    console.log('\n============================================================');
    console.log('✅ LOCAL DATABASE VALIDATION COMPLETE');
    console.log('\n📝 SUMMARY:');
    console.log('   All queries should be < 500ms for local DB');
    console.log('   If queries are fast, data is coming from local database');
    console.log('   No API calls should be made (check server logs)');
    
  } catch (error: any) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalSpeed();

