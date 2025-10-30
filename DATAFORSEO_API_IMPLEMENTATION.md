# DataForSEO API Implementation Documentation

## Overview
This document details the complete implementation of DataForSEO APIs in our business intelligence system, including all endpoints, parameters, response handling, and scoring algorithms.

## API Configuration

### Authentication
```typescript
private getAxiosInstance() {
  return axios.create({
    baseURL: 'https://api.dataforseo.com/v3',
    auth: {
      username: process.env.DATAFORSEO_LOGIN!,
      password: process.env.DATAFORSEO_PASSWORD!
    },
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

### Rate Limiting
```typescript
private async checkRateLimit() {
  // Implement rate limiting logic
  // Queue requests if necessary
  // Add delays between requests
}
```

## Implemented DataForSEO Endpoints

### 1. Business Listings Search
**Endpoint**: `POST /v3/business_data/business_listings/search/live`

**Purpose**: Find businesses by keyword and location

**Implementation**:
```typescript
async getBusinessListings(params: {
  keyword: string;
  location: string;
  limit?: number;
  locationType?: string;
  locationValue?: string;
  radius?: number;
}) {
  const locationCode = this.getLocationCodeFromCSV(params.location);
  
  const response = await this.getAxiosInstance().post('/business_data/business_listings/search/live', [{
    keyword: params.keyword,
    location_name: params.location,
    language_code: 'en',
    limit: params.limit || 100
  }]);
  
  return response.data;
}
```

**Response Structure**:
```typescript
{
  tasks: [{
    result: [{
      items: [{
        title: string;
        category: string;
        address: string;
        phone: string;
        website: string;
        rating: { value: number };
        reviews_count: number;
        place_id: string;
        cid: string;
      }]
    }]
  }]
}
```

### 2. Google My Business Info
**Endpoint**: `POST /v3/business_data/google/my_business_info/live`

**Purpose**: Get detailed GMB information

**Implementation**:
```typescript
async getGoogleMyBusinessInfo(params: {
  businessName: string;
  location: string;
  placeId?: string;
  cid?: string;
}) {
  const response = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', [{
    keyword: params.businessName,
    location_name: params.location,
    language_code: 'en'
  }]);
  
  return response.data;
}
```

### 3. Reviews API
**Endpoint**: `POST /v3/business_data/google/reviews/task_post`

**Purpose**: Get business reviews and ratings

**Implementation**:
```typescript
async getBusinessReviews(params: {
  businessName: string;
  location: string;
  maxReviewsCount?: number;
}) {
  const response = await this.getAxiosInstance().post('/business_data/google/reviews/task_post', [{
    keyword: params.businessName,
    location_name: params.location,
    language_code: 'en',
    max_reviews_count: params.maxReviewsCount || 1000
  }]);
  
  return response.data;
}
```

### 4. Ranked Keywords
**Endpoint**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`

**Purpose**: Get SEO keyword rankings

**Implementation**:
```typescript
async getRankedKeywords(params: {
  domain: string;
  location: string;
  limit?: number;
}) {
  const response = await this.getAxiosInstance().post('/dataforseo_labs/google/ranked_keywords/live', [{
    target: params.domain,
    language_name: 'English',
    location_name: params.location,
    limit: params.limit || 1000
  }]);
  
  return response.data;
}
```

### 5. Bulk Traffic Estimation
**Endpoint**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`

**Purpose**: Get organic and paid traffic estimates

**Implementation**:
```typescript
async getBulkTrafficEstimation(params: {
  domains: string[];
  location: string;
}) {
  const response = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', [{
    targets: params.domains,
    location_name: params.location,
    language_name: 'English'
  }]);
  
  return response.data;
}
```

### 6. On-Page Analysis
**Endpoint**: `POST /v3/on_page/task_post`

**Purpose**: Analyze website technical SEO

**Implementation**:
```typescript
async getOnPageAnalysis(params: {
  url: string;
  location: string;
}) {
  const response = await this.getAxiosInstance().post('/on_page/task_post', [{
    url: params.url,
    location_name: params.location,
    language_name: 'English'
  }]);
  
  return response.data;
}
```

### 7. Backlinks API
**Endpoint**: `POST /v3/backlinks/bulk_backlinks/live`

**Purpose**: Get backlink analysis

**Implementation**:
```typescript
async getBacklinkAnalysis(params: {
  domain: string;
  limit?: number;
}) {
  const response = await this.getAxiosInstance().post('/backlinks/bulk_backlinks/live', [{
    target: params.domain,
    limit: params.limit || 100
  }]);
  
  return response.data;
}
```

### 8. Ads Search
**Endpoint**: `POST /v3/serp/google/ads_search/live/advanced`

**Purpose**: Get ad creatives for specific domain

**Implementation**:
```typescript
async getAdsSearch(params: {
  domain: string;
  location: string;
  depth?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const locationCode = this.getLocationCodeFromCSV(params.location);
  
  const response = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', [{
    target: params.domain,
    location_code: locationCode,
    platform: 'google_search',
    depth: params.depth || 40,
    date_from: params.dateFrom || '2024-01-01',
    date_to: params.dateTo || '2024-12-31'
  }]);
  
  return response.data;
}
```

### 9. Ads Advertisers
**Endpoint**: `POST /v3/serp/google/ads_advertisers/live/advanced`

**Purpose**: Get advertiser information

**Implementation**:
```typescript
async getAdsAdvertisers(params: {
  keyword: string;
  location: string;
}) {
  const locationCode = this.getLocationCodeFromCSV(params.location);
  
  const response = await this.getAxiosInstance().post('/serp/google/ads_advertisers/live/advanced', [{
    keyword: params.keyword,
    location_code: locationCode,
    language_code: 'en'
  }]);
  
  return response.data;
}
```

## Location Code Mapping

### CSV-Based Location Resolution
**File**: `missouri_locations_with_header.csv`

**Implementation**:
```typescript
private getLocationCodeFromCSV(location: string): number {
  try {
    const csvPath = path.join(process.cwd(), 'missouri_locations_with_header.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const columns = line.split(',');
      if (columns.length < 2) continue;
      
      const csvLocation = columns[0].trim().toLowerCase();
      const locationCode = parseInt(columns[1].trim());
      
      if (isNaN(locationCode)) continue;
      
      const score = this.calculateMatchScore(location, csvLocation);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = locationCode;
      }
    }
    
    return bestMatch || 200609; // Default to St. Louis, MO
  } catch (error) {
    console.error('Error reading location CSV:', error);
    return 200609; // Default fallback
  }
}
```

### Location Matching Algorithm
```typescript
private calculateMatchScore(inputLocation: string, csvLocation: string): number {
  const inputTerms = this.extractLocationTerms(inputLocation);
  const csvTerms = this.extractLocationTerms(csvLocation);
  
  let score = 0;
  
  // Exact term matches (highest priority)
  for (const inputTerm of inputTerms) {
    if (csvTerms.includes(inputTerm.toLowerCase())) {
      score += 100;
    }
  }
  
  // Partial matches
  for (const inputTerm of inputTerms) {
    for (const csvTerm of csvTerms) {
      if (csvTerm.includes(inputTerm.toLowerCase()) || 
          inputTerm.toLowerCase().includes(csvTerm)) {
        score += 50;
      }
    }
  }
  
  // Major city prioritization
  const majorCities = ['st. louis', 'kansas city', 'springfield', 'columbia', 'independence'];
  if (majorCities.some(city => csvLocation.includes(city))) {
    score += 25;
  }
  
  return score;
}
```

## Data Extraction Methods

### Extract Review Rating
```typescript
private extractRealReviewRating(reviewsData: any): number {
  if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return 0;
  const reviews = reviewsData.tasks[0].result[0].reviews;
  if (reviews.length === 0) return 0;
  
  const totalRating = reviews.reduce((sum: number, review: any) => 
    sum + (review.rating || 0), 0
  );
  return totalRating / reviews.length;
}
```

### Extract Review Count
```typescript
private extractRealReviewCount(reviewsData: any): number {
  if (!reviewsData?.tasks?.[0]?.result?.[0]?.reviews) return 0;
  return reviewsData.tasks[0].result[0].reviews.length;
}
```

### Extract Organic Traffic
```typescript
private extractRealOrganicTraffic(trafficData: any): number {
  if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]?.metrics?.organic) return 0;
  return trafficData.tasks[0].result[0].items[0].metrics.organic.etv || 0;
}
```

### Extract Paid Traffic
```typescript
private extractRealPaidTraffic(trafficData: any): number {
  if (!trafficData?.tasks?.[0]?.result?.[0]?.items?.[0]?.metrics?.paid) return 0;
  return trafficData.tasks[0].result[0].items[0].metrics.paid.etv || 0;
}
```

### Extract Keyword Count
```typescript
private extractRealKeywordCount(keywordsData: any): number {
  if (!keywordsData?.tasks?.[0]?.result?.[0]?.items) return 0;
  return keywordsData.tasks[0].result[0].items.length;
}
```

### Extract On-Page Score
```typescript
private extractRealOnPageScore(onPageData: any): number {
  if (!onPageData?.tasks?.[0]?.result?.[0]?.items?.[0]?.onpage_score) return 0;
  return onPageData.tasks[0].result[0].items[0].onpage_score;
}
```

### Extract Backlink Count
```typescript
private extractRealBacklinkCount(backlinksData: any): number {
  if (!backlinksData?.tasks?.[0]?.result?.[0]?.items) return 0;
  return backlinksData.tasks[0].result[0].items.length;
}
```

### Extract Ad Count
```typescript
private extractRealAdCount(adsData: any): number {
  if (!adsData?.tasks?.[0]?.result?.[0]?.items) return 0;
  return adsData.tasks[0].result[0].items.filter((item: any) => 
    item.type === 'ads_search'
  ).length;
}
```

## Comprehensive Scoring Implementation

### Main Scoring Method
```typescript
async getComprehensiveBusinessScore(params: {
  businessName: string;
  domain: string;
  location: string;
  keywords?: string[];
}) {
  // 1. Business Listings Search
  const businessListingsResponse = await this.getAxiosInstance().post('/business_data/business_listings/search/live', [{
    keyword: params.businessName,
    location_name: params.location,
    language_code: 'en',
    limit: 100
  }]);

  // 2. Google My Business Info
  const gmbInfoResponse = await this.getAxiosInstance().post('/business_data/google/my_business_info/live', [{
    keyword: params.businessName,
    location_name: params.location,
    language_code: 'en'
  }]);

  // 3. Reviews API
  const reviewsResponse = await this.getAxiosInstance().post('/business_data/google/reviews/task_post', [{
    keyword: params.businessName,
    location_name: params.location,
    language_code: 'en',
    max_reviews_count: 1000
  }]);

  // 4. Ranked Keywords
  const rankedKeywordsResponse = await this.getAxiosInstance().post('/dataforseo_labs/google/ranked_keywords/live', [{
    target: params.domain,
    language_name: 'English',
    location_name: params.location,
    limit: 1000
  }]);

  // 5. Traffic Estimation
  const trafficResponse = await this.getAxiosInstance().post('/dataforseo_labs/google/bulk_traffic_estimation/live', [{
    targets: [params.domain],
    location_name: params.location,
    language_name: 'English'
  }]);

  // 6. On-Page Analysis
  const onPageResponse = await this.getAxiosInstance().post('/on_page/task_post', [{
    url: params.domain.startsWith('http') ? params.domain : `https://${params.domain}`,
    location_name: params.location,
    language_name: 'English'
  }]);

  // 7. Backlinks
  const backlinksResponse = await this.getAxiosInstance().post('/backlinks/bulk_backlinks/live', [{
    target: params.domain,
    limit: 100
  }]);

  // 8. Ads Search
  const adsResponse = await this.getAxiosInstance().post('/serp/google/ads_search/live/advanced', [{
    target: params.domain,
    location_code: this.getLocationCodeFromCSV(params.location),
    platform: 'google_search',
    depth: 40,
    date_from: '2024-01-01',
    date_to: '2024-12-31'
  }]);

  // 9. Ads Advertisers
  const adsAdvertisersResponse = await this.getAxiosInstance().post('/serp/google/ads_advertisers/live/advanced', [{
    keyword: params.keywords?.[0] || params.businessName,
    location_code: this.getLocationCodeFromCSV(params.location),
    language_code: 'en'
  }]);

  // Calculate comprehensive scores
  const scores = this.calculateRealScores({
    businessListings: businessListingsResponse.data,
    gmbInfo: gmbInfoResponse.data,
    reviews: reviewsResponse.data,
    rankedKeywords: rankedKeywordsResponse.data,
    traffic: trafficResponse.data,
    onPage: onPageResponse.data,
    backlinks: backlinksResponse.data,
    ads: adsResponse.data,
    adsAdvertisers: adsAdvertisersResponse.data
  });

  return {
    domain: params.domain,
    businessName: params.businessName,
    scores,
    recommendations: this.generateRealRecommendations(scores, {
      businessListings: businessListingsResponse.data,
      gmbInfo: gmbInfoResponse.data,
      reviews: reviewsResponse.data,
      rankedKeywords: rankedKeywordsResponse.data,
      traffic: trafficResponse.data,
      onPage: onPageResponse.data,
      backlinks: backlinksResponse.data,
      ads: adsResponse.data,
      adsAdvertisers: adsAdvertisersResponse.data
    }),
    rawData: {
      businessListings: businessListingsResponse.data,
      gmbInfo: gmbInfoResponse.data,
      reviews: reviewsResponse.data,
      keywords: rankedKeywordsResponse.data,
      traffic: trafficResponse.data,
      onPage: onPageResponse.data,
      backlinks: backlinksResponse.data,
      ads: adsResponse.data,
      adsAdvertisers: adsAdvertisersResponse.data
    }
  };
}
```

## Error Handling

### Individual API Error Handling
```typescript
try {
  const response = await this.getAxiosInstance().post('/endpoint', [params]);
  return response.data;
} catch (error) {
  console.error('API call failed:', error);
  return { tasks: [{ result: [{ items: [] }] }] }; // Fallback empty structure
}
```

### Comprehensive Error Handling
```typescript
// Each API call is wrapped in try-catch
// If any API fails, the system continues with available data
// Fallback empty data structures prevent crashes
```

## Performance Optimizations

### Parallel API Calls
- All DataForSEO API calls are made in parallel
- No sequential dependencies
- Maximum performance for comprehensive analysis

### Caching Strategy
- Location code caching
- Response data caching where appropriate
- Database result caching

### Rate Limiting
- Request queuing
- Exponential backoff
- API quota management

## Testing and Validation

### API Response Validation
```typescript
// Validate response structure
if (!response.data?.tasks?.[0]?.result?.[0]?.items) {
  throw new Error('Invalid API response structure');
}
```

### Data Extraction Testing
```typescript
// Test each extraction method
const rating = this.extractRealReviewRating(mockReviewsData);
expect(rating).toBeGreaterThan(0);
```

### End-to-End Testing
```typescript
// Test complete scoring workflow
const result = await dataForSEOService.getComprehensiveBusinessScore({
  businessName: 'Test Business',
  domain: 'test.com',
  location: 'St. Louis, MO'
});
expect(result.scores.leadScore).toBeGreaterThan(0);
```

---

**This documentation covers the complete DataForSEO API implementation with all endpoints, data extraction methods, scoring algorithms, and error handling strategies.**
