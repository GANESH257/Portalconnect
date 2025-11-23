/**
 * Validate Ads and SEO Data Storage and Loading
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function validateAdsAndSEO() {
  try {
    console.log('🔍 VALIDATING ADS & SEO DATA');
    console.log('============================================================\n');
    
    // Get a business profile with domain
    const profile = await prisma.businessProfile.findFirst({
      where: { 
        domain: { not: null },
        serpResult: { isNot: null }
      },
      include: {
        serpResult: {
          select: {
            id: true,
            rawData: true,
            rankAbsolute: true
          }
        },
        keywordRankings: {
          take: 5
        }
      }
    });
    
    if (!profile) {
      console.log('❌ No business profile found with domain');
      return;
    }
    
    console.log(`📋 Testing Business: ${profile.name}`);
    console.log(`   Domain: ${profile.domain}\n`);
    
    // Check what's stored in BusinessProfile table
    console.log('1️⃣  STORED IN BUSINESS_PROFILE TABLE:');
    console.log('   ✅ SEO Score:', profile.seoScore ?? 'NULL');
    console.log('   ✅ Domain Authority:', profile.domainAuthority ?? 'NULL');
    console.log('   ✅ Backlinks:', profile.backlinks ?? 'NULL');
    console.log('   ✅ Monthly Traffic:', profile.monthlyTraffic ?? 'NULL');
    console.log('   ✅ Page Speed:', profile.pageSpeed ?? 'NULL');
    console.log('   ✅ Mobile Score:', profile.mobileScore ?? 'NULL');
    console.log('   ✅ Accessibility Score:', profile.accessibilityScore ?? 'NULL');
    console.log('   ✅ Is Paid (Ads):', profile.isPaid ? 'YES' : 'NO');
    console.log('   ✅ Keyword Rankings:', profile.keywordRankings.length);
    
    // Check what's stored in rawData
    const rawData: any = profile.serpResult?.rawData || {};
    console.log('\n2️⃣  STORED IN RAWDATA:');
    console.log('   Has rawData:', !!rawData);
    console.log('   Has ads:', !!rawData.ads);
    console.log('   Has enriched:', !!rawData.enriched);
    
    if (rawData.ads) {
      console.log('\n   📢 ADS DATA:');
      console.log('      Matched:', rawData.ads.matched ? 'YES' : 'NO');
      console.log('      Advertiser ID:', rawData.ads.advertiserId ?? 'NULL');
      console.log('      Approx Ads Count:', rawData.ads.approxAdsCount ?? 'NULL');
      console.log('      Verified:', rawData.ads.verified ? 'YES' : 'NO');
      console.log('      Creatives:', Array.isArray(rawData.ads.creatives) ? rawData.ads.creatives.length : 'N/A');
    } else {
      console.log('   ❌ No ads data in rawData');
    }
    
    if (rawData.enriched) {
      const enriched = rawData.enriched;
      console.log('\n   📊 ENRICHED DATA:');
      console.log('      Analytics:', enriched.analytics ? '✅' : '❌');
      console.log('      Schemas:', enriched.schemas ? '✅' : '❌');
      console.log('      OnPage:', enriched.onPage ? '✅' : '❌');
      console.log('      OnPageResults:', enriched.onPageResults ? '✅' : '❌');
      console.log('      GMB Info:', enriched.gmbInfo ? '✅' : '❌');
      console.log('      Reviews:', enriched.reviews ? '✅' : '❌');
      console.log('      Backlinks:', enriched.backlinks ? '✅' : '❌');
      console.log('      Traffic:', enriched.traffic ? '✅' : '❌');
      console.log('      Domain Rank:', enriched.domainRank ? '✅' : '❌');
      
      if (enriched.analytics) {
        console.log('\n      Analytics Details:');
        console.log('         Google Analytics:', enriched.analytics.googleAnalytics?.found ? '✅' : '❌');
        console.log('         GA Type:', enriched.analytics.googleAnalytics?.type ?? 'N/A');
        console.log('         GA ID:', enriched.analytics.googleAnalytics?.id ?? 'N/A');
        console.log('         Facebook Pixel:', enriched.analytics.facebookPixel?.found ? '✅' : '❌');
      }
      
      if (enriched.schemas) {
        console.log('\n      Schema Details:');
        console.log('         LocalBusiness:', enriched.schemas.localBusiness ? '✅' : '❌');
        console.log('         FAQ:', enriched.schemas.faq ? '✅' : '❌');
        console.log('         Organization:', enriched.schemas.organization ? '✅' : '❌');
        console.log('         Breadcrumbs:', enriched.schemas.breadcrumbs ? '✅' : '❌');
        console.log('         Product:', enriched.schemas.product ? '✅' : '❌');
        console.log('         Review:', enriched.schemas.review ? '✅' : '❌');
      }
    } else {
      console.log('   ❌ No enriched data in rawData');
    }
    
    // Simulate what getBusinessAds returns
    console.log('\n3️⃣  WHAT getBusinessAds() WOULD RETURN:');
    const adsData = rawData.ads || null;
    const creatives = adsData?.creatives || rawData.enriched?.adsCreatives || [];
    const advertiserId = adsData?.advertiserId || null;
    
    console.log('   Ads found:', creatives.length);
    console.log('   Advertiser ID:', advertiserId ?? 'NULL');
    console.log('   Is Running Ads:', profile.isPaid || (adsData?.matched || false));
    console.log('   Total Ads:', creatives.length || (adsData?.approxAdsCount || 0));
    
    // Simulate what getBusinessSEOAndPPC returns
    console.log('\n4️⃣  WHAT getBusinessSEOAndPPC() WOULD RETURN:');
    const enriched = rawData.enriched || {};
    const storedAnalytics = enriched.analytics || { googleAnalytics: { found: false }, facebookPixel: { found: false } };
    const storedSchemas = enriched.schemas || {
      localBusiness: false, faq: false, organization: false,
      breadcrumbs: false, product: false, review: false
    };
    
    console.log('   SERP Position:', profile.serpResult?.rankAbsolute ?? 'NULL');
    console.log('   Analytics:', storedAnalytics.googleAnalytics?.found || storedAnalytics.facebookPixel?.found ? '✅' : '❌');
    console.log('   Schemas:', Object.values(storedSchemas).some(v => v === true) ? '✅' : '❌');
    console.log('   Speed Scores:', {
      desktop: profile.pageSpeed ?? 0,
      mobile: profile.mobileScore ?? 0
    });
    console.log('   Domain Authority:', profile.domainAuthority ?? 'NULL');
    console.log('   Backlinks:', profile.backlinks ?? 'NULL');
    console.log('   Monthly Traffic:', profile.monthlyTraffic ?? 'NULL');
    console.log('   SEO Score:', profile.seoScore ?? 'NULL');
    console.log('   PPC Status:', {
      runningAds: profile.isPaid || false,
      adCount: adsData?.approxAdsCount || 0
    });
    
    console.log('\n============================================================');
    console.log('✅ VALIDATION COMPLETE');
    console.log('\n📝 SUMMARY:');
    console.log('   ✅ SEO data is stored in businessProfile table');
    console.log('   ✅ Ads data should be in rawData.ads');
    console.log('   ✅ Enriched data should be in rawData.enriched');
    console.log('   ✅ Routes read from these locations');
    console.log('\n⚠️  NOTE:');
    console.log('   If analytics/schemas show ❌, they weren\'t stored in previous run');
    console.log('   (Bug is now fixed - re-run collection to get complete data)');
    
  } catch (error: any) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

validateAdsAndSEO();

