# Complete Data Flow Documentation

## Overview

This document provides a comprehensive guide to how data flows through the entire system: from API collection, through database storage, route handlers, and finally to the frontend UI. Each data component is documented with its source, storage location, route access, and frontend display.

---

## Table of Contents

1. [Data Collection Architecture](#data-collection-architecture)
2. [Data Components by Category](#data-components-by-category)
3. [Database Storage Structure](#database-storage-structure)
4. [Route Handler Data Flow](#route-handler-data-flow)
5. [Frontend Data Access](#frontend-data-access)
6. [Testing with Multiple Businesses](#testing-with-multiple-businesses)

---

## Data Collection Architecture

### Collection Script: `scripts/collect-spine-data.ts`

**Purpose**: Collects comprehensive business intelligence data for businesses found in SERP searches.

**Flow**:
1. **Phase 1: Discovery** - Find businesses using multiple APIs
2. **Phase 2: Enrichment** - Gather detailed data for each business
3. **Phase 3: Storage** - Store all data in database

**Configuration**:
```typescript
const KEYWORD = "Spine";
const LOCATION = "Chesterfield, MO";
const BUSINESS_LIMIT = 1; // Currently set to 1 for SPINE Center
```

---

## Data Components by Category

### 1. Page Speed Scores

#### **Data Source**
- **Primary**: Google PageSpeed Insights API
  - Endpoint: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
  - API Key: `GOOGLE_PAGESPEED_API_KEY` (from `.env`)
  - Strategy: `desktop` and `mobile` (separate calls)
  - Categories: `performance`, `accessibility`, `seo`, `best-practices`
  
- **Fallback**: DataForSEO On-Page API
  - Endpoint: `/on_page/pages` (via `dataForSEOService.getOnPagePages()`)
  - Provides: `page_timing`, `mobile_score`, `desktop_score`, `accessibility_score`

#### **Collection Process**
**File**: `scripts/collect-spine-data.ts` (lines 442-494, 977-996)

```typescript
// 1. On-Page Analysis (DataForSEO)
const onPageData = await dataForSEOService.getOnPageAnalysis({
  domain: websiteUrl,
  location: LOCATION
});

// 2. Wait for task completion (retry logic)
let onPageResults = null;
for (let attempt = 0; attempt < 3; attempt++) {
  await delay([15000, 10000, 5000][attempt]);
  const result = await dataForSEOService.getOnPagePages(taskId);
  if (result?.tasks?.[0]?.result) {
    onPageResults = result;
    break;
  }
}

// 3. PageSpeed Insights (Google API) - Fallback
const pageSpeedData = await getPageSpeedInsights(websiteUrl);
// Extracts: performance, mobile, accessibility, seo, bestPractices, coreWebVitals
```

**Alternative Script**: `scripts/update-pagespeed-data.ts`
- Standalone script to update PageSpeed data for a specific business
- Fetches both desktop and mobile performance data
- Stores Core Web Vitals (LCP, FID, CLS, FCP, TTI)

#### **Database Storage**

**Table**: `business_profiles`
- `pageSpeed` (Float) - Desktop performance score (0-100)
- `mobileScore` (Int) - Mobile performance score (0-100)
- `accessibilityScore` (Int) - Accessibility score (0-100)

**Table**: `serp_results.raw_data.enriched.pageSpeedInsights` (JSON)
```json
{
  "performance": 67,
  "mobile": 45,
  "accessibility": null,
  "seo": null,
  "bestPractices": null,
  "coreWebVitals": {
    "lcp": 941,
    "fid": 700,
    "cls": 0.038,
    "fcp": 811,
    "tti": 5596
  },
  "rawData": {
    "desktop": { /* Full Lighthouse result */ },
    "mobile": { /* Full Lighthouse result */ }
  }
}
```

**Storage Code**: `scripts/collect-spine-data.ts` (lines 977-996)
```typescript
pageSpeed: business.pageSpeedInsights?.performance || null,
mobileScore: business.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]?.mobile_score ||
             business.pageSpeedInsights?.mobile || null,
accessibilityScore: business.onPageResults?.tasks?.[0]?.result?.[0]?.items?.[0]?.accessibility_score ||
                    business.pageSpeedInsights?.accessibility || null
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (lines 2301-2374)

**Data Flow**:
1. Fetch `businessProfile` with `serpResult` relation
2. Extract `rawData.enriched` from `serpResult`
3. Priority order:
   - `businessProfile.pageSpeed` / `businessProfile.mobileScore` (already calculated)
   - `enriched.pageSpeedInsights.performance` / `enriched.pageSpeedInsights.mobile`
   - Calculate from `onPageResults` if available

**Code**:
```typescript
let desktopSpeed = businessProfile.pageSpeed;
let mobileSpeed = businessProfile.mobileScore;
let accessibilityScore = businessProfile.accessibilityScore;

// Fallback to PageSpeed Insights
if (desktopSpeed == null) {
  if (enriched?.pageSpeedInsights?.performance != null) {
    desktopSpeed = enriched.pageSpeedInsights.performance;
  }
}

// Last resort: Calculate from On-Page API data
if (desktopSpeed == null && onPageData?.page_timing) {
  // Calculate score from Core Web Vitals
  const timing = onPageData.page_timing;
  let score = 100;
  if (timing.largest_contentful_paint >= 4000) score -= 30;
  // ... more calculations
  desktopSpeed = Math.max(0, Math.min(100, score));
}
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "speedScores": {
      "desktop": 67,
      "mobile": 45
    },
    "coreWebVitals": {
      "lcp": 941,
      "fid": 700,
      "cls": 0.038,
      "fcp": 811,
      "tti": 5596
    }
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Function**: `fetchBusinessSEOAndPPC()` (lines 251-299)

**API Call**:
```typescript
const url = `/api/serp/business/${profileId}/seo-ppc?location=${encodeURIComponent(location)}`;
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
setSeoPpcData(data.data);
```

**UI Display**:
- **Tab**: "SEO & PPC"
- **Section**: "Technical SEO"
- **Fields**:
  - Desktop Speed Score: `seoPpcData.speedScores.desktop` (with progress bar)
  - Mobile Speed Score: `seoPpcData.speedScores.mobile` (with progress bar)
- **Recommendations**: Includes speed optimization advice if scores < 70

---

### 2. Analytics Data (Google Analytics & Facebook Pixel)

#### **Data Source**
- **HTML Scraping**: Direct HTTP fetch of business website
- **Detection Method**: Pattern matching in HTML content
- **Script**: `scripts/collect-spine-data.ts` (lines 543-600)

#### **Collection Process**

```typescript
// 1. Fetch HTML content
const htmlResponse = await axios.get(websiteUrl, {
  headers: { /* Browser-like headers */ },
  timeout: 15000
});

// 2. Detect Analytics
const detectedAnalytics = detectAnalyticsInHTML(htmlContent);

// 3. Store in enriched data
enriched.analytics = {
  googleAnalytics: {
    found: detectedAnalytics.googleAnalytics.found,
    id: detectedAnalytics.googleAnalytics.id,
    type: detectedAnalytics.googleAnalytics.type // 'gtag', 'ga4', 'ua'
  },
  facebookPixel: {
    found: detectedAnalytics.facebookPixel.found,
    id: detectedAnalytics.facebookPixel.id
  }
};
```

**Detection Logic** (`detectAnalyticsInHTML` function):
- **Google Analytics**: Searches for `gtag`, `ga4`, `google-analytics`, `gtm-`
- **Facebook Pixel**: Searches for `fbq`, `facebook-pixel`, `pixel_id`

#### **Database Storage**

**Table**: `serp_results.raw_data.enriched.analytics` (JSON)
```json
{
  "googleAnalytics": {
    "found": true,
    "id": "GTM-TGBB9722",
    "type": "gtag"
  },
  "facebookPixel": {
    "found": false,
    "id": null
  }
}
```

**Alternative Location**: `serp_results.raw_data.enriched.onPageResults.tasks[0].result[0].items[0].technologies`
- DataForSEO On-Page API also detects technologies
- Used as fallback if HTML scraping fails

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (lines 2246-2400)

**Data Flow**:
1. Extract from `enriched.analytics` (primary)
2. Fallback to `onPageData.technologies` (from On-Page API)
3. Merge results

**Code**:
```typescript
const storedAnalytics = enriched?.analytics || {
  googleAnalytics: { found: false },
  facebookPixel: { found: false }
};

// Fallback to onPage technologies
const hasGoogleAnalytics = storedAnalytics.googleAnalytics?.found || 
  onPageData?.technologies?.some((tech: any) => 
    tech.name?.toLowerCase().includes('google analytics')
  ) || false;
```

**Response Structure**:
```json
{
  "analytics": {
    "googleAnalytics": {
      "found": true,
      "type": "gtag",
      "id": "GTM-TGBB9722"
    },
    "facebookPixel": {
      "found": false,
      "id": null
    }
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → "Technical SEO" section

**UI Elements**:
- Google Analytics: ✅ Found / ❌ Not Found (with ID if found)
- Facebook Pixel: ✅ Found / ❌ Not Found (with ID if found)

---

### 3. Schema Markup Data

#### **Data Source**
- **HTML Scraping**: Direct HTTP fetch of business website
- **Detection Method**: JSON-LD parsing, microdata, RDFa detection
- **Script**: `scripts/collect-spine-data.ts` (lines 543-600)

#### **Collection Process**

```typescript
// 1. Fetch HTML content (same as analytics)
const htmlResponse = await axios.get(websiteUrl, { /* ... */ });

// 2. Detect Schemas
const detectedSchemas = detectSchemasInHTML(htmlContent);

// 3. Store in enriched data
enriched.schemas = {
  localBusiness: detectedSchemas.localBusiness,
  faq: detectedSchemas.faq,
  organization: detectedSchemas.organization,
  breadcrumbs: detectedSchemas.breadcrumbs,
  product: detectedSchemas.product,
  review: detectedSchemas.review
};
```

**Detection Logic** (`detectSchemasInHTML` function):
- **JSON-LD**: Parses `<script type="application/ld+json">` tags
- **Microdata**: Searches for `itemtype` attributes
- **RDFa**: Searches for `typeof` attributes
- **Types Detected**: LocalBusiness, FAQPage, Organization, BreadcrumbList, Product, Review

#### **Database Storage**

**Table**: `serp_results.raw_data.enriched.schemas` (JSON)
```json
{
  "localBusiness": false,
  "faq": true,
  "organization": true,
  "breadcrumbs": true,
  "product": false,
  "review": false
}
```

**Alternative Location**: `serp_results.raw_data.enriched.onPageResults.tasks[0].result[0].items[0].schemas`
- DataForSEO On-Page API also detects schemas
- Used as fallback

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (lines 2392-2400)

**Code**:
```typescript
const storedSchemas = enriched?.schemas || {
  localBusiness: false,
  faq: false,
  organization: false,
  breadcrumbs: false,
  product: false,
  review: false
};

// Fallback to onPage schemas
const finalSchemas = {
  localBusiness: storedSchemas.localBusiness || 
    onPageData?.schemas?.some((s: any) => s['@type'] === 'LocalBusiness') || false,
  // ... similar for other types
};
```

**Response Structure**:
```json
{
  "schemas": {
    "localBusiness": false,
    "faq": true,
    "organization": true,
    "breadcrumbs": true,
    "product": false,
    "review": false
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → "SEO Status" section

**UI Elements**:
- Local Business Schema: ✅ Found / ❌ Missing
- FAQ Schema: ✅ Found / ❌ Missing
- Other schemas shown in recommendations

---

### 4. Ads Data (PPC/Advertising)

#### **Data Source**
- **Primary**: DataForSEO Ads API
  - Endpoint: `/dataforseo_labs/google_ads_search/live`
  - Method: `getAdsForDomain()` (via `dataForSEOService`)
  - Parameters: `target` (domain), `locationCode`, `platform`, `format`, `depth`
  
- **Secondary**: DataForSEO Ads Advertisers API
  - Endpoint: `/dataforseo_labs/google_ads_search_by_advertiser/live`
  - Method: `getAdsAdvertisers()` (via `dataForSEOService`)
  - Parameters: `keyword`, `locationName`

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 397-440, 700-748)

```typescript
// 1. Fetch Ads Creatives for domain
const adsCreativesData = await dataForSEOService.getAdsForDomain({
  target: domain,
  locationCode: 2840, // Missouri
  platform: 'all',
  format: 'all',
  depth: 40
});

// Extract ad creatives
const creatives = adsCreativesData?.tasks?.[0]?.result?.[0]?.items || [];
const adCreatives = creatives
  .filter((item: any) => item.type === 'ads_search')
  .map((item: any) => ({
    creativeId: item.creative_id,
    advertiserId: item.advertiser_id,
    title: item.title,
    description: item.description,
    url: item.url,
    format: item.format,
    previewImage: item.preview_image,
    // ... more fields
  }));

enriched.adsCreatives = adCreatives;
enriched.adsCreativesCount = adCreatives.length;

// 2. Match businesses to advertisers
const adsAdvertisersData = await dataForSEOService.getAdsAdvertisers({
  keyword: KEYWORD,
  locationName: LOCATION
});

// Create map of advertiser domains
const advertiserDomains = new Map<string, any>();
for (const advertiser of advertisers) {
  const domain = extractDomain(advertiser.domain || advertiser.website);
  if (domain) {
    advertiserDomains.set(domain.toLowerCase(), advertiser);
  }
}

// Match business to advertiser
if (businessDomain && advertiserDomains.has(normalizedDomain)) {
  business.isPaid = true;
  business.ads = {
    matched: true,
    advertiserId: advertiser.advertiser_id,
    approxAdsCount: advertiser.approx_ads_count,
    verified: advertiser.verified
  };
}
```

#### **Database Storage**

**Table**: `business_profiles`
- `isPaid` (Boolean) - Whether business is running ads

**Table**: `serp_results.raw_data.enriched.adsCreatives` (JSON Array)
```json
[
  {
    "creativeId": "123456",
    "advertiserId": "789012",
    "title": "Ad Title",
    "description": "Ad Description",
    "url": "https://example.com",
    "format": "text",
    "previewImage": "https://...",
    "firstShown": "2024-01-01",
    "lastShown": "2024-01-31",
    "platform": "google",
    "verified": true
  }
]
```

**Table**: `serp_results.raw_data.enriched.adsCreativesCount` (Number)
- Count of ad creatives found

**Table**: `serp_results.raw_data.ads` (JSON)
```json
{
  "matched": true,
  "advertiserId": "789012",
  "approxAdsCount": 19,
  "verified": true
}
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/ads`
**File**: `server/routes/serp-intelligence.ts` (lines 1500-1800)

**Data Flow**:
1. Fetch `businessProfile` with `serpResult` relation
2. Extract `rawData.enriched.adsCreatives` from `serpResult`
3. If not found, search for alternative `serpResult` with enriched data
4. Transform ad creatives for frontend

**Code**:
```typescript
// Get serpResult with rawData
let serpResult = await prisma.serpResult.findUnique({
  where: { id: businessProfile.serpResultId! },
  select: { id: true, rawData: true, title: true, domain: true }
});

let rawData: any = serpResult.rawData || {};
let enriched: any = rawData.enriched || {};

// If no enriched data, search for alternative serpResult
if (!enriched.adsCreatives || enriched.adsCreatives.length === 0) {
  // Search by business name and domain
  const candidates = await prisma.serpResult.findMany({
    where: { /* search criteria */ },
    select: { id: true, rawData: true }
  });
  
  for (const candidate of candidates) {
    const candidateEnriched = (candidate.rawData as any)?.enriched || {};
    if (candidateEnriched.adsCreatives?.length > 0) {
      enriched = candidateEnriched;
      break;
    }
  }
}

// Extract and transform ads
const creatives = enriched.adsCreatives || [];
const ads = creatives.map((creative: any) => ({
  id: creative.creativeId,
  title: creative.title,
  description: creative.description,
  url: creative.url,
  platform: detectPlatform(creative.url), // 'google', 'bing', etc.
  previewImage: typeof creative.previewImage === 'string' 
    ? creative.previewImage 
    : creative.previewImage?.url || null,
  firstShown: creative.firstShown,
  lastShown: creative.lastShown
}));
```

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "isPaid": true,
    "adCount": 19,
    "ads": [
      {
        "id": "123456",
        "title": "Ad Title",
        "description": "Ad Description",
        "url": "https://example.com",
        "platform": "google",
        "previewImage": "https://...",
        "firstShown": "2024-01-01",
        "lastShown": "2024-01-31"
      }
    ]
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Function**: `fetchBusinessAds()` (lines 220-249)

**API Call**:
```typescript
const url = `/api/serp/business/${profileId}/ads?location=${encodeURIComponent(location)}`;
const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
setAdsData(data.data);
```

**UI Display**:
- **Tab**: "Ads"
- **Section**: Shows ad count and list of ad creatives
- **Elements**:
  - "Running X active ads" header
  - Grid/list of ad cards with preview images
  - Ad details (title, description, URL, dates)

---

### 5. Google Places Data (Reviews & Ratings)

#### **Data Source**
- **Google Places API** (via `scripts/add-google-places.ts`)
- **Endpoint**: `https://maps.googleapis.com/maps/api/place/details/json`
- **API Key**: `GOOGLE_PLACES_API_KEY` (from `.env`)
- **Parameters**: `place_id`, `fields` (rating, reviews, user_ratings_total)

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 496-517)

```typescript
// Import Google Places function
const { getGooglePlacesReviews } = await import("./add-google-places.js");

// Fetch reviews and ratings
const placesData = await getGooglePlacesReviews({
  placeId: business.placeId || business.place_id,
  businessName: business.title || business.name,
  address: `${business.address || ''}, ${business.city || ''}, ${business.state || ''}`.trim()
});

if (placesData) {
  enriched.googlePlaces = {
    rating: placesData.rating,
    totalRatings: placesData.totalRatings,
    reviews: placesData.reviews,
    placeId: placesData.placeId
  };
}
```

**Alternative**: DataForSEO Reviews API
- Endpoint: `/business_data/google/my_business/reviews/task_post` (via `dataForSEOService.getBusinessReviews()`)
- Used if Google Places API fails

#### **Database Storage**

**Table**: `business_profiles`
- `rating` (Float) - Average rating (0-5)
- `reviewsCount` (Int) - Total number of reviews

**Table**: `serp_results.raw_data.enriched.googlePlaces` (JSON)
```json
{
  "rating": 5.0,
  "totalRatings": 31,
  "reviews": [
    {
      "author": "John Doe",
      "rating": 5,
      "text": "Great service!",
      "time": "2024-01-15"
    }
  ],
  "placeId": "ChIJ..."
}
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId`
**File**: `server/routes/serp-intelligence.ts` (lines 1050-1070)

**Code**:
```typescript
googlePlaces: (() => {
  // Try direct enriched data
  if (enriched?.googlePlaces) {
    return enriched.googlePlaces;
  }
  
  // Search alternative serpResults
  const candidates = await prisma.serpResult.findMany({
    where: { /* search criteria */ }
  });
  
  for (const candidate of candidates) {
    const candidateEnriched = (candidate.rawData as any)?.enriched || {};
    if (candidateEnriched.googlePlaces) {
      return candidateEnriched.googlePlaces;
    }
  }
  
  return null;
})()
```

**Response Structure**:
```json
{
  "googlePlaces": {
    "rating": 5.0,
    "totalRatings": 31,
    "reviews": [ /* ... */ ],
    "placeId": "ChIJ..."
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "Reputation" tab

**UI Elements**:
- Rating display: ⭐ 5.0 out of 5.0
- Review count: "31 reviews"
- List of individual reviews

---

### 6. Safe Browsing Data

#### **Data Source**
- **Google Safe Browsing API** (via `scripts/add-safe-browsing.ts`)
- **Endpoint**: `https://safebrowsing.googleapis.com/v4/threatMatches:find`
- **API Key**: `GOOGLE_SAFE_BROWSING_API_KEY` (from `.env`)

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 519-531)

```typescript
const { checkSafeBrowsing } = await import("./add-safe-browsing.js");
const safeBrowsingData = await checkSafeBrowsing(websiteUrl);

if (safeBrowsingData) {
  enriched.safeBrowsing = safeBrowsingData;
}
```

**Check Types**: Malware, Phishing, Unwanted Software

#### **Database Storage**

**Table**: `serp_results.raw_data.enriched.safeBrowsing` (JSON)
```json
{
  "isSafe": true,
  "threats": [],
  "lastChecked": "2024-01-15T10:00:00Z"
}
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (line 2448)

**Code**:
```typescript
safeBrowsing: enriched.safeBrowsing || null
```

**Response Structure**:
```json
{
  "safeBrowsing": {
    "isSafe": true,
    "threats": []
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → Recommendations section

**UI Elements**:
- Security status indicator
- Warnings if threats detected

---

### 7. Schema Validation Data

#### **Data Source**
- **Custom Validation** (via `scripts/add-schema-validation.ts`)
- **Method**: HTML parsing and JSON-LD validation
- **Validates**: LocalBusiness, FAQ, Organization, Breadcrumbs, Product, Review schemas

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 533-541)

```typescript
const { validateSchemas } = await import("./add-schema-validation.js");
// Validation happens after HTML is fetched
enriched.schemaValidationPending = true;
```

**Validation Logic**:
- Parses JSON-LD schemas from HTML
- Validates required fields for each schema type
- Checks for common errors (missing fields, invalid types)

#### **Database Storage**

**Table**: `serp_results.raw_data.enriched.schemaValidation` (JSON)
```json
{
  "valid": true,
  "schemas": [
    {
      "type": "FAQPage",
      "valid": true,
      "errors": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (line 2449)

**Code**:
```typescript
schemaValidation: enriched.schemaValidation || null
```

**Response Structure**:
```json
{
  "schemaValidation": {
    "valid": true,
    "schemas": [ /* ... */ ],
    "errors": []
  }
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → Recommendations section

**UI Elements**:
- Schema validation status
- List of validation errors/warnings
- Recommendations for missing schemas

---

### 8. SEO Metrics (Domain Authority, Backlinks, Traffic)

#### **Data Source**
- **Domain Rank**: DataForSEO Domain Analytics API
  - Endpoint: `/dataforseo_labs/google/domain_rank/live`
  - Method: `getDomainRank()` (via `dataForSEOService`)
  
- **Backlinks**: DataForSEO Backlinks API
  - Endpoint: `/backlinks/summary/live`
  - Method: `getBacklinks()` (via `dataForSEOService`)
  
- **Traffic**: DataForSEO Traffic Estimation API
  - Endpoint: `/dataforseo_labs/google/bulk_traffic_estimation/live`
  - Method: `getBulkTrafficEstimation()` (via `dataForSEOService`)

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 600-700)

```typescript
// 1. Domain Rank
const domainRankData = await dataForSEOService.getDomainRank({
  target: domain
});
const domainRank = domainRankData?.tasks?.[0]?.result?.[0] || null;

// 2. Backlinks
const backlinksData = await dataForSEOService.getBacklinks({
  target: domain,
  limit: 1000
});
const backlinks = backlinksData?.tasks?.[0]?.result || [];

// 3. Traffic Estimation
const trafficData = await dataForSEOService.getBulkTrafficEstimation({
  domains: [domain],
  location: LOCATION
});
const traffic = trafficData?.tasks?.[0]?.result?.[0]?.items?.[0] || null;
```

#### **Database Storage**

**Table**: `business_profiles`
- `domainAuthority` (Int) - Domain authority score (0-100)
- `backlinks` (Int) - Number of backlinks
- `monthlyTraffic` (Int) - Estimated monthly organic traffic
- `seoScore` (Int) - Calculated SEO score (0-100)

**Table**: `serp_results.raw_data.enriched.domainRank` (JSON)
```json
{
  "rank": 38,
  "backlinks": 1250,
  "referring_domains": 450
}
```

**Table**: `serp_results.raw_data.enriched.traffic` (JSON)
```json
{
  "metrics": {
    "organic": {
      "etv": 218,
      "count": 15
    },
    "paid": {
      "etv": 0
    }
  }
}
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (lines 2437-2442)

**Code**:
```typescript
domainAuthority: businessProfile.domainAuthority || null,
backlinks: businessProfile.backlinks || null,
monthlyTraffic: businessProfile.monthlyTraffic || null,
seoScore: businessProfile.seoScore || null
```

**Response Structure**:
```json
{
  "domainAuthority": 38,
  "backlinks": 1250,
  "monthlyTraffic": 218,
  "seoScore": 13
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → Various sections

**UI Elements**:
- Domain Authority: Displayed in metrics section
- Backlinks: Shown in recommendations
- Monthly Traffic: Displayed in metrics section
- SEO Score: Part of opportunity score calculation

---

### 9. Keyword Rankings

#### **Data Source**
- **DataForSEO Ranked Keywords API**
  - Endpoint: `/dataforseo_labs/google/ranked_keywords/live`
  - Method: `getRankedKeywords()` (via `dataForSEOService`)
  - Parameters: `domain`, `location`, `limit`

#### **Collection Process**

**File**: `scripts/collect-spine-data.ts` (lines 358-372)

```typescript
const keywordsData = await dataForSEOService.getRankedKeywords({
  domain: domain,
  location: LOCATION,
  limit: 100
});
enriched.rankedKeywords = keywordsData?.tasks?.[0]?.result?.[0]?.items || [];
```

#### **Database Storage**

**Table**: `keyword_rankings` (separate table)
- `businessProfileId` (String) - Foreign key to `business_profiles`
- `keyword` (String) - Ranked keyword
- `rankAbsolute` (Int) - Absolute ranking position
- `searchVolume` (Int) - Monthly search volume
- `cpc` (Float) - Cost per click
- `difficulty` (Int) - Keyword difficulty score

**Table**: `serp_results.raw_data.enriched.rankedKeywords` (JSON Array)
```json
[
  {
    "keyword": "spine surgeon",
    "rank_absolute": 5,
    "search_volume": 1200,
    "cpc": 12.50,
    "difficulty": 65
  }
]
```

#### **Route Handler Access**

**Route**: `GET /api/serp/business/:profileId/seo-ppc`
**File**: `server/routes/serp-intelligence.ts` (lines 2402-2408)

**Code**:
```typescript
const keywordRankings = businessProfile.keywordRankings || [];
const serpResults = keywordRankings.length > 0 ? keywordRankings.map((kr: any) => ({
  keyword: kr.keyword || 'null',
  rank: kr.rankAbsolute,
  url: kr.url
})) : null;
```

**Response Structure**:
```json
{
  "serpResults": [
    {
      "keyword": "spine surgeon",
      "rank": 5,
      "url": "https://example.com"
    }
  ]
}
```

#### **Frontend Access**

**Component**: `client/pages/BusinessProfilePage.tsx`
**Display**: "SEO & PPC" tab → Keyword rankings section

**UI Elements**:
- List of ranked keywords
- Ranking positions
- Search volume and CPC data

---

## Database Storage Structure

### Primary Tables

#### 1. `serp_jobs`
- Stores search job metadata
- Links to user who created the job
- Tracks job status and results count

#### 2. `serp_results`
- Stores individual SERP result data
- **Critical Field**: `raw_data` (JSON) - Contains all enriched data
  - Structure: `raw_data.enriched.{componentName}`
  - Example: `raw_data.enriched.pageSpeedInsights`, `raw_data.enriched.analytics`

#### 3. `business_profiles`
- Stores normalized business profile data
- Contains calculated scores and metrics
- Links to `serp_results` via `serpResultId`

#### 4. `keyword_rankings`
- Stores keyword ranking history
- Links to `business_profiles` via `businessProfileId`

### Data Storage Pattern

**Two-Tier Storage**:
1. **Normalized Fields**: Stored in `business_profiles` table columns
   - Used for: Fast queries, filtering, sorting
   - Examples: `pageSpeed`, `mobileScore`, `domainAuthority`, `seoScore`

2. **Raw/Enriched Data**: Stored in `serp_results.raw_data.enriched` (JSON)
   - Used for: Complete data preservation, complex structures
   - Examples: `pageSpeedInsights.rawData`, `adsCreatives[]`, `googlePlaces.reviews[]`

**Why This Pattern?**
- Normalized fields enable fast database queries
- Raw data preserves complete API responses for future use
- Allows for data enrichment without losing original data

---

## Route Handler Data Flow

### Route: `GET /api/serp/business/:profileId`

**Purpose**: Get basic business profile information

**Flow**:
1. Extract `profileId` from URL params
2. Fetch `businessProfile` with `serpResult` relation
3. Extract `rawData.enriched` from `serpResult`
4. If enriched data missing, search for alternative `serpResult`
5. Return combined data

**File**: `server/routes/serp-intelligence.ts` (lines 946-1070)

### Route: `GET /api/serp/business/:profileId/seo-ppc`

**Purpose**: Get SEO & PPC analysis data

**Flow**:
1. Fetch `businessProfile` with `serpResult` relation
2. Extract `rawData.enriched` from `serpResult`
3. If enriched data missing, search for alternative `serpResult` by name/domain
4. Extract all components:
   - Speed scores (from `businessProfile` or `enriched.pageSpeedInsights`)
   - Analytics (from `enriched.analytics` or `onPageData.technologies`)
   - Schemas (from `enriched.schemas` or `onPageData.schemas`)
   - Safe Browsing (from `enriched.safeBrowsing`)
   - Schema Validation (from `enriched.schemaValidation`)
   - Core Web Vitals (from `enriched.pageSpeedInsights.coreWebVitals`)
5. Calculate opportunity score
6. Generate recommendations
7. Return complete analysis

**File**: `server/routes/serp-intelligence.ts` (lines 2140-2600)

### Route: `GET /api/serp/business/:profileId/ads`

**Purpose**: Get advertising/PPC data

**Flow**:
1. Fetch `businessProfile` with `serpResult` relation
2. Extract `rawData.enriched.adsCreatives` from `serpResult`
3. If enriched data missing, search for alternative `serpResult` by name/domain
4. Transform ad creatives for frontend
5. Return ads data

**File**: `server/routes/serp-intelligence.ts` (lines 1500-1800)

### Dynamic Data Search Pattern

**Problem**: Sometimes `businessProfile.serpResultId` points to a `serpResult` without enriched data.

**Solution**: Search for alternative `serpResult` records with enriched data.

**Code Pattern** (used in all routes):
```typescript
// 1. Try linked serpResult
let serpResult = businessProfile.serpResult;
let enriched = (serpResult?.rawData as any)?.enriched || {};

// 2. If no enriched data, search for alternative
if (!enriched || Object.keys(enriched).length === 0) {
  const candidates = await prisma.serpResult.findMany({
    where: {
      OR: [
        { title: { contains: businessProfile.name } },
        { domain: businessProfile.domain }
      ]
    },
    select: { id: true, rawData: true }
  });
  
  for (const candidate of candidates) {
    const candidateEnriched = (candidate.rawData as any)?.enriched || {};
    if (candidateEnriched && Object.keys(candidateEnriched).length > 0) {
      enriched = candidateEnriched;
      break;
    }
  }
}
```

---

## Frontend Data Access

### Component: `BusinessProfilePage.tsx`

**Location**: `client/pages/BusinessProfilePage.tsx`

**Data Fetching Functions**:

1. **`fetchBusinessProfile()`** (lines 150-218)
   - Fetches: Basic business profile
   - Endpoint: `GET /api/serp/business/:profileId`
   - Stores: `profile` state

2. **`fetchBusinessAds()`** (lines 220-249)
   - Fetches: Ads/PPC data
   - Endpoint: `GET /api/serp/business/:profileId/ads`
   - Stores: `adsData` state

3. **`fetchBusinessSEOAndPPC()`** (lines 251-299)
   - Fetches: SEO & PPC analysis
   - Endpoint: `GET /api/serp/business/:profileId/seo-ppc`
   - Stores: `seoPpcData` state

**UI Rendering**:
- **Overview Tab**: Basic business info from `profile`
- **SEO & PPC Tab**: Analysis data from `seoPpcData`
- **Ads Tab**: Ad creatives from `adsData`
- **Reputation Tab**: Reviews from `profile.googlePlaces`

**Data Flow**:
```
User clicks business → 
  fetchBusinessProfile() → 
    Sets profile state → 
      Triggers fetchBusinessAds() and fetchBusinessSEOAndPPC() → 
        Sets adsData and seoPpcData states → 
          UI renders all tabs with data
```

---

## Testing with Multiple Businesses

### Current Configuration

**File**: `scripts/collect-spine-data.ts`
```typescript
const BUSINESS_LIMIT = 1; // Currently set to 1 for SPINE Center
```

### Testing Plan for 5 Businesses

1. **Update Configuration**:
   ```typescript
   const BUSINESS_LIMIT = 5; // Change from 1 to 5
   ```

2. **Run Collection Script**:
   ```bash
   pnpm tsx scripts/collect-spine-data.ts
   ```

3. **Verification Steps**:
   - Verify all 5 businesses are stored in database
   - Check that each business has enriched data
   - Verify speed scores are collected for all
   - Check analytics and schemas for all
   - Verify ads data (if available)
   - Test UI display for all 5 businesses

4. **Expected Results**:
   - 5 `business_profiles` records
   - 5 `serp_results` records with `raw_data.enriched` populated
   - All data components present for each business
   - UI displays data correctly for all businesses

### Verification Script

Create `scripts/verify-5-businesses.ts`:
```typescript
// Verify all 5 businesses have complete data
// Check for: speed scores, analytics, schemas, ads, etc.
```

---

## Data Component Summary Table

| Component | Source API | Storage Location | Route | Frontend Display |
|-----------|-----------|------------------|-------|------------------|
| **Page Speed** | Google PageSpeed Insights, DataForSEO On-Page | `business_profiles.pageSpeed`, `raw_data.enriched.pageSpeedInsights` | `/seo-ppc` | SEO & PPC tab → Technical SEO |
| **Analytics** | HTML Scraping, DataForSEO On-Page | `raw_data.enriched.analytics` | `/seo-ppc` | SEO & PPC tab → Technical SEO |
| **Schemas** | HTML Scraping, DataForSEO On-Page | `raw_data.enriched.schemas` | `/seo-ppc` | SEO & PPC tab → SEO Status |
| **Ads** | DataForSEO Ads API | `raw_data.enriched.adsCreatives`, `business_profiles.isPaid` | `/ads` | Ads tab |
| **Google Places** | Google Places API | `raw_data.enriched.googlePlaces`, `business_profiles.rating` | `/business/:id` | Reputation tab |
| **Safe Browsing** | Google Safe Browsing API | `raw_data.enriched.safeBrowsing` | `/seo-ppc` | SEO & PPC tab → Recommendations |
| **Schema Validation** | Custom Validation | `raw_data.enriched.schemaValidation` | `/seo-ppc` | SEO & PPC tab → Recommendations |
| **Domain Authority** | DataForSEO Domain Rank | `business_profiles.domainAuthority` | `/seo-ppc` | SEO & PPC tab → Metrics |
| **Backlinks** | DataForSEO Backlinks | `business_profiles.backlinks` | `/seo-ppc` | SEO & PPC tab → Recommendations |
| **Traffic** | DataForSEO Traffic Estimation | `business_profiles.monthlyTraffic` | `/seo-ppc` | SEO & PPC tab → Metrics |
| **Keywords** | DataForSEO Ranked Keywords | `keyword_rankings` table, `raw_data.enriched.rankedKeywords` | `/seo-ppc` | SEO & PPC tab → Keyword Rankings |

---

## Next Steps

1. **Update Collection Script**: Change `BUSINESS_LIMIT` from 1 to 5
2. **Run Collection**: Execute `scripts/collect-spine-data.ts`
3. **Verify Data**: Check database for all 5 businesses with complete data
4. **Test UI**: Verify all 5 businesses display correctly in frontend
5. **Document Issues**: Note any missing data or display problems

---

## Appendix: Key Files Reference

- **Collection Script**: `scripts/collect-spine-data.ts`
- **PageSpeed Update**: `scripts/update-pagespeed-data.ts`
- **Analytics/Schemas Update**: `scripts/update-analytics-schemas.ts`
- **Route Handlers**: `server/routes/serp-intelligence.ts`
- **DataForSEO Service**: `server/services/dataforseoService.ts`
- **Frontend Component**: `client/pages/BusinessProfilePage.tsx`
- **Database Schema**: `prisma/schema.prisma`

---

**Last Updated**: 2024-01-15
**Version**: 1.0

