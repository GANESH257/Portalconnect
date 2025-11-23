/**
 * Verify all collected data for 5 businesses
 * Checks: PageSpeed Insights, Analytics, Schemas, Ads, SEO data, etc.
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function verifyBusinesses() {
  console.log("🔍 Verifying Data for 5 Businesses\n");

  try {
    // Get the 5 most recently created business profiles
    const businesses = await prisma.businessProfile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        domain: true,
        serpResultId: true
      }
    });

    console.log(`✅ Found ${businesses.length} businesses to verify\n`);

    let totalScore = 0;
    const maxScore = businesses.length * 100; // 100 points per business
    let businessesWithPageSpeed = 0;
    let businessesWithAds = 0;
    let businessesWithAnalytics = 0;

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      
      // Fetch serpResult separately to ensure we get the full rawData
      const serpResult = business.serpResultId 
        ? await prisma.serpResult.findUnique({
            where: { id: business.serpResultId },
            select: { 
              id: true,
              rawData: true 
            }
          })
        : null;
      
      const rawData: any = serpResult?.rawData || {};
      const enriched = rawData.enriched || {};

      console.log(`\n[${i + 1}/${businesses.length}] ${business.name}`);
      console.log(`   Domain: ${business.domain || 'N/A'}`);
      console.log(`   Profile ID: ${business.id}`);
      console.log(`   SerpResult ID: ${business.serpResultId || 'N/A'}`);

      let businessScore = 0;
      const checks: string[] = [];

      // 1. PageSpeed Insights (20 points)
      if (enriched.pageSpeedInsights) {
        const psi = enriched.pageSpeedInsights;
        if (psi.performance != null || psi.mobile != null) {
          businessScore += 20;
          businessesWithPageSpeed++;
          checks.push(`✅ PageSpeed Insights: Desktop ${psi.performance || 'N/A'}/100, Mobile ${psi.mobile || 'N/A'}/100`);
        } else {
          checks.push(`❌ PageSpeed Insights: Missing scores`);
        }
      } else if (business.domain) {
        checks.push(`❌ PageSpeed Insights: Not collected (has domain: ${business.domain})`);
      } else {
        checks.push(`⚠️  PageSpeed Insights: Not collected (no domain)`);
      }

      // 2. Analytics (15 points)
      if (enriched.analytics) {
        const hasGA = enriched.analytics.googleAnalytics?.found;
        const hasFB = enriched.analytics.facebookPixel?.found;
        if (hasGA || hasFB) {
          businessScore += 15;
          businessesWithAnalytics++;
          checks.push(`✅ Analytics: GA=${hasGA}, FB=${hasFB}`);
        } else {
          checks.push(`⚠️  Analytics: Not found`);
        }
      } else {
        checks.push(`❌ Analytics: Missing`);
      }

      // 3. Schemas (15 points)
      if (enriched.schemas) {
        const schemaCount = Object.values(enriched.schemas).filter(Boolean).length;
        if (schemaCount > 0) {
          businessScore += 15;
          checks.push(`✅ Schemas: ${schemaCount} types found`);
        } else {
          checks.push(`⚠️  Schemas: None detected`);
        }
      } else {
        checks.push(`❌ Schemas: Missing`);
      }

      // 4. Ads Creatives (15 points)
      if (enriched.adsCreatives && Array.isArray(enriched.adsCreatives)) {
        const adCount = enriched.adsCreatives.length;
        if (adCount > 0) {
          businessScore += 15;
          businessesWithAds++;
          checks.push(`✅ Ads: ${adCount} creatives`);
        } else {
          checks.push(`⚠️  Ads: No creatives (may not be running ads)`);
        }
      } else if (business.domain) {
        checks.push(`⚠️  Ads: Not collected or no ads`);
      } else {
        checks.push(`⚠️  Ads: Not collected (no domain)`);
      }

      // 5. GMB Info (10 points)
      if (enriched.gmbInfo) {
        businessScore += 10;
        checks.push(`✅ GMB Info: Present`);
      } else {
        checks.push(`❌ GMB Info: Missing`);
      }

      // 6. Reviews (10 points)
      if (enriched.reviews || enriched.googlePlaces) {
        businessScore += 10;
        const reviews = enriched.reviews || enriched.googlePlaces?.reviews || [];
        const reviewCount = Array.isArray(reviews) ? reviews.length : 0;
        checks.push(`✅ Reviews: ${reviewCount} reviews`);
      } else {
        checks.push(`⚠️  Reviews: Not collected`);
      }

      // 7. Ranked Keywords (5 points)
      if (enriched.rankedKeywords && Array.isArray(enriched.rankedKeywords) && enriched.rankedKeywords.length > 0) {
        businessScore += 5;
        checks.push(`✅ Ranked Keywords: ${enriched.rankedKeywords.length} keywords`);
      } else if (business.domain) {
        checks.push(`⚠️  Ranked Keywords: Not collected`);
      } else {
        checks.push(`⚠️  Ranked Keywords: Not collected (no domain)`);
      }

      // 8. Traffic Data (5 points)
      if (enriched.traffic) {
        businessScore += 5;
        checks.push(`✅ Traffic: Present`);
      } else if (business.domain) {
        checks.push(`⚠️  Traffic: Not collected`);
      } else {
        checks.push(`⚠️  Traffic: Not collected (no domain)`);
      }

      // 9. Domain Rank (5 points)
      if (enriched.domainRank) {
        businessScore += 5;
        checks.push(`✅ Domain Rank: Present`);
      } else if (business.domain) {
        checks.push(`⚠️  Domain Rank: Not collected`);
      } else {
        checks.push(`⚠️  Domain Rank: Not collected (no domain)`);
      }

      // Print all checks
      checks.forEach(check => console.log(`   ${check}`));

      console.log(`   📊 Score: ${businessScore}/100`);
      totalScore += businessScore;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 OVERALL VERIFICATION SCORE: ${totalScore}/${maxScore} (${Math.round((totalScore / maxScore) * 100)}%)`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`📈 SUMMARY:`);
    console.log(`   Businesses with PageSpeed Insights: ${businessesWithPageSpeed}/${businesses.length}`);
    console.log(`   Businesses with Ads: ${businessesWithAds}/${businesses.length}`);
    console.log(`   Businesses with Analytics: ${businessesWithAnalytics}/${businesses.length}`);

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBusinesses();
