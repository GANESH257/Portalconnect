# Complete Data Collection Documentation - collect-spine-data.ts

## 📋 Overview

This document provides comprehensive documentation for the data collection script (`scripts/collect-spine-data.ts`) that collects complete business intelligence data for businesses found when searching for a specific keyword in a location.

**Script Purpose**: Pre-populate database with comprehensive business data including SEO, PPC, ads, GMB info, reviews, keywords, traffic, on-page analysis, backlinks, domain rank, analytics, schemas, and HTML content.

**Usage**:
```bash
pnpm tsx scripts/collect-spine-data.ts [--limit=5]
```

---

## 🔄 Data Collection Flow

The script follows a **3-phase approach**:

### **Phase 1: Discovery** (Finding Businesses)
- Calls multiple DataForSEO APIs to discover businesses
- Combines results from Maps, Local Pack, and Business Listings APIs
- Deduplicates businesses by domain/placeId/cid
- Limits to specified number of businesses

### **Phase 2: Enrichment** (Collecting Detailed Data)
- For each business, collects comprehensive data from multiple APIs
- Includes: GMB Info, Reviews, Keywords, Traffic, Ads, On-Page, Backlinks, Domain Rank
- Fetches HTML for analytics and schema detection
- Integrates Google APIs (PageSpeed Insights, Places, Safe Browsing)
- Validates schemas

### **Phase 3: Storage** (Saving to Database)
- Creates SERP Job record
- Creates SerpResult records with enriched data
- Creates BusinessProfile records with calculated scores
- Stores KeywordRanking records

---

## 📊 Phase 1: Discovery

### **Step 1.1: Maps API**
**Purpose**: Find businesses from Google Maps search results

**API**: `POST /v3/serp/google/maps/live/advanced`  
**Service Method**: `dataForSEOService.getMapsResults()`  
**Parameters**:
- `keyword`: Search keyword (e.g., "Spine")
- `location`: Location string (e.g., "Chesterfield, MO")
- `language`: "English"
- `device`: "desktop"

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Business name, address, phone, rating, reviews
- Domain, URL, placeId, cid
- Rank position, coordinates

**Storage**: Results stored in `businesses[]` array for Phase 2

---

### **Step 1.2: Local Pack API**
**Purpose**: Find businesses from Google Local Pack (3-pack) results

**API**: `POST /v3/serp/google/local_finder/live/advanced`  
**Service Method**: `dataForSEOService.getLocalPackResults()`  
**Parameters**: Same as Maps API

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**: Similar to Maps API

**Storage**: Results merged into `businesses[]` array

---

### **Step 1.3: Business Listings API**
**Purpose**: Find businesses from DataForSEO Business Listings database

**API**: `POST /v3/business_data/business_listings/search/live`  
**Service Method**: `dataForSEOService.getBusinessListings()`  
**Parameters**:
- `keyword`: Search keyword
- `location_name`: Location string
- `language_code`: "en"
- `limit`: 100

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**: Business listings with contact info, categories, etc.

**Storage**: Results merged into `businesses[]` array

---

### **Step 1.4: Deduplication**
**Purpose**: Remove duplicate businesses

**Logic**:
- Groups by `placeId` (if available)
- Falls back to `cid` (if available)
- Falls back to domain + name combination
- Keeps first occurrence

**Result**: Unique list of businesses for enrichment

---

## 🔧 Phase 2: Enrichment

For each business, the script collects data in the following order:

### **Step 2.1: GMB Info**
**Purpose**: Get detailed Google My Business information

**API**: `POST /v3/business_data/google/my_business_info/live`  
**Service Method**: `dataForSEOService.getGoogleMyBusinessInfo()`  
**Parameters**:
- `businessName`: Business name
- `location`: Location string
- `placeId`: Google Place ID (if available)
- `cid`: Google Customer ID (if available)

**Response Path**: `tasks[0].result[0].items[0]`  
**Data Extracted**:
- Business hours, services, categories
- Email, website, social media
- Insurance accepted, languages, certifications
- Address details, coordinates

**Storage**: `enriched.gmbInfo`

---

### **Step 2.2: Reviews**
**Purpose**: Get Google reviews for the business

**API**: `POST /v3/business_data/google/reviews/task_post` (async)  
**Service Method**: `dataForSEOService.getBusinessReviews()`  
**Parameters**:
- `businessName`: Business name
- `location`: Location string
- `language_code`: "en"
- `max_reviews_count`: 1000

**Response Path**: `tasks[0].result[0].items[]` (after polling)  
**Data Extracted**:
- Review text, rating, author
- Review date, helpful votes

**Storage**: `enriched.reviews`

**Note**: This is an async task - script polls for completion

---

### **Step 2.3: Ranked Keywords**
**Purpose**: Get keywords the business ranks for

**API**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`  
**Service Method**: `dataForSEOService.getRankedKeywords()`  
**Parameters**:
- `target`: Domain (e.g., "onlinespinecare.com")
- `location_code`: Location code (from CSV lookup)
- `language_name`: "English"
- `limit`: 100

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Keyword, rank position
- Search volume, competition, CPC
- URL ranking for keyword

**Storage**: `enriched.rankedKeywords`

---

### **Step 2.4: Traffic Estimation**
**Purpose**: Get estimated monthly organic traffic

**API**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`  
**Service Method**: `dataForSEOService.getBulkTrafficEstimation()`  
**Parameters**:
- `targets`: Array of domains
- `location_code`: Location code
- `language_name`: "English"

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Monthly traffic estimate
- Traffic cost estimate
- Top keywords driving traffic

**Storage**: `enriched.traffic`

---

### **Step 2.5: Ads Creatives**
**Purpose**: Get ad creatives the business is running

**API**: `POST /v3/serp/google/ads_search/live/advanced`  
**Service Method**: `dataForSEOService.getAdsForDomain()`  
**Parameters**:
- `keyword`: Search keyword
- `location_code`: Location code (e.g., 2840 for Missouri)
- `domain`: Business domain
- `language`: "English"

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Ad title, description, URL
- Ad preview image
- Ad platform (Google, Bing, etc.)
- Ad position, dates

**Storage**: `enriched.adsCreatives`, `enriched.adsCreativesCount`

---

### **Step 2.6: On-Page Analysis**
**Purpose**: Get on-page SEO analysis

**API**: `POST /v3/on_page/task_post` (async) → `GET /v3/on_page/pages`  
**Service Method**: `dataForSEOService.getOnPageAnalysis()`  
**Parameters**:
- `url`: Full business URL (e.g., "https://onlinespinecare.com")
- `enable_javascript`: true
- `enable_browser_rendering`: true

**Response Path**: `tasks[0].result[0].items[0]` (after polling)  
**Data Extracted**:
- Page speed scores (desktop, mobile)
- Accessibility score
- Page timing (LCP, FID, CLS, TTI, FCP)
- Technologies detected
- Meta tags, headings structure

**Storage**: `enriched.onPageResults`, `enriched.onPage`

**Note**: This is an async task - script polls with retries (up to 3 attempts, 10s wait)

---

### **Step 2.7: Google Places API**
**Purpose**: Get Google Places reviews and ratings

**API**: Google Places API (via `add-google-places.js`)  
**Service Method**: External script integration  
**Parameters**:
- `placeId`: Google Place ID
- `apiKey`: `GOOGLE_PLACES_API_KEY`

**Response Path**: Direct API response  
**Data Extracted**:
- Rating, review count
- Review text (if available)

**Storage**: `enriched.googlePlaces`

---

### **Step 2.8: Google Safe Browsing API**
**Purpose**: Check if domain is safe (malware, phishing)

**API**: Google Safe Browsing API (via `add-safe-browsing.js`)  
**Service Method**: External script integration  
**Parameters**:
- `domain`: Business domain
- `apiKey`: `GOOGLE_SAFEBROWSING_API_KEY`

**Response Path**: Direct API response  
**Data Extracted**:
- Safety status
- Threat types (if unsafe)

**Storage**: `enriched.safeBrowsing`

---

### **Step 2.9: Google PageSpeed Insights**
**Purpose**: Get page speed scores and Core Web Vitals

**API**: Google PageSpeed Insights API (via `add-pagespeed-insights.js`)  
**Service Method**: External script integration  
**Parameters**:
- `url`: Full business URL
- `apiKey`: `GOOGLE_PAGESPEED_API_KEY`
- `category`: ["performance", "accessibility", "seo", "best-practices"]

**Response Path**: Direct API response  
**Data Extracted**:
- Performance score (desktop, mobile)
- Accessibility score
- SEO score
- Best Practices score
- Core Web Vitals (LCP, FID, CLS, TTI, FCP)
- Opportunities and diagnostics

**Storage**: `enriched.pageSpeedInsights`

---

### **Step 2.10: HTML Fetch & Analysis**
**Purpose**: Fetch HTML to detect analytics and schemas

**Method**: Direct HTTP GET request (via `axios.get`)  
**URL**: `https://{domain}` or `http://{domain}`  
**Headers**: Browser-like headers to avoid bot detection  
**Timeout**: 30 seconds

**Data Extracted**:

#### **Analytics Detection** (`detectAnalyticsInHTML()`)
- **Google Analytics**:
  - GA4: `gtag('config', 'G-XXXXX')`
  - Universal Analytics: `ga('create', 'UA-XXXXX')`
  - gtag.js presence
  - analytics.js presence
- **Facebook Pixel**:
  - `fbq('init', 'PIXEL_ID')`
  - `_fbp` cookie
  - fbevents.js presence

**Storage**: `enriched.analytics`

#### **Schema Detection** (`detectSchemasInHTML()`)
- Parses JSON-LD scripts
- Detects schema types:
  - LocalBusiness
  - FAQPage
  - Organization
  - BreadcrumbList
  - Product
  - Review

**Storage**: `enriched.schemas`, `enriched.htmlContent`

---

### **Step 2.11: Schema Validation**
**Purpose**: Validate detected schemas

**Method**: Custom validation (via `add-schema-validation.js`)  
**Logic**: Validates JSON-LD structure, required fields, data types

**Storage**: `enriched.schemaValidation`

---

### **Step 2.12: Backlinks**
**Purpose**: Get backlink analysis

**API**: `POST /v3/backlinks/summary/live`  
**Service Method**: `dataForSEOService.getBacklinkAnalysis()`  
**Parameters**:
- `target`: Domain
- `limit`: 100

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Backlink count
- Referring domains
- Backlink types (dofollow, nofollow)
- Domain authority metrics

**Storage**: `enriched.backlinks`

**Note**: Requires DataForSEO Backlinks subscription

---

### **Step 2.13: Domain Rank**
**Purpose**: Get domain authority and ranking metrics

**API**: `POST /v3/dataforseo_labs/google/domain_rank/live`  
**Service Method**: `dataForSEOService.getDomainAnalysis()`  
**Parameters**:
- `targets`: Array of domains
- `location_code`: Location code
- `language_name`: "English"

**Response Path**: `tasks[0].result[0].items[0]`  
**Data Extracted**:
- Domain rank score
- ETV (Estimated Traffic Value)
- Keyword count
- Position distribution (pos_1, pos_2_3, pos_4_10)

**Storage**: `enriched.domainRank`

---

### **Step 2.14: Ads Advertisers Check**
**Purpose**: Match businesses to advertisers (runs after all businesses enriched)

**API**: `POST /v3/serp/google/ads_advertisers/live/advanced`  
**Service Method**: `dataForSEOService.getAdsAdvertisers()`  
**Parameters**:
- `keyword`: Search keyword
- `locationName`: Location string (NOT locationCode)

**Response Path**: `tasks[0].result[0].items[]`  
**Data Extracted**:
- Advertiser domains
- Approximate ad count
- Advertiser ID

**Logic**: Matches business domains to advertiser domains, sets `business.isPaid = true` if match found

**Storage**: `business.ads`, `business.isPaid`

---

## 💾 Phase 3: Storage

### **Step 3.1: Create SERP Job**
**Purpose**: Create parent job record

**Table**: `serp_jobs`  
**Fields**:
- `keyword`: Search keyword
- `location`: Location string
- `userId`: System user ID
- `status`: "completed"
- `searchType`: "maps"

**Storage**: Creates `serpJob` record

---

### **Step 3.2: Create SerpResult**
**Purpose**: Store raw business data with enriched fields

**Table**: `serp_results`  
**Fields**:
- `serpJobId`: Reference to serp_jobs.id
- `rankAbsolute`: Business rank
- `title`: Business name
- `domain`: Extracted domain
- `placeId`: Google Place ID
- `cid`: Google Customer ID
- `rawData`: Complete data including `enriched` object

**Enriched Object Structure** (`rawData.enriched`):
```json
{
  "gmbInfo": {...},
  "reviews": {...},
  "rankedKeywords": [...],
  "traffic": {...},
  "onPageResults": {...},
  "backlinks": {...},
  "domainRank": {...},
  "analytics": {
    "googleAnalytics": {"found": true/false, "type": "GA4"/"UA", "id": "..."},
    "facebookPixel": {"found": true/false, "id": "..."}
  },
  "schemas": {
    "localBusiness": true/false,
    "faq": true/false,
    "organization": true/false,
    "breadcrumbs": true/false,
    "product": true/false,
    "review": true/false
  },
  "htmlContent": "...",
  "ads": {...},
  "adsCreatives": [...],
  "adsCreativesCount": 19,
  "pageSpeedInsights": {...},
  "googlePlaces": {...},
  "safeBrowsing": {...},
  "schemaValidation": {...}
}
```

**Storage**: Creates `serpResult` record

---

### **Step 3.3: Create BusinessProfile**
**Purpose**: Store normalized business profile with calculated scores

**Table**: `business_profiles`  
**Fields**:
- `serpResultId`: Reference to serp_results.id
- `name`: Business name
- `domain`: Business domain
- `websiteUrl`: Full website URL
- `placeId`, `cid`: Google identifiers
- `address`, `city`, `state`, `zipCode`: Location
- `phone`, `email`: Contact info
- `rating`, `reviewsCount`: Review data
- `isPaid`: Whether running ads
- `pageSpeed`, `mobileScore`, `accessibilityScore`: Speed scores
- `domainAuthority`: Calculated from domainRank.ETV
- `backlinks`: Backlink count
- `monthlyTraffic`: Traffic estimate
- `seoScore`: Calculated SEO score (0-100)

**Score Calculations**:
- `domainAuthority`: Scaled from ETV (0-10k ETV → 0-40 points)
- `seoScore`: Calculated from domainAuthority, traffic, backlinks, speed scores

**Storage**: Creates `businessProfile` record

---

### **Step 3.4: Create KeywordRankings**
**Purpose**: Store keyword ranking data

**Table**: `keyword_rankings`  
**Fields**:
- `businessProfileId`: Reference to business_profiles.id
- `keyword`: Keyword text
- `rankAbsolute`: Rank position
- `url`: Ranking URL
- `searchVolume`: Monthly search volume
- `competition`: Competition level
- `cpc`: Cost per click

**Storage**: Creates multiple `keywordRanking` records (up to 100 per business)

---

## 🔄 Data Flow Summary

```
Phase 1: Discovery
  Maps API → businesses[]
  Local Pack API → businesses[]
  Business Listings API → businesses[]
  Deduplication → unique businesses[]

Phase 2: Enrichment (for each business)
  GMB Info API → enriched.gmbInfo
  Reviews API → enriched.reviews
  Ranked Keywords API → enriched.rankedKeywords
  Traffic Estimation API → enriched.traffic
  Ads Creatives API → enriched.adsCreatives
  On-Page API → enriched.onPageResults
  Google Places API → enriched.googlePlaces
  Safe Browsing API → enriched.safeBrowsing
  PageSpeed Insights API → enriched.pageSpeedInsights
  HTML Fetch → enriched.analytics, enriched.schemas
  Schema Validation → enriched.schemaValidation
  Backlinks API → enriched.backlinks
  Domain Rank API → enriched.domainRank
  Ads Advertisers API → business.ads, business.isPaid

Phase 3: Storage
  Create serp_jobs → serpJob
  Create serp_results (with rawData.enriched) → serpResult
  Create business_profiles (with calculated scores) → businessProfile
  Create keyword_rankings → keywordRanking[]
```

---

## ⚙️ Configuration

**Environment Variables Required**:
- `DATAFORSEO_LOGIN`: DataForSEO API login
- `DATAFORSEO_PASSWORD`: DataForSEO API password
- `GOOGLE_PAGESPEED_API_KEY`: Google PageSpeed Insights API key
- `GOOGLE_PLACES_API_KEY`: Google Places API key
- `GOOGLE_SAFEBROWSING_API_KEY`: Google Safe Browsing API key

**Script Configuration**:
- `KEYWORD`: Search keyword (default: "Spine")
- `LOCATION`: Location string (default: "Chesterfield, MO")
- `BUSINESS_LIMIT`: Number of businesses to process (default: 5)

---

## 📊 Statistics Tracking

The script tracks:
- `apiCalls`: Total API calls made
- `businessesFound`: Total businesses discovered
- `businessesProcessed`: Businesses enriched
- `businessesStored`: Businesses saved to database
- `errors`: Error count
- `startTime`: Script start timestamp

---

## 🚨 Error Handling

- **API Failures**: Logged but don't stop collection (graceful degradation)
- **Missing Data**: Default values set (null, false, empty arrays)
- **Rate Limiting**: Built-in delays between API calls
- **HTML Fetch Failures**: 403/404 handled gracefully, defaults set
- **Async Task Failures**: Retry logic with timeouts

---

## 📝 Notes

1. **Location Code Lookup**: Script uses `missouri_locations_transformed.csv` to convert location strings to DataForSEO location codes
2. **Domain Extraction**: Uses `extractDomain()` helper to normalize domains
3. **Data Merging**: Enriched data is merged back into business object before storage
4. **Verification**: After storage, script verifies `enriched` data was stored correctly
5. **Cost Tracking**: Estimated API costs tracked in statistics

