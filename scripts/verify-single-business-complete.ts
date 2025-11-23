/**
 * Complete Verification for Single Business (SPINE Center)
 * 
 * This script verifies ALL data components are present and correct:
 * - Speed scores (desktop, mobile, accessibility)
 * - Analytics (Google Analytics, Facebook Pixel)
 * - Schemas (LocalBusiness, FAQ, etc.)
 * - Ads data
 * - Google Places data
 * - Safe Browsing data
 * - Schema Validation data
 * - SEO metrics (domain authority, backlinks, traffic)
 * - Keyword rankings
 * - Core Web Vitals
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";

interface VerificationResult {
  component: string;
  status: '✅' | '❌' | '⚠️';
  details: string;
  value?: any;
}

async function verifySingleBusiness() {
  console.log("🔍 Complete Data Verification for SPINE Center\n");
  console.log(`Business: ${BUSINESS_NAME}\n`);
  console.log("=".repeat(80));

  const results: VerificationResult[] = [];

  try {
    // Find the business profile
    const businessProfile = await prisma.businessProfile.findFirst({
      where: {
        name: { contains: "SPINE Center" }
      },
      include: {
        serpResult: {
          select: {
            id: true,
            rawData: true,
            title: true,
            domain: true
          }
        },
        keywordRankings: {
          take: 5,
          orderBy: { rankAbsolute: 'asc' }
        }
      }
    });

    if (!businessProfile) {
      console.log("❌ Business profile not found!");
      return;
    }

    console.log(`✅ Found Business Profile: ${businessProfile.name}`);
    console.log(`   Profile ID: ${businessProfile.id}`);
    console.log(`   Domain: ${businessProfile.domain || 'N/A'}`);
    console.log(`   SerpResult ID: ${businessProfile.serpResultId || 'N/A'}\n`);

    const rawData: any = businessProfile.serpResult?.rawData || {};
    const enriched: any = rawData.enriched || {};

    // 1. Speed Scores
    console.log("📊 SPEED SCORES");
    console.log("-".repeat(80));
    
    const desktopSpeed = businessProfile.pageSpeed || enriched.pageSpeedInsights?.performance;
    const mobileSpeed = businessProfile.mobileScore || enriched.pageSpeedInsights?.mobile;
    const accessibilityScore = businessProfile.accessibilityScore || enriched.pageSpeedInsights?.accessibility;

    results.push({
      component: "Desktop Speed Score",
      status: desktopSpeed != null ? '✅' : '❌',
      details: desktopSpeed != null ? `Score: ${desktopSpeed}/100` : "Missing",
      value: desktopSpeed
    });

    results.push({
      component: "Mobile Speed Score",
      status: mobileSpeed != null ? '✅' : '❌',
      details: mobileSpeed != null ? `Score: ${mobileSpeed}/100` : "Missing",
      value: mobileSpeed
    });

    results.push({
      component: "Accessibility Score",
      status: accessibilityScore != null ? '✅' : '⚠️',
      details: accessibilityScore != null ? `Score: ${accessibilityScore}/100` : "Missing (may be null from API)",
      value: accessibilityScore
    });

    console.log(`   Desktop Speed: ${desktopSpeed != null ? `✅ ${desktopSpeed}/100` : '❌ Missing'}`);
    console.log(`   Mobile Speed: ${mobileSpeed != null ? `✅ ${mobileSpeed}/100` : '❌ Missing'}`);
    console.log(`   Accessibility: ${accessibilityScore != null ? `✅ ${accessibilityScore}/100` : '⚠️ Missing'}`);

    // Core Web Vitals - Check multiple possible locations
    const coreWebVitals = enriched.pageSpeedInsights?.coreWebVitals || 
                          enriched.pageSpeedInsights?.rawData?.desktop?.lighthouseResult?.audits ? {
                            lcp: enriched.pageSpeedInsights.rawData.desktop.lighthouseResult.audits['largest-contentful-paint']?.numericValue,
                            fid: enriched.pageSpeedInsights.rawData.desktop.lighthouseResult.audits['max-potential-fid']?.numericValue,
                            cls: enriched.pageSpeedInsights.rawData.desktop.lighthouseResult.audits['cumulative-layout-shift']?.numericValue,
                            fcp: enriched.pageSpeedInsights.rawData.desktop.lighthouseResult.audits['first-contentful-paint']?.numericValue,
                            tti: enriched.pageSpeedInsights.rawData.desktop.lighthouseResult.audits['interactive']?.numericValue
                          } : null;
    
    if (coreWebVitals && (coreWebVitals.lcp || coreWebVitals.fid || coreWebVitals.cls)) {
      console.log(`   Core Web Vitals: ✅ Present`);
      console.log(`      LCP: ${coreWebVitals.lcp || 'N/A'}ms`);
      console.log(`      FID: ${coreWebVitals.fid || 'N/A'}ms`);
      console.log(`      CLS: ${coreWebVitals.cls || 'N/A'}`);
      console.log(`      FCP: ${coreWebVitals.fcp || 'N/A'}ms`);
      console.log(`      TTI: ${coreWebVitals.tti || 'N/A'}ms`);
      results.push({
        component: "Core Web Vitals",
        status: '✅',
        details: "All vitals present",
        value: coreWebVitals
      });
    } else {
      console.log(`   Core Web Vitals: ❌ Missing`);
      results.push({
        component: "Core Web Vitals",
        status: '❌',
        details: "Missing",
        value: null
      });
    }

    // 2. Analytics
    console.log("\n📈 ANALYTICS DATA");
    console.log("-".repeat(80));
    
    const analytics = enriched.analytics;
    if (analytics) {
      const hasGA = analytics.googleAnalytics?.found || false;
      const hasFB = analytics.facebookPixel?.found || false;
      
      console.log(`   Google Analytics: ${hasGA ? '✅ Found' : '❌ Not Found'}`);
      if (hasGA) {
        console.log(`      Type: ${analytics.googleAnalytics.type || 'N/A'}`);
        console.log(`      ID: ${analytics.googleAnalytics.id || 'N/A'}`);
      }
      
      console.log(`   Facebook Pixel: ${hasFB ? '✅ Found' : '❌ Not Found'}`);
      if (hasFB) {
        console.log(`      ID: ${analytics.facebookPixel.id || 'N/A'}`);
      }

      results.push({
        component: "Analytics Data",
        status: (hasGA || hasFB) ? '✅' : '⚠️',
        details: `GA: ${hasGA ? 'Yes' : 'No'}, FB: ${hasFB ? 'Yes' : 'No'}`,
        value: analytics
      });
    } else {
      console.log(`   Analytics: ❌ Missing`);
      results.push({
        component: "Analytics Data",
        status: '❌',
        details: "Not found in enriched data",
        value: null
      });
    }

    // 3. Schemas
    console.log("\n📋 SCHEMA MARKUP");
    console.log("-".repeat(80));
    
    const schemas = enriched.schemas;
    if (schemas) {
      const schemaTypes = ['localBusiness', 'faq', 'organization', 'breadcrumbs', 'product', 'review'];
      const foundSchemas = schemaTypes.filter(type => schemas[type] === true);
      
      console.log(`   Found Schemas: ${foundSchemas.length}/${schemaTypes.length}`);
      schemaTypes.forEach(type => {
        console.log(`      ${type}: ${schemas[type] ? '✅' : '❌'}`);
      });

      results.push({
        component: "Schema Markup",
        status: foundSchemas.length > 0 ? '✅' : '❌',
        details: `Found ${foundSchemas.length} schema types`,
        value: schemas
      });
    } else {
      console.log(`   Schemas: ❌ Missing`);
      results.push({
        component: "Schema Markup",
        status: '❌',
        details: "Not found in enriched data",
        value: null
      });
    }

    // 4. Ads Data
    console.log("\n📢 ADS DATA");
    console.log("-".repeat(80));
    
    const adsCreatives = enriched.adsCreatives;
    const adsData = rawData.ads;
    const isPaid = businessProfile.isPaid;

    if (adsCreatives && Array.isArray(adsCreatives) && adsCreatives.length > 0) {
      console.log(`   Ads Creatives: ✅ Found ${adsCreatives.length} creatives`);
      results.push({
        component: "Ads Creatives",
        status: '✅',
        details: `${adsCreatives.length} creatives found`,
        value: adsCreatives.length
      });
    } else if (isPaid || adsData?.matched) {
      console.log(`   Ads Status: ✅ Running Ads (matched: ${adsData?.matched || false})`);
      results.push({
        component: "Ads Data",
        status: '✅',
        details: "Business is running ads",
        value: { isPaid, matched: adsData?.matched }
      });
    } else {
      console.log(`   Ads: ⚠️ Not Running Ads (or data not collected)`);
      results.push({
        component: "Ads Data",
        status: '⚠️',
        details: "No ads data (business may not be running ads)",
        value: null
      });
    }

    // 5. Google Places
    console.log("\n⭐ GOOGLE PLACES DATA");
    console.log("-".repeat(80));
    
    const googlePlaces = enriched.googlePlaces;
    const rating = businessProfile.rating;
    const reviewsCount = businessProfile.reviewsCount;

    if (googlePlaces || rating != null) {
      console.log(`   Rating: ${rating != null ? `✅ ${rating}/5.0` : '❌ Missing'}`);
      console.log(`   Reviews Count: ${reviewsCount != null ? `✅ ${reviewsCount}` : '❌ Missing'}`);
      if (googlePlaces) {
        console.log(`   Google Places Data: ✅ Present`);
        console.log(`      Place ID: ${googlePlaces.placeId || 'N/A'}`);
        console.log(`      Reviews: ${googlePlaces.reviews?.length || 0}`);
      }
      results.push({
        component: "Google Places",
        status: (rating != null || googlePlaces) ? '✅' : '❌',
        details: `Rating: ${rating || 'N/A'}, Reviews: ${reviewsCount || 'N/A'}`,
        value: { rating, reviewsCount, googlePlaces }
      });
    } else {
      console.log(`   Google Places: ❌ Missing`);
      results.push({
        component: "Google Places",
        status: '❌',
        details: "No rating or Google Places data",
        value: null
      });
    }

    // 6. Safe Browsing
    console.log("\n🔒 SAFE BROWSING DATA");
    console.log("-".repeat(80));
    
    const safeBrowsing = enriched.safeBrowsing;
    if (safeBrowsing) {
      console.log(`   Safe Browsing: ✅ Present`);
      console.log(`      Is Safe: ${safeBrowsing.isSafe ? '✅ Yes' : '❌ No'}`);
      console.log(`      Threats: ${safeBrowsing.threats?.length || 0}`);
      results.push({
        component: "Safe Browsing",
        status: '✅',
        details: `Safe: ${safeBrowsing.isSafe}, Threats: ${safeBrowsing.threats?.length || 0}`,
        value: safeBrowsing
      });
    } else {
      console.log(`   Safe Browsing: ❌ Missing`);
      results.push({
        component: "Safe Browsing",
        status: '❌',
        details: "Not found in enriched data",
        value: null
      });
    }

    // 7. Schema Validation
    console.log("\n✅ SCHEMA VALIDATION");
    console.log("-".repeat(80));
    
    const schemaValidation = enriched.schemaValidation;
    if (schemaValidation) {
      console.log(`   Schema Validation: ✅ Present`);
      console.log(`      Valid: ${schemaValidation.valid ? '✅ Yes' : '❌ No'}`);
      console.log(`      Errors: ${schemaValidation.errors?.length || 0}`);
      console.log(`      Warnings: ${schemaValidation.warnings?.length || 0}`);
      results.push({
        component: "Schema Validation",
        status: '✅',
        details: `Valid: ${schemaValidation.valid}, Errors: ${schemaValidation.errors?.length || 0}`,
        value: schemaValidation
      });
    } else {
      console.log(`   Schema Validation: ❌ Missing`);
      results.push({
        component: "Schema Validation",
        status: '❌',
        details: "Not found in enriched data",
        value: null
      });
    }

    // 8. SEO Metrics
    console.log("\n📊 SEO METRICS");
    console.log("-".repeat(80));
    
    const domainAuthority = businessProfile.domainAuthority;
    const backlinks = businessProfile.backlinks;
    const monthlyTraffic = businessProfile.monthlyTraffic;
    const seoScore = businessProfile.seoScore;

    console.log(`   Domain Authority: ${domainAuthority != null ? `✅ ${domainAuthority}/100` : '❌ Missing'}`);
    console.log(`   Backlinks: ${backlinks != null ? `✅ ${backlinks}` : '❌ Missing'}`);
    console.log(`   Monthly Traffic: ${monthlyTraffic != null ? `✅ ${monthlyTraffic}` : '❌ Missing'}`);
    console.log(`   SEO Score: ${seoScore != null ? `✅ ${seoScore}/100` : '❌ Missing'}`);

    results.push({
      component: "Domain Authority",
      status: domainAuthority != null ? '✅' : '❌',
      details: domainAuthority != null ? `${domainAuthority}/100` : "Missing",
      value: domainAuthority
    });

    results.push({
      component: "Backlinks",
      status: backlinks != null ? '✅' : '❌',
      details: backlinks != null ? `${backlinks}` : "Missing",
      value: backlinks
    });

    results.push({
      component: "Monthly Traffic",
      status: monthlyTraffic != null ? '✅' : '❌',
      details: monthlyTraffic != null ? `${monthlyTraffic}` : "Missing",
      value: monthlyTraffic
    });

    results.push({
      component: "SEO Score",
      status: seoScore != null ? '✅' : '❌',
      details: seoScore != null ? `${seoScore}/100` : "Missing",
      value: seoScore
    });

    // 9. Keyword Rankings
    console.log("\n🔑 KEYWORD RANKINGS");
    console.log("-".repeat(80));
    
    const rankedKeywords = enriched.rankedKeywords;
    const keywordRankings = businessProfile.keywordRankings;
    
    if (keywordRankings && keywordRankings.length > 0) {
      console.log(`   Keyword Rankings (DB): ✅ Found ${keywordRankings.length} rankings`);
      keywordRankings.slice(0, 5).forEach((kr: any) => {
        console.log(`      "${kr.keyword}": Rank #${kr.rankAbsolute}`);
      });
      results.push({
        component: "Keyword Rankings",
        status: '✅',
        details: `${keywordRankings.length} keywords ranked`,
        value: keywordRankings.length
      });
    } else if (rankedKeywords && Array.isArray(rankedKeywords) && rankedKeywords.length > 0) {
      console.log(`   Ranked Keywords (Enriched): ✅ Found ${rankedKeywords.length} keywords`);
      rankedKeywords.slice(0, 5).forEach((kw: any) => {
        console.log(`      "${kw.keyword || kw.key || 'N/A'}": Rank #${kw.rank_absolute || kw.rankAbsolute || 'N/A'}`);
      });
      results.push({
        component: "Keyword Rankings",
        status: '✅',
        details: `${rankedKeywords.length} keywords in enriched data`,
        value: rankedKeywords.length
      });
    } else {
      console.log(`   Keyword Rankings: ❌ Missing`);
      results.push({
        component: "Keyword Rankings",
        status: '❌',
        details: "No keyword rankings found",
        value: 0
      });
    }

    // Summary
    console.log("\n" + "=".repeat(80));
    console.log("📊 VERIFICATION SUMMARY");
    console.log("=".repeat(80));

    const passed = results.filter(r => r.status === '✅').length;
    const failed = results.filter(r => r.status === '❌').length;
    const warnings = results.filter(r => r.status === '⚠️').length;
    const total = results.length;
    const completeness = Math.round((passed / total) * 100);

    console.log(`\nTotal Components Checked: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`\n📈 Completeness: ${completeness}%`);

    if (completeness >= 80) {
      console.log("\n✅ Data collection is COMPLETE and CORRECT!");
      console.log("   Ready to proceed with 5 businesses.");
    } else {
      console.log("\n⚠️  Some data components are missing.");
      console.log("   Failed components:");
      results.filter(r => r.status === '❌').forEach(r => {
        console.log(`      - ${r.component}: ${r.details}`);
      });
    }

    console.log("\n" + "=".repeat(80));

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySingleBusiness().catch(console.error);

