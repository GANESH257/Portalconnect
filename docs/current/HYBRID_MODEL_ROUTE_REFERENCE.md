# Hybrid Model Route Reference

Complete reference for all route endpoints in the hybrid model implementation.

---

## 📋 Table of Contents

1. [Search & Discovery Routes](#search--discovery-routes)
2. [Business Profile Routes](#business-profile-routes)
3. [Analysis Routes](#analysis-routes)
4. [Management Routes](#management-routes)
5. [Utility Routes](#utility-routes)

---

## 🔍 Search & Discovery Routes

### `POST /api/serp/search-prospects`

**Purpose**: Search for business prospects using keyword and location

**Data Source**: Database  
**Response Time**: <500ms  
**Cost**: $0

**Request:**
```json
{
  "keyword": "spine care",
  "location": "Chesterfield, MO",
  "locationType": "city",
  "locationValue": "Chesterfield, MO",
  "device": "desktop",
  "radius": 10,
  "mapView": "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "cmh3nk3mj0000rqllsoybppjl",
    "businesses": [
      {
        "id": "...",
        "businessProfileId": "...",
        "name": "The Spine Center",
        "domain": "www.spinecenter.com",
        "address": "123 Main St",
        "city": "Chesterfield",
        "state": "MO",
        "zipCode": "63017",
        "phone": "(314) 555-1234",
        "rating": 4.5,
        "reviewsCount": 123,
        "isRunningAds": false,
        "seoScore": 75,
        "domainAuthority": 42
      }
    ],
    "isFromDatabase": true
  }
}
```

**Key Fields:**
- `businesses[]` - Array of business results
- `jobId` - SERP job ID
- `isFromDatabase` - Flag indicating data source

---

### `POST /api/serp/analyze-website`

**Purpose**: Comprehensive website analysis

**Data Source**: Live API  
**Response Time**: 10-20s  
**Cost**: $0.02-0.04

**Request:**
```json
{
  "url": "https://www.example.com",
  "location": "United States",
  "device": "desktop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://www.example.com",
    "seo": {
      "performance_score": 78,
      "accessibility_score": 82,
      "seo_score": 72
    },
    "backlinks": {
      "total_backlinks": 127,
      "referring_domains": 45,
      "domain_authority": 42
    }
  }
}
```

---

## 👤 Business Profile Routes

### `GET /api/serp/business/:profileId`

**Purpose**: Get basic business profile

**Data Source**: Database  
**Response Time**: <100ms  
**Cost**: $0

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "The Spine Center",
    "domain": "www.spinecenter.com",
    "websiteUrl": "https://www.spinecenter.com",
    "address": "123 Main St",
    "city": "Chesterfield",
    "state": "MO",
    "phone": "(314) 555-1234",
    "rating": 4.5,
    "reviewsCount": 123,
    "keywordRankings": [...],
    "seoScore": 75,
    "domainAuthority": 42,
    "backlinks": 127,
    "monthlyTraffic": 5000,
    "isPaid": false,
    "isVerified": true
  },
  "isFromDatabase": true,
  "needsLiveData": ["seo-ppc", "ads", "reputation"]
}
```

**Key Fields:**
- Complete business profile from database
- `needsLiveData` - Array indicating which tabs need live API calls

---

### `GET /api/serp/business/:profileId/seo-ppc`

**Purpose**: Get comprehensive SEO & PPC analysis

**Data Source**: Live API  
**Response Time**: 5-15s  
**Cost**: $0.015-0.025

**Query Parameters:**
- `location` (optional) - Location string for API calls

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "serpPosition": 3,
    "schemas": {
      "localBusiness": true,
      "faq": true,
      "organization": true,
      "breadcrumbs": false
    },
    "analytics": {
      "googleAnalytics": {
        "found": true,
        "type": "GA4",
        "id": "G-XXXXXXXXXX"
      },
      "facebookPixel": {
        "found": false
      }
    },
    "speedScores": {
      "desktop": 85,
      "mobile": 78,
      "accessibility": 92
    },
    "ppcStatus": {
      "runningAds": true,
      "adCount": 15,
      "creativesCount": 15
    },
    "opportunityScore": 75,
    "opportunityScoreBreakdown": {...},
    "recommendations": [...],
    "safeBrowsing": {
      "isSafe": true,
      "threatTypes": []
    },
    "schemaValidation": {
      "valid": true,
      "errors": []
    },
    "coreWebVitals": {
      "lcp": 2.5,
      "fid": 0.1,
      "cls": 0.05
    }
  }
}
```

**APIs Called:**
1. On-Page Analysis API
2. PageSpeed Insights API
3. HTML Analysis (fetch + detect)
4. Safe Browsing API
5. Ads Advertisers API
6. Ads Search API

---

### `GET /api/serp/business/:profileId/ads`

**Purpose**: Get current ads creatives

**Data Source**: Live API  
**Response Time**: 2-5s  
**Cost**: $0.002-0.004

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "ads": [
      {
        "creativeId": "...",
        "advertiserId": "...",
        "title": "Ad Title",
        "description": "Ad Description",
        "url": "https://example.com",
        "previewImage": "https://...",
        "platform": "google_search",
        "format": "text",
        "lastShown": "2025-01-15T10:00:00Z"
      }
    ],
    "isRunningAds": true,
    "totalAds": 15,
    "creativesCount": 15,
    "domain": "example.com",
    "businessName": "Example Business"
  }
}
```

**APIs Called:**
1. Ads Search API
2. Ads Advertisers API

---

### `GET /api/serp/business/:profileId/reputation`

**Purpose**: Get reputation data with fresh reviews

**Data Source**: Live API  
**Response Time**: 3-8s  
**Cost**: $0.003-0.006

**Query Parameters:**
- `location` (optional) - Location string for API calls

**Response:**
```json
{
  "success": true,
  "isFromLiveAPI": true,
  "data": {
    "rating": 4.5,
    "totalRatings": 123,
    "reviews": [
      {
        "text": "Great service!",
        "rating": 5,
        "time": 1705320000,
        "author": "John Doe",
        "source": "google_places"
      }
    ],
    "responseRate": 85,
    "reviewVelocity": 12,
    "serviceIssues": ["Slow service", "Pricing concerns"],
    "placeId": "..."
  }
}
```

**APIs Called:**
1. Google Places API
2. DataForSEO Reviews API

---

## 📊 Analysis Routes

### `POST /api/serp/comprehensive-score`

**Purpose**: Get comprehensive business score

**Data Source**: Database  
**Response Time**: <100ms  
**Cost**: $0

**Request:**
```json
{
  "profileId": "...",
  "businessName": "Example Business",
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 75,
    "domainAuthority": 42,
    "backlinks": 127,
    "monthlyTraffic": 5000,
    "pageSpeed": 85,
    "mobileScore": 78,
    "accessibilityScore": 92,
    "keywordRankings": 45,
    "isPaid": false,
    "isVerified": true,
    "isFromDatabase": true
  }
}
```

---

### `POST /api/serp/domain-analysis`

**Purpose**: Get domain authority and rank analysis

**Data Source**: Hybrid (Database cached, Live API refresh)  
**Response Time**: <500ms (cached) or 2-5s (live)  
**Cost**: $0 (cached) or $0.002 (live)

**Request:**
```json
{
  "domain": "example.com",
  "location": "United States"
}
```

---

### `POST /api/serp/backlink-analysis`

**Purpose**: Get backlink analysis

**Data Source**: Hybrid (Database cached, Live API refresh)  
**Response Time**: <500ms (cached) or 2-5s (live)  
**Cost**: $0 (cached) or $0.002 (live)

---

### `POST /api/serp/onpage-analysis`

**Purpose**: Get on-page SEO analysis

**Data Source**: Live API  
**Response Time**: 10-15s  
**Cost**: $0.01-0.015

**Request:**
```json
{
  "domain": "example.com",
  "location": "United States"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "desktop_score": 85,
    "mobile_score": 78,
    "accessibility_score": 92,
    "page_timing": {...}
  }
}
```

---

## 📝 Management Routes

### `POST /api/serp/add-to-watchlist`

**Purpose**: Add business to watchlist

**Data Source**: Database  
**Response Time**: <100ms  
**Cost**: $0

**Request:**
```json
{
  "businessProfileId": "...",
  "notes": "Important prospect"
}
```

---

### `GET /api/serp/watchlist`

**Purpose**: Get all watchlist items

**Data Source**: Database  
**Response Time**: <200ms  
**Cost**: $0

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "businessProfileId": "...",
        "businessProfile": {...},
        "notes": "...",
        "createdAt": "..."
      }
    ]
  }
}
```

---

### `POST /api/serp/add-to-prospects`

**Purpose**: Add business to prospects list

**Data Source**: Database  
**Response Time**: <100ms  
**Cost**: $0

---

### `GET /api/serp/prospects`

**Purpose**: Get all prospect items

**Data Source**: Database  
**Response Time**: <200ms  
**Cost**: $0

---

## 🛠️ Utility Routes

### `POST /api/serp/track-keywords`

**Purpose**: Track keyword rankings over time

**Data Source**: Hybrid (Database + Live API)  
**Response Time**: <500ms  
**Cost**: $0-0.002

---

### `GET /api/serp/job/:jobId`

**Purpose**: Get SERP job results

**Data Source**: Database  
**Response Time**: <200ms  
**Cost**: $0

---

### `POST /api/serp/ads-search`

**Purpose**: Search for ads by keyword

**Data Source**: Live API  
**Response Time**: 2-3s  
**Cost**: $0.002

---

### `POST /api/serp/business-listings`

**Purpose**: Get business listings from directory

**Data Source**: Live API  
**Response Time**: 3-5s  
**Cost**: $0.003-0.005

---

### `POST /api/serp/google-my-business`

**Purpose**: Get Google My Business information

**Data Source**: Live API  
**Response Time**: 2-4s  
**Cost**: $0.002-0.003

---

## 📊 Route Summary Table

| Route | Method | Data Source | Response Time | Cost |
|-------|--------|-------------|---------------|------|
| `/api/serp/search-prospects` | POST | Database | <500ms | $0 |
| `/api/serp/business/:profileId` | GET | Database | <100ms | $0 |
| `/api/serp/business/:profileId/seo-ppc` | GET | Live API | 5-15s | $0.015-0.025 |
| `/api/serp/business/:profileId/ads` | GET | Live API | 2-5s | $0.002-0.004 |
| `/api/serp/business/:profileId/reputation` | GET | Live API | 3-8s | $0.003-0.006 |
| `/api/serp/comprehensive-score` | POST | Database | <100ms | $0 |
| `/api/serp/analyze-website` | POST | Live API | 10-20s | $0.02-0.04 |
| `/api/serp/watchlist` | GET | Database | <200ms | $0 |
| `/api/serp/prospects` | GET | Database | <200ms | $0 |

---

## 🔗 Related Documentation

- **Complete Documentation**: `docs/current/HYBRID_MODEL_COMPLETE_DOCUMENTATION.md`
- **Decision Matrix**: `docs/current/HYBRID_MODEL_DECISION_MATRIX.md`
- **Route Mapping CSV**: `data/HYBRID_MODEL_ROUTE_ENDPOINT_MAPPING.csv`
- **Data Field Mapping CSV**: `data/HYBRID_MODEL_DATA_FIELD_MAPPING.csv`

---

**Last Updated**: January 2025  
**Status**: Complete Route Reference

