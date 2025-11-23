import { prisma } from '../server/lib/prisma';

async function checkAdsData() {
  try {
    // Find the business profile
    const profile = await prisma.businessProfile.findFirst({
      where: {
        name: { contains: 'SPINE Center' }
      },
      include: {
        serpResult: {
          select: {
            id: true,
            rawData: true
          }
        }
      }
    });
    
    if (!profile) {
      console.log('❌ Profile not found');
      return;
    }
    
    console.log('✅ Found profile:', profile.name);
    console.log('   Profile ID:', profile.id);
    console.log('   isPaid:', profile.isPaid);
    
    const rawData: any = profile.serpResult?.rawData || {};
    console.log('\n📦 RawData check:');
    console.log('   Has rawData:', !!rawData);
    console.log('   Has ads:', !!rawData.ads);
    if (rawData.ads) {
      console.log('   ads object:', JSON.stringify(rawData.ads, null, 2));
    }
    console.log('   Has enriched:', !!rawData.enriched);
    if (rawData.enriched) {
      console.log('   enriched.ads:', JSON.stringify(rawData.enriched?.ads, null, 2));
    }
    
    // Check if there's ads data anywhere
    console.log('\n🔍 Full rawData structure:');
    console.log('   Keys in rawData:', Object.keys(rawData));
    if (rawData.enriched) {
      console.log('   Keys in enriched:', Object.keys(rawData.enriched));
    }
    
    // Check all businesses from the Spine job
    console.log('\n\n🔍 Checking ALL businesses from Spine job for ads data:');
    const spineJob = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (spineJob) {
      const allResults = await prisma.serpResult.findMany({
        where: { serpJobId: spineJob.id },
        select: {
          id: true,
          title: true,
          rawData: true,
          businessProfile: {
            select: {
              id: true,
              name: true,
              isPaid: true
            }
          }
        },
        take: 10
      });
      
      let withAds = 0;
      let withIsPaid = 0;
      
      for (const result of allResults) {
        const raw: any = result.rawData || {};
        const hasAds = !!(raw.ads || raw.enriched?.ads);
        const isPaid = result.businessProfile?.isPaid || false;
        
        if (hasAds) {
          withAds++;
          console.log(`\n   ✅ ${result.title || result.businessProfile?.name}`);
          console.log(`      ads:`, raw.ads || raw.enriched?.ads);
        }
        if (isPaid) {
          withIsPaid++;
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   Total checked: ${allResults.length}`);
      console.log(`   With ads data: ${withAds}`);
      console.log(`   With isPaid=true: ${withIsPaid}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdsData();

