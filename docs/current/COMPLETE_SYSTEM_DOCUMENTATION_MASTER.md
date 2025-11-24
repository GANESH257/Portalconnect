# Complete System Documentation - Master Guide

**Last Updated**: January 2025  
**Version**: Hybrid Model Implementation  
**Status**: Production Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Hybrid Model Implementation](#hybrid-model-implementation)
4. [Competitor Data System](#competitor-data-system)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Services & Components](#services--components)
8. [Frontend Architecture](#frontend-architecture)
9. [Data Flow](#data-flow)
10. [Deployment](#deployment)
11. [Development Setup](#development-setup)
12. [Key Features](#key-features)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 System Overview

### What is This System?

A comprehensive **SERP Intelligence Platform** that provides business intelligence, competitor analysis, SEO/PPC insights, and prospect discovery for healthcare and local businesses.

### Core Capabilities

1. **Business Profile Analysis**: Complete business intelligence with SEO, PPC, reputation, and competitor data
2. **Prospect Discovery**: Find and analyze businesses using Google Maps and local search
3. **Competitor Analysis**: Identify and compare local competitors
4. **SEO & PPC Intelligence**: Real-time SEO scores, keyword rankings, ad analysis
5. **Reputation Management**: Review analysis and reputation scoring
6. **Watchlist Management**: Track prospects and competitors

### Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Database**: MySQL (Prisma ORM)
- **APIs**: DataForSEO, Google APIs (PageSpeed, Safe Browsing, Places)
- **Deployment**: Railway (Backend), cPanel (Frontend)

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Business     │  │ Prospect     │  │ Watchlist    │      │
│  │ Profile Page │  │ Finder       │  │ Management   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Routes       │  │ Services     │  │ Prisma      │      │
│  │ (API)        │  │ (Business    │  │ (Database)  │      │
│  │              │  │  Logic)     │  │             │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   MySQL DB   │ │ DataForSEO │ │ Google APIs │
    │  (Prisma)    │ │    APIs    │ │             │
    └──────────────┘ └────────────┘ └─────────────┘
```

### Directory Structure

```
Ensemblenew/
├── client/                 # Frontend React application
│   ├── pages/             # Page components
│   ├── agents/            # AI agent interfaces
│   ├── components/        # Reusable UI components
│   └── ...
├── server/                 # Backend Express application
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── lib/               # Utilities and helpers
│   └── ...
├── prisma/                 # Database schema and migrations
├── scripts/               # Data collection and utility scripts
├── docs/                  # Documentation
├── data/                  # CSV files and data mappings
└── tests/                 # Test scripts
```

---

## 🔄 Hybrid Model Implementation

### What is the Hybrid Model?

The hybrid model combines **database-first loading** with **on-demand live API calls** to provide:
- **Fast initial page loads** (database data)
- **Fresh, detailed data** when needed (live APIs)
- **Reduced API costs** (only fetch when user requests)

### How It Works

#### Phase 1: Initial Load (Database)
```
User opens Business Profile
    ↓
Backend returns database data
    ↓
Frontend displays basic info immediately
    ↓
Shows "needsLiveData" flag for tabs
```

#### Phase 2: On-Demand Live Data (APIs)
```
User clicks "SEO & PPC" tab
    ↓
Frontend calls /api/serp/business/:id/seo-ppc
    ↓
Backend fetches fresh data from APIs
    ↓
Returns live data with loading states
```

### Implementation Details

#### Backend Routes

**1. `getBusinessProfile`** (`/api/serp/business/:profileId`)
- **Mode**: Database-only
- **Returns**: Basic business info + `needsLiveData: ['seo-ppc', 'ads', 'reputation']`
- **Location**: `server/routes/serp-intelligence.ts:987-1261`

**2. `getBusinessSEOAndPPC`** (`/api/serp/business/:profileId/seo-ppc`)
- **Mode**: Live API
- **Fetches**: 
  - HTML Analysis (analytics, schemas)
  - PageSpeed Insights
  - Safe Browsing
  - On-Page Analysis
  - Ads APIs
  - **Local Competitors** (NEW - location-aware)
- **Location**: `server/routes/serp-intelligence.ts:2253-2757`

**3. `getBusinessAds`** (`/api/serp/business/:profileId/ads`)
- **Mode**: Live API
- **Fetches**: Ads Search, Ads Advertisers, Traffic Estimation
- **Location**: `server/routes/serp-intelligence.ts:1631-1913`

**4. `getBusinessReputation`** (`/api/serp/business/:profileId/reputation`)
- **Mode**: Live API
- **Fetches**: Google Places, Reviews
- **Location**: `server/routes/serp-intelligence.ts:1915-2122`

#### Frontend Implementation

**BusinessProfilePage.tsx**
- Removed automatic fetching on page load
- Added tab click handlers for lazy loading
- Loading states and error handling
- Location: `client/pages/BusinessProfilePage.tsx`

---

## 🎯 Competitor Data System

### Overview

The competitor data system identifies and displays local competitors for a business using location-aware searches.

### How Competitors Are Found

1. **Keyword Selection** (Priority Order):
   - **Priority 1**: Original search keyword from `serpJob` (what was searched to find this business)
   - **Priority 2**: Top-ranking keyword from `keywordRankings` (best ranking position)
   - **Priority 3**: Category extracted from business name (removes common words like "center", "clinic")
   - **Priority 4**: Business name as fallback

2. **Location-Aware Search**:
   - Uses business location (City, State format)
   - Converts to location code via CSV lookup
   - Searches Google Local Pack for nearby businesses
   - Filters out the current business

3. **Data Processing**:
   - Excludes businesses with matching domain or name
   - Limits to top 5 competitors
   - Extracts: name, domain, address, rating, reviews count

### Implementation

**Backend Route**: `getBusinessSEOAndPPC`
- Location: `server/routes/serp-intelligence.ts:2575-2700`
- Service: `dataForSEOService.searchLocalPack()`
- Location: `server/services/dataforseoService.ts:654-678`

**Key Code**:
```typescript
// Dynamic keyword selection
let competitorKeyword = businessName;
const originalSearchKeyword = businessProfile.serpResult?.serpJob?.keyword;
if (originalSearchKeyword) {
  competitorKeyword = originalSearchKeyword;
} else if (keywordRankings.length > 0) {
  competitorKeyword = keywordRankings[0].keyword;
}

// Location-aware search
const searchLocation = `${businessProfile.city}, ${businessProfile.state}`;
localCompetitorsData = await dataForSEOService.searchLocalPack({
  keyword: competitorKeyword,
  location: searchLocation,
  device: 'desktop',
  limit: 20
});
```

**Frontend Display**:
- Location: `client/pages/BusinessProfilePage.tsx:482-540`
- Shows in Competitors section and SEO & PPC tab
- Displays: name, domain, rating, reviews, comparison status

### Data Structure

```typescript
{
  localCompetitors: {
    count: 5,
    items: [
      {
        name: "Competitor Name",
        domain: "competitor.com",
        address: "123 Main St",
        rating: 4.5,
        reviewsCount: 120
      }
    ]
  }
}
```

---

## 🔌 API Endpoints

### Business Profile Endpoints

#### `GET /api/serp/business/:profileId`
Get basic business profile (database)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Business Name",
    "domain": "business.com",
    "needsLiveData": ["seo-ppc", "ads", "reputation"]
  }
}
```

#### `GET /api/serp/business/:profileId/seo-ppc`
Get SEO & PPC analysis (live API)

**Query Params**:
- `location` (optional): Override location

**Response**:
```json
{
  "success": true,
  "data": {
    "serpPosition": 5,
    "schemas": {...},
    "analytics": {...},
    "ppcStatus": {...},
    "speedScores": {...},
    "localCompetitors": {
      "count": 5,
      "items": [...]
    },
    "opportunityScore": 75,
    "recommendations": [...]
  },
  "isFromLiveAPI": true
}
```

#### `GET /api/serp/business/:profileId/ads`
Get ads analysis (live API)

#### `GET /api/serp/business/:profileId/reputation`
Get reputation analysis (live API)

### Prospect Search Endpoints

#### `POST /api/serp/search-prospects`
Search for businesses

**Body**:
```json
{
  "keyword": "spine center",
  "location": "Chesterfield, MO"
}
```

### Watchlist Endpoints

#### `POST /api/serp/watchlist/add`
Add to watchlist

#### `GET /api/serp/watchlist`
Get watchlist items

---

## 🗄️ Database Schema

### Core Tables

#### `BusinessProfile`
Main business information

**Key Fields**:
- `id`: CUID
- `name`: Business name
- `domain`: Website domain
- `city`, `state`: Location
- `rating`, `reviewsCount`: GMB data
- `seoScore`, `domainAuthority`: SEO metrics
- `serpResultId`: Link to SERP result

#### `SerpResult`
SERP data from DataForSEO

**Key Fields**:
- `id`: CUID
- `title`: Business title from SERP
- `domain`: Domain from SERP
- `rawData`: Full API response (JSON)
- `serpJobId`: Link to search job

#### `SerpJob`
Search job tracking

**Key Fields**:
- `id`: CUID
- `keyword`: Search keyword
- `location`: Search location
- `status`: Job status

#### `KeywordRanking`
Keyword ranking data

**Key Fields**:
- `id`: CUID
- `businessProfileId`: Link to business
- `keyword`: Keyword
- `rankAbsolute`: Ranking position
- `url`: Ranking URL

### Relationships

```
SerpJob → SerpResult → BusinessProfile
                ↓
         KeywordRanking
```

---

## 🔧 Services & Components

### Backend Services

#### `dataforseoService.ts`
DataForSEO API integration

**Key Methods**:
- `searchLocalPack()`: Find local competitors
- `searchOrganic()`: Organic SERP search
- `getOnPageAnalysis()`: On-page SEO analysis
- `getAdsForDomain()`: Ads search
- `getLocationCode()`: Location code lookup

#### `googleApiService.ts`
Google APIs integration

**Key Methods**:
- `getPageSpeedInsights()`: PageSpeed analysis
- `checkSafeBrowsing()`: Security check
- `getPlaceDetails()`: Google Places data

#### `htmlAnalysisService.ts`
HTML analysis

**Key Methods**:
- `fetchHTML()`: Fetch website HTML
- `detectAnalytics()`: Detect GA, Facebook Pixel
- `detectSchemas()`: Detect schema markup
- `validateSchemas()`: Validate schema JSON-LD

#### `scoreCalculationService.ts`
Score calculations

**Key Methods**:
- `calculateOpportunityScore()`: Overall opportunity score
- `calculateOpportunityScoreBreakdown()`: Score breakdown
- `generateRecommendations()`: SEO recommendations

### Frontend Components

#### `BusinessProfilePage.tsx`
Main business profile page

**Features**:
- Tab navigation (Overview, SEO & PPC, Ads, Reputation)
- Lazy loading of live data
- Competitor display
- Score visualization

#### `ProspectFinderAgent.tsx`
Prospect search interface

**Features**:
- Keyword and location search
- Results grid
- Map visualization
- Add to watchlist

---

## 📊 Data Flow

### Prospect Discovery Flow

```
1. User searches "spine center" in "Chesterfield, MO"
   ↓
2. Frontend calls POST /api/serp/search-prospects
   ↓
3. Backend calls DataForSEO Maps API
   ↓
4. Results stored in SerpJob → SerpResult → BusinessProfile
   ↓
5. Frontend displays results
```

### Business Profile Flow

```
1. User opens business profile
   ↓
2. GET /api/serp/business/:id (database)
   ↓
3. Frontend displays basic info
   ↓
4. User clicks "SEO & PPC" tab
   ↓
5. GET /api/serp/business/:id/seo-ppc (live API)
   ↓
6. Backend fetches:
   - HTML Analysis
   - PageSpeed
   - Safe Browsing
   - Competitors (location-aware)
   ↓
7. Frontend displays detailed analysis
```

### Competitor Data Flow

```
1. User clicks SEO & PPC tab
   ↓
2. Backend determines competitor keyword:
   - Original search keyword (priority 1)
   - Top ranking keyword (priority 2)
   - Category from name (priority 3)
   - Business name (fallback)
   ↓
3. Backend searches Local Pack:
   - Keyword: determined keyword
   - Location: "City, State" format
   - Location code: from CSV lookup
   ↓
4. Results filtered:
   - Exclude current business
   - Limit to top 5
   ↓
5. Return competitor data
```

---

## 🚀 Deployment

### Backend (Railway)

**Build Command**: `pnpm install && pnpm build`  
**Start Command**: `pnpm start`

**Environment Variables**:
```
DATABASE_URL=mysql://...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
GOOGLE_PAGESPEED_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_SAFE_BROWSING_API_KEY=...
```

**Branch**: `hybrid-model-implementation`

See: `docs/current/RAILWAY_DEPLOYMENT_GUIDE.md`

### Frontend (cPanel)

**Build**: `pnpm build`  
**Deploy**: Upload `dist/` to cPanel public_html

See: `docs/current/CPANEL_DEPLOYMENT_GUIDE.md`

---

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- pnpm
- MySQL database
- API keys (DataForSEO, Google)

### Setup Steps

1. **Clone and Install**:
```bash
cd Ensemblenew
pnpm install
```

2. **Database Setup**:
```bash
# Copy .env.example to .env
# Set DATABASE_URL
pnpm prisma migrate dev
pnpm prisma generate
```

3. **Environment Variables**:
```bash
# .env
DATABASE_URL=mysql://...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
GOOGLE_PAGESPEED_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_SAFE_BROWSING_API_KEY=...
DEV_API_PORT=3001
```

4. **Start Development**:
```bash
# Terminal 1: Backend
pnpm tsx server/dev.ts

# Terminal 2: Frontend
pnpm dev
```

5. **Access**:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

See: `docs/current/LOCAL_DEVELOPMENT_SETUP.md`

---

## ✨ Key Features

### 1. Hybrid Model
- Fast initial loads (database)
- Fresh data on demand (APIs)
- Cost-effective API usage

### 2. Location-Aware Competitor Search
- Dynamic keyword selection
- Location-based competitor finding
- Smart filtering

### 3. Comprehensive Business Intelligence
- SEO analysis
- PPC status
- Reputation tracking
- Competitor comparison

### 4. Prospect Discovery
- Google Maps integration
- Local Pack search
- Automatic profile creation

### 5. Watchlist Management
- Track prospects
- Monitor competitors
- Organize businesses

---

## 🔍 Troubleshooting

### Competitor Data Not Showing

**Symptoms**: "No competitor data available" message

**Solutions**:
1. Check server logs for location and keyword used
2. Verify location format is "City, State"
3. Check DataForSEO API response
4. Verify business has keyword rankings or serpJob

### API Errors

**Symptoms**: 500 errors, rate limit errors

**Solutions**:
1. Check API keys in environment variables
2. Verify rate limits not exceeded
3. Check DataForSEO account balance
4. Review API response in logs

### Database Connection Issues

**Symptoms**: Prisma errors, connection refused

**Solutions**:
1. Verify DATABASE_URL in .env
2. Check MySQL is running
3. Verify database exists
4. Run `pnpm prisma generate`

### Frontend Not Loading

**Symptoms**: Blank page, 404 errors

**Solutions**:
1. Check frontend build completed
2. Verify Vite dev server running
3. Check browser console for errors
4. Clear browser cache

---

## 📚 Additional Documentation

- **Hybrid Model**: `docs/current/HYBRID_MODEL_VERIFICATION.md`
- **API Reference**: `docs/current/SERP_INTELLIGENCE_API_DOCUMENTATION.md`
- **Database Schema**: `docs/current/SERP_INTELLIGENCE_DATABASE_SCHEMA.md`
- **Deployment**: `docs/current/RAILWAY_DEPLOYMENT_GUIDE.md`
- **Development**: `docs/current/LOCAL_DEVELOPMENT_SETUP.md`

---

## 🔄 Recent Updates

### January 2025

1. **Competitor Data System** ✅
   - Dynamic keyword selection
   - Location-aware search
   - Smart filtering

2. **Hybrid Model** ✅
   - Database-first loading
   - On-demand live APIs
   - Cost optimization

3. **Location Handling** ✅
   - Proper location format validation
   - CSV-based location code lookup
   - Location-aware competitor search

---

**Documentation Version**: 1.0  
**Last Updated**: January 2025  
**Maintained By**: Development Team

