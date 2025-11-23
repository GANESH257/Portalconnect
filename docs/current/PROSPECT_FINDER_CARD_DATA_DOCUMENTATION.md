# Prospect Finder - Initial Card Data Display Documentation

## 📋 Overview

This document explains **all data fields displayed in the initial result cards** when viewing search results in the Prospect Finder page.

---

## 🎨 Card Display Modes

The Prospect Finder supports **3 view modes**:
1. **List View** (default) - Detailed card layout
2. **Table View** - Tabular data format
3. **Grid View** - Compact card grid

---

## 📊 List View Card (Default) - Complete Data Display

### **Card Header Section**

#### **1. Rank/Position Badge**
- **Field**: `prospect.rank` or `index + 1`
- **Display**: `#{rank}` badge
- **Source**: From API response or calculated from position
- **Location**: Top-left of card

#### **2. Business Name**
- **Field**: `prospect.title` OR `prospect.clinic` OR `prospect.name`
- **Display**: Large heading text
- **Source**: 
  - **Database-Only**: `business_profiles.name` or `serp_results.title`
  - **Collection**: Phase 1 - Maps/Local Pack/Business Listings APIs
- **Location**: Next to rank badge

#### **3. Running Ads Badge** (Conditional)
- **Field**: `prospect.isRunningAds`
- **Display**: Purple badge with "Running Ads" text
- **Additional**: Shows `prospect.approxAdsCount` if available
- **Source**: 
  - **Database-Only**: `business_profiles.isPaid` or `rawData.ads.matched`
  - **Collection**: Phase 2 - Ads Advertisers API
- **Location**: Next to business name

---

### **Main Information Grid** (4 columns)

#### **4. Category**
- **Field**: `prospect.category`
- **Display**: Building icon + category text
- **Fallback**: "Business" if not available
- **Source**: 
  - **Database-Only**: `business_profiles.category` or `serp_results.resultType`
  - **Collection**: Phase 1 - Maps/Local Pack APIs
- **Location**: First column

#### **5. Location**
- **Field**: `prospect.city` OR `prospect.address`
- **Display**: MapPin icon + location text
- **Fallback**: "Unknown" if not available
- **Source**: 
  - **Database-Only**: `business_profiles.city` or `business_profiles.address`
  - **Collection**: Phase 1 - Maps/Local Pack APIs, Phase 2 - GMB Info API
- **Location**: Second column

#### **6. Rating & Reviews**
- **Fields**: 
  - `prospect.rating.value` OR `prospect.rating` (rating value)
  - `prospect.rating.votes_count` OR `prospect.reviewsCount` OR `prospect.reviews` (review count)
- **Display**: Star icon + "X.X (XX)" format
- **Example**: "4.5 (120)"
- **Source**: 
  - **Database-Only**: `business_profiles.rating`, `business_profiles.reviewsCount`
  - **Collection**: Phase 1 - Maps/Local Pack APIs, Phase 2 - Reviews API, Google Places API
- **Location**: Third column

#### **7. Lead Score**
- **Field**: `prospect.comprehensiveScore.leadScore` OR `prospect.score`
- **Display**: TrendingUp icon + "Lead Score: XX/100"
- **Fallback**: Shows `prospect.score` if comprehensiveScore not available
- **Calculation**: 
  - Formula: `0.30 * presenceScore + 0.35 * seoScore + 0.25 * adsScore + 0.10 * engagementScore`
  - Calculated on frontend from available data
- **Source**: Calculated on-the-fly from other fields
- **Location**: Fourth column

---

### **Score Breakdown Section** (If Available)

#### **8. Comprehensive Score Breakdown**
- **Fields**:
  - `prospect.comprehensiveScore.presenceScore` - Presence score (0-100)
  - `prospect.comprehensiveScore.seoScore` - SEO score (0-100)
  - `prospect.comprehensiveScore.adsActivityScore` - Ads activity score (0-100)
  - `prospect.comprehensiveScore.engagementScore` - Engagement score (0-100)
- **Display**: Blue background box with 4 metrics in 2x2 grid
- **Calculation**: Calculated on frontend:
  - **Presence Score**: `(rating - 1) / 4 * 100 * 0.4 + Math.min(100, Math.log10(1 + reviewCount) * 20) * 0.4 + (hasWebsite && hasPhone && hasAddress ? 20 : 0)`
  - **SEO Score**: `(hasWebsite ? 60 : 0) + (reviewCount > 10 ? 20 : 0) + (rating > 4.0 ? 20 : 0)`
  - **Ads Score**: `(ad_count || 0) * 10`
  - **Engagement Score**: `(rating - 1) / 4 * 100 * 0.5 + Math.min(100, reviewCount / 10) * 0.5`
- **Location**: Below main information grid

---

### **Recommendations Section** (If Available)

#### **9. Improvement Opportunities**
- **Field**: `prospect.recommendations` (array)
- **Display**: Yellow background boxes with bullet points
- **Shows**: Up to 3 recommendations
- **Generated**: Based on score thresholds:
  - "Improve Google Business Profile completeness" (if presenceScore < 70)
  - "Optimize website for local SEO" (if seoScore < 60)
  - "Consider local advertising opportunities" (if adsScore < 30)
  - "Increase customer engagement and reviews" (if engagementScore < 60)
- **Location**: Below score breakdown

---

### **Highlights Section**

#### **10. Highlights Badges**
- **Field**: `prospect.highlights` (array)
- **Display**: Small badges in a flex wrap
- **Fallback**: Shows "High Rating" badge if no highlights available
- **Source**: From API response or mock data
- **Location**: Below recommendations

---

### **Contact & Details Grid** (3 columns)

#### **11. Contact Information**
- **Fields**:
  - **Phone**: `prospect.phone` - Phone icon + phone number (or "N/A")
  - **Email**: `prospect.email` - Mail icon + email address (or "N/A")
  - **Website**: `prospect.website` OR `prospect.url` - Globe icon + website URL (or "N/A")
- **Source**: 
  - **Database-Only**: `business_profiles.phone`, `business_profiles.email`, `business_profiles.websiteUrl`
  - **Collection**: Phase 1 - Maps/Local Pack APIs, Phase 2 - GMB Info API
- **Location**: First column

#### **12. Specialties**
- **Field**: `prospect.specialties` (array)
- **Display**: Outline badges in flex wrap
- **Fallback**: Shows "General Practice" badge if no specialties available
- **Source**: 
  - **Database-Only**: `business_profiles.specialties` (JSON array)
  - **Collection**: Phase 2 - GMB Info API
- **Location**: Second column

#### **13. Insurance Accepted**
- **Field**: `prospect.insurance` (array)
- **Display**: Outline badges in flex wrap
- **Fallback**: Shows "Most Insurance" badge if no insurance data available
- **Source**: 
  - **Database-Only**: `business_profiles.insuranceAccepted` (JSON array)
  - **Collection**: Phase 2 - GMB Info API
- **Location**: Third column

---

### **Action Buttons Section**

#### **14. Action Buttons**
- **Add to Watchlist**: Opens watchlist modal
- **Add to Prospects**: Adds to prospects collection
- **Scrape**: Website scraping action (future feature)
- **Last Updated**: Shows `prospect.lastUpdated` timestamp

---

## 📋 Table View - Complete Data Display

When in **Table View**, the following columns are displayed:

| Column | Field | Source |
|--------|-------|--------|
| **#** | `prospect.rank` or `index + 1` | Calculated |
| **Name** | `prospect.title` OR `prospect.clinic` OR `prospect.name` | Database: `business_profiles.name` |
| **Category** | `prospect.category` | Database: `business_profiles.category` |
| **Address** | `prospect.address` | Database: `business_profiles.address` |
| **City** | `prospect.city` | Database: `business_profiles.city` |
| **State** | `prospect.state` | Database: `business_profiles.state` |
| **ZIP** | `prospect.zipCode` | Database: `business_profiles.zipCode` |
| **Phone** | `prospect.phone` | Database: `business_profiles.phone` |
| **Website** | `prospect.website` OR `prospect.url` | Database: `business_profiles.websiteUrl` |
| **Domain** | `prospect.domain` | Database: `business_profiles.domain` |
| **Rating** | `prospect.rating.value` OR `prospect.rating` | Database: `business_profiles.rating` |
| **Reviews** | `prospect.rating.votes_count` OR `prospect.reviewsCount` | Database: `business_profiles.reviewsCount` |
| **Lead Score** | `prospect.comprehensiveScore.leadScore` OR `prospect.score` | Calculated |
| **Place ID** | `prospect.placeId` | Database: `business_profiles.placeId` |
| **CID** | `prospect.cid` | Database: `business_profiles.cid` |
| **Lat** | `prospect.lat` | Database: From `rawData` coordinates |
| **Lng** | `prospect.lng` | Database: From `rawData` coordinates |

---

## 🎯 Grid View - Compact Data Display

When in **Grid View**, each card shows:

1. **Rank Badge**: `#{rank}`
2. **Lead Score**: `Lead {leadScore}/100`
3. **Business Name**: `title` OR `clinic` OR `name`
4. **Category**: `category`
5. **Address**: `address`
6. **City**: `city`
7. **Phone**: `phone`
8. **Website**: `website` OR `url`
9. **Rating**: `rating` (X.X) with review count
10. **Highlights**: Up to 3 highlight badges
11. **Action Buttons**: Watchlist, Prospect buttons

---

## 🔄 Data Flow: Backend → Frontend → Display

### **Step 1: Backend API Response**
```typescript
// POST /api/serp/search-prospects
// Returns: { success: true, data: { businesses: [...] } }
```

### **Step 2: Frontend Enrichment**
```typescript
// Lines 221-303: enrichBusinesses function
// Maps backend response to enriched format with:
// - Calculated scores (presenceScore, seoScore, adsScore, engagementScore, leadScore)
// - Recommendations array
// - Normalized field names
```

### **Step 3: Display in Cards**
```typescript
// Lines 1262-1469: List view card rendering
// Uses enriched business data to display all fields
```

---

## 📊 Complete Field Mapping

### **Fields from Backend API Response**

| Frontend Field | Backend Field | Database Table | Collection Phase |
|---------------|---------------|----------------|------------------|
| `title` / `name` | `business.name` | `business_profiles.name` | Phase 1 |
| `category` | `business.category` | `business_profiles.category` | Phase 1 |
| `address` | `business.address` | `business_profiles.address` | Phase 1, Phase 2 |
| `city` | `business.city` | `business_profiles.city` | Phase 1, Phase 2 |
| `state` | `business.state` | `business_profiles.state` | Phase 1, Phase 2 |
| `zipCode` | `business.zipCode` | `business_profiles.zipCode` | Phase 1, Phase 2 |
| `phone` | `business.phone` | `business_profiles.phone` | Phase 1, Phase 2 |
| `website` / `url` | `business.websiteUrl` | `business_profiles.websiteUrl` | Phase 1 |
| `domain` | `business.domain` | `business_profiles.domain` | Phase 1 |
| `rating` | `business.rating` | `business_profiles.rating` | Phase 1, Phase 2 |
| `reviewsCount` | `business.reviewsCount` | `business_profiles.reviewsCount` | Phase 1, Phase 2 |
| `isRunningAds` | `business.isPaid` | `business_profiles.isPaid` | Phase 2 |
| `approxAdsCount` | `business.adCount` | `rawData.enriched.adsCreativesCount` | Phase 2 |
| `placeId` | `business.placeId` | `business_profiles.placeId` | Phase 1 |
| `cid` | `business.cid` | `business_profiles.cid` | Phase 1 |
| `lat` / `lng` | `business.latitude` / `business.longitude` | From `rawData` | Phase 1 |
| `specialties` | `business.specialties` | `business_profiles.specialties` (JSON) | Phase 2 |
| `insurance` | `business.insuranceAccepted` | `business_profiles.insuranceAccepted` (JSON) | Phase 2 |
| `email` | `business.email` | `business_profiles.email` | Phase 2 |

### **Fields Calculated on Frontend**

| Field | Calculation | Source Fields |
|-------|-------------|---------------|
| `presenceScore` | `(rating - 1) / 4 * 100 * 0.4 + Math.min(100, Math.log10(1 + reviewCount) * 20) * 0.4 + (hasWebsite && hasPhone && hasAddress ? 20 : 0)` | rating, reviewCount, website, phone, address |
| `seoScore` | `(hasWebsite ? 60 : 0) + (reviewCount > 10 ? 20 : 0) + (rating > 4.0 ? 20 : 0)` | website, reviewCount, rating |
| `adsActivityScore` | `(ad_count || 0) * 10` | ad_count |
| `engagementScore` | `(rating - 1) / 4 * 100 * 0.5 + Math.min(100, reviewCount / 10) * 0.5` | rating, reviewCount |
| `leadScore` | `0.30 * presenceScore + 0.35 * seoScore + 0.25 * adsScore + 0.10 * engagementScore` | All above scores |
| `recommendations` | Array based on score thresholds | All scores |

---

## 🎨 Visual Layout Summary

### **List View Card Structure**:
```
┌─────────────────────────────────────────────────────────┐
│ [#Rank] Business Name [Running Ads Badge]               │
├─────────────────────────────────────────────────────────┤
│ [Category] [Location] [Rating] [Lead Score]            │
├─────────────────────────────────────────────────────────┤
│ Score Breakdown:                                        │
│   Presence: XX  SEO: XX  Ads: XX  Engagement: XX        │
├─────────────────────────────────────────────────────────┤
│ Improvement Opportunities:                               │
│   • Recommendation 1                                    │
│   • Recommendation 2                                    │
│   • Recommendation 3                                    │
├─────────────────────────────────────────────────────────┤
│ Highlights: [Badge] [Badge] [Badge]                     │
├─────────────────────────────────────────────────────────┤
│ Contact Info    │ Specialties    │ Insurance            │
│ Phone: XXX      │ [Badge]        │ [Badge]              │
│ Email: XXX      │ [Badge]        │ [Badge]              │
│ Website: XXX    │                │                      │
├─────────────────────────────────────────────────────────┤
│ [Add to Watchlist] [Add to Prospects] [Scrape]          │
│ Last updated: XXX                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Notes

1. **Data Availability**: Not all fields may be available for every business. The UI handles missing data gracefully with fallbacks and "N/A" displays.

2. **Score Calculation**: All scores are calculated on the frontend from available data. If comprehensive data is missing, scores may be lower or incomplete.

3. **Real-time vs Cached**: In database-only mode, all data comes from pre-collected database. Scores are calculated on-the-fly from stored data.

4. **Clickable Elements**: 
   - Business name is a link to `/business/{businessProfileId}`
   - Website URL is clickable (opens in new tab)
   - Action buttons trigger respective functions

5. **Pagination**: Cards are paginated (20 per page). All data is stored in `sessionStorage` for fast pagination without re-fetching.

---

**Last Updated**: January 2025  
**Component**: `client/agents/prospect-finder/index.tsx`  
**Lines**: 1260-1471 (List View), 1472-1522 (Table View), 1523-1558 (Grid View)

