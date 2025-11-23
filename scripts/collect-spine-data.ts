/**
 * Data Collection Script for "Spine" Search in Chesterfield, MO
 * 
 * OPTIMIZED FOR HYBRID MODEL: This script collects only basic business data needed
 * for Prospect Finder initial display. Detailed data (SEO/PPC, Ads, Reputation) is
 * now fetched live when users click tabs in Business Profile.
 * 
 * Usage:
 *   pnpm tsx scripts/collect-spine-data.ts [--test] [--limit=5]
 * 
 * Options:
 *   --test: Test mode (collects data for 5 businesses only)
 *   --limit=N: Limit number of businesses to process (default: 5 for test, 100 for full)
 * 
 * What's Collected:
 *   - Phase 1: Discovery (Maps, Local Pack, Business Listings) - Basic business info
 *   - Phase 2: GMB Info - Services, specialties, email
 * 
 * What's NOT Collected (Now Fetched Live):
 *   - On-Page Analysis, PageSpeed Insights, HTML Analysis (SEO & PPC tab)
 *   - Ads Creatives, Ads Advertisers (Ads tab)
 *   - Detailed Reviews (Reputation tab)
 */

import "dotenv/config";
import { dataForSEOService } from "../server/services/dataforseoService.js";
import { prisma } from "../server/lib/prisma.js";
import axios from "axios";

// Configuration
const KEYWORD = "Spine";
const LOCATION = "Chesterfield, MO";
const TEST_MODE = process.argv.includes("--test");
const LIMIT_ARG = process.argv.find(arg => arg.startsWith("--limit="));
const BUSINESS_LIMIT = LIMIT_ARG 
  ? parseInt(LIMIT_ARG.split("=")[1]) 
  : 5; // Default: Collect 5 businesses for testing

// Statistics
const stats = {
  apiCalls: 0,
  businessesFound: 0,
  businessesProcessed: 0,
  businessesStored: 0,
  errors: 0,
  startTime: Date.now()
};

/**
 * Delay function for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect schemas in HTML (same logic as dataforseoService)
 */
function detectSchemasInHTML(html: string): {
  localBusiness: boolean;
  faq: boolean;
  organization: boolean;
  breadcrumbs: boolean;
  product: boolean;
  review: boolean;
} {
  const lowerHtml = html.toLowerCase();
  
  // Check for JSON-LD schemas
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
        
        if (Array.isArray(schema)) {
          schema.forEach((s: any) => {
            const schemaType = s['@type']?.toLowerCase() || '';
            if (schemaType.includes('localbusiness')) hasLocalBusiness = true;
            if (schemaType.includes('faqpage')) hasFAQ = true;
            if (schemaType.includes('organization')) hasOrganization = true;
            if (schemaType.includes('breadcrumb')) hasBreadcrumbs = true;
            if (schemaType.includes('product')) hasProduct = true;
            if (schemaType.includes('review')) hasReview = true;
          });
        } else {
          const schemaType = schema['@type']?.toLowerCase() || '';
          if (schemaType.includes('localbusiness')) hasLocalBusiness = true;
          if (schemaType.includes('faqpage')) hasFAQ = true;
          if (schemaType.includes('organization')) hasOrganization = true;
          if (schemaType.includes('breadcrumb')) hasBreadcrumbs = true;
          if (schemaType.includes('product')) hasProduct = true;
          if (schemaType.includes('review')) hasReview = true;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }
  
  // Check for microdata and RDFa
  if (lowerHtml.includes('itemtype') && lowerHtml.includes('localbusiness')) hasLocalBusiness = true;
  if (lowerHtml.includes('itemtype') && lowerHtml.includes('faqpage')) hasFAQ = true;
  if (lowerHtml.includes('schema.org/localbusiness')) hasLocalBusiness = true;
  if (lowerHtml.includes('schema.org/faqpage')) hasFAQ = true;
  
  return {
    localBusiness: hasLocalBusiness,
    faq: hasFAQ,
    organization: hasOrganization,
    breadcrumbs: hasBreadcrumbs,
    product: hasProduct,
    review: hasReview
  };
}

/**
 * Detect analytics in HTML (same logic as dataforseoService)
 */
function detectAnalyticsInHTML(html: string): {
  googleAnalytics: { found: boolean; type?: 'GA4' | 'UA' | 'gtag'; id?: string };
  facebookPixel: { found: boolean; id?: string };
} {
  // Google Analytics detection
  let gaFound = false;
  let gaType: 'GA4' | 'UA' | 'gtag' | undefined;
  let gaId: string | undefined;
  
  // Check for GA4 (gtag)
  const gtagMatch = html.match(/gtag\(['"]config['"],\s*['"]G-([^'"]+)['"]/i);
  if (gtagMatch) {
    gaFound = true;
    gaType = 'GA4';
    gaId = `G-${gtagMatch[1]}`;
  }
  
  // Check for Universal Analytics
  const uaMatch = html.match(/ga\(['"]create['"],\s*['"](UA-[^'"]+)['"]/i) || 
                          html.match(/_gaq\.push\(\[['"]create['"],\s*['"](UA-[^'"]+)['"]/i);
  if (uaMatch) {
    gaFound = true;
    gaType = 'UA';
    gaId = uaMatch[1];
  }
  
  // Check for gtag.js
  if (html.includes('gtag.js') && !gaFound) {
    gaFound = true;
    gaType = 'gtag';
  }
  
  // Check for analytics.js or ga.js
  if ((html.includes('analytics.js') || html.includes('ga.js')) && !gaFound) {
    gaFound = true;
    gaType = 'UA';
  }
  
  // Facebook Pixel detection
  let fbPixelFound = false;
  let fbPixelId: string | undefined;
  
  // Check for fbq('init', 'PIXEL_ID')
  const fbPixelMatch = html.match(/fbq\(['"]init['"],\s*['"]([^'"]+)['"]/i) ||
                        html.match(/_fbp=['"]([^'"]+)['"]/i);
  if (fbPixelMatch) {
    fbPixelFound = true;
    fbPixelId = fbPixelMatch[1];
  }
  
  // Check for Facebook Pixel script
  if (html.includes('fbevents.js') || html.includes('facebook.com/tr')) {
    fbPixelFound = true;
  }
  
  return {
    googleAnalytics: {
      found: gaFound,
      type: gaType,
      id: gaId
    },
    facebookPixel: {
      found: fbPixelFound,
      id: fbPixelId
    }
  };
}

/**
 * Extract businesses from API response
 */
function extractBusinesses(apiResponse: any, source: string): any[] {
  const items = apiResponse?.tasks?.[0]?.result?.[0]?.items || [];
  console.log(`  📊 ${source}: Found ${items.length} businesses`);
  return items.map((item: any) => ({
    ...item,
    _source: source
  }));
}

/**
 * Deduplicate businesses by placeId or cid
 */
function deduplicateBusinesses(businesses: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const business of businesses) {
    const key = business.place_id || business.cid || 
                `${business.domain || ''}_${business.address || ''}`;
    
    if (key && !seen.has(key)) {
      seen.set(key, business);
    } else if (!key) {
      // If no unique identifier, use title + address
      const fallbackKey = `${business.title || ''}_${business.address || ''}`;
      if (!seen.has(fallbackKey)) {
        seen.set(fallbackKey, business);
      }
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Phase 1: Discover businesses
 */
async function discoverBusinesses(): Promise<any[]> {
  console.log("\n🔍 Phase 1: Discovering Businesses...");
  console.log(`   Keyword: "${KEYWORD}"`);
  console.log(`   Location: "${LOCATION}"`);
  
  const allBusinesses: any[] = [];
  
  try {
    // 1. Maps API
    console.log("\n   📍 Calling Maps API...");
    stats.apiCalls++;
    const mapsData = await dataForSEOService.searchMaps({
      keyword: KEYWORD,
      location: LOCATION,
      device: "desktop"
    });
    const mapsBusinesses = extractBusinesses(mapsData, "Maps API");
    allBusinesses.push(...mapsBusinesses);
    await delay(1000); // Rate limiting
    
    // 2. Local Pack API
    console.log("\n   📍 Calling Local Pack API...");
    stats.apiCalls++;
    const localPackData = await dataForSEOService.searchLocalPack({
      keyword: KEYWORD,
      location: LOCATION,
      device: "desktop",
      limit: 100
    });
    const localPackBusinesses = extractBusinesses(localPackData, "Local Pack API");
    allBusinesses.push(...localPackBusinesses);
    await delay(1000); // Rate limiting
    
    // 3. Business Listings API
    console.log("\n   📍 Calling Business Listings API...");
    stats.apiCalls++;
    const listingsData = await dataForSEOService.searchMissouriBusinesses({
      keyword: KEYWORD,
      location: LOCATION,
      device: "desktop"
    });
    const listingsBusinesses = extractBusinesses(listingsData, "Business Listings API");
    allBusinesses.push(...listingsBusinesses);
    
  } catch (error: any) {
    console.error("   ❌ Error in discovery phase:", error.message);
    stats.errors++;
  }
  
  // Deduplicate
  const uniqueBusinesses = deduplicateBusinesses(allBusinesses);
  console.log(`\n   ✅ Total unique businesses found: ${uniqueBusinesses.length}`);
  
  // Limit for test mode
  const limitedBusinesses = uniqueBusinesses.slice(0, BUSINESS_LIMIT);
  console.log(`   📌 Processing ${limitedBusinesses.length} businesses${TEST_MODE ? ' (TEST MODE)' : ''}`);
  
  stats.businessesFound = uniqueBusinesses.length;
  return limitedBusinesses;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Phase 2: Enrich a single business
 */
async function enrichBusiness(business: any, index: number, total: number): Promise<any> {
  const businessName = business.title || business.name || 'Unknown';
  console.log(`\n   [${index + 1}/${total}] Enriching: ${businessName}`);
  
  // OPTIMIZED: Only collect GMB Info for services, specialties, email
  // All other data (SEO/PPC, Ads, Reputation) is now fetched live
  const enriched: any = {
    ...business,
    gmbInfo: null
  };
  
  const domain = extractDomain(business.url || business.website || business.domain);
  
  try {
    // 2.1: Google My Business Info
    console.log(`      📋 Fetching GMB Info...`);
    stats.apiCalls++;
    try {
      const gmbData = await dataForSEOService.enrichBusinessProfile({
        businessName,
        location: LOCATION,
        placeId: business.place_id,
        cid: business.cid
      });
      enriched.gmbInfo = gmbData?.tasks?.[0]?.result?.[0] || null;
      await delay(1000);
    } catch (error: any) {
      console.log(`      ⚠️  GMB Info failed: ${error.message}`);
      stats.errors++;
    }
    
    // OPTIMIZED: Removed most data collection that's now fetched live:
    // - Reviews (now in Reputation tab)
    // - Ranked Keywords (not used in initial display)
    // - Traffic Estimation (not used in initial display)
    // - Ads Creatives (now in Ads tab - but we still check if running ads for badge)
    // - On-Page Analysis (now in SEO & PPC tab)
    // - PageSpeed Insights (now in SEO & PPC tab)
    // - HTML Analysis (now in SEO & PPC tab)
    // - Safe Browsing (now in SEO & PPC tab)
    // - Schema Validation (now in SEO & PPC tab)
    // - Backlinks (not used in initial display)
    // - Domain Rank (not used in initial display)
    
    // Note: Basic ads check (isPaid flag) is done in checkAdsAdvertisers function
    // This is needed for the "Running Ads" badge in Prospect Finder
    
    console.log(`      ✅ Enrichment complete (optimized for hybrid model)`);
    stats.businessesProcessed++;
    
  } catch (error: any) {
    console.error(`      ❌ Error enriching ${businessName}:`, error.message);
    stats.errors++;
  }
  
  return enriched;
}

/**
 * Phase 2.9: Check Ads Advertisers and match to businesses
 * OPTIMIZED: Only check if business is running ads (for Prospect Finder badge)
 * Detailed ads data is fetched live in Ads tab
 */
async function checkAdsAdvertisers(businesses: any[]): Promise<void> {
  try {
    console.log("   📢 Checking Ads Advertisers (basic check for 'Running Ads' badge)...");
    stats.apiCalls++;
    
    // Use locationCode for Missouri (2840) - API prefers location_code over location_name
    // Note: This endpoint may not support location parameters for all regions
    const locationCode = (LOCATION.includes('Missouri') || LOCATION.includes('MO')) ? 2840 : undefined;
    const adsAdvertisersData = await dataForSEOService.getAdsAdvertisers({
      keyword: KEYWORD,
      locationCode: locationCode, // Use locationCode (preferred by API)
      locationName: locationCode ? undefined : LOCATION // Only use locationName if no locationCode
    });
    
    const advertisers = adsAdvertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`   ✅ Found ${advertisers.length} advertisers for "${KEYWORD}"`);
    
    // Create a map of advertiser domains
    const advertiserDomains = new Map<string, any>();
    for (const advertiser of advertisers) {
      const domain = extractDomain(advertiser.domain || advertiser.website);
      if (domain) { // Only add if domain is not null
        advertiserDomains.set(domain.toLowerCase(), advertiser);
      }
    }
    
    // Match businesses to advertisers (set isPaid flag for Prospect Finder badge)
    let matchedCount = 0;
    for (const business of businesses) {
      const businessDomain = extractDomain(business.url || business.website || business.domain);
      if (businessDomain) { // Only check if domain is not null
        const normalizedDomain = businessDomain.toLowerCase();
        const advertiser = advertiserDomains.get(normalizedDomain);
        if (advertiser) {
          business.isPaid = true;
          business.ads = {
            matched: true,
            advertiserId: advertiser.advertiser_id,
            approxAdsCount: advertiser.approx_ads_count || 0
          };
          matchedCount++;
          console.log(`   ✅ Matched: ${business.title || business.name} (${businessDomain})`);
        }
      }
    }
    
    console.log(`   ✅ Matched ${matchedCount} businesses to advertisers`);
  } catch (error: any) {
    console.log(`   ⚠️  Ads Advertisers check failed: ${error.message}`);
    stats.errors++;
    // Don't fail the whole process if ads check fails
  }
  try {
    console.log("   📢 Fetching Ads Advertisers for keyword...");
    stats.apiCalls++;
    
    // Use locationName, not locationCode - API doesn't accept locationCode for this endpoint
    const adsAdvertisersData = await dataForSEOService.getAdsAdvertisers({
      keyword: KEYWORD,
      locationName: LOCATION // Use locationName, not locationCode
    });
    
    const advertisers = adsAdvertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`   ✅ Found ${advertisers.length} advertisers for "${KEYWORD}"`);
    
    // Create a map of advertiser domains
    const advertiserDomains = new Map<string, any>();
    for (const advertiser of advertisers) {
      const domain = extractDomain(advertiser.domain || advertiser.website);
      if (domain) {
        advertiserDomains.set(domain.toLowerCase(), advertiser);
      }
    }
    
    // Match businesses to advertisers
    let matchedCount = 0;
    for (const business of businesses) {
      const businessDomain = extractDomain(business.url || business.website || business.domain);
      if (businessDomain) {
        const normalizedDomain = businessDomain.toLowerCase();
        const advertiser = advertiserDomains.get(normalizedDomain);
        if (advertiser) {
          business.isPaid = true;
          business.ads = {
            matched: true,
            advertiserId: advertiser.advertiser_id,
            approxAdsCount: advertiser.approx_ads_count,
            verified: advertiser.verified
          };
          matchedCount++;
          console.log(`   ✅ Matched: ${business.title || business.name} (${businessDomain})`);
        }
      }
    }
    
    console.log(`   ✅ Matched ${matchedCount} businesses to advertisers`);
    
  } catch (error: any) {
    console.log(`   ⚠️  Ads Advertisers check failed: ${error.message}`);
    stats.errors++;
  }
}

/**
 * Phase 3: Store data in database
 */
async function storeInDatabase(businesses: any[]): Promise<void> {
  console.log("\n💾 Phase 3: Storing Data in Database...");
  
  // Create a dummy user for the serp_job (or use existing user)
  // For now, we'll create a system user or use the first user
  let systemUserId: string;
  try {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      systemUserId = firstUser.id;
    } else {
      // Create a system user if none exists
      const systemUser = await prisma.user.create({
        data: {
          email: "system@prepopulate.local",
          passwordHash: "system",
          companyName: "System",
          position: "System",
          phoneNumber: "000-000-0000"
        }
      });
      systemUserId = systemUser.id;
    }
  } catch (error: any) {
    console.error("   ❌ Error getting/creating system user:", error.message);
    throw error;
  }
  
  // Create SERP Job
  console.log("   📝 Creating SERP Job...");
  const serpJob = await prisma.serpJob.create({
    data: {
      userId: systemUserId,
      keyword: KEYWORD,
      location: LOCATION,
      searchType: "maps",
      status: "completed",
      resultsCount: businesses.length,
      cost: stats.apiCalls * 0.002
    }
  });
  console.log(`   ✅ SERP Job created: ${serpJob.id}`);
  
  // Store businesses
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const businessName = business.title || business.name || 'Unknown';
    
    try {
      console.log(`   [${i + 1}/${businesses.length}] Storing: ${businessName}`);
      
      // Create SERP Result - Store ads data in rawData
      // Include ALL enriched data: analytics, schemas, htmlContent, onPageResults, etc.
      // IMPORTANT: Don't spread business first - it might overwrite enriched fields
      const rawDataWithAds: any = {
        // Original business data (from API)
        ...business,
        // Store ads data in rawData (set by checkAdsAdvertisers)
        ads: business.ads || null,
        isPaid: business.isPaid || false,
        // OPTIMIZED: Store only minimal enriched data (GMB Info for services, specialties)
        // All other data (SEO/PPC, Ads, Reputation) is now fetched live
        enriched: {
          gmbInfo: business.gmbInfo || null
        }
      };
      
      // Debug: Log what we're about to store
      console.log(`      📦 Storing rawData (optimized for hybrid model):`, {
        hasEnriched: !!rawDataWithAds.enriched,
        enrichedKeys: rawDataWithAds.enriched ? Object.keys(rawDataWithAds.enriched) : [],
        hasGmbInfo: !!rawDataWithAds.enriched?.gmbInfo
      });
      
      const serpResult = await prisma.serpResult.create({
        data: {
          serpJobId: serpJob.id,
          rankGroup: business.rank_group || 1,
          rankAbsolute: business.rank_absolute || i + 1,
          resultType: business.type || "maps",
          title: business.title || business.name,
          url: business.url,
          domain: extractDomain(business.url || business.website || business.domain),
          phone: business.phone,
          address: business.address,
          city: business.address_info?.city || business.city,
          state: business.address_info?.region || business.state || "MO",
          zipCode: business.address_info?.postal_code || business.zip_code,
          country: business.address_info?.country_code || "US",
          rating: business.rating?.value || business.rating,
          reviewsCount: business.rating?.votes_count || business.reviews_count || business.reviews,
          ratingMax: business.rating?.max || 5,
          placeId: business.place_id,
          cid: business.cid,
          rawData: rawDataWithAds as any // Store COMPLETE data including enriched field
        }
      });
      
      // VERIFY the enriched data was stored
      const verifyStored = await prisma.serpResult.findUnique({
        where: { id: serpResult.id },
        select: { rawData: true }
      });
      const storedRaw: any = verifyStored?.rawData || {};
      if (!storedRaw.enriched) {
        console.error(`      ❌ CRITICAL: enriched field NOT stored for ${businessName}!`);
        console.error(`      Attempting to update with enriched data...`);
        // Force update with enriched data
        await prisma.serpResult.update({
          where: { id: serpResult.id },
          data: {
            rawData: {
              ...storedRaw,
              enriched: rawDataWithAds.enriched
            } as any
          }
        });
        console.log(`      ✅ Updated with enriched data`);
      } else {
        console.log(`      ✅ Verified: enriched data stored successfully`);
      }
      
      // OPTIMIZED: Extract only GMB Info (other data not collected)
      const gmbInfo = business.gmbInfo;
      
      // OPTIMIZED: Create Business Profile with only basic data
      // Advanced metrics (domainAuthority, backlinks, pageSpeed, etc.) are not collected
      const businessProfile = await prisma.businessProfile.create({
        data: {
          serpResultId: serpResult.id,
          placeId: business.place_id,
          cid: business.cid,
          name: business.title || business.name || gmbInfo?.title || 'Unknown',
          domain: extractDomain(business.url || business.website || business.domain),
          websiteUrl: business.url || business.website || gmbInfo?.website,
          category: business.category || gmbInfo?.category,
          address: business.address || gmbInfo?.address_info?.address,
          city: business.address_info?.city || business.city || gmbInfo?.address_info?.city,
          state: business.address_info?.region || business.state || gmbInfo?.address_info?.region || "MO",
          zipCode: business.address_info?.postal_code || business.zip_code || gmbInfo?.address_info?.postal_code,
          country: business.address_info?.country_code || "US",
          phone: business.phone || gmbInfo?.phone,
          email: gmbInfo?.email,
          description: gmbInfo?.description,
          rating: business.rating?.value || business.rating,
          reviewsCount: business.rating?.votes_count || business.reviews_count || business.reviews,
          ratingMax: business.rating?.max || 5,
          isVerified: gmbInfo?.is_verified || false,
          isPaid: business.isPaid || false, // Set by checkAdsAdvertisers for Prospect Finder badge
          businessHours: gmbInfo?.business_hours || null,
          socialMedia: gmbInfo?.social_media || null,
          services: gmbInfo?.services || business.additional_categories || null,
          specialties: business.category_ids || null,
          insuranceAccepted: gmbInfo?.insurance_accepted || null,
          languages: gmbInfo?.languages || null,
          certifications: gmbInfo?.certifications || null,
          awards: gmbInfo?.awards || null,
          // OPTIMIZED: Advanced metrics not collected (now fetched live)
          domainAuthority: null,
          backlinks: null,
          monthlyTraffic: null,
          pageSpeed: null,
          mobileScore: null,
          accessibilityScore: null,
          seoScore: null,
          lastAnalyzed: new Date(),
          isActive: true
        }
      });
      
      // OPTIMIZED: Keyword rankings are not collected anymore (not used in initial display)
      
      stats.businessesStored++;
      console.log(`      ✅ Business profile created: ${businessProfile.id}`);
      
    } catch (error: any) {
      console.error(`      ❌ Error storing ${businessName}:`, error.message);
      stats.errors++;
    }
  }
  
  console.log(`\n   ✅ Database storage complete!`);
}

/**
 * Calculate page speed score from Core Web Vitals
 */
/**
 * Calculate SEO score (0-100) from available metrics
 */
function calculateSEOScore(metrics: {
  domainAuthority?: number | null;
  backlinks?: number | null;
  monthlyTraffic?: number | null;
  pageSpeed?: number | null;
  mobileScore?: number | null;
  accessibilityScore?: number | null;
  pageSpeedInsightsSEO?: number | null;
  bestPractices?: number | null;
}): number | null {
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
  
  // Normalize to 0-100 scale
  if (maxPossible === 0) return null;
  return Math.round((score / maxPossible) * 100);
}

function calculateSpeedScore(pageTiming: any): number | null {
  if (!pageTiming) return null;
  
  const lcp = pageTiming.largest_contentful_paint || 0;
  const fid = (pageTiming.first_input_delay || 0) * 1000;
  const cls = pageTiming.cumulative_layout_shift || 0;
  const tti = pageTiming.time_to_interactive || 0;
  
  const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 70 : 40;
  const fidScore = fid <= 100 ? 100 : fid <= 200 ? 70 : 40;
  const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 70 : 40;
  const ttiScore = tti <= 2000 ? 100 : tti <= 4000 ? 70 : 40;
  
  const score = Math.round(
    lcpScore * 0.4 + 
    fidScore * 0.2 + 
    clsScore * 0.2 + 
    ttiScore * 0.2
  );
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Print final statistics
 */
function printStatistics(): void {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 COLLECTION STATISTICS");
  console.log("=".repeat(60));
  console.log(`Total API Calls:        ${stats.apiCalls}`);
  console.log(`Businesses Found:       ${stats.businessesFound}`);
  console.log(`Businesses Processed:    ${stats.businessesProcessed}`);
  console.log(`Businesses Stored:      ${stats.businessesStored}`);
  console.log(`Errors:                 ${stats.errors}`);
  console.log(`Duration:               ${duration}s`);
  console.log(`Estimated Cost:         $${(stats.apiCalls * 0.002).toFixed(2)}`);
  console.log("=".repeat(60));
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Starting Data Collection for 'Spine' in Chesterfield, MO");
  console.log(`   Mode: ${TEST_MODE ? 'TEST (5 businesses)' : `FULL (${BUSINESS_LIMIT} businesses)`}`);
  
  try {
    // Phase 1: Discover
    const businesses = await discoverBusinesses();
    
    if (businesses.length === 0) {
      console.log("\n❌ No businesses found. Exiting.");
      return;
    }
    
    // Phase 2: Enrich
    console.log("\n🔧 Phase 2: Enriching Businesses...");
    const enrichedBusinesses: any[] = [];
    for (let i = 0; i < businesses.length; i++) {
      const enriched = await enrichBusiness(businesses[i], i, businesses.length);
      // Merge enriched data back into business object to ensure all fields are available
      const mergedBusiness = {
        ...businesses[i],
        ...enriched,
        // Ensure analytics and schemas are explicitly set from enriched
        analytics: enriched.analytics || businesses[i].analytics || null,
        schemas: enriched.schemas || businesses[i].schemas || null,
        htmlContent: enriched.htmlContent || businesses[i].htmlContent || null,
        // Ensure all enriched fields are available
        gmbInfo: enriched.gmbInfo || businesses[i].gmbInfo || null,
        reviews: enriched.reviews || businesses[i].reviews || null,
        rankedKeywords: enriched.rankedKeywords || businesses[i].rankedKeywords || null,
        traffic: enriched.traffic || businesses[i].traffic || null,
        onPage: enriched.onPage || businesses[i].onPage || null,
        onPageResults: enriched.onPageResults || businesses[i].onPageResults || null,
        backlinks: enriched.backlinks || businesses[i].backlinks || null,
        domainRank: enriched.domainRank || businesses[i].domainRank || null,
        pageSpeedInsights: enriched.pageSpeedInsights || businesses[i].pageSpeedInsights || null,
        googlePlaces: enriched.googlePlaces || businesses[i].googlePlaces || null,
        safeBrowsing: enriched.safeBrowsing || businesses[i].safeBrowsing || null,
        schemaValidation: enriched.schemaValidation || businesses[i].schemaValidation || null,
        ads: enriched.ads || businesses[i].ads || null,
        adsCreatives: enriched.adsCreatives || businesses[i].adsCreatives || null,
        adsCreativesCount: enriched.adsCreativesCount || businesses[i].adsCreativesCount || 0
      };
      enrichedBusinesses.push(mergedBusiness);
      // Add a small delay between businesses to avoid rate limiting
      if (i < businesses.length - 1) {
        await delay(500);
      }
    }
    
    // Phase 2.9: Check Ads Advertisers (match businesses to advertisers)
    console.log("\n📢 Phase 2.9: Checking Ads Advertisers...");
    await checkAdsAdvertisers(enrichedBusinesses);
    
    // Phase 3: Store
    await storeInDatabase(enrichedBusinesses);
    
    // Print statistics
    printStatistics();
    
    console.log("\n✅ Data collection complete!");
    
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error);
    printStatistics();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();

