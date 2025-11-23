# Free APIs for Business Intelligence Data

## Overview
This document lists free APIs that can supplement or replace DataForSEO APIs for collecting business intelligence data.

---

## 1. Google PageSpeed Insights API ✅ **RECOMMENDED**

### What It Provides:
- **Performance Score** (0-100) - Desktop and Mobile
- **Accessibility Score** (0-100) - WCAG compliance
- **SEO Score** (0-100) - SEO best practices
- **Best Practices Score** (0-100) - Code quality and security
- **Core Web Vitals**:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
  - Time to Interactive (TTI)
  - Speed Index
- **Opportunities** - Specific recommendations for improvement
- **Diagnostics** - Detailed performance insights

### Requirements:
- ✅ **FREE** - No cost
- ✅ **API Key** - Free from Google Cloud Console (requires signup)
- ✅ **Rate Limit** - 25,000 requests per day (free tier)
- ✅ **No Subscription** - Just need Google account

### Setup:
1. Go to https://console.cloud.google.com/
2. Create a project (free)
3. Enable "PageSpeed Insights API"
4. Create API key
5. Add to `.env`: `GOOGLE_PAGESPEED_API_KEY=your_key_here`

### API Endpoint:
```
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
```

### Use Case:
- ✅ Replace On-Page API for speed scores (when On-Page fails)
- ✅ Get SEO best practices score
- ✅ Get accessibility score
- ✅ Get detailed performance recommendations

---

## 2. Lighthouse (Programmatic) ✅ **RECOMMENDED**

### What It Provides:
- **Performance Score** (0-100)
- **Accessibility Score** (0-100)
- **SEO Score** (0-100)
- **Best Practices Score** (0-100)
- **PWA Score** (0-100)
- **All Core Web Vitals**
- **Detailed audits and recommendations**

### Requirements:
- ✅ **FREE** - Open source, no cost
- ✅ **No API Key** - No signup required
- ✅ **No Rate Limits** - Run locally
- ⚠️ **Resource Intensive** - Requires headless browser (Puppeteer/Playwright)

### Setup:
```bash
npm install lighthouse puppeteer
```

### Use Case:
- ✅ Fallback when PageSpeed Insights API key not available
- ✅ Run locally without API calls
- ✅ Get all Lighthouse data programmatically

---

## 3. WebPageTest API ⚠️ **LIMITED FREE TIER**

### What It Provides:
- **Performance Metrics** - Load time, Speed Index, etc.
- **Waterfall Charts** - Resource loading breakdown
- **Core Web Vitals**
- **Multiple Locations** - Test from different locations

### Requirements:
- ✅ **FREE Tier** - Limited requests
- ⚠️ **API Key** - Requires signup at webpagetest.org
- ⚠️ **Rate Limits** - Free tier has limits

### Use Case:
- Alternative performance testing
- Detailed resource loading analysis

---

## 4. GTmetrix API ⚠️ **REQUIRES SIGNUP**

### What It Provides:
- **Performance Scores**
- **Page Load Details**
- **Optimization Recommendations**

### Requirements:
- ⚠️ **Free Tier** - Limited requests
- ⚠️ **API Key** - Requires signup
- ⚠️ **Rate Limits** - Free tier restrictions

### Use Case:
- Alternative performance testing
- Detailed optimization recommendations

---

## 5. Google Places API (for Reviews) ⚠️ **PAID BUT HAS FREE TIER**

### What It Provides:
- **Business Reviews** - Google reviews
- **Business Details** - Name, address, phone, hours
- **Ratings** - Average rating, review count
- **Photos** - Business photos

### Requirements:
- ⚠️ **Free Tier** - $200 free credit/month
- ⚠️ **API Key** - Requires Google Cloud account
- ⚠️ **Cost** - $0.017 per request after free tier

### Use Case:
- Get Google reviews (alternative to DataForSEO Reviews API)
- Get business details

---

## 6. OpenStreetMap Nominatim API ✅ **FREE, NO SIGNUP**

### What It Provides:
- **Geocoding** - Address to coordinates
- **Reverse Geocoding** - Coordinates to address
- **Place Details** - Basic business information

### Requirements:
- ✅ **FREE** - No cost
- ✅ **No API Key** - No signup required
- ⚠️ **Rate Limits** - 1 request per second (can be increased with email)

### Use Case:
- Get coordinates for businesses missing lat/lng
- Reverse geocoding for address validation

---

## 7. Moz API ⚠️ **PAID**

### What It Provides:
- **Domain Authority** - Moz DA score
- **Page Authority** - Moz PA score
- **Backlinks** - Link data
- **Keyword Rankings**

### Requirements:
- ❌ **PAID** - Requires subscription
- ❌ **API Key** - Requires paid account

### Use Case:
- Alternative domain authority source (but requires payment)

---

## 8. Ahrefs API ⚠️ **PAID**

### What It Provides:
- **Domain Rating** - Ahrefs DR score
- **Backlinks** - Comprehensive backlink data
- **Keyword Rankings**
- **Traffic Estimates**

### Requirements:
- ❌ **PAID** - Requires subscription
- ❌ **API Key** - Requires paid account

### Use Case:
- Alternative to DataForSEO (but requires payment)

---

## Recommended Implementation Strategy

### Priority 1: Google PageSpeed Insights API ✅
- **Why**: Free, provides SEO score, accessibility, performance, best practices
- **When**: Use as primary source for speed scores when On-Page API fails
- **Setup**: Requires Google Cloud account (free) and API key

### Priority 2: Lighthouse (Programmatic) ✅
- **Why**: Free, no API key, provides all scores
- **When**: Fallback when PageSpeed Insights not configured
- **Setup**: Install npm package, run locally

### Priority 3: OpenStreetMap Nominatim ✅
- **Why**: Free, no signup, provides coordinates
- **When**: Fill missing lat/lng for businesses
- **Setup**: No setup needed, just make HTTP requests

### Priority 4: Google Places API ⚠️
- **Why**: Can get reviews and business details
- **When**: Alternative to DataForSEO Reviews API
- **Setup**: Requires Google Cloud account, has free tier

---

## Implementation Plan

1. **Enhance PageSpeed Insights Integration**
   - Extract ALL data: performance, accessibility, SEO, best practices
   - Extract Core Web Vitals metrics
   - Extract opportunities and diagnostics
   - Store in `enriched.pageSpeedInsights`

2. **Add Lighthouse Fallback**
   - Install lighthouse + puppeteer
   - Run programmatically when PageSpeed Insights not available
   - Extract same data as PageSpeed Insights

3. **Add OpenStreetMap for Missing Coordinates**
   - Use Nominatim API to geocode addresses
   - Fill missing lat/lng for businesses

4. **Consider Google Places for Reviews**
   - If DataForSEO Reviews API continues to fail
   - Use Google Places API (has free tier)

---

## Cost Comparison

| API | Cost | Signup Required | Rate Limits |
|-----|------|----------------|-------------|
| Google PageSpeed Insights | FREE | Yes (Google account) | 25k/day |
| Lighthouse | FREE | No | None |
| OpenStreetMap Nominatim | FREE | No | 1 req/sec |
| Google Places | $200 free/month | Yes | Varies |
| WebPageTest | FREE tier | Yes | Limited |
| GTmetrix | FREE tier | Yes | Limited |

---

## Next Steps

1. ✅ Enhanced PageSpeed Insights integration (done)
2. ⏳ Add Lighthouse programmatic fallback
3. ⏳ Add OpenStreetMap for missing coordinates
4. ⏳ Test and verify all data is collected

