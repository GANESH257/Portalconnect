# Data Pre-Population & Caching Strategy

## 📋 Executive Summary

This document outlines a strategy to pre-populate the database with cached API data to reduce API response times and costs. The approach involves downloading and storing limited datasets from DataForSEO APIs for common use cases.

**Goal**: Reduce API response time from 2-5 seconds to <100ms by serving cached data for common queries.

**Last Updated**: January 2025  
**Version**: 1.0.0

---

## 🎯 Objectives

1. **Reduce API Response Time**: Serve cached data for common queries
2. **Lower API Costs**: Minimize DataForSEO API calls for frequently accessed data
3. **Improve User Experience**: Faster page loads and search results
4. **Maintain Data Freshness**: Balance between cached and fresh data

---

## 📊 Tables Analysis & Pre-Population Strategy

### **Tables That CAN Be Pre-Populated**

| Table | Pre-Populate? | Reason | Data Source | Estimated Size |
|-------|---------------|--------|-------------|----------------|
| `serp_results` | ✅ **YES** | Common searches can be cached | Maps API, Local Pack API | ~10,000 records |
| `business_profiles` | ✅ **YES** | Common businesses in Missouri | Multiple APIs | ~5,000 records |
| `keyword_rankings` | ⚠️ **LIMITED** | Rankings change frequently | Ranked Keywords API | ~1,000 records |
| `serp_jobs` | ❌ **NO** | User-specific, runtime generated | N/A | N/A |

### **Tables That CANNOT Be Pre-Populated**

| Table | Reason |
|-------|--------|
| `users` | User-generated data |
| `sessions` | Runtime authentication data |
| `email_verifications` | Runtime verification tokens |
| `watchlist_items` | User-specific data |
| `prospect_items` | User-specific sales pipeline data |
| `competitor_analysis` | Depends on user selections |

---

## 🗂️ Pre-Population Data Strategy

### **1. Business Profiles (`business_profiles`)**

**Target**: Pre-populate 5,000 common Missouri businesses

**Data Sources**:
- Google Maps API (primary)
- Google My Business Info API (enrichment)
- Reviews API (ratings)
- Domain Rank API (authority)

**Categories to Focus**:
- Healthcare (Dental, Medical, Chiropractic)
- Professional Services
- Retail
- Restaurants

**Geographic Focus**: Missouri (St. Louis, Kansas City, Springfield, Columbia)

**Data Limits**:
- Max 5,000 businesses
- Top 100 businesses per major city
- Top 50 businesses per category

**Fields to Pre-Populate**:
```typescript
{
  name, domain, websiteUrl, category, address, city, state, zipCode,
  phone, rating, reviewsCount, placeId, cid,
  businessHours, socialMedia, services, specialties,
  seoScore, domainAuthority, backlinks, monthlyTraffic,
  pageSpeed, mobileScore, accessibilityScore
}
```

---

### **2. SERP Results (`serp_results`)**

**Target**: Pre-populate 10,000 common search results

**Data Sources**:
- Maps API
- Local Pack API
- Organic Search API

**Common Search Keywords**:
- "dental clinic [city]"
- "medical practice [city]"
- "chiropractor [city]"
- "lawyer [city]"
- "restaurant [city]"

**Geographic Focus**: Missouri cities

**Data Limits**:
- 20 results per keyword × 50 keywords = 1,000 results
- Top 3 pages per search (60 results max)
- Focus on first page results (rank 1-20)

**Fields to Pre-Populate**:
```typescript
{
  rankAbsolute, resultType, title, url, domain, phone, address,
  city, state, zipCode, rating, reviewsCount, placeId, cid,
  rawData (complete API response)
}
```

---

### **3. Keyword Rankings (`keyword_rankings`)**

**Target**: Pre-populate 1,000 keyword rankings for top domains

**Data Sources**:
- Ranked Keywords API

**Focus**:
- Top 100 domains in Missouri
- 10 keywords per domain
- Common industry keywords

**Data Limits**:
- 100 domains × 10 keywords = 1,000 rankings
- Update frequency: Weekly (rankings change)

**Fields to Pre-Populate**:
```typescript
{
  keyword, rankAbsolute, searchVolume, competition, cpc, difficulty,
  url, title, trackedAt
}
```

---

## 📐 Data Size Estimates

### **Storage Requirements**

| Table | Records | Avg Size/Record | Total Size |
|-------|---------|-----------------|------------|
| `business_profiles` | 5,000 | ~5 KB | ~25 MB |
| `serp_results` | 10,000 | ~3 KB | ~30 MB |
| `keyword_rankings` | 1,000 | ~1 KB | ~1 MB |
| **Total** | **16,000** | - | **~56 MB** |

**Note**: JSON fields (`rawData`, `businessHours`, etc.) contribute significantly to size.

---

## 🔄 Caching Strategy

### **Cache-First Approach**

```
User Request
    ↓
Check Local Database Cache
    ↓
    ├── Cache Hit? → Return Cached Data (<100ms)
    │
    └── Cache Miss? → Call DataForSEO API (2-5s)
                      → Store in Database
                      → Return Data
```

### **Cache Invalidation Strategy**

1. **Time-Based Expiration**:
   - `business_profiles`: 30 days
   - `serp_results`: 7 days
   - `keyword_rankings`: 7 days

2. **Manual Refresh**: Users can trigger refresh for specific records

3. **Selective Updates**: Only update changed fields, not entire records

---

## 🛠️ Implementation Steps

### **Phase 1: Setup & Planning** ✅

1. ✅ Analyze tables and data sources
2. ✅ Document strategy (this document)
3. ⏳ Get approval for approach

### **Phase 2: Data Collection Script**

**Step 1: Create Data Collection Script**
- File: `scripts/prepopulate-data.ts`
- Purpose: Fetch data from DataForSEO APIs
- Features:
  - Rate limiting (60 req/min)
  - Error handling
  - Progress tracking
  - Data validation

**Step 2: Define Seed Data Configuration**
- File: `scripts/seed-config.json`
- Contains:
  - Keywords to search
  - Cities to target
  - Categories to focus
  - Limits per category

**Step 3: Create Database Seeding Script**
- File: `scripts/seed-database.ts`
- Purpose: Insert pre-fetched data into database
- Features:
  - Batch inserts
  - Duplicate detection
  - Transaction handling

### **Phase 3: API Data Fetching**

**Step 4: Fetch Business Listings**
- Use Maps API for each city + category combination
- Store in temporary JSON files
- Estimated API calls: ~500 calls

**Step 5: Enrich Business Profiles**
- For each business, call:
  - GMB Info API
  - Reviews API
  - Domain Rank API (if domain exists)
- Estimated API calls: ~5,000 calls

**Step 6: Fetch SERP Results**
- Use Maps + Local Pack APIs for common keywords
- Store results with rawData
- Estimated API calls: ~100 calls

**Step 7: Fetch Keyword Rankings**
- For top 100 domains, fetch ranked keywords
- Estimated API calls: ~100 calls

**Total Estimated API Calls**: ~5,700 calls
**Estimated Cost**: ~$11.40 (at $0.002 per call)
**Estimated Time**: ~2-3 hours (with rate limiting)

### **Phase 4: Database Seeding**

**Step 8: Insert Business Profiles**
- Batch insert 5,000 records
- Handle duplicates (by placeId/cid)
- Set `isActive = true` and `lastAnalyzed` timestamp

**Step 9: Insert SERP Results**
- Create corresponding `serp_jobs` records
- Insert `serp_results` linked to jobs
- Store complete `rawData` for reference

**Step 10: Insert Keyword Rankings**
- Link to `business_profiles` by domain
- Set `trackedAt` timestamp

### **Phase 5: Cache Logic Implementation**

**Step 11: Update API Service Layer**
- Modify `dataforseoService.ts` to check cache first
- Add cache lookup functions
- Implement cache refresh logic

**Step 12: Add Cache Flags**
- Add `isCached` flag to responses
- Add `cacheExpiry` timestamp
- Add `lastRefreshed` timestamp

**Step 13: Create Cache Refresh Endpoint**
- Admin endpoint to refresh specific records
- Background job to refresh expired records

### **Phase 6: Testing & Validation**

**Step 14: Test Cache Hits**
- Verify cached data is returned correctly
- Test response times (<100ms target)

**Step 15: Test Cache Misses**
- Verify API calls when cache misses
- Test data storage after API calls

**Step 16: Performance Testing**
- Compare response times (cached vs. API)
- Monitor database query performance
- Test with concurrent users

---

## 📝 Detailed Implementation Plan

### **File Structure**

```
scripts/
├── prepopulate-data.ts          # Main data collection script
├── seed-config.json             # Configuration for seed data
├── seed-database.ts             # Database seeding script
├── fetch-businesses.ts          # Fetch business listings
├── enrich-profiles.ts           # Enrich business profiles
├── fetch-serp-results.ts        # Fetch SERP results
├── fetch-keywords.ts            # Fetch keyword rankings
└── utils/
    ├── rate-limiter.ts          # API rate limiting
    ├── data-validator.ts        # Data validation
    └── progress-tracker.ts      # Progress tracking

server/
├── services/
│   ├── dataforseoService.ts     # Updated with cache logic
│   └── cacheService.ts          # New cache service
└── routes/
    └── admin.ts                 # Admin endpoints for cache management
```

---

## 🔧 Technical Implementation Details

### **1. Data Collection Script Structure**

```typescript
// scripts/prepopulate-data.ts
import { dataForSEOService } from '../server/services/dataforseoService';
import { prisma } from '../server/lib/prisma';
import seedConfig from './seed-config.json';

interface SeedConfig {
  keywords: string[];
  cities: string[];
  categories: string[];
  limits: {
    businessesPerCity: number;
    businessesPerCategory: number;
    serpResultsPerKeyword: number;
  };
}

async function prepopulateData() {
  console.log('🚀 Starting data pre-population...');
  
  // Step 1: Fetch business listings
  const businesses = await fetchBusinessListings(seedConfig);
  
  // Step 2: Enrich business profiles
  const enrichedBusinesses = await enrichBusinessProfiles(businesses);
  
  // Step 3: Fetch SERP results
  const serpResults = await fetchSERPResults(seedConfig);
  
  // Step 4: Fetch keyword rankings
  const keywordRankings = await fetchKeywordRankings(enrichedBusinesses);
  
  // Step 5: Seed database
  await seedDatabase({
    businesses: enrichedBusinesses,
    serpResults,
    keywordRankings
  });
  
  console.log('✅ Data pre-population complete!');
}
```

### **2. Cache Service Implementation**

```typescript
// server/services/cacheService.ts
export class CacheService {
  async getBusinessProfile(domain: string, city: string, state: string) {
    // Check cache first
    const cached = await prisma.businessProfile.findFirst({
      where: {
        domain,
        city,
        state,
        isActive: true,
        lastAnalyzed: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      }
    });
    
    if (cached) {
      return { data: cached, isCached: true };
    }
    
    // Cache miss - fetch from API
    return { data: null, isCached: false };
  }
  
  async getSERPResults(keyword: string, location: string) {
    // Check cache
    const cachedJob = await prisma.serpJob.findFirst({
      where: {
        keyword,
        location,
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      },
      include: {
        serpResults: {
          take: 100,
          orderBy: { rankAbsolute: 'asc' }
        }
      }
    });
    
    if (cachedJob && cachedJob.serpResults.length > 0) {
      return { data: cachedJob, isCached: true };
    }
    
    return { data: null, isCached: false };
  }
}
```

### **3. Updated DataForSEO Service**

```typescript
// server/services/dataforseoService.ts (updated)
import { CacheService } from './cacheService';

const cacheService = new CacheService();

async searchMaps(params: {
  keyword: string;
  location: string;
  device?: string;
}) {
  // Check cache first
  const cached = await cacheService.getSERPResults(
    params.keyword,
    params.location
  );
  
  if (cached.isCached) {
    console.log('✅ Cache hit for:', params.keyword, params.location);
    return {
      data: cached.data,
      isCached: true,
      responseTime: '<100ms'
    };
  }
  
  // Cache miss - call API
  console.log('❌ Cache miss - calling API for:', params.keyword);
  const startTime = Date.now();
  const apiResponse = await this.callMapsAPI(params);
  const responseTime = Date.now() - startTime;
  
  // Store in cache
  await this.storeInCache(apiResponse, params);
  
  return {
    data: apiResponse,
    isCached: false,
    responseTime: `${responseTime}ms`
  };
}
```

---

## 📊 Configuration File

### **`scripts/seed-config.json`**

```json
{
  "keywords": [
    "dental clinic",
    "medical practice",
    "chiropractor",
    "lawyer",
    "restaurant",
    "plumber",
    "electrician",
    "accountant",
    "real estate agent",
    "insurance agent"
  ],
  "cities": [
    "St. Louis, MO",
    "Kansas City, MO",
    "Springfield, MO",
    "Columbia, MO",
    "Jefferson City, MO",
    "Chesterfield, MO",
    "O'Fallon, MO",
    "St. Charles, MO",
    "Independence, MO",
    "Lee's Summit, MO"
  ],
  "categories": [
    "Healthcare",
    "Professional Services",
    "Retail",
    "Food & Dining",
    "Home Services"
  ],
  "limits": {
    "businessesPerCity": 100,
    "businessesPerCategory": 50,
    "serpResultsPerKeyword": 20,
    "keywordRankingsPerDomain": 10,
    "totalBusinesses": 5000,
    "totalSERPResults": 10000,
    "totalKeywordRankings": 1000
  },
  "apiRateLimit": {
    "requestsPerMinute": 60,
    "requestsPerDay": 1000,
    "delayBetweenRequests": 1000
  }
}
```

---

## ⚠️ Limitations & Considerations

### **1. Data Freshness**
- Cached data may be up to 30 days old
- Some data (rankings, reviews) changes frequently
- Solution: Implement refresh triggers for critical data

### **2. Storage Size**
- Initial: ~56 MB
- Growth: ~10 MB per month (if refreshing)
- Solution: Implement data cleanup for old records

### **3. API Costs**
- Initial population: ~$11.40
- Monthly refresh: ~$5-10
- Solution: Selective refresh (only changed records)

### **4. Geographic Limitations**
- Focused on Missouri only
- May not cover all user searches
- Solution: Expand based on usage patterns

### **5. Cache Invalidation**
- Need to handle stale data
- Solution: Time-based expiration + manual refresh

---

## 🚀 Execution Plan

### **Pre-Execution Checklist**

- [ ] Review and approve strategy
- [ ] Set up development environment
- [ ] Configure DataForSEO API credentials
- [ ] Set up database backup
- [ ] Allocate time for data collection (2-3 hours)
- [ ] Monitor API rate limits

### **Execution Steps**

1. **Create Scripts** (1-2 hours)
   - Data collection scripts
   - Database seeding scripts
   - Configuration files

2. **Test with Small Dataset** (30 minutes)
   - Test with 10 businesses
   - Verify data structure
   - Test cache logic

3. **Full Data Collection** (2-3 hours)
   - Run full data collection
   - Monitor API calls
   - Handle errors

4. **Database Seeding** (30 minutes)
   - Insert all collected data
   - Verify data integrity
   - Create indexes if needed

5. **Cache Logic Implementation** (2-3 hours)
   - Update API service
   - Implement cache service
   - Add cache refresh logic

6. **Testing** (1-2 hours)
   - Test cache hits
   - Test cache misses
   - Performance testing

**Total Estimated Time**: 7-11 hours

---

## 📈 Expected Results

### **Performance Improvements**

| Metric | Before (API) | After (Cache) | Improvement |
|--------|--------------|---------------|-------------|
| Response Time | 2-5 seconds | <100ms | **20-50x faster** |
| API Calls | Every request | Only on cache miss | **~80% reduction** |
| User Experience | Slow loading | Instant results | **Significantly better** |
| API Costs | $0.002 per call | Reduced by ~80% | **Cost savings** |

### **Cache Hit Rate Expectations**

- **Common Searches**: 70-80% cache hit rate
- **Business Profiles**: 60-70% cache hit rate
- **Keyword Rankings**: 40-50% cache hit rate (changes frequently)

---

## 🔍 Monitoring & Maintenance

### **Metrics to Track**

1. Cache hit rate
2. Average response time
3. API call frequency
4. Database size growth
5. Data freshness (age of cached records)

### **Maintenance Tasks**

1. **Weekly**: Refresh keyword rankings
2. **Monthly**: Refresh business profiles
3. **Quarterly**: Expand seed data based on usage
4. **As Needed**: Manual refresh for specific records

---

## ✅ Approval Checklist

Before proceeding, please confirm:

- [ ] Strategy approved
- [ ] API costs acceptable (~$11.40 initial + ~$5-10/month)
- [ ] Storage size acceptable (~56 MB initial)
- [ ] Time allocation approved (7-11 hours)
- [ ] Data freshness requirements understood
- [ ] Geographic limitations acceptable (Missouri focus)

---

## 📞 Next Steps

Once approved, I will:

1. Create all necessary scripts
2. Implement cache service
3. Update API service layer
4. Create seed data configuration
5. Test with small dataset
6. Execute full data collection
7. Document results

---

**Status**: ⏳ Awaiting Approval  
**Ready to Proceed**: Yes  
**Estimated Start Time**: Upon approval

