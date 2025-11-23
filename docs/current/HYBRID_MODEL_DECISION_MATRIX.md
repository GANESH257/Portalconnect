# Hybrid Model Decision Matrix

## 🎯 When to Use Database vs Live API

This document provides clear guidelines for deciding whether to use database or live API for each data field and use case.

---

## 📊 Decision Criteria

### Use Database When:
- ✅ Data is **static** or changes **rarely** (weekly/monthly)
- ✅ Data is needed for **initial display** (list views, cards)
- ✅ **Performance** is critical (<500ms response time)
- ✅ **Cost** must be minimized ($0 per request)
- ✅ Data is **historical** (snapshot in time)

### Use Live API When:
- ✅ Data is **dynamic** or changes **frequently** (daily/hourly)
- ✅ Data is needed for **detailed analysis** (tab views)
- ✅ **Freshness** is critical (real-time data)
- ✅ Data is **user-triggered** (on tab click)
- ✅ Data is **current** (current state)

### Use Hybrid When:
- ✅ Data can be **cached** but needs **refresh option**
- ✅ Data is **mostly static** but may change
- ✅ **Performance** is important but **freshness** is also needed
- ✅ Data has **fallback** to cached version

---

## 🔍 Field-by-Field Decision Matrix

| Data Field | Current Source | Reason | Update Frequency | Alternative |
|------------|---------------|--------|------------------|-------------|
| **Basic Business Info** | | | | |
| `name` | Database | Static, rarely changes | Monthly | N/A |
| `domain` | Database | Static, rarely changes | Never | N/A |
| `address` | Database | Static, rarely changes | Monthly | N/A |
| `phone` | Database | Static, rarely changes | Monthly | N/A |
| `city`, `state`, `zipCode` | Database | Static, rarely changes | Never | N/A |
| **Ratings & Reviews** | | | | |
| `rating` | Database (initial) | Cached for initial display | Weekly | Live API (reputation tab) |
| `reviewsCount` | Database (initial) | Cached for initial display | Weekly | Live API (reputation tab) |
| `reviews[]` | Live API | Dynamic, new reviews added regularly | Daily | Database (cached snapshot) |
| **SEO Metrics** | | | | |
| `seoScore` | Database | Calculated score, can be recalculated | Monthly | Live API (recalculate) |
| `domainAuthority` | Database | Changes slowly | Monthly | Live API (refresh) |
| `backlinks` | Database | Changes slowly | Monthly | Live API (refresh) |
| `monthlyTraffic` | Database | Estimated, changes slowly | Monthly | Live API (refresh) |
| `pageSpeed` | Live API | Changes with website updates | On-demand | Database (cached, refresh monthly) |
| `mobileScore` | Live API | Changes with website updates | On-demand | Database (cached, refresh monthly) |
| `accessibilityScore` | Live API | Changes with website updates | On-demand | Database (cached, refresh monthly) |
| **Schemas & Analytics** | | | | |
| `schemas.*` | Live API | Changes when website is updated | On-demand | Database (cached, refresh on website change) |
| `analytics.*` | Live API | Changes when tracking is added/removed | On-demand | Database (cached, refresh on website change) |
| **PPC & Ads** | | | | |
| `isRunningAds` | Database (initial) | Cached for initial display | Weekly | Live API (ads tab) |
| `ads[]` | Live API | Changes frequently (daily) | On-demand | N/A (must be live) |
| `ppcStatus` | Live API | Changes frequently | On-demand | N/A (must be live) |
| **Keyword Rankings** | | | | |
| `keywordRankings[]` | Database | Historical snapshot | Monthly | Live API (refresh) |
| `serpPosition` | Database | Changes daily but cached for initial display | Daily | Live API (refresh) |
| **Reputation** | | | | |
| `responseRate` | Live API | Calculated from current reviews | On-demand | N/A (must be live) |
| `reviewVelocity` | Live API | Calculated from recent reviews | On-demand | N/A (must be live) |
| `serviceIssues` | Live API | Extracted from current reviews | On-demand | N/A (must be live) |

---

## 🎯 Use Case Decision Matrix

### Initial Display (Prospect Finder Cards)

**Use Database For:**
- ✅ Business name, domain, address, phone
- ✅ Rating, reviewsCount (cached)
- ✅ Calculated scores (seoScore, domainAuthority)
- ✅ Basic flags (isRunningAds from database)

**Don't Use Live API For:**
- ❌ Detailed reviews (not needed for cards)
- ❌ Current ads (not needed for cards)
- ❌ Real-time SEO metrics (not needed for cards)

**Result**: Fast initial load (<500ms), all data from database

---

### Business Profile Page (Initial Load)

**Use Database For:**
- ✅ Complete business profile
- ✅ Keyword rankings (top 100)
- ✅ Historical metrics
- ✅ Flag: `needsLiveData: ['seo-ppc', 'ads', 'reputation']`

**Don't Use Live API For:**
- ❌ SEO & PPC data (fetch on tab click)
- ❌ Ads data (fetch on tab click)
- ❌ Reputation data (fetch on tab click)

**Result**: Fast initial load (<100ms), flag indicates what needs live data

---

### SEO & PPC Tab (On Tab Click)

**Use Live API For:**
- ✅ On-Page Analysis (current SEO metrics)
- ✅ PageSpeed Insights (current performance)
- ✅ HTML Analysis (current schemas & analytics)
- ✅ Safe Browsing (current security status)
- ✅ Ads APIs (current PPC status)

**Don't Use Database For:**
- ❌ Speed scores (may be stale)
- ❌ Schema detection (may be outdated)
- ❌ Analytics detection (may have changed)
- ❌ PPC status (changes frequently)

**Result**: Fresh data (5-15s), real-time analysis

---

### Ads Tab (On Tab Click)

**Use Live API For:**
- ✅ Ads Search API (current ad creatives)
- ✅ Ads Advertisers API (current PPC status)

**Don't Use Database For:**
- ❌ Ad creatives (change daily)
- ❌ PPC status (changes frequently)

**Result**: Fresh ads data (2-5s), current creatives

---

### Reputation Tab (On Tab Click)

**Use Live API For:**
- ✅ Google Places API (current reviews)
- ✅ DataForSEO Reviews API (additional reviews)
- ✅ Response rate calculation (from current reviews)
- ✅ Review velocity (reviews in last 90 days)

**Don't Use Database For:**
- ❌ Reviews (new reviews added regularly)
- ❌ Response rate (changes with new reviews)
- ❌ Review velocity (time-sensitive)

**Result**: Fresh reputation data (3-8s), current reviews

---

## 🔄 Caching Strategy Decision Matrix

### No Caching (Always Live)
**Use For:**
- Ads data (changes daily)
- Current reviews (new reviews added)
- Real-time SEO metrics (speed scores)
- PPC status (changes frequently)

**Reason**: Data changes too frequently to cache effectively

---

### Persistent Cache (Database)
**Use For:**
- Basic business info (rarely changes)
- Historical keyword rankings (snapshot)
- Calculated scores (can be recalculated)
- Domain authority (changes slowly)

**Reason**: Data is static or changes slowly, cache is effective

---

### Time-Based Cache (Future: Redis)
**Use For:**
- Speed scores (cache for 30 days)
- Schema detection (cache until website change)
- Analytics detection (cache until website change)
- Reviews count (cache for 7 days)

**Reason**: Data changes but not frequently, time-based cache balances freshness and performance

---

## 💰 Cost Decision Matrix

### Minimize Cost
**Strategy**: Use database for initial display, live API only when needed

**Example:**
- Search prospects: Database ($0)
- Business profile: Database ($0)
- SEO & PPC tab: Live API ($0.015-0.025) - only when user clicks
- Ads tab: Live API ($0.002-0.004) - only when user clicks
- Reputation tab: Live API ($0.003-0.006) - only when user clicks

**Total per session**: ~$0.02-0.035 (vs $0.05-0.10 for all live API)

---

### Balance Cost and Freshness
**Strategy**: Cache frequently accessed data, refresh periodically

**Example:**
- Speed scores: Cache for 30 days, refresh monthly
- Reviews count: Cache for 7 days, refresh weekly
- Domain authority: Cache in database, refresh on-demand

**Result**: Reduced API calls while maintaining reasonable freshness

---

## ⚡ Performance Decision Matrix

### Fast Initial Load
**Strategy**: Database for initial display (<500ms)

**Use Database For:**
- Search results
- Business profile basic data
- List views (watchlist, prospects)

**Result**: Fast user experience, data loads immediately

---

### On-Demand Fresh Data
**Strategy**: Live API for detailed analysis (2-15s)

**Use Live API For:**
- Detailed tabs (SEO & PPC, Ads, Reputation)
- Analysis views
- Current metrics

**Result**: Fresh data when user needs it, doesn't slow initial load

---

## 📋 Decision Flow Chart

```
Start: Need Data
│
├─ Is it for initial display?
│  ├─ Yes → Use Database
│  └─ No → Continue
│
├─ Does it change frequently (daily)?
│  ├─ Yes → Use Live API
│  └─ No → Continue
│
├─ Is it user-triggered (tab click)?
│  ├─ Yes → Use Live API
│  └─ No → Continue
│
├─ Can it be cached effectively?
│  ├─ Yes → Use Database (with refresh option)
│  └─ No → Use Live API
│
End: Choose Source
```

---

## ✅ Best Practices

1. **Always start with database** for initial display
2. **Use live API** only when user explicitly requests detailed data
3. **Cache static data** in database
4. **Don't cache dynamic data** - always fetch fresh
5. **Balance cost and freshness** - cache with refresh option
6. **Show loading states** during live API calls
7. **Handle errors gracefully** - fallback to cached data if available

---

**Last Updated**: January 2025  
**Status**: Complete Decision Matrix

