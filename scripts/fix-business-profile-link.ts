/**
 * Fix Business Profile to link to correct SerpResult with enriched data
 */
import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar";

async function fixLinkage() {
  console.log("\n🔧 FIXING BUSINESS PROFILE LINKAGE\n");
  console.log("=".repeat(80));
  
  // Find the record with actual data (rankAbsolute: 1, updated by fix script)
  const goodRecord = await prisma.serpResult.findFirst({
    where: {
      title: { contains: BUSINESS_NAME },
      rankAbsolute: 1
    },
    select: { 
      id: true, 
      title: true, 
      rankAbsolute: true,
      rawData: true
    }
  });
  
  if (!goodRecord) {
    console.log("❌ Good record not found");
    return;
  }
  
  const goodEnriched = (goodRecord.rawData as any)?.enriched || {};
  console.log(`✅ Found record with data: ${goodRecord.id}`);
  console.log(`   Rank: ${goodRecord.rankAbsolute}`);
  console.log(`   Enriched keys: ${Object.keys(goodEnriched).length}`);
  
  // Find all business profiles for this business
  const profiles = await prisma.businessProfile.findMany({
    where: { 
      name: { contains: BUSINESS_NAME }
    },
    select: { 
      id: true, 
      name: true, 
      serpResultId: true 
    }
  });
  
  console.log(`\n📋 Found ${profiles.length} business profile(s):`);
  for (const profile of profiles) {
    console.log(`   Profile: ${profile.id}`);
    console.log(`   Linked to: ${profile.serpResultId || 'NONE'}`);
    
    if (profile.serpResultId !== goodRecord.id) {
      console.log(`   ⚠️  MISMATCH! Updating to link to ${goodRecord.id}...`);
      await prisma.businessProfile.update({
        where: { id: profile.id },
        data: { serpResultId: goodRecord.id }
      });
      console.log(`   ✅ Updated!`);
    } else {
      console.log(`   ✅ Already correctly linked`);
    }
  }
  
  // Also update the business profile scores from the enriched data
  const profile = profiles[0];
  if (profile) {
    console.log(`\n💾 Updating business profile scores...`);
    // The fix script should have already done this, but let's verify
    const updatedProfile = await prisma.businessProfile.findUnique({
      where: { id: profile.id },
      select: {
        seoScore: true,
        domainAuthority: true,
        pageSpeed: true,
        mobileScore: true,
        isPaid: true
      }
    });
    
    console.log(`   Current scores:`);
    console.log(`   SEO Score: ${updatedProfile?.seoScore ?? 'N/A'}`);
    console.log(`   Domain Authority: ${updatedProfile?.domainAuthority ?? 'N/A'}`);
    console.log(`   Page Speed: ${updatedProfile?.pageSpeed ?? 'N/A'}`);
    console.log(`   Mobile Score: ${updatedProfile?.mobileScore ?? 'N/A'}`);
    console.log(`   Is Paid: ${updatedProfile?.isPaid ? 'Yes' : 'No'}`);
  }
  
  console.log("\n" + "=".repeat(80));
  console.log("✅ LINKAGE FIX COMPLETE");
  console.log("=".repeat(80) + "\n");
  
  await prisma.$disconnect();
}

fixLinkage().catch(console.error);

