/**
 * Fix and re-collect ALL data for a single business
 */
import "dotenv/config";
import { dataForSEOService } from "../server/services/dataforseoService.js";
import { prisma } from "../server/lib/prisma.js";
import axios from "axios";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";
const LOCATION = "Chesterfield, MO";

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// Copy detection functions from collect-spine-data.ts
function detectSchemasInHTML(html: string): any {
  const lowerHtml = html.toLowerCase();
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
  let hasLocalBusiness = false;
  let hasFAQ = false;
  let hasOrganization = false;
  let hasBreadcrumbs = false;
  let hasProduct = false;
  let hasReview = false;
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const schema = JSON.parse(jsonContent);
        const schemas = Array.isArray(schema) ? schema : [schema];
        for (const s of schemas) {
          const type = s['@type']?.toLowerCase() || '';
          if (type.includes('localbusiness')) hasLocalBusiness = true;
          if (type.includes('faqpage')) hasFAQ = true;
          if (type.includes('organization')) hasOrganization = true;
          if (type.includes('breadcrumb')) hasBreadcrumbs = true;
          if (type.includes('product')) hasProduct = true;
          if (type.includes('review')) hasReview = true;
        }
      } catch {}
    }
  }
  
  return { localBusiness: hasLocalBusiness, faq: hasFAQ, organization: hasOrganization, breadcrumbs: hasBreadcrumbs, product: hasProduct, review: hasReview };
}

function detectAnalyticsInHTML(html: string): any {
  const lowerHtml = html.toLowerCase();
  const hasGA = /gtag|ga\(|google-analytics|googletagmanager|ga4|gtm/i.test(html);
  const hasFB = /facebook.*pixel|fbq\(|connect\.facebook/i.test(html);
  
  let gaId = null;
  let gaType = null;
  
  if (hasGA) {
    const gaMatch = html.match(/(?:gtag|ga)\(['"]\w+['"],\s*['"]([^'"]+)['"]/i) || html.match(/UA-\d+-\d+|G-[A-Z0-9]+/);
    if (gaMatch) {
      gaId = gaMatch[1] || gaMatch[0];
      gaType = gaId.startsWith('G-') ? 'GA4' : 'UA';
    }
  }
  
  return {
    googleAnalytics: { found: hasGA, id: gaId, type: gaType },
    facebookPixel: { found: hasFB }
  };
}

function calculateSEOScore(metrics: any): number | null {
  let score = 0;
  let maxPossible = 0;
  
  // Domain Authority (25% weight) - Reduced from 30% to make room for PageSpeed SEO
  if (metrics.domainAuthority != null) {
    maxPossible += 25;
    // Scale domain authority proportionally: 0-100 DA maps to 0-25 points
    score += Math.round((metrics.domainAuthority / 100) * 25);
  }
  
  // Backlinks (15% weight) - Reduced from 20%
  if (metrics.backlinks != null) {
    maxPossible += 15;
    if (metrics.backlinks >= 10000) score += 15;
    else if (metrics.backlinks >= 5000) score += 12;
    else if (metrics.backlinks >= 1000) score += 8;
    else if (metrics.backlinks >= 100) score += 4;
  }
  
  // Monthly Traffic (15% weight) - Reduced from 20%
  if (metrics.monthlyTraffic != null) {
    maxPossible += 15;
    if (metrics.monthlyTraffic >= 100000) score += 15;
    else if (metrics.monthlyTraffic >= 50000) score += 12;
    else if (metrics.monthlyTraffic >= 10000) score += 8;
    else if (metrics.monthlyTraffic >= 5000) score += 6;
    else if (metrics.monthlyTraffic >= 1000) score += 4;
    else if (metrics.monthlyTraffic >= 500) score += 3;
    else if (metrics.monthlyTraffic >= 100) score += 2;
    else if (metrics.monthlyTraffic > 0) {
      score += Math.max(1, Math.round((metrics.monthlyTraffic / 100) * 1));
    }
  }
  
  // Page Speed (10% weight) - Reduced from 15%
  if (metrics.pageSpeed != null) {
    maxPossible += 10;
    if (metrics.pageSpeed >= 90) score += 10;
    else if (metrics.pageSpeed >= 70) score += 7;
    else if (metrics.pageSpeed >= 50) score += 4;
  }
  
  // Mobile Score (10% weight) - Same
  if (metrics.mobileScore != null) {
    maxPossible += 10;
    if (metrics.mobileScore >= 90) score += 10;
    else if (metrics.mobileScore >= 70) score += 7;
    else if (metrics.mobileScore >= 50) score += 4;
  }
  
  // PageSpeed Insights SEO Score (15% weight) - NEW! Uses Google's official SEO analysis
  if (metrics.pageSpeedInsightsSEO != null) {
    maxPossible += 15;
    // Use PageSpeed Insights SEO score directly (0-100 scale)
    score += Math.round((metrics.pageSpeedInsightsSEO / 100) * 15);
  }
  
  // Accessibility Score (5% weight) - Same
  if (metrics.accessibilityScore != null) {
    maxPossible += 5;
    if (metrics.accessibilityScore >= 90) score += 5;
    else if (metrics.accessibilityScore >= 70) score += 3;
    else if (metrics.accessibilityScore >= 50) score += 1;
  }
  
  // Best Practices Score (5% weight) - NEW! Uses Google's best practices analysis
  if (metrics.bestPractices != null) {
    maxPossible += 5;
    // Use PageSpeed Insights Best Practices score directly (0-100 scale)
    score += Math.round((metrics.bestPractices / 100) * 5);
  }
  
  if (maxPossible === 0) return null;
  return Math.round((score / maxPossible) * 100);
}

async function fixBusiness() {
  console.log("🔧 FIXING DATA FOR:", BUSINESS_NAME);
  console.log("=".repeat(70));
  
  // Find the business
  const serpResult = await prisma.serpResult.findFirst({
    where: {
      title: { contains: "SPINE Center: Dr. Amit Bhandarkar" },
      rankAbsolute: 1
    },
    include: { businessProfile: true }
  });
  
  if (!serpResult) {
    console.log("❌ Business not found");
    await prisma.$disconnect();
    return;
  }
  
  console.log("✅ Found business:", serpResult.title);
  console.log("   Domain:", serpResult.domain);
  console.log("   Website:", serpResult.url);
  
  const domain = serpResult.domain || extractDomain(serpResult.url);
  const websiteUrl = serpResult.url || `https://${domain}`;
  
  if (!domain) {
    console.log("❌ No domain found");
    await prisma.$disconnect();
    return;
  }
  
  const enriched: any = {};
  
  // 1. GMB Info
  console.log("\n📋 Fetching GMB Info...");
  try {
    const gmbData = await dataForSEOService.enrichBusinessProfile({
      businessName: BUSINESS_NAME,
      location: LOCATION,
      placeId: serpResult.placeId || undefined,
      cid: serpResult.cid || undefined
    });
    enriched.gmbInfo = gmbData?.tasks?.[0]?.result?.[0] || null;
    console.log("   ✅ GMB Info:", enriched.gmbInfo ? "Found" : "Not found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ GMB Info failed:", error.message);
  }
  
  // 2. Reviews (async task - need to wait and fetch)
  console.log("\n⭐ Fetching Reviews...");
  try {
    const reviewsTask = await dataForSEOService.getBusinessReviews({
      businessName: BUSINESS_NAME,
      location: LOCATION,
      maxReviews: 1000
    });
    const taskId = reviewsTask?.tasks?.[0]?.id;
    if (taskId) {
      console.log("   ⏳ Waiting for Reviews task to complete...");
      await delay(5000); // Wait 5 seconds for task to complete
      try {
        // Try to fetch reviews task result
        const reviewsResult = await dataForSEOService.getBusinessReviewsResult?.(taskId);
        if (reviewsResult) {
          enriched.reviews = reviewsResult?.tasks?.[0]?.result?.[0] || null;
          console.log("   ✅ Reviews:", enriched.reviews ? "Found" : "Not found");
        } else {
          // If no getBusinessReviewsResult method, use the task data
          enriched.reviews = reviewsTask?.tasks?.[0] || null;
          console.log("   ⚠️  Reviews task created, result may be available later");
        }
      } catch (err: any) {
        console.log("   ⚠️  Reviews task still processing, using task data");
        enriched.reviews = reviewsTask?.tasks?.[0] || null;
      }
    } else {
      enriched.reviews = reviewsTask?.tasks?.[0]?.result?.[0] || null;
      console.log("   ✅ Reviews:", enriched.reviews ? "Found" : "Not found");
    }
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Reviews failed:", error.message);
  }
  
  // 3. Ranked Keywords
  console.log("\n🔑 Fetching Ranked Keywords...");
  try {
    const keywordsData = await dataForSEOService.getRankedKeywords({
      domain: domain,
      limit: 100
    });
    enriched.rankedKeywords = keywordsData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log("   ✅ Keywords:", enriched.rankedKeywords.length, "found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Keywords failed:", error.message);
  }
  
  // 4. Traffic Estimation
  console.log("\n📊 Fetching Traffic Estimation...");
  try {
    const trafficData = await dataForSEOService.getBulkTrafficEstimation({
      domains: [domain]
    });
    enriched.traffic = trafficData?.tasks?.[0]?.result?.[0]?.items?.[0] || null;
    if (enriched.traffic?.metrics?.paid?.etv) {
      enriched.paidETV = enriched.traffic.metrics.paid.etv;
    }
    console.log("   ✅ Traffic:", enriched.traffic ? `ETV: ${enriched.traffic.metrics?.organic?.etv || 'N/A'}` : "Not found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Traffic failed:", error.message);
  }
  
  // 5. Ads Creatives
  console.log("\n📢 Fetching Ads Creatives...");
  try {
    const locationCode = 2840; // Missouri
    const adsCreativesData = await dataForSEOService.getAdsForDomain({
      target: domain,
      locationCode: locationCode,
      platform: 'all',
      format: 'all',
      depth: 40
    });
    const creatives = adsCreativesData?.tasks?.[0]?.result?.[0]?.items || [];
    enriched.adsCreatives = creatives
      .filter((item: any) => item.type === 'ads_search')
      .map((item: any) => ({
        creativeId: item.creative_id,
        advertiserId: item.advertiser_id,
        title: item.title,
        description: item.description,
        url: item.url,
        format: item.format,
        previewImage: item.preview_image,
        firstShown: item.first_shown,
        lastShown: item.last_shown,
        rankGroup: item.rank_group,
        rankAbsolute: item.rank_absolute,
        platform: item.platform,
        verified: item.verified
      }));
    enriched.adsCreativesCount = enriched.adsCreatives.length;
    console.log("   ✅ Ads Creatives:", enriched.adsCreatives.length, "found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Ads Creatives failed:", error.message);
    enriched.adsCreatives = [];
    enriched.adsCreativesCount = 0;
  }
  
  // 6. Check Ads Advertisers (use locationName, not locationCode - API doesn't accept locationCode)
  console.log("\n📢 Checking Ads Advertisers...");
  try {
    const adsAdvertisersData = await dataForSEOService.getAdsAdvertisers({
      keyword: "Spine",
      locationName: LOCATION // Use locationName, not locationCode
    });
    const advertisers = adsAdvertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    const matchedAdvertiser = advertisers.find((adv: any) => {
      const advDomain = (adv.domain || '').toLowerCase().replace(/^www\./, '');
      return advDomain === normalizedDomain;
    });
    if (matchedAdvertiser) {
      enriched.ads = {
        matched: true,
        advertiserId: matchedAdvertiser.advertiser_id,
        approxAdsCount: matchedAdvertiser.approx_ads_count || 0,
        verified: matchedAdvertiser.verified || false
      };
      console.log("   ✅ Ads Advertiser matched:", matchedAdvertiser.advertiser_id);
      console.log("      Approx Ads Count:", matchedAdvertiser.approx_ads_count || 0);
    } else {
      // Even if no advertiser match, we have ads creatives, so mark as running ads
      enriched.ads = {
        matched: false,
        advertiserId: null,
        approxAdsCount: enriched.adsCreatives?.length || 0,
        verified: false
      };
      console.log("   ⚠️  No ads advertiser match, but", enriched.adsCreatives?.length || 0, "creatives found");
    }
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Ads Advertisers failed:", error.message);
    // Still set ads if we have creatives
    if (enriched.adsCreatives && enriched.adsCreatives.length > 0) {
      enriched.ads = {
        matched: false,
        advertiserId: null,
        approxAdsCount: enriched.adsCreatives.length,
        verified: false
      };
    } else {
      enriched.ads = null;
    }
  }
  
  // 7. Domain Rank
  console.log("\n🏆 Fetching Domain Rank...");
  try {
    const domainRankData = await dataForSEOService.getDomainAnalysis({
      domain: domain
    });
    enriched.domainRank = domainRankData?.tasks?.[0]?.result?.[0]?.items?.[0] || null;
    console.log("   ✅ Domain Rank:", enriched.domainRank ? `Rank: ${enriched.domainRank.rank}` : "Not found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Domain Rank failed:", error.message);
  }
  
  // 8. Backlinks
  console.log("\n🔗 Fetching Backlinks...");
  try {
    const backlinksData = await dataForSEOService.getBacklinkAnalysis({
      domain: domain,
      limit: 100
    });
    enriched.backlinks = backlinksData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log("   ✅ Backlinks:", enriched.backlinks.length, "found");
    await delay(1000);
  } catch (error: any) {
    console.log("   ❌ Backlinks failed:", error.message);
  }
  
  // 9. HTML Fetch for Analytics/Schemas
  console.log("\n🔍 Fetching HTML for Analytics/Schemas...");
  try {
    const htmlResponse = await axios.get(websiteUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      validateStatus: (status) => status < 500
    });
    if (htmlResponse.status === 200 && htmlResponse.data) {
      enriched.htmlContent = htmlResponse.data;
      enriched.schemas = detectSchemasInHTML(htmlResponse.data);
      enriched.analytics = detectAnalyticsInHTML(htmlResponse.data);
      console.log("   ✅ HTML fetched, Analytics/Schemas detected");
    } else {
      console.log("   ⚠️  HTML fetch returned status:", htmlResponse.status);
    }
  } catch (error: any) {
    console.log("   ⚠️  HTML fetch failed:", error.message);
  }
  
  // 10. On-Page Analysis
  console.log("\n🔍 Fetching On-Page Analysis...");
  let pageSpeed = null;
  let mobileScore = null;
  let accessibilityScore = null;
  
  try {
    const onPageData = await dataForSEOService.getOnPageAnalysis({
      domain: websiteUrl
    });
    const taskId = onPageData?.tasks?.[0]?.id;
    enriched.onPage = onPageData?.tasks?.[0] || null;
    
    if (taskId) {
      console.log("   ⏳ Waiting for On-Page task...");
      await delay(15000);
      try {
        const onPageResults = await dataForSEOService.getOnPagePages(taskId);
        if (onPageResults && (onPageResults as any).tasks?.[0]?.result) {
          enriched.onPageResults = onPageResults;
          console.log("   ✅ On-Page results fetched");
        }
      } catch (err: any) {
        console.log("   ⚠️  On-Page results not ready:", err.message);
      }
    }
  } catch (error: any) {
    console.log("   ❌ On-Page failed:", error.message);
  }
  
  // 10b. Alternative: Try Google PageSpeed Insights if On-Page failed
  if (!pageSpeed && !mobileScore) {
    console.log("\n🔍 Trying Google PageSpeed Insights (alternative)...");
    try {
      const { getPageSpeedInsights } = await import("./add-pagespeed-insights.js");
      const psiData = await getPageSpeedInsights(websiteUrl);
      if (psiData) {
        pageSpeed = psiData.performance;
        mobileScore = psiData.mobile;
        accessibilityScore = psiData.accessibility;
        
        // Store full PageSpeed Insights data in enriched
        enriched.pageSpeedInsights = {
          performance: psiData.performance,
          mobile: psiData.mobile,
          accessibility: psiData.accessibility,
          seo: psiData.seo,
          bestPractices: psiData.bestPractices,
          opportunities: psiData.opportunities,
          diagnostics: psiData.diagnostics,
          metrics: psiData.metrics
        };
        
        console.log("   ✅ PageSpeed Insights:", {
          performance: pageSpeed,
          mobile: mobileScore,
          accessibility: accessibilityScore,
          seo: psiData.seo,
          bestPractices: psiData.bestPractices,
          opportunities: psiData.opportunities.length,
          diagnostics: psiData.diagnostics.length
        });
      } else {
        console.log("   ⚠️  PageSpeed Insights not configured (needs API key)");
      }
    } catch (err: any) {
      console.log("   ⚠️  PageSpeed Insights failed:", err.message);
    }
  }
  
  // 11. Google Places API - Get Reviews and Ratings
  console.log("\n⭐ Fetching Google Places Reviews...");
  try {
    const { getGooglePlacesReviews } = await import("./add-google-places.js");
    const placesData = await getGooglePlacesReviews({
      placeId: serpResult.placeId || undefined,
      businessName: serpResult.title,
      address: `${serpResult.address || ''}, ${serpResult.city || ''}, ${serpResult.state || ''}`.trim()
    });
    if (placesData) {
      enriched.googlePlaces = {
        rating: placesData.rating,
        totalRatings: placesData.totalRatings,
        reviews: placesData.reviews,
        placeId: placesData.placeId
      };
      console.log(`   ✅ Google Places: Rating ${placesData.rating}/5 (${placesData.totalRatings} reviews)`);
    } else {
      console.log("   ⚠️  Google Places not found or not configured");
    }
    await delay(1000);
  } catch (error: any) {
    console.log("   ⚠️  Google Places failed:", error.message);
  }
  
  // 12. Google Safe Browsing API - Security Check
  console.log("\n🔒 Checking Safe Browsing...");
  try {
    const { checkSafeBrowsing } = await import("./add-safe-browsing.js");
    const safeBrowsingData = await checkSafeBrowsing(websiteUrl);
    if (safeBrowsingData) {
      enriched.safeBrowsing = safeBrowsingData;
      console.log(`   ✅ Safe Browsing: ${safeBrowsingData.isSafe ? 'SAFE' : 'UNSAFE'}`, 
        safeBrowsingData.threats.length > 0 ? `(${safeBrowsingData.threats.join(', ')})` : '');
    } else {
      console.log("   ⚠️  Safe Browsing check failed");
    }
    await delay(1000);
  } catch (error: any) {
    console.log("   ⚠️  Safe Browsing failed:", error.message);
  }
  
  // 13. Schema Validation
  console.log("\n📋 Validating Schemas...");
  try {
    const { validateSchemas } = await import("./add-schema-validation.js");
    const htmlContent = enriched.htmlContent || '';
    if (htmlContent) {
      const validation = validateSchemas(htmlContent);
      enriched.schemaValidation = validation;
      console.log(`   ✅ Schema Validation: ${validation.valid ? 'VALID' : 'INVALID'}`, 
        validation.errors.length > 0 ? `(${validation.errors.length} errors)` : '');
    } else {
      console.log("   ⚠️  No HTML content available for validation");
    }
  } catch (error: any) {
    console.log("   ⚠️  Schema validation failed:", error.message);
  }
  
  // Update rawData with enriched data
  console.log("\n💾 Updating database...");
  const currentRaw: any = serpResult.rawData || {};
  
  // Debug: Show what we're about to save
  console.log("   📊 Enriched data keys:", Object.keys(enriched).join(', '));
  console.log("   📊 Enriched data count:", Object.keys(enriched).length);
  
  const updatedRawData = {
    ...currentRaw,
    enriched: {
      ...(currentRaw.enriched || {}),
      ...enriched
    },
    ads: enriched.ads || currentRaw.ads || null,
    isPaid: !!(enriched.ads?.matched || enriched.adsCreatives?.length > 0) || currentRaw.isPaid || false
  };
  
  // Debug: Verify enriched object before save
  const enrichedKeys = Object.keys(updatedRawData.enriched || {});
  console.log("   📊 Enriched keys after merge:", enrichedKeys.join(', '));
  console.log("   📊 Enriched keys count:", enrichedKeys.length);
  
  await prisma.serpResult.update({
    where: { id: serpResult.id },
    data: { rawData: updatedRawData as any }
  });
  
  // Verify it was saved
  const saved = await prisma.serpResult.findUnique({
    where: { id: serpResult.id },
    select: { rawData: true }
  });
  const savedEnriched = (saved?.rawData as any)?.enriched || {};
  console.log("   ✅ Saved enriched keys:", Object.keys(savedEnriched).join(', '));
  console.log("   ✅ Saved enriched count:", Object.keys(savedEnriched).length);
  
  // Calculate and update Business Profile
  const gmbInfo = enriched.gmbInfo;
  const traffic = enriched.traffic;
  const backlinks = enriched.backlinks;
  const domainRank = enriched.domainRank;
  const onPage = enriched.onPage;
  const onPageResults = enriched.onPageResults;
  
  // Extract speed scores from On-Page results if available
  const onPageResultsData = enriched.onPageResults;
  const onPageData = enriched.onPage;
  
  const pageTiming = onPageResultsData?.tasks?.[0]?.result?.[0]?.items?.[0]?.page_timing ||
                     onPageResultsData?.result?.[0]?.items?.[0]?.page_timing ||
                     onPageData?.page_timing;
  
  // Calculate page speed from page_timing if available
  if (pageTiming && !pageSpeed) {
    const lcp = pageTiming.largest_contentful_paint || 0;
    const fid = (pageTiming.first_input_delay || 0) * 1000;
    const cls = pageTiming.cumulative_layout_shift || 0;
    const tti = pageTiming.time_to_interactive || 0;
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 70 : 40;
    const fidScore = fid <= 100 ? 100 : fid <= 200 ? 70 : 40;
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 70 : 40;
    const ttiScore = tti <= 2000 ? 100 : tti <= 4000 ? 70 : 40;
    pageSpeed = Math.round(lcpScore * 0.4 + fidScore * 0.2 + clsScore * 0.2 + ttiScore * 0.2);
  }
  
  // Extract mobile score from On-Page if not already set
  if (!mobileScore) {
    mobileScore = onPageResultsData?.tasks?.[0]?.result?.[0]?.items?.[0]?.mobile_score ||
                  onPageResultsData?.result?.[0]?.items?.[0]?.mobile_score ||
                  onPageData?.mobile_score ||
                  null;
  }
  
  // Extract accessibility score from On-Page if not already set
  if (!accessibilityScore) {
    accessibilityScore = onPageResultsData?.tasks?.[0]?.result?.[0]?.items?.[0]?.accessibility_score ||
                         onPageResultsData?.result?.[0]?.items?.[0]?.accessibility_score ||
                         onPageData?.accessibility_score ||
                         null;
  }
  
  // Extract domain authority from domainRank
  // Domain Rank API returns metrics with organic/paid data, but not a direct "rank" field
  // Better calculation: Use ETV, keyword count, and top positions for accurate domain authority
  let domainAuthority = null;
  if (domainRank?.metrics?.organic) {
    const organic = domainRank.metrics.organic;
    const etv = organic.etv || 0;
    const keywordCount = organic.count || 0;
    const pos1 = organic.pos_1 || 0;
    const pos2_3 = organic.pos_2_3 || 0;
    const pos4_10 = organic.pos_4_10 || 0;
    
    // ETV score: Scale 0-10k ETV to 0-40 points (more realistic for small businesses)
    // For ETV of 205: (205/10000)*40 = 0.82, rounds to 1 point
    // For ETV of 10k: (10000/10000)*40 = 40 points (max)
    const etvScore = Math.min(40, Math.round((etv / 10000) * 40));
    
    // Keyword count score: Scale 0-1000 keywords to 0-30 points
    const keywordScore = Math.min(30, Math.round((keywordCount / 1000) * 30));
    
    // Position score: Top positions are valuable (0-30 points)
    // pos_1 is worth 10 points each, pos_2_3 is worth 5 points each, pos_4_10 is worth 2 points each
    const positionScore = Math.min(30, (pos1 * 10) + (pos2_3 * 5) + (pos4_10 * 2));
    
    domainAuthority = Math.min(100, etvScore + keywordScore + positionScore);
    console.log(`   📊 Domain Authority calculated: ${domainAuthority} (ETV: ${etvScore}, Keywords: ${keywordScore}, Positions: ${positionScore})`);
  }
  
  // Extract PageSpeed Insights SEO score if available
  const pageSpeedInsightsSEO = enriched.pageSpeedInsights?.seo || null;
  const pageSpeedInsightsBestPractices = enriched.pageSpeedInsights?.bestPractices || null;
  
  const seoScore = calculateSEOScore({
    domainAuthority: domainAuthority,
    backlinks: backlinks?.length || domainRank?.backlinks || null,
    monthlyTraffic: traffic?.metrics?.organic?.etv || null,
    pageSpeed: pageSpeed,
    mobileScore: mobileScore,
    accessibilityScore: accessibilityScore,
    pageSpeedInsightsSEO: pageSpeedInsightsSEO, // Use Google's SEO score
    bestPractices: pageSpeedInsightsBestPractices // Use Google's best practices score
  });
  
  // Update or create business profile - ensure it's linked to THIS serpResult
  let businessProfile = serpResult.businessProfile;
  
  const isPaid = !!(enriched.ads?.matched || enriched.adsCreatives?.length > 0);
  const backlinksCount = backlinks?.length || domainRank?.backlinks || null;
  const monthlyTrafficValue = traffic?.metrics?.organic?.etv || null;
  
  const profileData = {
    serpResultId: serpResult.id, // CRITICAL: Ensure it's linked to THIS serpResult
    domainAuthority: domainAuthority,
    backlinks: backlinksCount,
    monthlyTraffic: monthlyTrafficValue,
    pageSpeed: pageSpeed,
    mobileScore: mobileScore,
    accessibilityScore: accessibilityScore,
    seoScore: seoScore,
    isPaid: isPaid
  };
  
  if (businessProfile) {
    // Update existing profile
    businessProfile = await prisma.businessProfile.update({
      where: { id: businessProfile.id },
      data: profileData
    });
    console.log("   ✅ Business Profile UPDATED");
  } else {
    // Create new profile linked to this serpResult
    businessProfile = await prisma.businessProfile.create({
      data: {
        serpResultId: serpResult.id,
        placeId: serpResult.placeId,
        cid: serpResult.cid,
        name: serpResult.title,
        domain: serpResult.domain,
        websiteUrl: serpResult.url,
        category: 'Business',
        address: serpResult.address || '',
        city: serpResult.city || '',
        state: serpResult.state || '',
        zipCode: serpResult.zipCode || '',
        phone: serpResult.phone || '',
        rating: (serpResult.rating as any) || 0,
        reviewsCount: (serpResult.reviewsCount as any) || 0,
        services: [],
        specialties: [],
        insuranceAccepted: [],
        languages: [],
        isActive: true,
        ...profileData
      }
    });
    console.log("   ✅ Business Profile CREATED");
  }
  
  console.log("   📊 Business Profile Scores:");
  console.log("      SEO Score:", businessProfile.seoScore || "N/A");
  console.log("      Domain Authority:", businessProfile.domainAuthority || "N/A");
  console.log("      Backlinks:", businessProfile.backlinks || "N/A");
  console.log("      Monthly Traffic:", businessProfile.monthlyTraffic || "N/A");
  console.log("      Page Speed:", businessProfile.pageSpeed || "N/A");
  console.log("      Mobile Score:", businessProfile.mobileScore || "N/A");
  console.log("      Accessibility Score:", businessProfile.accessibilityScore || "N/A");
  console.log("      Is Paid:", businessProfile.isPaid);
  console.log("      Linked to SerpResult:", businessProfile.serpResultId);
  
  console.log("\n✅ COMPLETE! All data collected and stored.");
  await prisma.$disconnect();
}

fixBusiness().catch(console.error);

