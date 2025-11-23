# Live API vs Database-Only Mode Comparison

## 📋 Overview

This document compares how business profile data is calculated in **Live API Mode** (original implementation) vs **Database-Only Mode** (current implementation). This comparison helps identify differences and plan a hybrid approach.

---

## 📊 Comparison Table

| Business Profile Data Field | Live API Method | Database-Only Method |
|----------------------------|-----------------|---------------------|
| **Basic Information** |
| `name` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].title`<br>**Code**: `server/routes/serp-intelligence.ts:384-388`<br>**Service**: `dataForSEOService.searchMaps()` | **Source**: Database<br>**Table**: `business_profiles.name`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: `prisma.businessProfile.findUnique()`<br>**Fallback**: `serp_results.title` from `rawData` |
| `domain` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].domain`<br>**Code**: `server/routes/serp-intelligence.ts:384-388`<br>**Extraction**: Direct from API response | **Source**: Database<br>**Table**: `business_profiles.domain`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: Direct field access<br>**Fallback**: Extracted from `websiteUrl` |
| `websiteUrl` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].url`<br>**Code**: `server/routes/serp-intelligence.ts:384-388` | **Source**: Database<br>**Table**: `business_profiles.websiteUrl`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: Direct field access |
| `phone` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].phone`<br>**Code**: `server/routes/serp-intelligence.ts:384-388` | **Source**: Database<br>**Table**: `business_profiles.phone`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: Direct field access |
| `address`, `city`, `state`, `zipCode` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].address`<br>**Path**: `tasks[0].result[0].items[].address_info.city/region/postal_code`<br>**Code**: `server/routes/serp-intelligence.ts:384-388` | **Source**: Database<br>**Table**: `business_profiles.address`, `city`, `state`, `zipCode`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: Direct field access |
| `rating`, `reviewsCount` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].rating.value`<br>**Path**: `tasks[0].result[0].items[].rating.votes_count`<br>**Code**: `server/routes/serp-intelligence.ts:384-388` | **Source**: Database<br>**Table**: `business_profiles.rating`, `reviewsCount`<br>**Code**: `server/routes/serp-intelligence.ts:1023-1043`<br>**Query**: Direct field access<br>**Fallback**: `serp_results.rawData.rating` |
| **SEO & Performance Metrics** |
| `pageSpeed` (Desktop) | **Source**: On-Page API (async)<br>**API**: `POST /v3/on_page/task_post` → `GET /v3/on_page/pages`<br>**Path**: `tasks[0].result[0].items[0].desktop_score`<br>**Code**: `server/services/dataforseoService.ts:getOnPageAnalysis()`<br>**Calculation**: Direct from API response<br>**Fallback**: Calculated from `page_timing` (LCP, FID, CLS, TTI) | **Source**: Database (multiple sources)<br>**Priority 1**: `business_profiles.pageSpeed`<br>**Priority 2**: `rawData.enriched.pageSpeedInsights.performance`<br>**Priority 3**: `rawData.enriched.onPageResults.desktop_score`<br>**Priority 4**: Calculated from `onPageResults.page_timing`<br>**Code**: `server/routes/serp-intelligence.ts:2495-2577`<br>**Query**: `prisma.businessProfile.findUnique()` + dynamic search for enriched data |
| `mobileScore` | **Source**: On-Page API (async)<br>**API**: `POST /v3/on_page/task_post` → `GET /v3/on_page/pages`<br>**Path**: `tasks[0].result[0].items[0].mobile_score`<br>**Code**: `server/services/dataforseoService.ts:getOnPageAnalysis()`<br>**Calculation**: Direct from API response<br>**Fallback**: Calculated from `mobile_page_timing` | **Source**: Database (multiple sources)<br>**Priority 1**: `business_profiles.mobileScore`<br>**Priority 2**: `rawData.enriched.pageSpeedInsights.mobile`<br>**Priority 3**: `rawData.enriched.onPageResults.mobile_score`<br>**Priority 4**: Calculated from `onPageResults.mobile_page_timing`<br>**Code**: `server/routes/serp-intelligence.ts:2579-2605`<br>**Query**: Same as desktop, with mobile-specific fallbacks |
| `accessibilityScore` | **Source**: On-Page API (async)<br>**API**: `POST /v3/on_page/task_post` → `GET /v3/on_page/pages`<br>**Path**: `tasks[0].result[0].items[0].accessibility_score`<br>**Code**: `server/services/dataforseoService.ts:getOnPageAnalysis()` | **Source**: Database<br>**Priority 1**: `business_profiles.accessibilityScore`<br>**Priority 2**: `rawData.enriched.pageSpeedInsights.accessibility`<br>**Priority 3**: `rawData.enriched.onPageResults.accessibility_score`<br>**Code**: `server/routes/serp-intelligence.ts:2529-2537`<br>**Query**: Same dynamic search pattern |
| `domainAuthority` | **Source**: Domain Rank API<br>**API**: `POST /v3/dataforseo_labs/google/domain_rank/live`<br>**Path**: `tasks[0].result[0].items[0].metrics.organic.etv`<br>**Code**: `server/services/dataforseoService.ts:getDomainAnalysis()`<br>**Calculation**: `min(40, (etv/10000)*40)` - scales 0-10k ETV to 0-40 points | **Source**: Database<br>**Table**: `business_profiles.domainAuthority`<br>**Code**: `server/routes/serp-intelligence.ts:1054`<br>**Query**: Direct field access<br>**Stored During**: Collection script calculates and stores during `collect-spine-data.ts` |
| `backlinks` | **Source**: Backlinks API<br>**API**: `POST /v3/backlinks/summary/live`<br>**Path**: `tasks[0].result[0].items[0].backlinks`<br>**Code**: `server/services/dataforseoService.ts:getBacklinkAnalysis()`<br>**Note**: Requires subscription | **Source**: Database<br>**Table**: `business_profiles.backlinks`<br>**Code**: `server/routes/serp-intelligence.ts:1055`<br>**Query**: Direct field access<br>**Stored During**: Collection script stores from `enriched.backlinks` |
| `monthlyTraffic` | **Source**: Traffic Estimation API<br>**API**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`<br>**Path**: `tasks[0].result[0].items[0].metrics.organic.etv`<br>**Code**: `server/services/dataforseoService.ts:getBulkTrafficEstimation()` | **Source**: Database<br>**Table**: `business_profiles.monthlyTraffic`<br>**Code**: `server/routes/serp-intelligence.ts:1056`<br>**Query**: Direct field access<br>**Stored During**: Collection script stores from `enriched.traffic` |
| `seoScore` | **Source**: Calculated from multiple APIs<br>**Calculation**: `calculateSEOScore()` function<br>**Inputs**: domainAuthority, backlinks, monthlyTraffic, pageSpeed, mobileScore, accessibilityScore<br>**Code**: `server/services/dataforseoService.ts:calculateSEOScore()`<br>**Formula**: Weighted combination of all metrics (0-100) | **Source**: Database<br>**Table**: `business_profiles.seoScore`<br>**Code**: `server/routes/serp-intelligence.ts:1057`<br>**Query**: Direct field access<br>**Stored During**: Collection script calculates and stores during `collect-spine-data.ts:1119-1171` |
| **Analytics & Tracking** |
| `analytics.googleAnalytics.found` | **Source**: HTML Analysis<br>**Method**: HTTP GET to domain + regex parsing<br>**Code**: `server/services/dataforseoService.ts:detectAnalyticsInHTML()`<br>**Patterns**: `gtag('config', 'G-XXXXX')`, `ga('create', 'UA-XXXXX')`, `gtag.js`, `analytics.js`<br>**Live Call**: Made on-demand when profile is accessed | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.analytics.googleAnalytics.found`<br>**Code**: `server/routes/serp-intelligence.ts:2609-2634`<br>**Query**: Dynamic search for `serpResult` with enriched data<br>**Extraction**: `storedAnalytics.googleAnalytics.found === true`<br>**Fallback**: Check `onPageData.technologies` array |
| `analytics.googleAnalytics.type` | **Source**: HTML Analysis<br>**Method**: Regex pattern matching<br>**Code**: `server/services/dataforseoService.ts:detectAnalyticsInHTML()`<br>**Types**: "GA4", "UA", "gtag" | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.analytics.googleAnalytics.type`<br>**Code**: `server/routes/serp-intelligence.ts:2622`<br>**Query**: `storedAnalytics.googleAnalytics.type`<br>**Fallback**: Infer from `gaId` (if starts with "G-" then "GA4") |
| `analytics.googleAnalytics.id` | **Source**: HTML Analysis<br>**Method**: Regex extraction<br>**Code**: `server/services/dataforseoService.ts:detectAnalyticsInHTML()`<br>**Pattern**: `G-([^'"]+)` or `UA-([^'"]+)` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.analytics.googleAnalytics.id`<br>**Code**: `server/routes/serp-intelligence.ts:2618-2621`<br>**Query**: `storedAnalytics.googleAnalytics.id`<br>**Fallback**: Extract from `onPageData.technologies` array |
| `analytics.facebookPixel.found` | **Source**: HTML Analysis<br>**Method**: HTTP GET + regex parsing<br>**Code**: `server/services/dataforseoService.ts:detectAnalyticsInHTML()`<br>**Patterns**: `fbq('init', 'PIXEL_ID')`, `_fbp`, `fbevents.js` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.analytics.facebookPixel.found`<br>**Code**: `server/routes/serp-intelligence.ts:2623-2628`<br>**Query**: `storedAnalytics.facebookPixel.found === true`<br>**Fallback**: Check `onPageData.technologies` array |
| **Schema Markup** |
| `schemas.localBusiness` | **Source**: HTML Analysis<br>**Method**: HTTP GET + JSON-LD parsing<br>**Code**: `server/services/dataforseoService.ts:detectSchemasInHTML()`<br>**Pattern**: Check for `@type: "LocalBusiness"` in JSON-LD scripts | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.schemas.localBusiness`<br>**Code**: `server/routes/serp-intelligence.ts:2637-2644`<br>**Query**: `storedSchemas.localBusiness`<br>**Fallback**: Check `onPageData.schemas` array for `@type: "LocalBusiness"` |
| `schemas.faq` | **Source**: HTML Analysis<br>**Method**: JSON-LD parsing<br>**Code**: `server/services/dataforseoService.ts:detectSchemasInHTML()`<br>**Pattern**: Check for `@type: "FAQPage"` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.schemas.faq`<br>**Code**: `server/routes/serp-intelligence.ts:2639`<br>**Query**: `storedSchemas.faq`<br>**Fallback**: Check `onPageData.schemas` array |
| `schemas.organization` | **Source**: HTML Analysis<br>**Method**: JSON-LD parsing<br>**Code**: `server/services/dataforseoService.ts:detectSchemasInHTML()`<br>**Pattern**: Check for `@type: "Organization"` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.schemas.organization`<br>**Code**: `server/routes/serp-intelligence.ts:2640`<br>**Query**: `storedSchemas.organization`<br>**Fallback**: Check `onPageData.schemas` array |
| `schemas.breadcrumbs` | **Source**: HTML Analysis<br>**Method**: JSON-LD parsing<br>**Code**: `server/services/dataforseoService.ts:detectSchemasInHTML()`<br>**Pattern**: Check for `@type: "BreadcrumbList"` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.schemas.breadcrumbs`<br>**Code**: `server/routes/serp-intelligence.ts:2641`<br>**Query**: `storedSchemas.breadcrumbs`<br>**Fallback**: Check `onPageData.schemas` array |
| **PPC & Advertising** |
| `isPaid` / `ppcStatus.runningAds` | **Source**: Ads Advertisers API<br>**API**: `POST /v3/serp/google/ads_advertisers/live/advanced`<br>**Path**: Match business domain to advertiser domains<br>**Code**: `server/routes/serp-intelligence.ts:486-550`<br>**Calculation**: `domain matches advertiser.domain` → `isPaid = true`<br>**Live Call**: Made during search results enrichment | **Source**: Database<br>**Table**: `business_profiles.isPaid`<br>**Code**: `server/routes/serp-intelligence.ts:2671`<br>**Query**: Direct field access<br>**Fallback**: `rawData.ads.matched` or `enriched.adsCreatives.length > 0`<br>**Stored During**: Collection script matches during `checkAdsAdvertisers()` |
| `ppcStatus.adCount` | **Source**: Ads Advertisers API<br>**API**: `POST /v3/serp/google/ads_advertisers/live/advanced`<br>**Path**: `advertiser.approx_ads_count`<br>**Code**: `server/routes/serp-intelligence.ts:549` | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.adsCreativesCount`<br>**Code**: `server/routes/serp-intelligence.ts:2673`<br>**Query**: `enriched.adsCreativesCount` or `enriched.adsCreatives.length`<br>**Fallback**: `rawData.ads.approxAdsCount` |
| `ppcStatus.creativesCount` | **Source**: Ads Search API<br>**API**: `POST /v3/serp/google/ads_search/live/advanced`<br>**Path**: `tasks[0].result[0].items[]` (array length)<br>**Code**: `server/services/dataforseoService.ts:getAdsForDomain()`<br>**Live Call**: Made on-demand when ads tab is accessed | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.adsCreatives` (array length)<br>**Code**: `server/routes/serp-intelligence.ts:1830-1950`<br>**Query**: Dynamic search for `serpResult` with `enriched.adsCreatives`<br>**Extraction**: `enriched.adsCreatives.length` |
| `ads` (creatives array) | **Source**: Ads Search API<br>**API**: `POST /v3/serp/google/ads_search/live/advanced`<br>**Path**: `tasks[0].result[0].items[]`<br>**Code**: `server/routes/serp-intelligence.ts:getBusinessAds()`<br>**Live Call**: Made on-demand when ads tab is accessed<br>**Transformation**: Maps API response to ad objects with title, description, URL, preview image | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.adsCreatives`<br>**Code**: `server/routes/serp-intelligence.ts:1830-1950`<br>**Query**: Dynamic search for `serpResult` with enriched ads data<br>**Transformation**: Maps stored creatives to ad objects<br>**Fallback**: Search by domain + name + placeId/cid to find correct `serpResult` |
| **Keyword Rankings** |
| `keywordRankings[]` | **Source**: Ranked Keywords API<br>**API**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`<br>**Path**: `tasks[0].result[0].items[]`<br>**Code**: `server/services/dataforseoService.ts:getRankedKeywords()`<br>**Live Call**: Made on-demand when keyword rankings are needed | **Source**: Database<br>**Table**: `keyword_rankings` (related to `business_profiles`)<br>**Code**: `server/routes/serp-intelligence.ts:1053`<br>**Query**: `prisma.businessProfile.findUnique({ include: { keywordRankings } })`<br>**Stored During**: Collection script stores up to 100 keywords per business |
| `serpPosition` | **Source**: Maps/Local Pack API<br>**API**: `POST /v3/serp/google/maps/live/advanced`<br>**Path**: `tasks[0].result[0].items[].rank_absolute`<br>**Code**: `server/routes/serp-intelligence.ts:384-388` | **Source**: Database<br>**Table**: `serp_results.rankAbsolute`<br>**Code**: `server/routes/serp-intelligence.ts:2656`<br>**Query**: `serpResult.rankAbsolute` |
| **Additional Data** |
| `googlePlaces` (reviews) | **Source**: Google Places API<br>**API**: `GET https://maps.googleapis.com/maps/api/place/details/json`<br>**Code**: `scripts/add-google-places.js`<br>**Live Call**: Made on-demand (if integrated) | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.googlePlaces`<br>**Code**: `server/routes/serp-intelligence.ts:1064-1067`<br>**Query**: `enriched.googlePlaces`<br>**Stored During**: Collection script calls Google Places API |
| `safeBrowsing` | **Source**: Google Safe Browsing API<br>**API**: `POST https://safebrowsing.googleapis.com/v4/threatMatches:find`<br>**Code**: `scripts/add-safe-browsing.js`<br>**Live Call**: Made on-demand (if integrated) | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.safeBrowsing`<br>**Code**: `server/routes/serp-intelligence.ts:2688`<br>**Query**: `enriched.safeBrowsing`<br>**Stored During**: Collection script calls Safe Browsing API |
| `schemaValidation` | **Source**: Custom Validation<br>**Method**: HTML parsing + JSON-LD validation<br>**Code**: `scripts/add-schema-validation.js`<br>**Live Call**: Made on-demand (if integrated) | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.schemaValidation`<br>**Code**: `server/routes/serp-intelligence.ts:2689`<br>**Query**: `enriched.schemaValidation`<br>**Stored During**: Collection script validates schemas during HTML analysis |
| `coreWebVitals` | **Source**: PageSpeed Insights API<br>**API**: `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`<br>**Path**: `lighthouseResult.audits`<br>**Code**: `scripts/add-pagespeed-insights.js`<br>**Extraction**: LCP, FID, CLS, TTI, FCP from audits | **Source**: Database<br>**Table**: `serp_results.rawData.enriched.pageSpeedInsights.coreWebVitals`<br>**Code**: `server/routes/serp-intelligence.ts:2691-2720`<br>**Query**: `enriched.pageSpeedInsights.coreWebVitals`<br>**Fallback**: Extract from `pageSpeedInsights.rawData.desktop.lighthouseResult.audits` |
| `opportunityScore` | **Source**: Calculated from multiple metrics<br>**Code**: `server/routes/serp-intelligence.ts:calculateOpportunityScore()`<br>**Inputs**: SERP position, schemas, analytics, speed scores, PPC status, safe browsing, schema validation<br>**Formula**: Weighted scoring (0-100) | **Source**: Database (calculated on-the-fly)<br>**Code**: `server/routes/serp-intelligence.ts:2719-2776`<br>**Calculation**: Same formula, but uses stored data instead of live API calls<br>**Inputs**: All from database (serpPosition, schemas, analytics, speedScores, ppcStatus, etc.) |

---

## 🔄 Key Differences

### **1. Data Source**
- **Live API**: All data fetched on-demand from external APIs
- **Database-Only**: All data pre-fetched and stored during collection script

### **2. Performance**
- **Live API**: Slower (multiple API calls, async tasks, rate limiting)
- **Database-Only**: Fast (single database query, instant response)

### **3. Data Freshness**
- **Live API**: Always current (real-time data)
- **Database-Only**: Stale (data from collection time)

### **4. Cost**
- **Live API**: Pay per request (~$0.002-0.04 per API call)
- **Database-Only**: One-time collection cost, then free

### **5. Error Handling**
- **Live API**: Must handle API failures, rate limits, timeouts
- **Database-Only**: Must handle missing data, search for alternative `serpResult` records

### **6. Matching Logic**
- **Live API**: Direct API response mapping
- **Database-Only**: Dynamic search for `serpResult` with enriched data using domain + name + placeId/cid

---

## 🔗 Code References

### **Live API Methods** (Commented Out)
- Search: `server/routes/serp-intelligence.ts:359-550` (commented)
- SEO & PPC: Would call `dataForSEOService.getSEOAndPPCAnalysis()` (not in current codebase)
- Ads: Would call `dataForSEOService.getAdsForDomain()` on-demand

### **Database-Only Methods** (Current)
- Search: `server/routes/serp-intelligence.ts:135-357`
- Business Profile: `server/routes/serp-intelligence.ts:951-1216`
- SEO & PPC: `server/routes/serp-intelligence.ts:2089-2829`
- Ads: `server/routes/serp-intelligence.ts:1586-2051`
- Comprehensive Score: `server/routes/serp-intelligence.ts:1426-1482`

### **Service Methods** (Used by Both)
- DataForSEO Service: `server/services/dataforseoService.ts`
- Analytics Detection: `scripts/collect-spine-data.ts:118-184` (same logic used in both)
- Schema Detection: `scripts/collect-spine-data.ts:49-113` (same logic used in both)

---

## 💡 Hybrid Approach Considerations

### **Fields Suitable for Database-Only**
- Basic info (name, address, phone) - rarely changes
- Historical data (keyword rankings, backlinks) - snapshot in time
- Calculated scores (SEO score, domain authority) - can be recalculated

### **Fields Suitable for Live API**
- Real-time ads data - changes frequently
- Current SERP position - changes daily
- Fresh reviews - new reviews added regularly

### **Fields Suitable for Hybrid**
- Speed scores - can use cached data, refresh monthly
- Analytics detection - can use cached data, refresh on-demand
- Schema validation - can use cached data, refresh when website changes

---

## 📝 Notes

1. **Dynamic Search Logic**: Database-only mode includes sophisticated search logic to find `serpResult` records with enriched data, even if the initially linked record doesn't have it. This is crucial for data integrity.

2. **Fallback Chains**: Database-only mode uses multiple fallback sources (businessProfile → pageSpeedInsights → onPageResults → calculated from timing) to ensure data is always available.

3. **Data Staleness**: Database-only mode trades freshness for speed. Consider refresh strategies for time-sensitive data.

4. **Cost Optimization**: Database-only mode eliminates ongoing API costs but requires upfront collection investment.

5. **Error Resilience**: Database-only mode is more resilient to API failures but requires careful data validation during collection.

