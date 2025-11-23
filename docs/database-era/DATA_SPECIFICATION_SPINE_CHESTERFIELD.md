# Data Specification: "Spine" Search in Chesterfield, MO

## 📋 Executive Summary

This document specifies the exact data to be collected and stored for a focused pre-population scenario:
- **Keyword**: "Spine"
- **Location**: "Chesterfield, MO"
- **Target**: 100 businesses
- **Goal**: Complete business intelligence data for all 100 businesses

**Last Updated**: January 2025  
**Version**: 1.0.0

---

## 🎯 Search Parameters

| Parameter | Value |
|-----------|-------|
| **Keyword** | "Spine" |
| **Location** | "Chesterfield, MO" |
| **Location Code** | 2840 (St. Louis area) |
| **Device** | "desktop" |
| **Language** | "English" |
| **Target Results** | 100 businesses |

---

## 📊 Data Collection Plan

### **Phase 1: Initial Business Discovery**

#### **Step 1.1: Maps API Search**
- **API**: `POST /v3/serp/google/maps/live/advanced`
- **Parameters**:
  ```json
  {
    "keyword": "Spine",
    "location_code": 2840,
    "language_code": "en",
    "device": "desktop"
  }
  ```
- **Expected Results**: ~20-30 businesses
- **Data Collected**: Basic business info, location, ratings

#### **Step 1.2: Local Pack API Search**
- **API**: `POST /v3/serp/google/local_finder/live/advanced`
- **Parameters**:
  ```json
  {
    "keyword": "Spine",
    "location_code": 2840,
    "language_code": "en",
    "device": "desktop",
    "limit": 100
  }
  ```
- **Expected Results**: Up to 100 businesses
- **Data Collected**: Local pack results, rankings

#### **Step 1.3: Business Listings Search**
- **API**: `POST /v3/business_data/business_listings/search/live`
- **Parameters**:
  ```json
  {
    "keyword": "Spine",
    "location_name": "Chesterfield, MO",
    "language_code": "en",
    "limit": 100
  }
  ```
- **Expected Results**: Up to 100 businesses
- **Data Collected**: Business directory listings

**Total Initial Results**: ~100 unique businesses (after deduplication by placeId/cid)

---

### **Phase 2: Business Profile Enrichment (For Each of 100 Businesses)**

For each business discovered, collect the following data:

#### **Step 2.1: Google My Business Info**
- **API**: `POST /v3/business_data/google/my_business_info/live`
- **Parameters** (per business):
  ```json
  {
    "keyword": "[Business Name]",
    "location_name": "Chesterfield, MO",
    "language_code": "en",
    "place_id": "[placeId]" // if available
  }
  ```
- **Data Collected**:
  - Business hours
  - Social media links
  - Services offered
  - Languages spoken
  - Insurance accepted
  - Certifications
  - Awards
  - Email (if available)
  - Description

#### **Step 2.2: Reviews & Ratings**
- **API**: `POST /v3/business_data/google/reviews/task_post`
- **Parameters** (per business):
  ```json
  {
    "keyword": "[Business Name]",
    "location_name": "Chesterfield, MO",
    "language_code": "en",
    "max_reviews_count": 1000
  }
  ```
- **Data Collected**:
  - Average rating
  - Total review count
  - Review distribution (if available)

#### **Step 2.3: Ranked Keywords (If Domain Exists)**
- **API**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`
- **Parameters** (per business with domain):
  ```json
  {
    "target": "[domain]",
    "language_name": "English",
    "location_name": "Chesterfield, MO",
    "limit": 100
  }
  ```
- **Data Collected**:
  - Top 100 keywords the domain ranks for
  - Ranking positions
  - Search volume
  - Competition level
  - CPC
  - Difficulty

#### **Step 2.4: Traffic Estimation (If Domain Exists)**
- **API**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`
- **Parameters** (batch for all domains):
  ```json
  {
    "targets": ["domain1.com", "domain2.com", ...],
    "location_name": "Chesterfield, MO",
    "language_name": "English"
  }
  ```
- **Data Collected**:
  - Monthly organic traffic estimate
  - Monthly paid traffic estimate
  - Keyword count

#### **Step 2.5: On-Page Analysis (If Domain Exists)**
- **API**: `POST /v3/on_page/task_post`
- **Parameters** (per business with domain):
  ```json
  {
    "url": "[websiteUrl]",
    "location_name": "Chesterfield, MO",
    "language_name": "English"
  }
  ```
- **Data Collected**:
  - On-page SEO score
  - Mobile score
  - Accessibility score
  - Core Web Vitals (LCP, FID, CLS, TTI)
  - Page speed score (calculated)

#### **Step 2.6: Backlinks Analysis (If Domain Exists)**
- **API**: `POST /v3/backlinks/bulk_backlinks/live`
- **Parameters** (per business with domain):
  ```json
  {
    "target": "[domain]",
    "limit": 100
  }
  ```
- **Data Collected**:
  - Total backlink count
  - Domain authority (calculated)
  - Referring domains count

#### **Step 2.7: Domain Rank Overview (If Domain Exists)**
- **API**: `POST /v3/dataforseo_labs/google/domain_rank_overview/live`
- **Parameters** (per business with domain):
  ```json
  {
    "target": "[domain]",
    "location_name": "Chesterfield, MO",
    "language_name": "English"
  }
  ```
- **Data Collected**:
  - Domain rank/authority
  - Backlinks count
  - Referring domains

#### **Step 2.8: Ads Search (If Domain Exists)**
- **API**: `POST /v3/serp/google/ads_search/live/advanced`
- **Parameters** (per business with domain):
  ```json
  {
    "target": "[domain]",
    "location_code": 2840,
    "platform": "google_search",
    "depth": 40,
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  }
  ```
- **Data Collected**:
  - Is running ads (boolean)
  - Number of active ads
  - Ad performance data (if available)

#### **Step 2.9: Ads Advertisers Check**
- **API**: `POST /v3/serp/google/ads_advertisers/live/advanced`
- **Parameters** (once for keyword):
  ```json
  {
    "keyword": "Spine",
    "location_code": 2840,
    "language_code": "en"
  }
  ```
- **Data Collected**:
  - List of advertisers for "Spine" keyword
  - Match businesses to advertisers by domain
  - Mark businesses as running ads if matched

---

### **Phase 3: SERP Results Storage**

#### **Step 3.1: Store SERP Job**
- Create `serp_jobs` record:
  ```typescript
  {
    keyword: "Spine",
    location: "Chesterfield, MO",
    searchType: "maps",
    status: "completed",
    resultsCount: 100,
    cost: calculated
  }
  ```

#### **Step 3.2: Store SERP Results**
- Create `serp_results` records for each business:
  - One record per business from Maps API
  - One record per business from Local Pack API
  - Deduplicate by placeId/cid
  - Store complete `rawData` JSON

---

### **Phase 4: Business Profiles Creation**

#### **Step 4.1: Create Business Profiles**
- For each of 100 businesses, create `business_profiles` record with:
  - All data from Phase 2 (enrichment)
  - Link to `serp_results` via `serpResultId`
  - Calculate `seoScore` from collected data
  - Set `lastAnalyzed` timestamp

#### **Step 4.2: Create Keyword Rankings**
- For each business with domain, create `keyword_rankings` records:
  - One record per keyword from Ranked Keywords API
  - Link to `business_profiles` via `businessProfileId`
  - Store ranking data, search volume, competition, etc.

---

## 📋 Complete Data Checklist Per Business

### **Basic Information** ✅
- [ ] Business name
- [ ] Domain
- [ ] Website URL
- [ ] Category
- [ ] Address
- [ ] City
- [ ] State
- [ ] ZIP Code
- [ ] Phone
- [ ] Email (if available)
- [ ] Place ID
- [ ] CID (Google Customer ID)

### **Ratings & Reviews** ✅
- [ ] Average rating
- [ ] Review count
- [ ] Rating max (usually 5)

### **Business Details** ✅
- [ ] Business hours (JSON)
- [ ] Social media links (JSON)
- [ ] Services offered (JSON array)
- [ ] Specialties (JSON array)
- [ ] Insurance accepted (JSON array)
- [ ] Languages spoken (JSON array)
- [ ] Certifications (JSON array)
- [ ] Awards (JSON array)
- [ ] Description

### **SEO Metrics** ✅
- [ ] SEO Score (calculated)
- [ ] Domain Authority
- [ ] Backlinks count
- [ ] Monthly traffic estimate
- [ ] Page speed score
- [ ] Mobile score
- [ ] Accessibility score

### **Keyword Rankings** ✅
- [ ] Top 100 keywords (stored in `keyword_rankings` table)
- [ ] Ranking positions
- [ ] Search volume
- [ ] Competition level
- [ ] CPC
- [ ] Difficulty

### **Advertising** ✅
- [ ] Is running ads (boolean)
- [ ] Number of active ads
- [ ] Advertiser ID (if applicable)

### **Verification** ✅
- [ ] Google verified status
- [ ] Is active flag
- [ ] Last analyzed timestamp

---

## 📊 API Call Breakdown

### **Phase 1: Discovery (3 API calls)**
- Maps API: 1 call
- Local Pack API: 1 call
- Business Listings API: 1 call
- **Total**: 3 calls

### **Phase 2: Enrichment (Per Business)**

For each of 100 businesses:

| API | Calls per Business | Total Calls |
|-----|-------------------|-------------|
| GMB Info | 1 | 100 |
| Reviews | 1 | 100 |
| Ranked Keywords | 1 (if domain) | ~80 (assuming 80% have domains) |
| Traffic Estimation | 1 (batch) | 1 (for all) |
| On-Page Analysis | 1 (if domain) | ~80 |
| Backlinks | 1 (if domain) | ~80 |
| Domain Rank | 1 (if domain) | ~80 |
| Ads Search | 1 (if domain) | ~80 |
| Ads Advertisers | 1 (once) | 1 |

**Total Enrichment Calls**: ~602 calls

### **Total API Calls**
- Discovery: 3 calls
- Enrichment: ~602 calls
- **Grand Total**: ~605 API calls
- **Estimated Cost**: ~$1.21 (at $0.002 per call)
- **Estimated Time**: ~10-15 minutes (with rate limiting)

---

## 🗄️ Database Records Created

### **serp_jobs**
- **Records**: 1
- **Data**: Search job for "Spine" in "Chesterfield, MO"

### **serp_results**
- **Records**: ~100-150 (may have duplicates from different APIs)
- **Data**: Individual search results with complete rawData

### **business_profiles**
- **Records**: 100 (deduplicated)
- **Data**: Complete business intelligence profiles

### **keyword_rankings**
- **Records**: ~8,000 (100 businesses × ~80 keywords average)
- **Data**: Keyword ranking data for each business

### **Total Database Records**: ~8,201 records

---

## 📐 Storage Size Estimate

| Table | Records | Avg Size | Total Size |
|-------|---------|----------|------------|
| `serp_jobs` | 1 | 1 KB | 1 KB |
| `serp_results` | 150 | 3 KB | 450 KB |
| `business_profiles` | 100 | 5 KB | 500 KB |
| `keyword_rankings` | 8,000 | 1 KB | 8 MB |
| **Total** | **8,251** | - | **~9 MB** |

---

## 🔄 Data Collection Workflow

```
Step 1: Discovery
  ├── Maps API → Get ~30 businesses
  ├── Local Pack API → Get ~100 businesses
  └── Business Listings API → Get ~100 businesses
  → Deduplicate → 100 unique businesses

Step 2: For Each Business (100x)
  ├── GMB Info API → Business details
  ├── Reviews API → Ratings
  ├── Ranked Keywords API → SEO keywords (if domain)
  ├── Traffic API → Traffic estimates (batch)
  ├── On-Page API → Technical SEO (if domain)
  ├── Backlinks API → Backlink profile (if domain)
  ├── Domain Rank API → Domain authority (if domain)
  └── Ads Search API → Ad presence (if domain)

Step 3: Ads Advertisers (once)
  └── Get all advertisers for "Spine" keyword
  → Match businesses to advertisers

Step 4: Database Storage
  ├── Create serp_jobs record
  ├── Create serp_results records (150)
  ├── Create business_profiles records (100)
  └── Create keyword_rankings records (~8,000)

Step 5: Calculate Scores
  ├── Calculate SEO scores
  ├── Calculate lead scores
  └── Update business_profiles
```

---

## ⚙️ Implementation Details

### **Deduplication Strategy**

Businesses will be deduplicated by:
1. **Primary**: `placeId` (Google Place ID)
2. **Secondary**: `cid` (Google Customer ID)
3. **Tertiary**: Domain + Address match

### **Error Handling**

- If a business has no domain: Skip domain-related APIs
- If an API fails: Continue with available data
- If a business is not found: Log and skip
- If rate limit reached: Wait and retry

### **Rate Limiting**

- **Limit**: 60 requests per minute
- **Delay**: 1 second between requests
- **Estimated Time**: ~10-15 minutes for all calls

### **Data Validation**

- Validate required fields before storage
- Check for null/undefined values
- Validate JSON structures
- Ensure placeId/cid uniqueness

---

## 📝 Data Quality Requirements

### **Minimum Required Fields**
- Business name
- Address (or city/state minimum)
- Phone or website (at least one)

### **Preferred Fields**
- Domain/website
- Place ID
- Rating
- Category

### **Optional Fields**
- Email
- Social media
- Business hours
- Services

---

## 🎯 Success Criteria

### **Data Collection Success**
- ✅ 100 unique businesses collected
- ✅ All businesses have basic info (name, address, phone)
- ✅ At least 80% have domains
- ✅ All businesses have ratings (if available)
- ✅ All businesses with domains have keyword rankings

### **Data Completeness**
- ✅ 100% have basic information
- ✅ 80%+ have domain/website
- ✅ 100% have ratings (if available on Google)
- ✅ 80%+ have keyword rankings (if domain exists)
- ✅ 80%+ have SEO metrics (if domain exists)

### **Performance**
- ✅ All API calls complete successfully
- ✅ No rate limit violations
- ✅ Data stored correctly in database
- ✅ All relationships properly linked

---

## 🚀 Execution Plan

### **Pre-Execution Checklist**
- [ ] DataForSEO API credentials configured
- [ ] Database backup created
- [ ] Rate limiting configured
- [ ] Error handling tested
- [ ] Storage space verified (~9 MB needed)

### **Execution Steps**

1. **Discovery Phase** (2 minutes)
   - Run Maps API
   - Run Local Pack API
   - Run Business Listings API
   - Deduplicate results

2. **Enrichment Phase** (10-12 minutes)
   - For each business, run enrichment APIs
   - Batch process where possible
   - Handle errors gracefully

3. **Storage Phase** (2-3 minutes)
   - Create serp_jobs record
   - Create serp_results records
   - Create business_profiles records
   - Create keyword_rankings records

4. **Validation Phase** (1 minute)
   - Verify data completeness
   - Check relationships
   - Validate required fields

**Total Estimated Time**: 15-18 minutes

---

## 📊 Expected Results

### **Database Records**
- 1 `serp_jobs` record
- ~150 `serp_results` records
- 100 `business_profiles` records
- ~8,000 `keyword_rankings` records

### **Data Completeness**
- 100% businesses with basic info
- 80%+ businesses with complete profiles
- 80%+ businesses with keyword rankings
- 80%+ businesses with SEO metrics

### **Performance**
- All data available locally
- Response time: <100ms (from database)
- No API calls needed for cached data

---

## 🔍 Post-Collection Validation

### **Data Quality Checks**
- [ ] All 100 businesses have names
- [ ] All businesses have addresses
- [ ] At least 80 businesses have domains
- [ ] All businesses with domains have keyword rankings
- [ ] All relationships properly linked
- [ ] No duplicate businesses (by placeId)

### **API Call Verification**
- [ ] Total API calls: ~605
- [ ] No rate limit errors
- [ ] All API calls successful
- [ ] Error rate < 5%

### **Database Verification**
- [ ] All records inserted successfully
- [ ] Foreign keys properly set
- [ ] Indexes created
- [ ] Data integrity maintained

---

## 📞 Next Steps

Once this specification is approved:

1. Create data collection script
2. Create database seeding script
3. Test with 5 businesses first
4. Execute full collection (100 businesses)
5. Validate results
6. Document any issues or adjustments

---

**Status**: ⏳ Awaiting Approval  
**Ready to Proceed**: Yes  
**Estimated Execution Time**: 15-18 minutes  
**Estimated Cost**: ~$1.21

