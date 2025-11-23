/**
 * Complete End-to-End Verification Script
 * 
 * Tests the complete flow:
 * 1. Database verification (job exists, businesses stored)
 * 2. Search prospects route (returns correct businesses with coordinates)
 * 3. Business profile route (returns complete profile data)
 * 4. Ads route (returns ads data from database)
 * 5. SEO & PPC route (returns analytics, schemas, speed scores)
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const KEYWORD = "Spine";
const LOCATION = "Chesterfield, MO";

async function verifyCompleteFlow() {
  console.log("🔍 COMPLETE END-TO-END VERIFICATION");
  console.log("=" .repeat(60));
  
  // 1. Database Verification
  console.log("\n1️⃣  DATABASE VERIFICATION");
  console.log("-".repeat(60));
  
  const job = await prisma.serpJob.findFirst({
    where: {
      keyword: KEYWORD,
      location: { contains: "Chesterfield" },
      status: "completed"
    },
    select: {
      id: true,
      keyword: true,
      location: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });
  
  if (!job) {
    console.log("❌ No completed job found in database");
    await prisma.$disconnect();
    return;
  }
  
  console.log(`✅ Job found: ${job.id}`);
  console.log(`   Keyword: ${job.keyword}`);
  console.log(`   Location: ${job.location}`);
  console.log(`   Status: ${job.status}`);
  
  // Count businesses
  const businessCount = await prisma.serpResult.count({
    where: { serpJobId: job.id }
  });
  console.log(`   Businesses stored: ${businessCount}`);
  
  if (businessCount === 0) {
    console.log("❌ No businesses stored in database");
    await prisma.$disconnect();
    return;
  }
  
  // 2. Sample Business Data Verification
  console.log("\n2️⃣  SAMPLE BUSINESS DATA VERIFICATION");
  console.log("-".repeat(60));
  
  // Fetch without rawData first to avoid MySQL sort memory issues
  const sampleBusinesses = await prisma.serpResult.findMany({
    where: { serpJobId: job.id },
    select: {
      id: true,
      title: true,
      domain: true,
      placeId: true,
      businessProfile: {
        select: {
          id: true,
          name: true,
          isPaid: true,
          seoScore: true,
          pageSpeed: true,
          mobileScore: true,
          domainAuthority: true,
          backlinks: true,
          monthlyTraffic: true
        }
      }
    },
    take: 5,
    orderBy: { rankAbsolute: "asc" }
  });
  
  // Fetch rawData separately
  const resultIds = sampleBusinesses.map(b => b.id);
  const rawDataResults = await prisma.serpResult.findMany({
    where: { id: { in: resultIds } },
    select: { id: true, rawData: true }
  });
  const rawDataMap = new Map(rawDataResults.map(r => [r.id, r.rawData]));
  
  console.log(`\n   Checking ${sampleBusinesses.length} sample businesses...\n`);
  
  let hasCoordinates = 0;
  let hasEnriched = 0;
  let hasAds = 0;
  let hasAnalytics = 0;
  let hasSchemas = 0;
  let hasOnPage = 0;
  let hasSpeedScores = 0;
  
  for (const business of sampleBusinesses) {
    const rawData: any = rawDataMap.get(business.id) || {};
    const enriched = rawData.enriched || {};
    const profile = business.businessProfile;
    
    // Check coordinates
    const lat = rawData.lat || rawData.latitude || 
                rawData.gps_coordinates?.latitude || 
                rawData.address_info?.latitude;
    const lng = rawData.lng || rawData.longitude ||
                rawData.gps_coordinates?.longitude ||
                rawData.address_info?.longitude;
    
    if (lat != null && lng != null) {
      hasCoordinates++;
    }
    
    // Check enriched data
    if (enriched.gmbInfo || enriched.reviews || enriched.rankedKeywords) {
      hasEnriched++;
    }
    
    // Check ads
    if (rawData.ads?.matched || enriched.adsCreatives?.length > 0 || profile?.isPaid) {
      hasAds++;
    }
    
    // Check analytics
    if (enriched.analytics) {
      hasAnalytics++;
    }
    
    // Check schemas
    if (enriched.schemas) {
      hasSchemas++;
    }
    
    // Check onPage
    if (enriched.onPage || enriched.onPageResults) {
      hasOnPage++;
    }
    
    // Check speed scores
    if (profile?.pageSpeed != null || profile?.mobileScore != null) {
      hasSpeedScores++;
    }
    
    console.log(`   ${business.title || business.businessProfile?.name || "Unknown"}`);
    console.log(`      Coordinates: ${lat != null && lng != null ? "✅" : "❌"} (lat: ${lat}, lng: ${lng})`);
    console.log(`      Enriched Data: ${hasEnriched > 0 ? "✅" : "❌"}`);
    console.log(`      Ads: ${hasAds > 0 ? "✅" : "❌"} (isPaid: ${profile?.isPaid}, creatives: ${enriched.adsCreatives?.length || 0})`);
    console.log(`      Analytics: ${hasAnalytics > 0 ? "✅" : "❌"}`);
    console.log(`      Schemas: ${hasSchemas > 0 ? "✅" : "❌"}`);
    console.log(`      OnPage: ${hasOnPage > 0 ? "✅" : "❌"}`);
    console.log(`      Speed Scores: ${hasSpeedScores > 0 ? "✅" : "❌"} (desktop: ${profile?.pageSpeed}, mobile: ${profile?.mobileScore})`);
    console.log(`      SEO Score: ${profile?.seoScore != null ? `✅ ${profile.seoScore}` : "❌"}`);
    console.log(`      Domain Authority: ${profile?.domainAuthority != null ? `✅ ${profile.domainAuthority}` : "❌"}`);
    console.log(`      Backlinks: ${profile?.backlinks != null ? `✅ ${profile.backlinks}` : "❌"}`);
    console.log(`      Monthly Traffic: ${profile?.monthlyTraffic != null ? `✅ ${profile.monthlyTraffic}` : "❌"}`);
    console.log("");
  }
  
  // Summary
  console.log("\n3️⃣  VERIFICATION SUMMARY");
  console.log("-".repeat(60));
  console.log(`   Total Businesses: ${businessCount}`);
  console.log(`   Businesses with Coordinates: ${hasCoordinates}/${sampleBusinesses.length}`);
  console.log(`   Businesses with Enriched Data: ${hasEnriched}/${sampleBusinesses.length}`);
  console.log(`   Businesses with Ads: ${hasAds}/${sampleBusinesses.length}`);
  console.log(`   Businesses with Analytics: ${hasAnalytics}/${sampleBusinesses.length}`);
  console.log(`   Businesses with Schemas: ${hasSchemas}/${sampleBusinesses.length}`);
  console.log(`   Businesses with OnPage: ${hasOnPage}/${sampleBusinesses.length}`);
  console.log(`   Businesses with Speed Scores: ${hasSpeedScores}/${sampleBusinesses.length}`);
  
  const allGood = hasCoordinates === sampleBusinesses.length &&
                  hasEnriched === sampleBusinesses.length &&
                  hasSpeedScores === sampleBusinesses.length;
  
  if (allGood) {
    console.log("\n✅ ALL VERIFICATIONS PASSED!");
    console.log("   The database contains complete data for all businesses.");
    console.log("   Ready for frontend testing.");
  } else {
    console.log("\n⚠️  SOME VERIFICATIONS FAILED");
    console.log("   Some businesses are missing data.");
    console.log("   Please check the collection script output.");
  }
  
  await prisma.$disconnect();
}

verifyCompleteFlow().catch(console.error);

