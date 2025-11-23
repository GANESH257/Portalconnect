/**
 * Verify all data for a specific business
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";

async function verifyBusinessData() {
  console.log(`\n🔍 VERIFYING DATA FOR: ${BUSINESS_NAME}\n`);
  console.log("=".repeat(80));

  // Find the business - use same query as fix script
  const serpResult = await prisma.serpResult.findFirst({
    where: {
      title: { contains: "SPINE Center: Dr. Amit Bhandarkar" },
      rankAbsolute: 1  // Match the fix script query
    },
    include: {
      businessProfile: true
    }
  });
  
  // If not found with rankAbsolute, try without it
  const serpResultAlt = serpResult || await prisma.serpResult.findFirst({
    where: {
      title: { contains: "SPINE Center: Dr. Amit Bhandarkar" }
    },
    include: {
      businessProfile: true
    }
  });
  
  const finalResult = serpResult || serpResultAlt;

  if (!finalResult) {
    console.log("❌ Business not found");
    return;
  }

  const rawData: any = finalResult.rawData || {};
  const enriched = rawData.enriched || {};
  const profile = finalResult.businessProfile;

  console.log(`\n✅ Business Found: ${finalResult.title}`);
  console.log(`   ID: ${finalResult.id}`);
  console.log(`   Rank: ${finalResult.rankAbsolute}`);
  console.log(`   Domain: ${finalResult.domain || 'N/A'}`);
  console.log(`   Website: ${finalResult.url || 'N/A'}`);
  console.log(`\n🔍 Raw Data Structure:`);
  console.log(`   Has rawData: ${!!rawData}`);
  console.log(`   Has enriched: ${!!enriched}`);
  console.log(`   Enriched keys: ${Object.keys(enriched).join(', ') || 'none'}`);
  console.log(`   Enriched keys count: ${Object.keys(enriched).length}`);
  if (Object.keys(enriched).length > 0) {
    console.log(`\n   Sample enriched data:`);
    Object.keys(enriched).slice(0, 10).forEach(key => {
      const value = enriched[key];
      let type = typeof value;
      if (Array.isArray(value)) type = `array[${value.length}]`;
      else if (value && typeof value === 'object') type = `object(${Object.keys(value).length} keys)`;
      const hasValue = value !== null && value !== undefined;
      console.log(`     ${key}: ${type} ${hasValue ? '✅' : '❌'}`);
    });
  }

  // Check all data points
  const checks = [
    { name: "GMB Info", data: enriched.gmbInfo, required: true },
    { name: "Reviews", data: enriched.reviews, required: true },
    { name: "Ranked Keywords", data: enriched.rankedKeywords, required: true },
    { name: "Traffic", data: enriched.traffic, required: true },
    { name: "Ads Creatives", data: enriched.adsCreatives, required: false },
    { name: "Domain Rank", data: enriched.domainRank, required: true },
    { name: "Backlinks", data: enriched.backlinks, required: true },
    { name: "On-Page Results", data: enriched.onPageResults, required: false },
    { name: "Analytics", data: enriched.analytics, required: true },
    { name: "Schemas", data: enriched.schemas, required: true },
    { name: "HTML Content", data: enriched.htmlContent, required: false },
    { name: "Google Places", data: enriched.googlePlaces, required: false },
    { name: "Safe Browsing", data: enriched.safeBrowsing, required: false },
    { name: "Schema Validation", data: enriched.schemaValidation, required: false },
    { name: "PageSpeed Insights", data: enriched.pageSpeedInsights, required: false },
  ];

  console.log("\n📊 DATA VERIFICATION:");
  console.log("-".repeat(80));

  let allPresent = true;
  for (const check of checks) {
    const present = !!check.data;
    const status = present ? "✅" : (check.required ? "❌" : "⚠️");
    console.log(`${status} ${check.name.padEnd(25)} ${present ? "Present" : "Missing"}`);
    if (!present && check.required) {
      allPresent = false;
    }
  }

  // Check Business Profile scores
  console.log("\n📈 BUSINESS PROFILE SCORES:");
  console.log("-".repeat(80));
  if (profile) {
    console.log(`✅ SEO Score: ${profile.seoScore ?? 'N/A'}`);
    console.log(`✅ Domain Authority: ${profile.domainAuthority ?? 'N/A'}`);
    console.log(`✅ Backlinks: ${profile.backlinks ?? 'N/A'}`);
    console.log(`✅ Monthly Traffic: ${profile.monthlyTraffic ?? 'N/A'}`);
    console.log(`✅ Page Speed: ${profile.pageSpeed ?? 'N/A'}`);
    console.log(`✅ Mobile Score: ${profile.mobileScore ?? 'N/A'}`);
    console.log(`✅ Accessibility Score: ${profile.accessibilityScore ?? 'N/A'}`);
    console.log(`✅ Is Paid: ${profile.isPaid ? 'Yes' : 'No'}`);
  } else {
    console.log("❌ Business Profile not found");
  }

  // Check Google Places
  if (enriched.googlePlaces) {
    console.log("\n⭐ GOOGLE PLACES:");
    console.log(`   Rating: ${enriched.googlePlaces.rating ?? 'N/A'}/5`);
    console.log(`   Total Ratings: ${enriched.googlePlaces.totalRatings ?? 'N/A'}`);
    console.log(`   Reviews Count: ${enriched.googlePlaces.reviews?.length ?? 0}`);
  }

  // Check Safe Browsing
  if (enriched.safeBrowsing) {
    console.log("\n🔒 SAFE BROWSING:");
    console.log(`   Status: ${enriched.safeBrowsing.isSafe ? 'SAFE ✅' : 'UNSAFE ❌'}`);
    if (enriched.safeBrowsing.threats?.length > 0) {
      console.log(`   Threats: ${enriched.safeBrowsing.threats.join(', ')}`);
    }
  }

  // Check Schema Validation
  if (enriched.schemaValidation) {
    console.log("\n📋 SCHEMA VALIDATION:");
    console.log(`   Valid: ${enriched.schemaValidation.valid ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Errors: ${enriched.schemaValidation.errors?.length ?? 0}`);
    console.log(`   Warnings: ${enriched.schemaValidation.warnings?.length ?? 0}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log(allPresent ? "✅ ALL REQUIRED DATA PRESENT" : "⚠️  SOME DATA MISSING");
  console.log("=".repeat(80) + "\n");

  return {
    businessId: profile?.id || finalResult.id,
    allPresent,
    checks
  };
}

verifyBusinessData()
  .then((result) => {
    if (result) {
      console.log(`\n✅ Verification complete. Business ID: ${result.businessId}`);
      process.exit(0);
    } else {
      console.log("\n❌ Verification failed");
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

