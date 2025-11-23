/**
 * Alternative: Google PageSpeed Insights API for speed scores
 * 
 * This is a FREE API that provides:
 * - Performance score (0-100)
 * - Mobile score (0-100)
 * - Accessibility score (0-100)
 * 
 * Requirements:
 * - Google API key (free, requires signup at https://console.cloud.google.com/)
 * - Add to .env: GOOGLE_PAGESPEED_API_KEY=your_key_here
 * 
 * Rate Limits:
 * - Free tier: 25,000 requests per day
 * - No cost per request
 */
import axios from "axios";

const GOOGLE_PAGESPEED_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;
const PAGESPEED_API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function getPageSpeedInsights(url: string): Promise<{
  performance: number | null;
  mobile: number | null;
  accessibility: number | null;
  seo: number | null;
  bestPractices: number | null;
  opportunities: any[];
  diagnostics: any[];
  metrics: {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    tti?: number; // Time to Interactive
    speedIndex?: number;
  };
} | null> {
  if (!GOOGLE_PAGESPEED_API_KEY) {
    console.log("⚠️  Google PageSpeed Insights API key not configured");
    console.log("   To use this, add GOOGLE_PAGESPEED_API_KEY to .env");
    console.log("   Get free API key at: https://console.cloud.google.com/");
    return null;
  }

  try {
    // Fetch ALL categories - don't specify category param to get all categories
    // PageSpeed Insights returns all categories (performance, accessibility, SEO, best-practices) by default
    const desktopResponse = await axios.get(PAGESPEED_API_URL, {
      params: {
        url: url,
        key: GOOGLE_PAGESPEED_API_KEY,
        strategy: "desktop"
        // Don't specify category - this returns ALL categories
      }
    });

    // Fetch mobile performance with all categories
    const mobileResponse = await axios.get(PAGESPEED_API_URL, {
      params: {
        url: url,
        key: GOOGLE_PAGESPEED_API_KEY,
        strategy: "mobile"
        // Don't specify category - this returns ALL categories
      }
    });

    const lighthouse = desktopResponse.data?.lighthouseResult;
    const mobileLighthouse = mobileResponse.data?.lighthouseResult;
    
    // Extract scores
    const desktopScore = lighthouse?.categories?.performance?.score
      ? Math.round(lighthouse.categories.performance.score * 100)
      : null;
    
    const mobileScore = mobileLighthouse?.categories?.performance?.score
      ? Math.round(mobileLighthouse.categories.performance.score * 100)
      : null;
    
    const accessibilityScore = lighthouse?.categories?.accessibility?.score
      ? Math.round(lighthouse.categories.accessibility.score * 100)
      : null;
    
    const seoScore = lighthouse?.categories?.seo?.score
      ? Math.round(lighthouse.categories.seo.score * 100)
      : null;
    
    const bestPracticesScore = lighthouse?.categories?.["best-practices"]?.score
      ? Math.round(lighthouse.categories["best-practices"].score * 100)
      : null;

    // Extract Core Web Vitals and other metrics
    const audits = lighthouse?.audits || {};
    const metrics = {
      fcp: audits["first-contentful-paint"]?.numericValue || null,
      lcp: audits["largest-contentful-paint"]?.numericValue || null,
      fid: audits["max-potential-fid"]?.numericValue || null,
      cls: audits["cumulative-layout-shift"]?.numericValue || null,
      tti: audits["interactive"]?.numericValue || null,
      speedIndex: audits["speed-index"]?.numericValue || null
    };

    // Extract opportunities (recommendations)
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === "opportunity" && audit.score !== null && audit.score < 1)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        details: audit.details
      }));

    // Extract diagnostics
    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.details?.type === "diagnostic" && audit.score !== null)
      .map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue
      }));

    return {
      performance: desktopScore,
      mobile: mobileScore,
      accessibility: accessibilityScore,
      seo: seoScore,
      bestPractices: bestPracticesScore,
      opportunities: opportunities,
      diagnostics: diagnostics,
      metrics: metrics
    };
  } catch (error: any) {
    console.error("PageSpeed Insights API error:", error.message);
    return null;
  }
}

