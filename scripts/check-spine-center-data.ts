/**
 * Check SPINE Center Data in Database and Route Response
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";

async function checkData() {
  console.log("🔍 Checking SPINE Center Data\n");
  console.log("=".repeat(80));

  try {
    // 1. Check Business Profile
    const profile = await prisma.businessProfile.findFirst({
      where: { name: { contains: "SPINE Center" } },
      include: {
        serpResult: {
          select: {
            id: true,
            rankAbsolute: true,
            rawData: true
          }
        }
      }
    });

    if (!profile) {
      console.log("❌ Business profile not found!");
      return;
    }

    console.log("✅ Business Profile Found:");
    console.log(`   ID: ${profile.id}`);
    console.log(`   Name: ${profile.name}`);
    console.log(`   Domain: ${profile.domain}`);
    console.log(`   SerpResult ID: ${profile.serpResultId}`);
    console.log(`   Rank: ${profile.serpResult?.rankAbsolute || 'N/A'}`);
    console.log(`\n   Stored Scores:`);
    console.log(`      pageSpeed: ${profile.pageSpeed ?? 'NULL'}`);
    console.log(`      mobileScore: ${profile.mobileScore ?? 'NULL'}`);
    console.log(`      accessibilityScore: ${profile.accessibilityScore ?? 'NULL'}`);
    console.log(`      seoScore: ${profile.seoScore ?? 'NULL'}`);
    console.log(`      domainAuthority: ${profile.domainAuthority ?? 'NULL'}`);
    console.log(`      monthlyTraffic: ${profile.monthlyTraffic ?? 'NULL'}`);

    // 2. Check Enriched Data
    const rawData: any = profile.serpResult?.rawData || {};
    const enriched: any = rawData.enriched || {};

    console.log(`\n📦 Enriched Data Keys: ${Object.keys(enriched).join(', ')}`);
    console.log(`   Total enriched keys: ${Object.keys(enriched).length}`);

    // Check PageSpeed Insights
    console.log(`\n📊 PageSpeed Insights:`);
    if (enriched.pageSpeedInsights) {
      console.log(`   ✅ Present`);
      console.log(`      performance: ${enriched.pageSpeedInsights.performance ?? 'NULL'}`);
      console.log(`      mobile: ${enriched.pageSpeedInsights.mobile ?? 'NULL'}`);
      console.log(`      accessibility: ${enriched.pageSpeedInsights.accessibility ?? 'NULL'}`);
      console.log(`      coreWebVitals: ${enriched.pageSpeedInsights.coreWebVitals ? 'Present' : 'Missing'}`);
    } else {
      console.log(`   ❌ Missing`);
    }

    // Check Analytics
    console.log(`\n📈 Analytics:`);
    if (enriched.analytics) {
      console.log(`   ✅ Present`);
      console.log(`      googleAnalytics.found: ${enriched.analytics.googleAnalytics?.found ?? 'NULL'}`);
      console.log(`      googleAnalytics.id: ${enriched.analytics.googleAnalytics?.id ?? 'NULL'}`);
      console.log(`      googleAnalytics.type: ${enriched.analytics.googleAnalytics?.type ?? 'NULL'}`);
      console.log(`      facebookPixel.found: ${enriched.analytics.facebookPixel?.found ?? 'NULL'}`);
    } else {
      console.log(`   ❌ Missing`);
    }

    // Check Schemas
    console.log(`\n📋 Schemas:`);
    if (enriched.schemas) {
      console.log(`   ✅ Present`);
      console.log(`      localBusiness: ${enriched.schemas.localBusiness}`);
      console.log(`      faq: ${enriched.schemas.faq}`);
      console.log(`      organization: ${enriched.schemas.organization}`);
      console.log(`      breadcrumbs: ${enriched.schemas.breadcrumbs}`);
    } else {
      console.log(`   ❌ Missing`);
    }

    // Check Ads
    console.log(`\n📢 Ads:`);
    console.log(`   isPaid (profile): ${profile.isPaid}`);
    console.log(`   adsCreatives: ${enriched.adsCreatives?.length ?? 0} creatives`);
    console.log(`   ads.matched: ${rawData.ads?.matched ?? 'N/A'}`);

    // 3. Simulate Route Logic
    console.log(`\n🔧 Simulating Route Logic:`);
    
    // Speed scores extraction (same as route)
    let desktopSpeed = profile.pageSpeed;
    let mobileSpeed = profile.mobileScore;
    
    console.log(`   Initial from profile: desktop=${desktopSpeed}, mobile=${mobileSpeed}`);
    
    if (desktopSpeed == null) {
      if (enriched.pageSpeedInsights?.performance != null) {
        desktopSpeed = enriched.pageSpeedInsights.performance;
        console.log(`   ✅ Using PageSpeed Insights performance: ${desktopSpeed}`);
      }
    }
    
    if (mobileSpeed == null) {
      if (enriched.pageSpeedInsights?.mobile != null) {
        mobileSpeed = enriched.pageSpeedInsights.mobile;
        console.log(`   ✅ Using PageSpeed Insights mobile: ${mobileSpeed}`);
      }
    }
    
    console.log(`   Final: desktop=${desktopSpeed ?? 'NULL'}, mobile=${mobileSpeed ?? 'NULL'}`);

    // Analytics extraction
    const storedAnalytics = enriched.analytics || {
      googleAnalytics: { found: false },
      facebookPixel: { found: false }
    };
    
    const hasGA = storedAnalytics.googleAnalytics?.found || false;
    const gaId = storedAnalytics.googleAnalytics?.id || null;
    
    console.log(`\n   Analytics:`);
    console.log(`      hasGA: ${hasGA}`);
    console.log(`      gaId: ${gaId}`);

    // 4. Calculate Opportunity Score (same as route)
    console.log(`\n📊 Opportunity Score Calculation:`);
    
    let opportunityScore = 0;
    let maxPossible = 0;

    // SERP Position (30 points)
    maxPossible += 30;
    const serpPosition = profile.serpResult?.rankAbsolute;
    if (serpPosition) {
      if (serpPosition <= 3) opportunityScore += 30;
      else if (serpPosition <= 10) opportunityScore += 20;
      else if (serpPosition <= 20) opportunityScore += 10;
      else opportunityScore += 5;
    }
    console.log(`   SERP Position (${serpPosition}): ${serpPosition ? (serpPosition <= 3 ? 30 : serpPosition <= 10 ? 20 : serpPosition <= 20 ? 10 : 5) : 0}/30`);

    // Schemas (20 points)
    maxPossible += 20;
    const schemas = enriched.schemas || {};
    if (schemas.localBusiness) opportunityScore += 10;
    if (schemas.faq) opportunityScore += 10;
    console.log(`   Schemas: ${(schemas.localBusiness ? 10 : 0) + (schemas.faq ? 10 : 0)}/20 (localBusiness: ${schemas.localBusiness}, faq: ${schemas.faq})`);

    // Analytics (15 points)
    maxPossible += 15;
    if (hasGA) opportunityScore += 10;
    if (storedAnalytics.facebookPixel?.found) opportunityScore += 5;
    console.log(`   Analytics: ${(hasGA ? 10 : 0) + (storedAnalytics.facebookPixel?.found ? 5 : 0)}/15 (GA: ${hasGA}, FB: ${storedAnalytics.facebookPixel?.found})`);

    // Speed (20 points)
    maxPossible += 20;
    if (desktopSpeed != null) {
      if (desktopSpeed >= 90) opportunityScore += 10;
      else if (desktopSpeed >= 70) opportunityScore += 5;
    }
    if (mobileSpeed != null) {
      if (mobileSpeed >= 90) opportunityScore += 10;
      else if (mobileSpeed >= 70) opportunityScore += 5;
    }
    console.log(`   Speed: ${(desktopSpeed != null ? (desktopSpeed >= 90 ? 10 : desktopSpeed >= 70 ? 5 : 0) : 0) + (mobileSpeed != null ? (mobileSpeed >= 90 ? 10 : mobileSpeed >= 70 ? 5 : 0) : 0)}/20 (desktop: ${desktopSpeed ?? 'NULL'}, mobile: ${mobileSpeed ?? 'NULL'})`);

    // PPC (15 points)
    maxPossible += 15;
    if (profile.isPaid || enriched.adsCreatives?.length > 0) {
      opportunityScore += 15;
      console.log(`   PPC: 15/15 (Running ads)`);
    } else {
      opportunityScore += 8;
      console.log(`   PPC: 8/15 (Not running ads)`);
    }

    const normalizedScore = maxPossible > 0 ? Math.round((opportunityScore / maxPossible) * 100) : 0;
    
    console.log(`\n   Total: ${opportunityScore}/${maxPossible} = ${normalizedScore}/100`);
    console.log(`\n   Expected Score: ${normalizedScore}/100`);
    console.log(`   Current UI Score: 46/100`);
    console.log(`   Previous Score: 58/100`);

    // 5. Identify Issues
    console.log(`\n🔍 Issues Identified:`);
    if (profile.pageSpeed == null && enriched.pageSpeedInsights?.performance == null) {
      console.log(`   ❌ Desktop Speed: Missing from both profile and enriched data`);
    }
    if (profile.mobileScore == null && enriched.pageSpeedInsights?.mobile == null) {
      console.log(`   ❌ Mobile Speed: Missing from both profile and enriched data`);
    }
    if (!hasGA) {
      console.log(`   ❌ Google Analytics: Not detected (should be found)`);
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkData().catch(console.error);

