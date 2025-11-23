# Complete API Documentation - Data Collection

## 📋 Overview

This document provides comprehensive documentation for all APIs used in the data collection process, including DataForSEO APIs and Google APIs.

---

## 🔵 DataForSEO APIs

### **Base Configuration**
- **Base URL**: `https://api.dataforseo.com/v3`
- **Authentication**: Basic Auth (username/password from environment variables)
- **Rate Limit**: 60 requests/minute, 1000 requests/day
- **Cost**: ~$0.002 per request (varies by endpoint)

---

### **1. Maps API**
**Endpoint**: `POST /v3/serp/google/maps/live/advanced`

**Purpose**: Get Google Maps search results for a keyword and location

**Request Body**:
```json
[{
  "keyword": "Spine",
  "location": "Chesterfield, MO",
  "language": "English",
  "device": "desktop"
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "title": "Business Name",
        "url": "https://...",
        "domain": "example.com",
        "phone": "+1-555-0123",
        "address": "123 Main St",
        "address_info": {
          "city": "Chesterfield",
          "region": "MO",
          "postal_code": "63017",
          "country_code": "US"
        },
        "rating": {
          "value": 4.5,
          "votes_count": 100,
          "max": 5
        },
        "place_id": "ChIJ...",
        "cid": "1234567890",
        "rank_absolute": 1,
        "rank_group": 1
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getMapsResults()`

**Used In**: Phase 1 - Discovery

---

### **2. Local Pack API**
**Endpoint**: `POST /v3/serp/google/local_finder/live/advanced`

**Purpose**: Get Google Local Pack (3-pack) search results

**Request Body**: Same as Maps API

**Response Structure**: Similar to Maps API

**Service Method**: `dataForSEOService.getLocalPackResults()`

**Used In**: Phase 1 - Discovery

---

### **3. Business Listings API**
**Endpoint**: `POST /v3/business_data/business_listings/search/live`

**Purpose**: Search DataForSEO's business listings database

**Request Body**:
```json
[{
  "keyword": "Spine",
  "location_name": "Chesterfield, MO",
  "language_code": "en",
  "limit": 100
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "title": "Business Name",
        "url": "https://...",
        "category": "Medical",
        "additional_categories": ["Spine Surgery", "Orthopedics"],
        "phone": "+1-555-0123",
        "address": "123 Main St",
        "city": "Chesterfield",
        "state": "MO",
        "zip_code": "63017"
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getBusinessListings()`

**Used In**: Phase 1 - Discovery

---

### **4. Google My Business Info API**
**Endpoint**: `POST /v3/business_data/google/my_business_info/live`

**Purpose**: Get detailed Google My Business information

**Request Body**:
```json
[{
  "keyword": "Business Name",
  "location_name": "Chesterfield, MO",
  "language_code": "en",
  "place_id": "ChIJ..." // optional
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "title": "Business Name",
        "website": "https://example.com",
        "phone": "+1-555-0123",
        "email": "info@example.com",
        "address_info": {
          "address": "123 Main St",
          "city": "Chesterfield",
          "region": "MO",
          "postal_code": "63017"
        },
        "business_hours": {...},
        "services": ["Service 1", "Service 2"],
        "social_media": {...},
        "insurance_accepted": [...],
        "languages": ["English", "Spanish"],
        "certifications": [...],
        "awards": [...]
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getGoogleMyBusinessInfo()`

**Used In**: Phase 2 - Enrichment (Step 2.1)

---

### **5. Reviews API**
**Endpoint**: `POST /v3/business_data/google/reviews/task_post` (async)

**Purpose**: Get Google reviews for a business

**Request Body**:
```json
[{
  "keyword": "Business Name",
  "location_name": "Chesterfield, MO",
  "language_code": "en",
  "max_reviews_count": 1000
}]
```

**Polling Endpoint**: `GET /v3/business_data/google/reviews/task_get/{taskId}`

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "review_text": "Great service!",
        "rating": {
          "value": 5,
          "max": 5
        },
        "author": "John Doe",
        "review_datetime": "2024-01-01T00:00:00Z",
        "helpful_votes": 10
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getBusinessReviews()`

**Used In**: Phase 2 - Enrichment (Step 2.2)

**Note**: Async task - requires polling for completion

---

### **6. Ranked Keywords API**
**Endpoint**: `POST /v3/dataforseo_labs/google/ranked_keywords/live`

**Purpose**: Get keywords a domain ranks for

**Request Body**:
```json
[{
  "target": "example.com",
  "location_code": 2840,
  "language_name": "English",
  "limit": 100
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "keyword": "spine surgery",
        "rank_absolute": 5,
        "rank_group": 1,
        "url": "https://example.com/page",
        "search_volume": 1000,
        "competition": "medium",
        "cpc": 5.50,
        "difficulty": 45
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getRankedKeywords()`

**Used In**: Phase 2 - Enrichment (Step 2.3)

---

### **7. Bulk Traffic Estimation API**
**Endpoint**: `POST /v3/dataforseo_labs/google/bulk_traffic_estimation/live`

**Purpose**: Get estimated monthly organic traffic for domains

**Request Body**:
```json
[{
  "targets": ["example.com"],
  "location_code": 2840,
  "language_name": "English"
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "target": "example.com",
        "metrics": {
          "organic": {
            "etv": 5000,
            "count": 100,
            "estimated_paid_traffic_cost": 250.00
          }
        }
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getBulkTrafficEstimation()`

**Used In**: Phase 2 - Enrichment (Step 2.4)

---

### **8. Ads Search API**
**Endpoint**: `POST /v3/serp/google/ads_search/live/advanced`

**Purpose**: Get ad creatives for a domain

**Request Body**:
```json
[{
  "keyword": "Spine",
  "location_code": 2840,
  "language": "English",
  "domain": "example.com"
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "type": "ads",
        "title": "Ad Title",
        "description": "Ad Description",
        "url": "https://example.com/landing",
        "preview_image": "https://...",
        "ad_aclk": "https://...",
        "domain": "example.com"
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getAdsForDomain()`

**Used In**: Phase 2 - Enrichment (Step 2.5)

---

### **9. On-Page Analysis API**
**Endpoint**: `POST /v3/on_page/task_post` (async)

**Purpose**: Get on-page SEO analysis

**Request Body**:
```json
[{
  "url": "https://example.com",
  "enable_javascript": true,
  "enable_browser_rendering": true
}]
```

**Polling Endpoint**: `GET /v3/on_page/pages/{taskId}`

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "url": "https://example.com",
        "onpage_score": 85,
        "page_timing": {
          "largest_contentful_paint": 2000,
          "first_input_delay": 100,
          "cumulative_layout_shift": 0.05,
          "time_to_interactive": 3000
        },
        "desktop_score": 90,
        "mobile_score": 75,
        "accessibility_score": 80,
        "technologies": [...],
        "meta_tags": {...},
        "headings": [...]
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getOnPageAnalysis()`

**Used In**: Phase 2 - Enrichment (Step 2.6)

**Note**: Async task - requires polling with retries

---

### **10. Ads Advertisers API**
**Endpoint**: `POST /v3/serp/google/ads_advertisers/live/advanced`

**Purpose**: Get list of advertisers for a keyword

**Request Body**:
```json
[{
  "keyword": "Spine",
  "location_name": "Chesterfield, MO"
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "advertiser_id": "123456",
        "domain": "example.com",
        "website": "https://example.com",
        "approx_ads_count": 25,
        "verified": true
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getAdsAdvertisers()`

**Used In**: Phase 2 - Enrichment (Step 2.14)

**Note**: Uses `location_name`, NOT `location_code`

---

### **11. Backlink Analysis API**
**Endpoint**: `POST /v3/backlinks/summary/live`

**Purpose**: Get backlink summary for a domain

**Request Body**:
```json
[{
  "target": "example.com",
  "limit": 100
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "target": "example.com",
        "backlinks": 1000,
        "referring_domains": 100,
        "referring_main_domains": 50,
        "referring_ips": 75,
        "referring_subnets": 60
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getBacklinkAnalysis()`

**Used In**: Phase 2 - Enrichment (Step 2.12)

**Note**: Requires DataForSEO Backlinks subscription

---

### **12. Domain Rank API**
**Endpoint**: `POST /v3/dataforseo_labs/google/domain_rank/live`

**Purpose**: Get domain authority and ranking metrics

**Request Body**:
```json
[{
  "targets": ["example.com"],
  "location_code": 2840,
  "language_name": "English"
}]
```

**Response Structure**:
```json
{
  "tasks": [{
    "result": [{
      "items": [{
        "target": "example.com",
        "metrics": {
          "organic": {
            "etv": 10000,
            "count": 500,
            "pos_1": 10,
            "pos_2_3": 50,
            "pos_4_10": 100
          }
        }
      }]
    }]
  }]
}
```

**Service Method**: `dataForSEOService.getDomainAnalysis()`

**Used In**: Phase 2 - Enrichment (Step 2.13)

---

## 🟢 Google APIs

### **1. Google PageSpeed Insights API**
**Endpoint**: `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed`

**Purpose**: Get page speed scores and Core Web Vitals

**Request Parameters**:
- `url`: Full URL (e.g., "https://example.com")
- `key`: API key (`GOOGLE_PAGESPEED_API_KEY`)
- `category`: Array of categories (optional)

**Response Structure**:
```json
{
  "lighthouseResult": {
    "categories": {
      "performance": {"score": 0.85},
      "accessibility": {"score": 0.90},
      "seo": {"score": 0.95},
      "best-practices": {"score": 0.80}
    },
    "audits": {
      "largest-contentful-paint": {"numericValue": 2000},
      "first-input-delay": {"numericValue": 100},
      "cumulative-layout-shift": {"numericValue": 0.05}
    }
  }
}
```

**Service Method**: `add-pagespeed-insights.js`

**Used In**: Phase 2 - Enrichment (Step 2.9)

---

### **2. Google Places API**
**Endpoint**: `GET https://maps.googleapis.com/maps/api/place/details/json`

**Purpose**: Get Google Places details including reviews

**Request Parameters**:
- `place_id`: Google Place ID
- `key`: API key (`GOOGLE_PLACES_API_KEY`)
- `fields`: "rating,user_ratings_total,reviews"

**Response Structure**:
```json
{
  "result": {
    "rating": 4.5,
    "user_ratings_total": 100,
    "reviews": [{
      "author_name": "John Doe",
      "rating": 5,
      "text": "Great service!",
      "time": 1234567890
    }]
  }
}
```

**Service Method**: `add-google-places.js`

**Used In**: Phase 2 - Enrichment (Step 2.7)

---

### **3. Google Safe Browsing API**
**Endpoint**: `POST https://safebrowsing.googleapis.com/v4/threatMatches:find`

**Purpose**: Check if domain is safe (malware, phishing)

**Request Body**:
```json
{
  "client": {
    "clientId": "your-client-id",
    "clientVersion": "1.0"
  },
  "threatInfo": {
    "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING"],
    "platformTypes": ["ANY_PLATFORM"],
    "threatEntryTypes": ["URL"],
    "threatEntries": [{"url": "https://example.com"}]
  }
}
```

**Response Structure**:
```json
{
  "matches": [] // Empty if safe
}
```

**Service Method**: `add-safe-browsing.js`

**Used In**: Phase 2 - Enrichment (Step 2.8)

---

## 🔍 HTML Analysis (No API)

### **HTML Fetch**
**Method**: Direct HTTP GET request

**Purpose**: Fetch HTML content for analytics and schema detection

**Request**:
- URL: `https://{domain}` or `http://{domain}`
- Headers: Browser-like headers to avoid bot detection
- Timeout: 30 seconds

**Response**: HTML string

**Used In**: Phase 2 - Enrichment (Step 2.10)

---

### **Analytics Detection**
**Method**: Regex pattern matching on HTML

**Detects**:
- **Google Analytics**:
  - GA4: `gtag('config', 'G-XXXXX')`
  - Universal Analytics: `ga('create', 'UA-XXXXX')`
  - gtag.js presence
  - analytics.js presence
- **Facebook Pixel**:
  - `fbq('init', 'PIXEL_ID')`
  - `_fbp` cookie
  - fbevents.js presence

**Function**: `detectAnalyticsInHTML(html: string)`

**Used In**: Phase 2 - Enrichment (Step 2.10)

---

### **Schema Detection**
**Method**: JSON-LD parsing from HTML

**Detects**:
- LocalBusiness
- FAQPage
- Organization
- BreadcrumbList
- Product
- Review

**Function**: `detectSchemasInHTML(html: string)`

**Used In**: Phase 2 - Enrichment (Step 2.10)

---

### **Schema Validation**
**Method**: Custom validation logic

**Purpose**: Validate JSON-LD structure, required fields, data types

**Function**: `validateSchemas(html: string)` (from `add-schema-validation.js`)

**Used In**: Phase 2 - Enrichment (Step 2.11)

---

## 📊 API Usage Summary

| API | Type | Async | Cost | Used In |
|-----|------|-------|------|---------|
| Maps API | DataForSEO | No | ~$0.002 | Phase 1 |
| Local Pack API | DataForSEO | No | ~$0.002 | Phase 1 |
| Business Listings API | DataForSEO | No | ~$0.04 | Phase 1 |
| GMB Info API | DataForSEO | No | ~$0.0054 | Phase 2 |
| Reviews API | DataForSEO | Yes | ~$0.00075 | Phase 2 |
| Ranked Keywords API | DataForSEO | No | ~$0.02 | Phase 2 |
| Traffic Estimation API | DataForSEO | No | ~$0.0101 | Phase 2 |
| Ads Search API | DataForSEO | No | ~$0.002 | Phase 2 |
| On-Page API | DataForSEO | Yes | Free | Phase 2 |
| Ads Advertisers API | DataForSEO | No | Free | Phase 2 |
| Backlinks API | DataForSEO | No | Varies | Phase 2 |
| Domain Rank API | DataForSEO | No | ~$0.0101 | Phase 2 |
| PageSpeed Insights API | Google | No | Free (quota) | Phase 2 |
| Places API | Google | No | Paid | Phase 2 |
| Safe Browsing API | Google | No | Free (quota) | Phase 2 |
| HTML Fetch | HTTP | No | Free | Phase 2 |

---

## 🔐 Authentication

### **DataForSEO**
- **Method**: Basic Authentication
- **Username**: `DATAFORSEO_LOGIN` (env var)
- **Password**: `DATAFORSEO_PASSWORD` (env var)

### **Google APIs**
- **Method**: API Key in query parameter
- **Keys**: 
  - `GOOGLE_PAGESPEED_API_KEY`
  - `GOOGLE_PLACES_API_KEY`
  - `GOOGLE_SAFEBROWSING_API_KEY`

---

## ⚠️ Error Handling

- **403 Forbidden**: HTML fetch blocked (bot protection) - handled gracefully
- **404 Not Found**: Task not ready (async) - retry with polling
- **40501 Invalid Field**: Wrong parameter name - use `location_name` not `location_code` for some endpoints
- **40204 Access Denied**: Subscription required - logged but continues
- **Rate Limiting**: Built-in delays between requests

