/**
 * Check actual values in enriched data
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar";

async function checkValues() {
  const serpResult = await prisma.serpResult.findFirst({
    where: {
      title: { contains: BUSINESS_NAME },
      rankAbsolute: 1
    },
    select: { rawData: true }
  });
  
  if (!serpResult) {
    console.log("❌ Not found");
    return;
  }
  
  const enriched = (serpResult.rawData as any)?.enriched || {};
  
  console.log("\n🔍 CHECKING ENRICHED VALUES\n");
  console.log("=".repeat(80));
  
  const checks = [
    'gmbInfo', 'reviews', 'rankedKeywords', 'traffic', 
    'adsCreatives', 'analytics', 'schemas', 'googlePlaces',
    'safeBrowsing', 'schemaValidation', 'pageSpeedInsights'
  ];
  
  for (const key of checks) {
    const value = enriched[key];
    console.log(`\n${key}:`);
    if (value === null) {
      console.log(`   ❌ null`);
    } else if (value === undefined) {
      console.log(`   ❌ undefined`);
    } else if (Array.isArray(value)) {
      console.log(`   ✅ array[${value.length}]`);
      if (value.length > 0) {
        console.log(`      First item keys: ${Object.keys(value[0] || {}).join(', ')}`);
      }
    } else if (typeof value === 'object') {
      const keys = Object.keys(value);
      console.log(`   ✅ object(${keys.length} keys)`);
      if (keys.length > 0) {
        console.log(`      Keys: ${keys.slice(0, 10).join(', ')}`);
        // Check if it's a task object (has status_code, result, etc.)
        if (value.status_code || value.result || value.tasks) {
          console.log(`      ⚠️  Looks like a task object, not result data`);
        }
      } else {
        console.log(`      ⚠️  Empty object`);
      }
    } else {
      console.log(`   ✅ ${typeof value}: ${value}`);
    }
  }
  
  await prisma.$disconnect();
}

checkValues().catch(console.error);

