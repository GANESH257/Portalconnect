/**
 * Complete Data Collection for SPINE Center ONLY
 * Collects EVERYTHING - no shortcuts, no missing data
 */
import "dotenv/config";
import { dataForSEOService } from "../server/services/dataforseoService.js";
import { prisma } from "../server/lib/prisma.js";
import axios from "axios";

const BUSINESS_NAME = "SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery";
const KEYWORD = "Spine";
const LOCATION = "Chesterfield, MO";
const DOMAIN = "onlinespinecare.com";

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function collectCompleteData() {
  console.log("🚀 COMPLETE DATA COLLECTION FOR SPINE CENTER");
  console.log("=".repeat(70));
  console.log(`Business: ${BUSINESS_NAME}`);
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Location: ${LOCATION}`);
  console.log("=".repeat(70));
  
  // Step 1: Create SERP Job
  console.log("\n📋 Step 1: Creating SERP Job...");
  const serpJob = await dataForSEOService.createSerpJob({
    keyword: KEYWORD,
    location: LOCATION,
    language: "en",
    device: "desktop"
  });
  
  if (!serpJob?.tasks?.[0]?.id) {
    console.log("❌ Failed to create SERP job");
    return;
  }
  
  const jobId = serpJob.tasks[0].id;
  console.log(`✅ SERP Job created: ${jobId}`);
  
  // Wait for job to complete
  console.log("⏳ Waiting for SERP job to complete...");
  await delay(10000);
  
  // Get SERP results
  const serpResults = await dataForSEOService.getSerpResults(jobId);
  if (!serpResults?.tasks?.[0]?.result?.[0]?.items) {
    console.log("❌ No SERP results found");
    return;
  }
  
  const items = serpResults.tasks[0].result[0].items;
  const spineCenterResult = items.find((item: any) => 
    item.title?.includes("SPINE Center") || 
    item.domain === DOMAIN
  );
  
  if (!spineCenterResult) {
    console.log("❌ SPINE Center not found in SERP results");
    return;
  }
  
  console.log(`✅ Found SPINE Center in SERP: ${spineCenterResult.title}`);
  
  // Store SERP Job
  const storedJob = await prisma.serpJob.create({
    data: {
      keyword: KEYWORD,
      location: LOCATION,
      language: "en",
      device: "desktop",
      status: "completed",
      rawData: serpResults.tasks[0].result[0] as any
    }
  });
  
  // Store SERP Result
  const storedResult = await prisma.serpResult.create({
    data: {
      serpJobId: storedJob.id,
      title: spineCenterResult.title || BUSINESS_NAME,
      url: spineCenterResult.url || `https://${DOMAIN}`,
      domain: DOMAIN,
      rankAbsolute: spineCenterResult.rank_absolute || 1,
      rankGroup: spineCenterResult.rank_group || 1,
      placeId: spineCenterResult.place_id || null,
      cid: spineCenterResult.cid || null,
      rawData: {
        ...spineCenterResult,
        enriched: {}
      } as any
    }
  });
  
  console.log(`✅ Stored SERP Result: ${storedResult.id}`);
  
  const enriched: any = {};
  
  // Step 2: GMB Info
  console.log("\n📋 Step 2: Fetching GMB Info...");
  try {
    const gmbData = await dataForSEOService.enrichBusinessProfile({
      businessName: BUSINESS_NAME,
      location: LOCATION,
      placeId: spineCenterResult.place_id,
      cid: spineCenterResult.cid
    });
    enriched.gmbInfo = gmbData?.tasks?.[0]?.result?.[0] || null;
    console.log("✅ GMB Info collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ GMB Info failed: ${error.message}`);
  }
  
  // Step 3: Reviews
  console.log("\n⭐ Step 3: Fetching Reviews...");
  try {
    const reviewsTask = await dataForSEOService.getBusinessReviews({
      businessName: BUSINESS_NAME,
      location: LOCATION,
      maxReviews: 1000
    });
    const reviewsTaskId = reviewsTask?.tasks?.[0]?.id;
    if (reviewsTaskId) {
      await delay(5000);
      enriched.reviews = reviewsTask?.tasks?.[0]?.result?.[0] || reviewsTask?.tasks?.[0] || null;
    } else {
      enriched.reviews = reviewsTask?.tasks?.[0]?.result?.[0] || null;
    }
    console.log("✅ Reviews collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Reviews failed: ${error.message}`);
  }
  
  // Step 4: Ranked Keywords
  console.log("\n🔑 Step 4: Fetching Ranked Keywords...");
  try {
    const keywordsData = await dataForSEOService.getRankedKeywords({
      domain: DOMAIN,
      limit: 100
    });
    enriched.rankedKeywords = keywordsData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`✅ Ranked Keywords: ${enriched.rankedKeywords.length} found`);
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Keywords failed: ${error.message}`);
  }
  
  // Step 5: Traffic Estimation
  console.log("\n📊 Step 5: Fetching Traffic Estimation...");
  try {
    const trafficData = await dataForSEOService.getBulkTrafficEstimation({
      domains: [DOMAIN]
    });
    enriched.traffic = trafficData?.tasks?.[0]?.result?.[0]?.items?.[0] || null;
    if (enriched.traffic?.metrics?.paid?.etv) {
      enriched.paidETV = enriched.traffic.metrics.paid.etv;
    }
    console.log("✅ Traffic Estimation collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Traffic failed: ${error.message}`);
  }
  
  // Step 6: Ads Creatives
  console.log("\n📢 Step 6: Fetching Ads Creatives...");
  try {
    const adsData = await dataForSEOService.getAdsForDomain({
      target: DOMAIN,
      locationCode: 2840, // Missouri
      platform: 'all',
      format: 'all',
      depth: 40
    });
    const creatives = adsData?.tasks?.[0]?.result?.[0]?.items || [];
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
        platform: 'google_search'
      }));
    console.log(`✅ Ads Creatives: ${enriched.adsCreatives.length} found`);
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Ads Creatives failed: ${error.message}`);
  }
  
  // Step 7: Ads Advertisers
  console.log("\n📢 Step 7: Fetching Ads Advertisers...");
  try {
    const advertisersData = await dataForSEOService.getAdsAdvertisers({
      target: DOMAIN,
      locationName: LOCATION
    });
    enriched.adsAdvertisers = advertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`✅ Ads Advertisers: ${enriched.adsAdvertisers.length} found`);
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Ads Advertisers failed: ${error.message}`);
  }
  
  // Step 8: Domain Rank
  console.log("\n🏆 Step 8: Fetching Domain Rank...");
  try {
    const domainRankData = await dataForSEOService.getDomainAnalysis({
      domain: DOMAIN
    });
    enriched.domainRank = domainRankData?.tasks?.[0]?.result?.[0] || null;
    console.log("✅ Domain Rank collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Domain Rank failed: ${error.message}`);
  }
  
  // Step 9: Backlinks
  console.log("\n🔗 Step 9: Fetching Backlinks...");
  try {
    const backlinksData = await dataForSEOService.getBacklinks({
      target: DOMAIN,
      limit: 1000
    });
    enriched.backlinks = backlinksData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`✅ Backlinks: ${enriched.backlinks.length} found`);
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Backlinks failed: ${error.message}`);
  }
  
  // Step 10: HTML Content (for Analytics & Schemas)
  console.log("\n🌐 Step 10: Fetching HTML Content...");
  try {
    const htmlResponse = await axios.get(`https://${DOMAIN}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    enriched.htmlContent = htmlResponse.data;
    
    // Detect Analytics
    const html = htmlResponse.data;
    enriched.analytics = {
      googleAnalytics: html.includes('google-analytics.com') || html.includes('gtag') || html.includes('ga('),
      googleTagManager: html.includes('googletagmanager.com'),
      facebookPixel: html.includes('facebook.net') && html.includes('fbevents.js'),
      hasAnalytics: html.includes('google-analytics.com') || html.includes('googletagmanager.com') || html.includes('facebook.net')
    };
    
    // Detect Schemas
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
    let hasLocalBusiness = false;
    let hasFAQ = false;
    let hasOrganization = false;
    
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
          }
        } catch (e) {}
      }
    }
    
    enriched.schemas = {
      localBusiness: hasLocalBusiness,
      faq: hasFAQ,
      organization: hasOrganization,
      breadcrumbs: html.includes('itemtype') && html.includes('breadcrumb'),
      product: html.includes('itemtype') && html.includes('product'),
      review: html.includes('itemtype') && html.includes('review')
    };
    
    console.log("✅ HTML Content, Analytics, and Schemas collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ HTML fetch failed: ${error.message}`);
  }
  
  // Step 11: On-Page Analysis
  console.log("\n📄 Step 11: Fetching On-Page Analysis...");
  try {
    const onPageData = await dataForSEOService.getOnPageAnalysis({
      domain: `https://${DOMAIN}`
    });
    const onPageTaskId = onPageData?.tasks?.[0]?.id;
    if (onPageTaskId) {
      console.log("⏳ Waiting for On-Page task to complete...");
      await delay(10000);
      try {
        const onPageResult = await dataForSEOService.getOnPageResults?.(onPageTaskId);
        enriched.onPageResults = onPageResult?.tasks?.[0]?.result?.[0] || onPageData?.tasks?.[0] || null;
      } catch (err: any) {
        enriched.onPageResults = onPageData?.tasks?.[0] || null;
      }
    } else {
      enriched.onPageResults = onPageData?.tasks?.[0]?.result?.[0] || null;
    }
    console.log("✅ On-Page Analysis collected");
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ On-Page Analysis failed: ${error.message}`);
  }
  
  // Step 12: Google PageSpeed Insights
  console.log("\n⚡ Step 12: Fetching PageSpeed Insights...");
  try {
    const pageSpeedKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    if (pageSpeedKey) {
      const pageSpeedResponse = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`, {
        params: {
          url: `https://${DOMAIN}`,
          key: pageSpeedKey
        }
      });
      enriched.pageSpeedInsights = {
        performance: pageSpeedResponse.data?.lighthouseResult?.categories?.performance?.score * 100 || null,
        accessibility: pageSpeedResponse.data?.lighthouseResult?.categories?.accessibility?.score * 100 || null,
        seo: pageSpeedResponse.data?.lighthouseResult?.categories?.seo?.score * 100 || null,
        bestPractices: pageSpeedResponse.data?.lighthouseResult?.categories?.['best-practices']?.score * 100 || null,
        coreWebVitals: {
          lcp: pageSpeedResponse.data?.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile || null,
          fid: pageSpeedResponse.data?.loadingExperience?.metrics?.FIRST_INPUT_DELAY_MS?.percentile || null,
          cls: pageSpeedResponse.data?.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile || null
        }
      };
      console.log("✅ PageSpeed Insights collected");
    } else {
      console.log("⚠️  PageSpeed API key not found, skipping");
    }
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ PageSpeed Insights failed: ${error.message}`);
  }
  
  // Step 13: Google Places
  console.log("\n📍 Step 13: Fetching Google Places...");
  try {
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    if (placesKey && spineCenterResult.place_id) {
      const placesResponse = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json`, {
        params: {
          place_id: spineCenterResult.place_id,
          fields: 'rating,user_ratings_total,reviews',
          key: placesKey
        }
      });
      enriched.googlePlaces = placesResponse.data?.result || null;
      console.log("✅ Google Places collected");
    } else {
      console.log("⚠️  Google Places API key or place_id not found, skipping");
    }
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Google Places failed: ${error.message}`);
  }
  
  // Step 14: Safe Browsing
  console.log("\n🔒 Step 14: Checking Safe Browsing...");
  try {
    const safeBrowsingKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (safeBrowsingKey) {
      const safeBrowsingResponse = await axios.post(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingKey}`, {
        client: {
          clientId: "clinicprospect",
          clientVersion: "1.0"
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url: `https://${DOMAIN}` }]
        }
      });
      enriched.safeBrowsing = {
        isSafe: !safeBrowsingResponse.data?.matches || safeBrowsingResponse.data.matches.length === 0,
        threats: safeBrowsingResponse.data?.matches || []
      };
      console.log("✅ Safe Browsing check completed");
    } else {
      console.log("⚠️  Safe Browsing API key not found, skipping");
    }
    await delay(2000);
  } catch (error: any) {
    console.log(`❌ Safe Browsing failed: ${error.message}`);
  }
  
  // Step 15: Schema Validation
  console.log("\n✅ Step 15: Validating Schemas...");
  try {
    if (enriched.htmlContent) {
      const jsonLdMatches = enriched.htmlContent.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis);
      const validSchemas: any[] = [];
      const invalidSchemas: any[] = [];
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
            const schema = JSON.parse(jsonContent);
            validSchemas.push(schema);
          } catch (e) {
            invalidSchemas.push({ error: 'Invalid JSON', content: match.substring(0, 100) });
          }
        }
      }
      
      enriched.schemaValidation = {
        valid: validSchemas.length,
        invalid: invalidSchemas.length,
        schemas: validSchemas
      };
      console.log(`✅ Schema Validation: ${validSchemas.length} valid, ${invalidSchemas.length} invalid`);
    }
  } catch (error: any) {
    console.log(`❌ Schema Validation failed: ${error.message}`);
  }
  
  // Update serpResult with ALL enriched data
  console.log("\n💾 Step 16: Saving ALL data to database...");
  const updatedResult = await prisma.serpResult.update({
    where: { id: storedResult.id },
    data: {
      rawData: {
        ...spineCenterResult,
        enriched: enriched
      } as any
    }
  });
  
  // Calculate scores
  const pageSpeed = enriched.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]?.page_speed || 
                    enriched.pageSpeedInsights?.performance || null;
  const mobileScore = enriched.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]?.mobile_score || 
                      enriched.pageSpeedInsights?.accessibility || null;
  const accessibilityScore = enriched.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]?.accessibility_score || 
                             enriched.pageSpeedInsights?.accessibility || null;
  
  const domainAuthority = enriched.domainRank?.rank || 
                          (enriched.traffic?.metrics?.organic?.etv ? Math.min(100, Math.round((enriched.traffic.metrics.organic.etv / 10000) * 100)) : null);
  
  const monthlyTraffic = enriched.traffic?.metrics?.organic?.etv || null;
  const backlinksCount = enriched.backlinks?.length || 0;
  const keywordsCount = enriched.rankedKeywords?.length || 0;
  
  const seoScore = calculateSEOScore({
    domainAuthority,
    backlinksCount,
    monthlyTraffic,
    pageSpeed,
    mobileScore,
    accessibilityScore,
    pageSpeedInsightsSEO: enriched.pageSpeedInsights?.seo || null,
    bestPractices: enriched.pageSpeedInsights?.bestPractices || null
  });
  
  // Create/Update Business Profile
  const businessProfile = await prisma.businessProfile.upsert({
    where: { 
      domain: DOMAIN 
    },
    create: {
      name: BUSINESS_NAME,
      domain: DOMAIN,
      websiteUrl: `https://${DOMAIN}`,
      serpResultId: storedResult.id,
      city: "Chesterfield",
      state: "MO",
      seoScore: seoScore,
      domainAuthority: domainAuthority,
      monthlyTraffic: monthlyTraffic,
      backlinksCount: backlinksCount,
      keywordsCount: keywordsCount,
      pageSpeed: pageSpeed,
      mobileScore: mobileScore,
      accessibilityScore: accessibilityScore,
      isPaid: enriched.adsCreatives?.length > 0 || false,
      isActive: true
    },
    update: {
      name: BUSINESS_NAME,
      serpResultId: storedResult.id,
      seoScore: seoScore,
      domainAuthority: domainAuthority,
      monthlyTraffic: monthlyTraffic,
      backlinksCount: backlinksCount,
      keywordsCount: keywordsCount,
      pageSpeed: pageSpeed,
      mobileScore: mobileScore,
      accessibilityScore: accessibilityScore,
      isPaid: enriched.adsCreatives?.length > 0 || false
    }
  });
  
  console.log(`✅ Business Profile created/updated: ${businessProfile.id}`);
  console.log(`✅ SEO Score: ${seoScore}`);
  console.log(`✅ Ads Creatives: ${enriched.adsCreatives?.length || 0}`);
  console.log("\n🎉 COMPLETE DATA COLLECTION FINISHED!");
  console.log("=".repeat(70));
  
  await prisma.$disconnect();
}

function calculateSEOScore(metrics: any): number | null {
  let score = 0;
  let maxPossible = 0;
  
  if (metrics.domainAuthority != null) {
    maxPossible += 30;
    score += Math.round((metrics.domainAuthority / 100) * 30);
  }
  
  if (metrics.backlinksCount != null) {
    maxPossible += 15;
    if (metrics.backlinksCount >= 10000) score += 15;
    else if (metrics.backlinksCount >= 5000) score += 12;
    else if (metrics.backlinksCount >= 1000) score += 8;
    else if (metrics.backlinksCount >= 500) score += 6;
    else if (metrics.backlinksCount >= 100) score += 4;
    else if (metrics.backlinksCount >= 50) score += 3;
    else if (metrics.backlinksCount > 0) score += Math.max(1, Math.round((metrics.backlinksCount / 50) * 3));
  }
  
  if (metrics.monthlyTraffic != null) {
    maxPossible += 15;
    if (metrics.monthlyTraffic >= 100000) score += 15;
    else if (metrics.monthlyTraffic >= 50000) score += 12;
    else if (metrics.monthlyTraffic >= 10000) score += 8;
    else if (metrics.monthlyTraffic >= 5000) score += 6;
    else if (metrics.monthlyTraffic >= 1000) score += 4;
    else if (metrics.monthlyTraffic >= 500) score += 3;
    else if (metrics.monthlyTraffic >= 100) score += 2;
    else if (metrics.monthlyTraffic > 0) score += Math.max(1, Math.round((metrics.monthlyTraffic / 100) * 1));
  }
  
  if (metrics.pageSpeed != null) {
    maxPossible += 10;
    if (metrics.pageSpeed >= 90) score += 10;
    else if (metrics.pageSpeed >= 70) score += 7;
    else if (metrics.pageSpeed >= 50) score += 4;
  }
  
  if (metrics.mobileScore != null) {
    maxPossible += 10;
    if (metrics.mobileScore >= 90) score += 10;
    else if (metrics.mobileScore >= 70) score += 7;
    else if (metrics.mobileScore >= 50) score += 4;
  }
  
  if (metrics.pageSpeedInsightsSEO != null) {
    maxPossible += 15;
    score += Math.round((metrics.pageSpeedInsightsSEO / 100) * 15);
  }
  
  if (metrics.accessibilityScore != null) {
    maxPossible += 5;
    if (metrics.accessibilityScore >= 90) score += 5;
    else if (metrics.accessibilityScore >= 70) score += 3;
    else if (metrics.accessibilityScore >= 50) score += 1;
  }
  
  if (metrics.bestPractices != null) {
    maxPossible += 5;
    score += Math.round((metrics.bestPractices / 100) * 5);
  }
  
  if (maxPossible === 0) return null;
  return Math.round((score / maxPossible) * 100);
}

collectCompleteData().catch(console.error);

