/**
 * Complete verification of ALL stored data for all 20 businesses
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function verifyAllData() {
  console.log("🔍 COMPLETE DATA VERIFICATION FOR ALL 20 BUSINESSES");
  console.log("=".repeat(70));
  
  const job = await prisma.serpJob.findFirst({
    where: {
      keyword: "Spine",
      location: { contains: "Chesterfield" },
      status: "completed"
    },
    select: { id: true, keyword: true, location: true }
  });
  
  if (!job) {
    console.log("❌ No job found");
    await prisma.$disconnect();
    return;
  }
  
  // Fetch without rawData first to avoid MySQL sort memory issues
  const results = await prisma.serpResult.findMany({
    where: { serpJobId: job.id },
    select: {
      id: true,
      title: true,
      businessProfile: {
        select: {
          id: true,
          seoScore: true,
          isPaid: true,
          domainAuthority: true,
          backlinks: true,
          monthlyTraffic: true,
          pageSpeed: true,
          mobileScore: true,
          accessibilityScore: true
        }
      }
    },
    orderBy: { rankAbsolute: "asc" }
  });
  
  // Fetch rawData separately
  const resultIds = results.map(r => r.id);
  const rawDataResults = await prisma.serpResult.findMany({
    where: { id: { in: resultIds } },
    select: { id: true, rawData: true }
  });
  const rawDataMap = new Map(rawDataResults.map(r => [r.id, r.rawData]));
  
  console.log(`\nFound ${results.length} businesses\n`);
  
  const stats = {
    hasEnriched: 0,
    hasSEOScore: 0,
    hasAds: 0,
    hasGmbInfo: 0,
    hasReviews: 0,
    hasKeywords: 0,
    hasTraffic: 0,
    hasBacklinks: 0,
    hasDomainRank: 0,
    hasAnalytics: 0,
    hasSchemas: 0,
    hasOnPage: 0,
    hasAdsCreatives: 0,
    hasPaidETV: 0,
    hasPageSpeed: 0,
    hasMobileScore: 0,
    hasAccessibilityScore: 0
  };
  
  const missing: any[] = [];
  
  for (const result of results) {
    const raw: any = rawDataMap.get(result.id) || {};
    const enriched = raw.enriched || {};
    const profile = result.businessProfile;
    
    const checks: any = {
      enriched: !!raw.enriched,
      seoScore: profile?.seoScore != null,
      ads: !!(raw.ads || enriched.ads),
      gmbInfo: !!enriched.gmbInfo,
      reviews: !!enriched.reviews,
      keywords: !!(enriched.rankedKeywords && enriched.rankedKeywords.length > 0),
      traffic: !!enriched.traffic,
      backlinks: !!(enriched.backlinks && enriched.backlinks.length > 0),
      domainRank: !!enriched.domainRank,
      analytics: !!enriched.analytics,
      schemas: !!enriched.schemas,
      onPage: !!(enriched.onPage || enriched.onPageResults),
      adsCreatives: !!(enriched.adsCreatives && enriched.adsCreatives.length > 0),
      paidETV: !!enriched.paidETV,
      pageSpeed: profile?.pageSpeed != null,
      mobileScore: profile?.mobileScore != null,
      accessibilityScore: profile?.accessibilityScore != null
    };
    
    // Count stats
    if (checks.enriched) stats.hasEnriched++;
    if (checks.seoScore) stats.hasSEOScore++;
    if (checks.ads) stats.hasAds++;
    if (checks.gmbInfo) stats.hasGmbInfo++;
    if (checks.reviews) stats.hasReviews++;
    if (checks.keywords) stats.hasKeywords++;
    if (checks.traffic) stats.hasTraffic++;
    if (checks.backlinks) stats.hasBacklinks++;
    if (checks.domainRank) stats.hasDomainRank++;
    if (checks.analytics) stats.hasAnalytics++;
    if (checks.schemas) stats.hasSchemas++;
    if (checks.onPage) stats.hasOnPage++;
    if (checks.adsCreatives) stats.hasAdsCreatives++;
    if (checks.paidETV) stats.hasPaidETV++;
    if (checks.pageSpeed) stats.hasPageSpeed++;
    if (checks.mobileScore) stats.hasMobileScore++;
    if (checks.accessibilityScore) stats.hasAccessibilityScore++;
    
    const missingFields = Object.entries(checks)
      .filter(([_, v]) => !v)
      .map(([k]) => k);
    
    if (missingFields.length > 0) {
      missing.push({
        title: result.title,
        missing: missingFields
      });
    }
  }
  
  console.log("📊 VERIFICATION SUMMARY");
  console.log("-".repeat(70));
  console.log(`Total Businesses: ${results.length}`);
  console.log(`Has Enriched Data: ${stats.hasEnriched}/${results.length}`);
  console.log(`Has SEO Score: ${stats.hasSEOScore}/${results.length}`);
  console.log(`Has Ads Data: ${stats.hasAds}/${results.length}`);
  console.log(`Has GMB Info: ${stats.hasGmbInfo}/${results.length}`);
  console.log(`Has Reviews: ${stats.hasReviews}/${results.length}`);
  console.log(`Has Keywords: ${stats.hasKeywords}/${results.length}`);
  console.log(`Has Traffic: ${stats.hasTraffic}/${results.length}`);
  console.log(`Has Backlinks: ${stats.hasBacklinks}/${results.length}`);
  console.log(`Has Domain Rank: ${stats.hasDomainRank}/${results.length}`);
  console.log(`Has Analytics: ${stats.hasAnalytics}/${results.length}`);
  console.log(`Has Schemas: ${stats.hasSchemas}/${results.length}`);
  console.log(`Has OnPage: ${stats.hasOnPage}/${results.length}`);
  console.log(`Has Ads Creatives: ${stats.hasAdsCreatives}/${results.length}`);
  console.log(`Has Paid ETV: ${stats.hasPaidETV}/${results.length}`);
  console.log(`Has Page Speed: ${stats.hasPageSpeed}/${results.length}`);
  console.log(`Has Mobile Score: ${stats.hasMobileScore}/${results.length}`);
  console.log(`Has Accessibility Score: ${stats.hasAccessibilityScore}/${results.length}`);
  
  if (missing.length > 0) {
    console.log("\n❌ BUSINESSES WITH MISSING DATA:");
    console.log("-".repeat(70));
    for (const m of missing) {
      console.log(`\n${m.title}:`);
      console.log(`  Missing: ${m.missing.join(", ")}`);
    }
  }
  
  const allComplete = missing.length === 0;
  console.log("\n" + "=".repeat(70));
  if (allComplete) {
    console.log("✅ ALL DATA STORED CORRECTLY FOR ALL 20 BUSINESSES!");
  } else {
    console.log(`⚠️  ${missing.length} businesses have missing data`);
  }
  console.log("=".repeat(70));
  
  await prisma.$disconnect();
}

verifyAllData().catch(console.error);

