/**
 * Update PageSpeed Data for SPINE Center
 * 
 * This script fetches PageSpeed Insights data and updates the database
 * with performance, mobile, accessibility, SEO, and best practices scores.
 */

import "dotenv/config";
import { prisma } from "../server/lib/prisma.js";
import axios from "axios";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";
const DOMAIN = "onlinespinecare.com";
// Try both possible env variable names
const GOOGLE_PAGESPEED_API_KEY = process.env.GOOGLE_PAGESPEED_INSIGHTS_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;

if (!GOOGLE_PAGESPEED_API_KEY) {
  console.error("❌ Google PageSpeed API key not found in .env");
  console.error("   Please add either GOOGLE_PAGESPEED_INSIGHTS_API_KEY or GOOGLE_PAGESPEED_API_KEY to .env");
  process.exit(1);
}

/**
 * Fetch PageSpeed Insights data from Google API
 * Uses the same logic as add-pagespeed-insights.ts
 */
async function getPageSpeedInsights(url: string): Promise<any> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
  
  try {
    // Fetch desktop performance with all categories
    console.log("   📊 Fetching desktop performance data...");
    const desktopResponse = await axios.get(apiUrl, {
      params: {
        url: url,
        key: GOOGLE_PAGESPEED_API_KEY,
        strategy: "desktop"
        // Don't specify category - API v5 returns all categories by default
      },
      timeout: 60000 // 60 second timeout
    });
    
    // Fetch mobile performance with all categories
    console.log("   📱 Fetching mobile performance data...");
    const mobileResponse = await axios.get(apiUrl, {
      params: {
        url: url,
        key: GOOGLE_PAGESPEED_API_KEY,
        strategy: "mobile"
        // Don't specify category - API v5 returns all categories by default
      },
      timeout: 60000 // 60 second timeout
    });
    
    return {
      desktop: desktopResponse.data,
      mobile: mobileResponse.data
    };
  } catch (error: any) {
    if (error.response) {
      throw new Error(`PageSpeed API error: ${error.response.status} - ${error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * Extract scores from PageSpeed Insights response
 * Uses the same logic as add-pagespeed-insights.ts
 */
function extractPageSpeedScores(desktopData: any, mobileData: any): {
  performance: number | null;
  mobile: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  coreWebVitals?: any;
} {
  const result: any = {
    performance: null,
    mobile: null,
    accessibility: null,
    seo: null,
    bestPractices: null,
  };
  
  // Extract desktop scores
  const desktopLighthouse = desktopData?.lighthouseResult;
  if (desktopLighthouse) {
    const categories = desktopLighthouse.categories || {};
    
    // Extract scores from categories
    if (categories.performance) {
      result.performance = Math.round(categories.performance.score * 100);
    }
    if (categories.accessibility) {
      result.accessibility = Math.round(categories.accessibility.score * 100);
    }
    if (categories['best-practices']) {
      result.bestPractices = Math.round(categories['best-practices'].score * 100);
    }
    if (categories.seo) {
      result.seo = Math.round(categories.seo.score * 100);
    }
    
    // Core Web Vitals from desktop
    const audits = desktopLighthouse.audits || {};
    result.coreWebVitals = {
      lcp: audits['largest-contentful-paint']?.numericValue ? Math.round(audits['largest-contentful-paint'].numericValue) : null,
      fid: audits['max-potential-fid']?.numericValue ? Math.round(audits['max-potential-fid'].numericValue) : null,
      cls: audits['cumulative-layout-shift']?.numericValue ? audits['cumulative-layout-shift'].numericValue : null,
      fcp: audits['first-contentful-paint']?.numericValue ? Math.round(audits['first-contentful-paint'].numericValue) : null,
      tti: audits['interactive']?.numericValue ? Math.round(audits['interactive'].numericValue) : null,
    };
  }
  
  // Extract mobile scores
  const mobileLighthouse = mobileData?.lighthouseResult;
  if (mobileLighthouse) {
    const categories = mobileLighthouse.categories || {};
    if (categories.performance) {
      result.mobile = Math.round(categories.performance.score * 100);
    }
  }
  
  return result;
}

async function updatePageSpeedData() {
  console.log("🚀 Updating PageSpeed Data for SPINE Center\n");
  
  try {
    // Find the business profile
    const businessProfile = await prisma.businessProfile.findFirst({
      where: {
        name: { contains: BUSINESS_NAME }
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
    
    if (!businessProfile) {
      console.log("❌ Business profile not found");
      return;
    }
    
    console.log(`✅ Found business profile: ${businessProfile.name}`);
    console.log(`   Domain: ${businessProfile.domain || DOMAIN}`);
    
    // Fetch PageSpeed Insights data
    const url = businessProfile.websiteUrl || `https://${businessProfile.domain || DOMAIN}`;
    console.log(`\n📥 Fetching PageSpeed Insights for: ${url}`);
    console.log(`   Using API Key: ${GOOGLE_PAGESPEED_API_KEY.substring(0, 10)}...`);
    
    try {
      const pageSpeedData = await getPageSpeedInsights(url);
      console.log("✅ PageSpeed Insights data fetched successfully");
      
      // Extract scores from both desktop and mobile responses
      const scores = extractPageSpeedScores(pageSpeedData.desktop, pageSpeedData.mobile);
      console.log("\n📊 PageSpeed Scores:");
      console.log("   Desktop Performance:", scores.performance);
      console.log("   Mobile Performance:", scores.mobile);
      console.log("   Accessibility:", scores.accessibility);
      console.log("   SEO:", scores.seo);
      console.log("   Best Practices:", scores.bestPractices);
      console.log("   Core Web Vitals:", JSON.stringify(scores.coreWebVitals, null, 2));
      
      // Update the serpResult's rawData.enriched
      if (businessProfile.serpResult) {
        const serpResult = businessProfile.serpResult;
        const rawData: any = serpResult.rawData || {};
        const enriched: any = rawData.enriched || {};
        
        // Store full PageSpeed Insights data
        enriched.pageSpeedInsights = {
          performance: scores.performance,
          mobile: scores.mobile,
          accessibility: scores.accessibility,
          seo: scores.seo,
          bestPractices: scores.bestPractices,
          coreWebVitals: scores.coreWebVitals,
          rawData: {
            desktop: pageSpeedData.desktop,
            mobile: pageSpeedData.mobile
          }
        };
        
        // Update the serpResult
        await prisma.serpResult.update({
          where: { id: serpResult.id },
          data: {
            rawData: {
              ...rawData,
              enriched: enriched
            }
          }
        });
        
        // Update BusinessProfile with speed scores
        await prisma.businessProfile.update({
          where: { id: businessProfile.id },
          data: {
            pageSpeed: scores.performance,
            mobileScore: scores.mobile,
            accessibilityScore: scores.accessibility
          }
        });
        
        console.log("\n✅ Updated database with PageSpeed Insights data");
        console.log(`   SerpResult ID: ${serpResult.id}`);
        console.log(`   BusinessProfile ID: ${businessProfile.id}`);
        console.log(`   Stored scores: Desktop=${scores.performance}, Mobile=${scores.mobile}, Accessibility=${scores.accessibility}`);
      } else {
        console.log("\n❌ No serpResult linked to business profile");
      }
      
    } catch (pageSpeedError: any) {
      console.log(`\n❌ PageSpeed Insights fetch failed: ${pageSpeedError.message}`);
      if (pageSpeedError.response) {
        console.log(`   Status: ${pageSpeedError.response.status}`);
        console.log(`   Response: ${JSON.stringify(pageSpeedError.response.data, null, 2)}`);
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePageSpeedData().catch(console.error);

