# Hybrid Model Complete Documentation

## 🎯 Overview

The Hybrid Model is the current implementation that combines **Database (Static Data)** with **Live API (Dynamic Data)** to optimize performance, cost, and data freshness.

### Core Principle

- **Database**: Fast, cached, static data that rarely changes (business info, historical metrics)
- **Live API**: Current, real-time data that changes frequently (ads, reviews, SEO metrics)
- **Hybrid**: Best of both worlds - fast initial load from database, fresh data on-demand from APIs

---

## 📊 Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    INITIAL LOAD (Database)                  │
├─────────────────────────────────────────────────────────────┤
│  1. User searches for prospects                            │
│  2. Query serp_jobs + serp_results + business_profiles     │
│  3. Return basic business data (<500ms)                     │
│  4. Flag: needsLiveData: ['seo-ppc', 'ads', 'reputation']   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ON-DEMAND LOAD (Live API)                      │
├─────────────────────────────────────────────────────────────┤
│  User clicks tab → Fetch live data:                        │
│  - SEO & PPC Tab: On-Page, PageSpeed, HTML Analysis         │
│  - Ads Tab: Ads Search, Ads Advertisers                     │
│  - Reputation Tab: Google Places, Reviews API                │
└─────────────────────────────────────────────────────────────┘
```

### Route Categories

#### 1. **Database-Only Routes** (Fast, No Cost)
- `POST /api/serp/search-prospects` - Search businesses
- `GET /api/serp/business/:profileId` - Basic profile
- `POST /api/serp/comprehensive-score` - Score from database
- `GET /api/serp/watchlist` - Watchlist items
- `GET /api/serp/prospects` - Prospect items

**Characteristics:**
- Response time: <500ms
- Cost: $0
- Data freshness: From collection time
- Use case: Initial display, list views

#### 2. **Live API Routes** (Current, On-Demand)
- `GET /api/serp/business/:profileId/seo-ppc` - SEO & PPC analysis
- `GET /api/serp/business/:profileId/ads` - Ads data
- `GET /api/serp/business/:profileId/reputation` - Reputation data
- `POST /api/serp/analyze-website` - Website analysis
- `POST /api/serp/onpage-analysis` - On-page analysis

**Characteristics:**
- Response time: 2-15 seconds
- Cost: $0.002-0.025 per request
- Data freshness: Real-time
- Use case: Detailed analysis, current metrics

#### 3. **Hybrid Routes** (Database + Live API)
- `POST /api/serp/domain-analysis` - Domain rank (cached + live)
- `POST /api/serp/backlink-analysis` - Backlinks (cached + live)
- `POST /api/serp/ranked-keywords` - Keywords (cached + live)

**Characteristics:**
- Response time: <500ms (if cached) or 2-5s (if live)
- Cost: $0 (if cached) or $0.002-0.003 (if live)
- Data freshness: Cached with refresh option
- Use case: Historical data with refresh capability

---

## 🔄 Data Collection Strategy

### Phase 1: Discovery (Database Collection)
**Purpose**: Find businesses and collect basic info

**APIs Used:**
- Maps API → Basic business listings
- Local Pack API → Local pack results
- Business Listings API → Directory listings

**Data Stored:**
- `serp_jobs` - Search job metadata
- `serp_results` - Business listings with basic info
- `business_profiles` - Business profiles with calculated scores

**Collection Time**: ~5-10 seconds per 100 businesses
**Collection Cost**: ~$0.03-0.05 per 100 businesses

### Phase 2: Basic Enrichment (Database Collection)
**Purpose**: Add essential business details

**APIs Used:**
- GMB Info API → Business details (services, specialties)

**Data Stored:**
- `business_profiles` - Enhanced with GMB data
- `serp_results.rawData.enriched.gmbInfo` - Full GMB response

**Collection Time**: ~2-3 seconds per business
**Collection Cost**: ~$0.002 per business

### Phase 3: Live Data (On-Demand)
**Purpose**: Fetch current, dynamic data when needed

**APIs Used (On-Demand):**
- On-Page Analysis API → SEO metrics
- PageSpeed Insights API → Performance scores
- HTML Analysis → Analytics & Schemas
- Safe Browsing API → Security check
- Ads Search API → Ad creatives
- Ads Advertisers API → PPC status
- Google Places API → Reviews
- DataForSEO Reviews API → Review data

**Data NOT Stored**: Fetched fresh on each request

**Request Time**: 2-15 seconds per request
**Request Cost**: $0.002-0.025 per request

---

## 📋 Route Endpoint Reference

### Search & Discovery

#### `POST /api/serp/search-prospects`
**Data Source**: Database  
**Response Time**: <500ms  
**Cost**: $0

**Request:**
```json
{
  "keyword": "spine care",
  "location": "Chesterfield, MO",
  "device": "desktop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "...",
    "businesses": [...],
    "isFromDatabase": true
  },
  "needsLiveData": ["seo-ppc", "ads", "reputation"]
}
```

**Data Fields:**
- Basic business info (name, domain, address, phone)
- Rating, reviewsCount
- Calculated scores (seoScore, domainAuthority)
- Flag: `isRunningAds` (from database)

---

### Business Profile

#### `GET /api/serp/business/:profileId`
**Data Source**: Database  
**Response Time**: <100ms  
**Cost**: $0

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "domain": "...",
    "rating": 4.5,
    "reviewsCount": 123,
    "keywordRankings": [...],
    "isFromDatabase": true
  },
  "needsLiveData": ["seo-ppc", "ads", "reputation"]
}
```

**Data Fields:**
- Complete business profile from database
- Keyword rankings (top 100)
- Calculated metrics (seoScore, domainAuthority, etc.)
- Flag indicating which tabs need live data

---

### SEO & PPC Analysis

#### `GET /api/serp/business/:profileId/seo-ppc`
**Data Source**: Live API  
**Response Time**: 5-15 seconds  
**Cost**: $0.015-0.025

**APIs Called:**
1. On-Page Analysis API
2. PageSpeed Insights API
3. HTML Analysis (fetch + detect)
4. Safe Browsing API
5. Ads Advertisers API
6. Ads Search API

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "schemas": {...},
    "analytics": {...},
    "speedScores": {...},
    "ppcStatus": {...},
    "opportunityScore": 75,
    "recommendations": [...]
  }
}
```

**Data Fields:**
- Schema detection (localBusiness, faq, organization, etc.)
- Analytics detection (Google Analytics, Facebook Pixel)
- Speed scores (desktop, mobile, accessibility)
- PPC status (runningAds, adCount)
- Opportunity score (0-100)
- AI-generated recommendations

---

### Ads Data

#### `GET /api/serp/business/:profileId/ads`
**Data Source**: Live API  
**Response Time**: 2-5 seconds  
**Cost**: $0.002-0.004

**APIs Called:**
1. Ads Search API (get ads for domain)
2. Ads Advertisers API (check if running ads)

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "ads": [...],
    "isRunningAds": true,
    "totalAds": 15,
    "creativesCount": 15
  }
}
```

**Data Fields:**
- Array of ad creatives (title, description, URL, preview image)
- Advertiser ID
- Total ads count
- Is running ads flag

---

### Reputation Data

#### `GET /api/serp/business/:profileId/reputation`
**Data Source**: Live API  
**Response Time**: 3-8 seconds  
**Cost**: $0.003-0.006

**APIs Called:**
1. Google Places API (get place details + reviews)
2. DataForSEO Reviews API (get additional reviews)

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "rating": 4.5,
    "totalRatings": 123,
    "reviews": [...],
    "responseRate": 85,
    "reviewVelocity": 12,
    "serviceIssues": [...]
  }
}
```

**Data Fields:**
- Average rating
- Total ratings count
- Array of reviews (text, rating, time, author)
- Response rate (% of reviews with responses)
- Review velocity (reviews in last 90 days)
- Common service issues (from negative reviews)

---

## 💰 Cost Analysis

### Database Collection (One-Time)
- **Discovery**: ~$0.03-0.05 per 100 businesses
- **Basic Enrichment**: ~$0.20 per 100 businesses (GMB Info)
- **Total**: ~$0.23-0.25 per 100 businesses

### Live API Requests (Per User Session)
- **Search Prospects**: $0 (database)
- **Business Profile**: $0 (database)
- **SEO & PPC Tab**: $0.015-0.025 (live API)
- **Ads Tab**: $0.002-0.004 (live API)
- **Reputation Tab**: $0.003-0.006 (live API)
- **Total per session**: ~$0.02-0.035

### Cost Comparison

| Mode | Initial Collection | Per Session | 100 Sessions |
|------|-------------------|-------------|--------------|
| **Live API Only** | $0 | $0.05-0.10 | $5-10 |
| **Database Only** | $0.23-0.25 | $0 | $0.23-0.25 |
| **Hybrid Model** | $0.23-0.25 | $0.02-0.035 | $2.23-3.75 |

**Savings**: Hybrid model saves ~60-70% compared to Live API Only

---

## ⚡ Performance Characteristics

### Response Times

| Route | Database Mode | Live API Mode | Hybrid Model |
|-------|--------------|---------------|--------------|
| Search Prospects | <500ms | 6-8s | <500ms ✅ |
| Business Profile | <100ms | 10-15s | <100ms ✅ |
| SEO & PPC | N/A | 15-20s | 5-15s ✅ |
| Ads | N/A | 2-3s | 2-5s ✅ |
| Reputation | N/A | 3-5s | 3-8s ✅ |

**Key Insight**: Hybrid model provides fast initial load (<500ms) with on-demand fresh data (2-15s)

---

## 🎯 When to Use Database vs Live API

### Use Database For:
- ✅ Basic business information (name, address, phone)
- ✅ Historical data (keyword rankings snapshot)
- ✅ Calculated scores (SEO score, domain authority)
- ✅ Initial display (Prospect Finder cards)
- ✅ List views (watchlist, prospects)

### Use Live API For:
- ✅ Current ads data (changes frequently)
- ✅ Fresh reviews (new reviews added regularly)
- ✅ Real-time SEO metrics (speed scores, schemas)
- ✅ Latest ad creatives (ads change daily)
- ✅ Detailed analysis (when user clicks tab)

### Use Hybrid For:
- ✅ Domain authority (cached with refresh option)
- ✅ Backlinks (cached with refresh option)
- ✅ Keyword rankings (cached with refresh option)
- ✅ Speed scores (can cache, refresh monthly)

---

## 🔧 Implementation Details

### Frontend Implementation

**BusinessProfilePage.tsx:**
```typescript
// Initial load: Database only
useEffect(() => {
  fetchBusinessProfile(profileId); // Database query
}, [profileId]);

// Tab click: Fetch live data
const handleTabClick = (tab: string) => {
  if (tab === 'seo-ppc' && !seoPpcData) {
    fetchSEOAndPPC(profileId); // Live API
  }
  if (tab === 'ads' && !adsData) {
    fetchAds(profileId); // Live API
  }
  if (tab === 'reputation' && !reputationData) {
    fetchReputation(profileId); // Live API
  }
};
```

### Backend Implementation

**Route Handler Pattern:**
```typescript
// Database route
export const getBusinessProfile = async (req, res) => {
  const profile = await prisma.businessProfile.findUnique(...);
  res.json({
    data: profile,
    needsLiveData: ['seo-ppc', 'ads', 'reputation']
  });
};

// Live API route
export const getBusinessSEOAndPPC = async (req, res) => {
  // Fetch from multiple APIs in parallel
  const [onPage, pageSpeed, html, safeBrowsing, ads] = await Promise.all([
    getOnPageAnalysis(...),
    getPageSpeedInsights(...),
    fetchHTML(...),
    checkSafeBrowsing(...),
    getAdsData(...)
  ]);
  // Combine and return
  res.json({ data: {...}, isFromLiveAPI: true });
};
```

---

## 📊 Data Field Mapping

See `data/HYBRID_MODEL_DATA_FIELD_MAPPING.csv` for complete mapping of:
- Every data field
- Its source (Database table/field OR API endpoint)
- Route endpoint that serves it
- Update frequency
- Caching strategy

---

## 🚀 Best Practices

### 1. **Lazy Loading**
- Load database data immediately
- Fetch live data only when user clicks tab
- Show loading states during API calls

### 2. **Error Handling**
- Database errors: Show cached data or fallback
- API errors: Show error message, allow retry
- Partial failures: Return available data with error flags

### 3. **Caching Strategy**
- Database: Persistent storage (until next collection)
- Live API: No caching (always fresh)
- Future: Add Redis cache for frequently accessed live data

### 4. **Cost Optimization**
- Collect only essential data during collection phase
- Use live APIs only for dynamic data
- Batch API calls where possible (parallel requests)

---

## 📝 Related Documentation

- **Route Endpoint Mapping**: `data/HYBRID_MODEL_ROUTE_ENDPOINT_MAPPING.csv`
- **Data Field Mapping**: `data/HYBRID_MODEL_DATA_FIELD_MAPPING.csv`
- **Decision Matrix**: `docs/current/HYBRID_MODEL_DECISION_MATRIX.md`
- **Route Reference**: `docs/current/HYBRID_MODEL_ROUTE_REFERENCE.md`
- **Verification**: `docs/current/HYBRID_MODEL_VERIFICATION.md`

---

**Last Updated**: January 2025  
**Status**: Complete Implementation  
**Version**: 1.0

