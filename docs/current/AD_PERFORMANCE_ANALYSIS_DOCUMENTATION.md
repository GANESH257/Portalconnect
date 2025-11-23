# Ad Performance Analysis System Documentation

## Overview
This system provides comprehensive ad performance analysis for business profiles using DataForSEO APIs. It implements the exact workflow and scoring formula you specified for analyzing paid advertising performance.

## DataForSEO APIs Used

### 1. Business Listings Search
- **Endpoint**: `POST /v3/business_data/business_listings/search/live`
- **Purpose**: Get business domain and basic information
- **Parameters**:
  ```json
  {
    "keyword": "business_name",
    "location_name": "location",
    "language_code": "en",
    "limit": 100
  }
  ```

### 2. Google My Business Info
- **Endpoint**: `POST /v3/business_data/google/my_business_info/live`
- **Purpose**: Get business domain, CID, place_id for ads targeting
- **Parameters**:
  ```json
  {
    "keyword": "business_name",
    "location_name": "location",
    "language_code": "en"
  }
  ```

### 3. Ads Search (Domain-Specific)
- **Endpoint**: `POST /v3/serp/google/ads_search/live/advanced`
- **Purpose**: Get ad creatives for specific domain
- **Parameters**:
  ```json
  {
    "target": "example.com",
    "location_code": 2840,
    "platform": "google_search",
    "depth": 40,
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  }
  ```

### 4. Ads Advertisers
- **Endpoint**: `POST /v3/serp/google/ads_advertisers/live/advanced`
- **Purpose**: Get advertiser information and approx ads count
- **Parameters**:
  ```json
  {
    "keyword": "business_name",
    "location_code": 2840,
    "language_code": "en"
  }
  ```

### 5. Bulk Traffic Estimation
- **Endpoint**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`
- **Purpose**: Get paid ETV (estimated traffic value)
- **Parameters**:
  ```json
  {
    "targets": ["example.com"],
    "location_code": 2840,
    "language_code": "en",
    "item_types": ["organic", "paid"]
  }
  ```

## Ad Performance Analysis Workflow

### Step 1: Get Business Domain
```typescript
// Get business domain from GMB Info or Business Listings
const gmbInfo = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', [{
  keyword: businessName,
  location_name: location,
  language_code: 'en'
}]);
const domain = gmbInfo.data.tasks[0].result[0].url;
```

### Step 2: Fetch Ad Creatives
```typescript
// Get ad creatives for specific domain
const adsResponse = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', [{
  target: domain,
  location_code: locationCode,
  platform: 'google_search',
  depth: 40,
  date_from: '2024-01-01',
  date_to: '2024-12-31'
}]);
```

### Step 3: Get Advertiser Data
```typescript
// Get advertiser information
const adsAdvertisersResponse = await this.getAxiosInstance().post('/serp/google/ads_advertisers/live/advanced', [{
  keyword: businessName,
  location_code: locationCode,
  language_code: 'en'
}]);
```

### Step 4: Get Paid Traffic Estimate
```typescript
// Get paid ETV from traffic estimation
const trafficResponse = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', [{
  targets: [domain],
  location_code: locationCode,
  language_code: 'en',
  item_types: ['organic', 'paid']
}]);
```

## Ad Activity Score Formula

### Components and Weights
- **Paid ETV (normalized)** — 60%
- **Creatives Count (normalized)** — 20%
- **Ad Recency (freshness)** — 10%
- **Verified Advertiser** — 10%

### Implementation
```typescript
private computeAdActivityScore(
  paidETV: number,
  creativesCount: number,
  adRecency: number,
  verified: boolean
): number {
  // Normalize paid ETV with log scale (60% weight)
  const paidScore = this.logNormalize(paidETV, 1, 100000) * 0.60;
  
  // Normalize creatives count with log scale (20% weight)
  const creativesScore = this.logNormalize(creativesCount, 0, 200) * 0.20;
  
  // Recency score (10% weight)
  const recencyScore = adRecency * 0.10;
  
  // Verified advertiser bonus (10% weight)
  const verifiedScore = verified ? 100 : 0;
  const verifiedBonus = verifiedScore * 0.10;
  
  return Math.round(paidScore + creativesScore + recencyScore + verifiedBonus);
}
```

### Log Normalization
```typescript
private logNormalize(value: number, min: number, max: number): number {
  const logValue = Math.log10(1 + value);
  const logMin = Math.log10(1 + Math.max(min, 0));
  const logMax = Math.log10(1 + Math.max(max, 1));
  
  if (logMax === logMin) return 0;
  return 100 * (logValue - logMin) / (logMax - logMin);
}
```

## Data Extraction Methods

### Extract Ad Creatives
```typescript
private extractAdCreatives(adsData: any): any[] {
  if (!adsData?.tasks?.[0]?.result?.[0]?.items) return [];
  
  return adsData.tasks[0].result[0].items
    .filter((item: any) => item.type === 'ads_search')
    .map((item: any) => ({
      creativeId: item.creative_id,
      advertiserId: item.advertiser_id,
      title: item.title,
      url: item.url,
      format: item.format,
      previewImage: item.preview_image,
      firstShown: item.first_shown,
      lastShown: item.last_shown,
      verified: item.verified
    }));
}
```

### Extract Advertiser Data
```typescript
private extractAdvertiserData(adsAdvertisersData: any): {
  approxAdsCount: number;
  verified: boolean;
  platforms: string[];
} {
  if (!adsAdvertisersData?.tasks?.[0]?.result?.[0]?.items) {
    return { approxAdsCount: 0, verified: false, platforms: [] };
  }
  
  const items = adsAdvertisersData.tasks[0].result[0].items;
  const advertiserItems = items.filter((item: any) => 
    item.type === 'ads_advertiser' || item.type === 'ads_multi_account_advertiser'
  );
  
  const totalAdsCount = advertiserItems.reduce((sum: number, item: any) => 
    sum + (item.approx_ads_count || 0), 0
  );
  
  const verified = advertiserItems.some((item: any) => item.verified);
  const platforms = [...new Set(advertiserItems.map((item: any) => item.platform).filter(Boolean))] as string[];
  
  return { approxAdsCount: totalAdsCount, verified, platforms };
}
```

### Calculate Ad Recency
```typescript
private calculateAdRecency(creatives: any[]): number {
  if (creatives.length === 0) return 0;
  
  const now = new Date();
  const lastShownDates = creatives
    .map(c => c.lastShown)
    .filter(Boolean)
    .map(dateStr => new Date(dateStr));
  
  if (lastShownDates.length === 0) return 0;
  
  const mostRecent = new Date(Math.max(...lastShownDates.map(d => d.getTime())));
  const daysSince = Math.floor((now.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
  
  // Score 100 if within 7 days, 0 if > 180 days
  return Math.max(0, Math.min(100, (180 - daysSince) * 100 / 173));
}
```

## Business Profile Integration

### Enhanced Business Profile Data Structure
```typescript
interface BusinessProfile {
  // ... existing fields
  comprehensiveScore?: {
    presenceScore: number;
    seoScore: number;
    adsActivityScore: number;
    engagementScore: number;
    leadScore: number;
    adPerformance?: {
      paidETV: number;
      creativesCount: number;
      approxAdsCount: number;
      adRecency: number;
      verifiedAdvertiser: boolean;
      platforms: string[];
      creatives: any[];
      lastActiveDate: string;
    };
  };
}
```

### UI Display Components
- **Paid ETV Display**: Monthly estimated paid traffic
- **Active Creatives Count**: Number of unique ad creatives
- **Approx Ads Count**: Total ad campaigns
- **Ad Recency Score**: Campaign freshness (0-100)
- **Verified Advertiser Status**: Whether advertiser is verified
- **Platforms Used**: Google Search, Maps, Shopping, YouTube
- **Last Active Date**: When ads were last shown
- **Recent Ad Creatives**: Actual ad titles, formats, dates, verification

## API Response Structure

### Ad Performance Analysis Response
```typescript
{
  adActivityScore: number;
  paidETV: number;
  creativesCount: number;
  approxAdsCount: number;
  adRecency: number;
  verifiedAdvertiser: boolean;
  platforms: string[];
  creatives: Array<{
    creativeId: string;
    advertiserId: string;
    title: string;
    url: string;
    format: string;
    previewImage?: string;
    firstShown: string;
    lastShown: string;
    verified: boolean;
  }>;
  lastActiveDate: string;
}
```

## Limitations and Notes

### What DataForSEO Can Provide
- ✅ Ad creatives, creative_id, advertiser_id
- ✅ Approx ads count, first_shown/last_shown timestamps
- ✅ Ad format, preview image URL, ad transparency URL
- ✅ Paid ETV as estimate of paid traffic volume
- ✅ Verified advertiser status
- ✅ Platform information (search/maps/shopping/youtube)

### What DataForSEO Cannot Provide
- ❌ Campaign-level metrics (spend, impressions, clicks)
- ❌ CTR, conversions, CPA data
- ❌ Actual ad spend or ROI
- ❌ Account-level performance metrics

### For True Ad Performance
- Requires access to advertiser's Google Ads account
- Need Google Ads API integration
- Requires tracking data for conversion/ROI analysis

## Implementation Files

### Backend Implementation
- **File**: `server/services/dataforseoService.ts`
- **Methods**: 
  - `calculateAdActivityScore()`
  - `extractAdCreatives()`
  - `extractAdvertiserData()`
  - `calculateAdRecency()`
  - `computeAdActivityScore()`
  - `logNormalize()`

### Frontend Implementation
- **File**: `client/pages/BusinessProfilePage.tsx`
- **Components**: Detailed Ad Performance Analysis section
- **Display**: Ad metrics, creatives, advertiser info

### API Routes
- **File**: `server/routes/serp-intelligence.ts`
- **Endpoint**: `GET /api/serp/business/:profileId`
- **Enhancement**: Includes comprehensive ad performance data

## Usage Example

```typescript
// Get comprehensive business score with ad performance
const comprehensiveData = await dataForSEOService.getComprehensiveBusinessScore({
  businessName: "Example Business",
  domain: "example.com",
  location: "St. Louis, MO",
  keywords: ["plumber"]
});

// Access ad performance data
const adPerformance = comprehensiveData.scores.adPerformance;
console.log(`Ad Activity Score: ${adPerformance.adActivityScore}`);
console.log(`Paid ETV: ${adPerformance.paidETV}`);
console.log(`Creatives Count: ${adPerformance.creativesCount}`);
```

## Testing and Validation

### Test Business Profile
1. Navigate to business profile page
2. Verify comprehensive scoring section displays
3. Check ad performance metrics are populated
4. Validate ad creatives display correctly
5. Confirm advertiser information is accurate

### Expected Results
- Detailed ad performance analysis section
- Accurate paid ETV, creatives count, ads count
- Recent ad creatives with proper formatting
- Verified advertiser status and platforms
- Last active date and recency scores

---

**This documentation covers the complete ad performance analysis system implementation using DataForSEO APIs as specified.**
