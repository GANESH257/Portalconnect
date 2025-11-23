# Ad Data Integration Documentation

## Overview

This document describes the integration of Google Ads data retrieval using DataForSEO API endpoints to enrich Prospect Finder search results and Business Profile pages with advertisement information.

## API Endpoints Used

### 1. Google Ads Advertisers Endpoint
- **Endpoint**: `POST /v3/serp/google/ads_advertisers/task_post`
- **Purpose**: Discover advertisers running ads for a given keyword + location
- **Returns**: `advertiser_id`, `approx_ads_count`, verification status, domain info

### 2. Google Ads Search Endpoint
- **Endpoint**: `POST /v3/serp/google/ads_search/task_post`
- **Purpose**: Retrieve actual ad creatives for specific advertisers (by `advertiser_ids` or `target` domain)
- **Returns**: Ad creatives with title, description, URL, preview image, first/last shown dates, rank info, format, platform

## Implementation Details

### Backend Service Methods (`server/services/dataforseoService.ts`)

#### New Methods Added:

1. **`getAdsForAdvertisers(params)`**
   - Fetches ads for up to 25 advertiser IDs per request
   - Parameters: `advertiserIds`, `locationCode`/`locationName`, `platform`, `format`, `dateFrom`/`dateTo`, `depth`
   - Returns: Ad creatives data

2. **`getAdsForDomain(params)`**
   - Fetches ads for a specific domain
   - Parameters: `target` (domain), `locationCode`/`locationName`, `platform`, `format`, `dateFrom`/`dateTo`, `depth`
   - Returns: Ad creatives data

3. **`extractAdvertiserIds(advertisersData)`**
   - Helper method to extract advertiser IDs from advertiser response
   - Returns: Array of unique advertiser IDs

4. **`findAdvertiserIdForDomain(advertisersData, domain)`**
   - Finds advertiser ID for a specific domain from advertiser response
   - Returns: Advertiser ID string or null

#### Updated Methods:

1. **`getAdsAdvertisers(params)`**
   - Now supports `locationCode`, `locationName`, or `locationCoordinate`
   - Maintains backward compatibility with existing calls

### Backend API Routes (`server/routes/serp-intelligence.ts`)

#### New Endpoint:

- **`GET /api/serp/business/:profileId/ads`**
  - Gets all ads for a specific business profile
  - Uses domain or advertiser_id to fetch ads
  - Returns: `{ ads, advertiserId, domain, businessName, totalAds, isRunningAds }`
  - Error handling: Returns empty ads array if fetch fails (non-blocking)

#### Search Results Enrichment:

- **`POST /api/serp/search-prospects`**
  - Now includes lightweight ad data enrichment
  - Fetches advertisers for keyword+location (non-blocking)
  - Matches businesses by domain to identify which are running ads
  - Adds to each result:
    - `isRunningAds`: boolean
    - `advertiserId`: string (if found)
    - `approxAdsCount`: number (if available)
    - `advertiserVerified`: boolean (if available)
  - Non-blocking: If ad fetch fails, results still return normally

### Frontend Changes

#### Business Profile Page (`client/pages/BusinessProfilePage.tsx`)

1. **New State**:
   - `adsData`: Stores fetched ads data
   - `adsLoading`: Loading state for ads fetch

2. **New Function**:
   - `fetchBusinessAds(profileData)`: Fetches ads for the business profile

3. **New Tab**:
   - Added "Ads" tab to display active advertisements
   - Shows:
     - Total number of active ads
     - Grid of ad cards with:
       - Ad title and description
       - Preview image (if available)
       - Platform and format badges
       - Verified advertiser badge (if applicable)
       - Last shown date
       - Link to view ad on Google Ads Transparency Center

#### Prospect Finder (`client/agents/prospect-finder/index.tsx`)

1. **Visual Indicator**:
   - Added "Running Ads" badge next to business name in search results
   - Shows approximate ads count if available
   - Purple badge with TrendingUp icon

## Data Flow

### For Prospect Finder (Search Results):

1. User searches for prospects with keyword + location
2. Backend fetches Maps/Local Pack results
3. Backend fetches advertisers for keyword+location (non-blocking)
4. Backend matches businesses by domain to identify running ads
5. Frontend displays "Running Ads" badge for businesses with ads

### For Business Profile:

1. User views a business profile
2. Frontend fetches business profile data
3. Frontend fetches ads data via `/api/serp/business/:profileId/ads`
4. Backend:
   - Gets business profile from database
   - Attempts to find advertiser_id by calling `getAdsAdvertisers` with business name
   - If found, calls `getAdsForAdvertisers` with advertiser_id
   - If not found, calls `getAdsForDomain` with business domain
5. Frontend displays ads in "Ads" tab

## Error Handling

- All ad data fetching is **non-blocking**
- If advertiser fetch fails during search, results still return (without ad data)
- If ads fetch fails for business profile, returns empty ads array with error message
- Frontend gracefully handles missing ad data

## Performance Considerations

1. **Search Results**: Advertiser fetch adds ~1 API call per search (acceptable, non-blocking)
2. **Business Profile**: Ad fetch only happens when viewing profile (on-demand)
3. **Caching**: Consider caching advertiser data for the same keyword+location combinations

## Example Usage

### Search Results Response:
```json
{
  "success": true,
  "data": {
    "businesses": [
      {
        "title": "Business Name",
        "domain": "example.com",
        "isRunningAds": true,
        "advertiserId": "AR123456789",
        "approxAdsCount": 15,
        "advertiserVerified": true,
        ...
      }
    ]
  }
}
```

### Business Profile Ads Response:
```json
{
  "success": true,
  "data": {
    "ads": [
      {
        "creativeId": "CR123",
        "advertiserId": "AR123456789",
        "title": "Ad Title",
        "description": "Ad description",
        "url": "https://transparencyreport.google.com/...",
        "format": "text",
        "platform": "google_search",
        "previewImage": "https://...",
        "firstShown": "2024-01-01",
        "lastShown": "2024-11-01",
        "rankGroup": 1,
        "rankAbsolute": 1,
        "verified": true
      }
    ],
    "totalAds": 15,
    "isRunningAds": true,
    "advertiserId": "AR123456789",
    "domain": "example.com"
  }
}
```

## Notes

- Ad data is fetched using DataForSEO's documented endpoints
- Current flow is preserved - ad fetching is optional and non-blocking
- Domain-based matching ensures businesses are correctly identified as running ads
- Advertiser ID lookup is preferred over domain lookup for better accuracy
- All API calls respect rate limiting configured in `dataforseoService.ts`

## Future Enhancements

1. Cache advertiser data to reduce API calls
2. Batch fetch ads for multiple businesses in search results
3. Add filtering/sorting by "Running Ads" status in Prospect Finder
4. Display ad performance metrics (impressions, clicks, etc.) if available
5. Show ad trends over time (which ads are new, which are inactive)

