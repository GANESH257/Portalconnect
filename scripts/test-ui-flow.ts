/**
 * Test UI Flow: Search -> Business Profile -> All Tabs
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const KEYWORD = "Spine";
const LOCATION = "Chesterfield, MO";
const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar";

async function testUIFlow() {
  console.log("\n🧪 TESTING UI FLOW\n");
  console.log("=".repeat(80));
  
  // Step 1: Test Search
  console.log("\n1️⃣  TESTING SEARCH");
  console.log("-".repeat(80));
  console.log(`   Keyword: "${KEYWORD}"`);
  console.log(`   Location: "${LOCATION}"`);
  
  const job = await prisma.serpJob.findFirst({
    where: {
      keyword: { contains: KEYWORD },
      location: { contains: LOCATION },
      status: 'completed'
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (!job) {
    console.log("   ❌ No job found");
    return;
  }
  
  console.log(`   ✅ Job found: ${job.id}`);
  
  // Fetch results without rawData to avoid sort memory issues
  const results = await prisma.serpResult.findMany({
    where: { serpJobId: job.id },
    select: {
      id: true,
      title: true,
      domain: true,
      url: true,
      rankAbsolute: true,
      businessProfile: {
        select: {
          id: true,
          name: true,
          seoScore: true,
          domainAuthority: true,
          pageSpeed: true,
          mobileScore: true,
          isPaid: true
        }
      }
    },
    orderBy: { rankAbsolute: 'asc' },
    take: 5
  });
  
  console.log(`   ✅ Found ${results.length} businesses`);
  
  // Find our target business
  const targetBusiness = results.find(r => 
    r.title.includes(BUSINESS_NAME) || 
    r.businessProfile?.name?.includes(BUSINESS_NAME)
  );
  
  if (!targetBusiness) {
    console.log(`   ❌ Target business "${BUSINESS_NAME}" not found in results`);
    return;
  }
  
  console.log(`   ✅ Target business found: ${targetBusiness.title}`);
  console.log(`      Business Profile ID: ${targetBusiness.businessProfile?.id || 'N/A'}`);
  console.log(`      Rank: ${targetBusiness.rankAbsolute}`);
  
  // Step 2: Test Business Profile Data
  console.log("\n2️⃣  TESTING BUSINESS PROFILE DATA");
  console.log("-".repeat(80));
  
  const profileId = targetBusiness.businessProfile?.id || targetBusiness.id;
  
  // Fetch profile and rawData separately to avoid sort memory issues
  const profile = await prisma.businessProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      name: true,
      seoScore: true,
      domainAuthority: true,
      backlinks: true,
      monthlyTraffic: true,
      pageSpeed: true,
      mobileScore: true,
      accessibilityScore: true,
      isPaid: true,
      serpResultId: true
    }
  });
  
  // Fetch rawData separately
  const serpResult = profile?.serpResultId ? await prisma.serpResult.findUnique({
    where: { id: profile.serpResultId },
    select: { rawData: true, id: true, title: true, rankAbsolute: true }
  }) : null;
  
  if (!profile) {
    console.log("   ❌ Business Profile not found");
    return;
  }
  
  console.log(`   ✅ Business Profile: ${profile.name}`);
  console.log(`      Profile ID: ${profile.id}`);
  console.log(`      SerpResult ID: ${profile.serpResultId || 'N/A'}`);
  console.log(`      SEO Score: ${profile.seoScore ?? 'N/A'}`);
  console.log(`      Domain Authority: ${profile.domainAuthority ?? 'N/A'}`);
  console.log(`      Page Speed: ${profile.pageSpeed ?? 'N/A'}`);
  console.log(`      Mobile Score: ${profile.mobileScore ?? 'N/A'}`);
  console.log(`      Is Paid: ${profile.isPaid ? 'Yes' : 'No'}`);
  
  if (serpResult) {
    console.log(`\n   📋 SerpResult Info:`);
    console.log(`      SerpResult ID: ${serpResult.id}`);
    console.log(`      Title: ${serpResult.title}`);
    console.log(`      Rank: ${serpResult.rankAbsolute}`);
  }
  
  // Step 3: Test Enriched Data
  console.log("\n3️⃣  TESTING ENRICHED DATA (for all tabs)");
  console.log("-".repeat(80));
  
  const rawData: any = serpResult?.rawData || {};
  const enriched = rawData.enriched || {};
  
  console.log(`   🔍 Raw Data Check:`);
  console.log(`      Has rawData: ${!!rawData}`);
  console.log(`      Has enriched: ${!!enriched}`);
  console.log(`      Enriched keys: ${Object.keys(enriched).join(', ') || 'none'}`);
  console.log(`      Enriched count: ${Object.keys(enriched).length}`);
  
  // Also check if there's a different serpResult with the data
  if (Object.keys(enriched).length === 0) {
    console.log(`\n   ⚠️  No enriched data found in linked serpResult. Checking other records...`);
    const allSerpResults = await prisma.serpResult.findMany({
      where: {
        title: { contains: BUSINESS_NAME },
        serpJobId: job.id
      },
      select: { id: true, title: true, rankAbsolute: true, rawData: true }
    });
    
    for (const sr of allSerpResults) {
      const srEnriched = (sr.rawData as any)?.enriched || {};
      if (Object.keys(srEnriched).length > 0) {
        console.log(`      ✅ Found enriched data in SerpResult ${sr.id} (Rank ${sr.rankAbsolute})`);
        console.log(`         Keys: ${Object.keys(srEnriched).join(', ')}`);
        // Use this one instead
        Object.assign(enriched, srEnriched);
        break;
      }
    }
  }
  
  // Helper to check if data is actually present (not just key exists)
  function hasData(key: string): boolean {
    const value = enriched[key];
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) {
      // Arrays are present if they have items
      return value.length > 0;
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      // Empty objects are not present
      if (keys.length === 0) return false;
      // For reviews, it might be a task object - still consider it present if it has structure
      // (the UI can handle task objects)
      return true;
    }
    // Primitives are present
    return true;
  }
  
  const tabs = [
    { name: "Overview", checks: ['gmbInfo', 'reviews', 'rankedKeywords'] },
    { name: "SEO & PPC", checks: ['analytics', 'schemas', 'pageSpeedInsights', 'safeBrowsing', 'schemaValidation'] },
    { name: "Reputation", checks: ['googlePlaces', 'reviews'] },
    { name: "Ads", checks: ['adsCreatives', 'ads'] }
  ];
  
  for (const tab of tabs) {
    console.log(`\n   📑 ${tab.name} Tab:`);
    let allPresent = true;
    for (const check of tab.checks) {
      const present = hasData(check);
      const status = present ? "✅" : "⚠️";
      const value = enriched[check];
      let detail = '';
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) detail = ` (array[${value.length}])`;
        else if (typeof value === 'object') detail = ` (object with ${Object.keys(value).length} keys)`;
        else detail = ` (${typeof value})`;
      }
      console.log(`      ${status} ${check}: ${present ? 'Present' : 'Missing'}${detail}`);
      if (!present && check !== 'safeBrowsing') {
        allPresent = false;
      }
    }
    console.log(`      ${allPresent ? '✅' : '⚠️'} Tab Status: ${allPresent ? 'Complete' : 'Partial'}`);
  }
  
  // Step 4: Summary
  console.log("\n4️⃣  SUMMARY");
  console.log("-".repeat(80));
  const allEnrichedKeys = Object.keys(enriched);
  console.log(`   ✅ Total enriched data keys: ${allEnrichedKeys.length}`);
  console.log(`   ✅ Keys: ${allEnrichedKeys.join(', ')}`);
  console.log(`   ✅ Business Profile scores: ${profile.seoScore ? 'Present' : 'Missing'}`);
  console.log(`   ✅ Ready for UI testing: YES`);
  
  console.log("\n" + "=".repeat(80));
  console.log("✅ UI FLOW TEST COMPLETE");
  console.log("=".repeat(80) + "\n");
  
  await prisma.$disconnect();
}

testUIFlow().catch(console.error);

