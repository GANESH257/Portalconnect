/**
 * Validate Data Collection Results
 * Checks if all data was collected correctly
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

async function validateData() {
  try {
    console.log('📊 DATABASE VALIDATION');
    console.log('============================================================');
    
    // Check total businesses stored
    const totalBusinesses = await prisma.businessProfile.count();
    console.log(`✅ Total Business Profiles: ${totalBusinesses}`);
    
    // Check for businesses with missing critical data
    const noDomain = await prisma.businessProfile.count({
      where: { domain: null }
    });
    const noWebsite = await prisma.businessProfile.count({
      where: { websiteUrl: null }
    });
    const noPhone = await prisma.businessProfile.count({
      where: { phone: null }
    });
    
    console.log(`\n📋 Missing Data:`);
    console.log(`  Businesses without domain: ${noDomain}`);
    console.log(`  Businesses without website: ${noWebsite}`);
    console.log(`  Businesses without phone: ${noPhone}`);
    
    // Check SERP results
    const serpResults = await prisma.serpResult.count();
    console.log(`\n✅ Total SERP Results: ${serpResults}`);
    
    // Check keyword rankings
    const keywordRankings = await prisma.keywordRanking.count();
    console.log(`✅ Total Keyword Rankings: ${keywordRankings}`);
    
    // Check SERP Jobs
    const serpJobs = await prisma.serpJob.findMany({
      where: { 
        keyword: 'Spine', 
        location: 'Chesterfield, MO' 
      },
      include: {
        serpResults: {
          include: {
            businessProfile: true
          },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    if (serpJobs.length > 0) {
      const job = serpJobs[0];
      console.log(`\n📋 Latest Job Analysis (Job ID: ${job.id}):`);
      console.log(`  Status: ${job.status}`);
      console.log(`  SERP Results in job: ${job.serpResults.length}`);
      
      // Check rawData for enriched data
      let withAnalytics = 0;
      let withSchemas = 0;
      let withOnPage = 0;
      let withHTML = 0;
      let withGMB = 0;
      let withReviews = 0;
      let withBacklinks = 0;
      let withTraffic = 0;
      let withDomainRank = 0;
      
      const sampleSize = Math.min(10, job.serpResults.length);
      
      for (const result of job.serpResults.slice(0, sampleSize)) {
        const rawData: any = result.rawData || {};
        const enriched = rawData.enriched || {};
        
        if (enriched.analytics && (enriched.analytics.googleAnalytics || enriched.analytics.facebookPixel)) {
          withAnalytics++;
        }
        if (enriched.schemas) {
          withSchemas++;
        }
        if (enriched.onPage || enriched.onPageResults) {
          withOnPage++;
        }
        if (enriched.htmlContent) {
          withHTML++;
        }
        if (enriched.gmbInfo) {
          withGMB++;
        }
        if (enriched.reviews) {
          withReviews++;
        }
        if (enriched.backlinks && Array.isArray(enriched.backlinks) && enriched.backlinks.length > 0) {
          withBacklinks++;
        }
        if (enriched.traffic) {
          withTraffic++;
        }
        if (enriched.domainRank) {
          withDomainRank++;
        }
      }
      
      console.log(`\n📈 Enriched Data Coverage (sample of ${sampleSize}):`);
      console.log(`  ✅ With Analytics data: ${withAnalytics}/${sampleSize} (${Math.round(withAnalytics/sampleSize*100)}%)`);
      console.log(`  ✅ With Schemas data: ${withSchemas}/${sampleSize} (${Math.round(withSchemas/sampleSize*100)}%)`);
      console.log(`  ✅ With OnPage data: ${withOnPage}/${sampleSize} (${Math.round(withOnPage/sampleSize*100)}%)`);
      console.log(`  ✅ With HTML content: ${withHTML}/${sampleSize} (${Math.round(withHTML/sampleSize*100)}%)`);
      console.log(`  ✅ With GMB Info: ${withGMB}/${sampleSize} (${Math.round(withGMB/sampleSize*100)}%)`);
      console.log(`  ✅ With Reviews: ${withReviews}/${sampleSize} (${Math.round(withReviews/sampleSize*100)}%)`);
      console.log(`  ✅ With Backlinks: ${withBacklinks}/${sampleSize} (${Math.round(withBacklinks/sampleSize*100)}%)`);
      console.log(`  ✅ With Traffic data: ${withTraffic}/${sampleSize} (${Math.round(withTraffic/sampleSize*100)}%)`);
      console.log(`  ✅ With Domain Rank: ${withDomainRank}/${sampleSize} (${Math.round(withDomainRank/sampleSize*100)}%)`);
      
      // Check business profiles for calculated scores
      const profilesWithScores = await prisma.businessProfile.count({
        where: {
          serpResult: {
            serpJobId: job.id
          },
          seoScore: { not: null }
        }
      });
      
      console.log(`\n📊 Business Profiles with SEO Scores: ${profilesWithScores}/${job.serpResults.length}`);
      
      // Check for businesses with ads data
      const withAds = await prisma.businessProfile.count({
        where: {
          serpResult: {
            serpJobId: job.id
          },
          isPaid: true
        }
      });
      
      console.log(`📢 Businesses running ads: ${withAds}/${job.serpResults.length}`);
    } else {
      console.log('\n⚠️  No SERP jobs found for "Spine" in "Chesterfield, MO"');
    }
    
    console.log('\n============================================================');
    console.log('✅ Validation complete!');
    
  } catch (error: any) {
    console.error('❌ Validation error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

validateData();

