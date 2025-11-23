# Google Places, Safe Browsing & Schema Validation Implementation

## ✅ Implementation Complete

All three features have been added to the collection scripts, routes, and score calculations.

---

## 📋 What Was Added

### 1. **Google Places API** - Reviews & Ratings
- **File**: `scripts/add-google-places.ts`
- **Purpose**: Fetch business reviews and ratings from Google Places
- **Data Collected**:
  - Rating (1-5 stars)
  - Total ratings count
  - Individual reviews (author, rating, text, time)
  - Place ID
- **Storage**: `rawData.enriched.googlePlaces`
- **Display**: Reputation tab in Business Profile

### 2. **Google Safe Browsing API** - Security Checks
- **File**: `scripts/add-safe-browsing.ts`
- **Purpose**: Check if website is flagged for malware, phishing, or unwanted software
- **Data Collected**:
  - Is Safe (boolean)
  - Threats array (MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE)
  - Malware flag
  - Phishing flag
  - Unwanted Software flag
- **Storage**: `rawData.enriched.safeBrowsing`
- **Display**: SEO & PPC tab in Business Profile

### 3. **Schema Validation** - Structured Data Validation
- **File**: `scripts/add-schema-validation.ts`
- **Purpose**: Validate JSON-LD schemas for syntax errors and required fields
- **Data Collected**:
  - Valid (boolean)
  - Errors array (specific validation errors)
  - Warnings array
  - Schemas array (per-schema validation results)
- **Storage**: `rawData.enriched.schemaValidation`
- **Display**: SEO & PPC tab in Business Profile

---

## 🔧 Integration Points

### Collection Scripts
- ✅ `scripts/collect-spine-data.ts` - Added all three APIs
- ✅ `scripts/fix-single-business.ts` - Added all three APIs

### Backend Routes
- ✅ `server/routes/serp-intelligence.ts`:
  - `getBusinessProfile` - Returns `googlePlaces` data
  - `getBusinessSEOAndPPC` - Returns `safeBrowsing` and `schemaValidation` data

### Score Calculations
- ✅ **Opportunity Score** now includes:
  - Safe Browsing (10 points max) - Safe = 10, Unsafe = 0
  - Schema Validation (10 points max) - Valid = 10, Invalid = 1-7 based on error count

### Recommendations
- ✅ **Safe Browsing recommendations**:
  - CRITICAL warnings for malware/phishing
  - WARNING for unwanted software
- ✅ **Schema Validation recommendations**:
  - Lists specific schema errors
  - Shows first 3 errors in recommendations

---

## 📊 API Requirements

### Google Places API
- **API Key**: Same as PageSpeed Insights (`GOOGLE_PAGESPEED_API_KEY`)
- **Enable**: "Places API" in Google Cloud Console
- **Cost**: $0.017 per request (after free tier)
- **Rate Limit**: $200 credit/month free tier

### Google Safe Browsing API
- **API Key**: Same as PageSpeed Insights (`GOOGLE_PAGESPEED_API_KEY`)
- **Enable**: "Safe Browsing API" in Google Cloud Console
- **Cost**: FREE (10,000 requests/day free tier)
- **Rate Limit**: 10,000 requests/day

### Schema Validation
- **No API Required**: Pure JavaScript validation
- **Cost**: FREE
- **Rate Limit**: None

---

## 🎯 UI Updates Needed

### Reputation Tab
- [ ] Display Google Places reviews
- [ ] Show individual review cards (author, rating, text, date)
- [ ] Display Google Places rating vs. DataForSEO rating

### SEO & PPC Tab
- [ ] Display Safe Browsing status (Safe/Unsafe with threat types)
- [ ] Display Schema Validation status (Valid/Invalid with error count)
- [ ] Show Core Web Vitals (LCP, FID, CLS, TTI, FCP) from PageSpeed Insights

---

## 📝 Next Steps

1. **Update BusinessProfilePage UI**:
   - Add Google Places reviews to reputation tab
   - Add Safe Browsing and Schema Validation to SEO tab
   - Display Core Web Vitals metrics

2. **Test Data Collection**:
   - Run `scripts/fix-single-business.ts` to test all three APIs
   - Verify data is stored correctly in database

3. **Verify API Keys**:
   - Ensure Places API and Safe Browsing API are enabled in Google Cloud Console
   - Test API calls work correctly

---

## ✅ Status

- ✅ Collection scripts updated
- ✅ Routes updated
- ✅ Score calculations updated
- ✅ Recommendations updated
- ⏳ UI updates pending (next step)

