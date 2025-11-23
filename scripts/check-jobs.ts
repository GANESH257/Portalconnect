import { prisma } from '../server/lib/prisma';

async function checkJobs() {
  try {
    console.log('📋 CHECKING ALL JOBS...\n');
    
    const jobs = await prisma.serpJob.findMany({
      where: { status: 'completed' },
      select: {
        id: true,
        keyword: true,
        location: true,
        createdAt: true,
        _count: { select: { serpResults: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Found ${jobs.length} completed jobs:\n`);
    jobs.forEach((job, i) => {
      console.log(`${i + 1}. Job ID: ${job.id}`);
      console.log(`   Keyword: "${job.keyword}"`);
      console.log(`   Location: "${job.location}"`);
      console.log(`   Results: ${job._count.serpResults}`);
      console.log(`   Created: ${job.createdAt}`);
      console.log('');
    });
    
    // Check exact match
    const exactMatch = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      }
    });
    
    console.log('\n🔍 EXACT MATCH CHECK:');
    console.log('   Searching for: keyword="Spine", location="Chesterfield, MO"');
    if (exactMatch) {
      console.log(`   ✅ FOUND: Job ID ${exactMatch.id}`);
      console.log(`      Keyword: "${exactMatch.keyword}"`);
      console.log(`      Location: "${exactMatch.location}"`);
    } else {
      console.log('   ❌ NOT FOUND');
    }
    
    // Check what the search is actually returning
    const searchResult = await prisma.serpJob.findFirst({
      where: {
        keyword: 'Spine',
        location: 'Chesterfield, MO',
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        serpResults: {
          take: 5,
          select: {
            title: true,
            domain: true
          }
        }
      }
    });
    
    if (searchResult) {
      console.log('\n📊 FIRST 5 RESULTS FROM THIS JOB:');
      searchResult.serpResults.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.title} (${r.domain || 'no domain'})`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkJobs();

