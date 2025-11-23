/**
 * Find a test business in the database
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function findTestBusiness() {
  console.log("🔍 Finding test businesses in database...\n");
  
  // Find any completed job
  const job = await prisma.serpJob.findFirst({
    where: { status: 'completed' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (job) {
    console.log(`✅ Found job: ${job.keyword} in ${job.location}`);
    console.log(`   Job ID: ${job.id}`);
    
    // Find businesses from this job
    const businesses = await prisma.businessProfile.findMany({
      where: {
        serpResult: {
          jobId: job.id
        }
      },
      take: 5,
      select: {
        id: true,
        name: true,
        domain: true,
        city: true,
        state: true,
        serpResultId: true
      }
    });
    
    console.log(`\n📋 Found ${businesses.length} businesses:`);
    businesses.forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.name}`);
      console.log(`      ID: ${b.id}`);
      console.log(`      Domain: ${b.domain || 'N/A'}`);
      console.log(`      Location: ${b.city || 'N/A'}, ${b.state || 'N/A'}`);
    });
    
    if (businesses.length > 0) {
      console.log(`\n✅ Use this profile ID for testing: ${businesses[0].id}`);
      return businesses[0].id;
    }
  } else {
    console.log("❌ No completed jobs found");
  }
  
  // Also check for SPINE Center specifically
  const spineCenter = await prisma.businessProfile.findFirst({
    where: {
      name: { contains: "SPINE Center" }
    },
    select: {
      id: true,
      name: true,
      domain: true,
      serpResultId: true
    }
  });
  
  if (spineCenter) {
    console.log(`\n✅ Found SPINE Center:`);
    console.log(`   ID: ${spineCenter.id}`);
    console.log(`   Name: ${spineCenter.name}`);
    console.log(`   Domain: ${spineCenter.domain || 'N/A'}`);
    return spineCenter.id;
  }
  
  await prisma.$disconnect();
  return null;
}

findTestBusiness().then(profileId => {
  if (profileId) {
    console.log(`\n✅ Test with profile ID: ${profileId}`);
  } else {
    console.log("\n❌ No test business found");
  }
  process.exit(0);
}).catch(console.error);

