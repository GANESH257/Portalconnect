# Data Collection Testing Plan for 5 Businesses

## Overview

This document outlines the plan for testing data collection with 5 businesses instead of 1, following the comprehensive documentation of the data flow system.

---

## Documentation Created

### 1. `COMPLETE_DATA_FLOW_DOCUMENTATION.md`

**Comprehensive documentation covering**:
- **Data Collection Architecture**: How data is collected from APIs
- **Data Components by Category**: Detailed breakdown of each data component:
  - Page Speed Scores
  - Analytics Data (Google Analytics & Facebook Pixel)
  - Schema Markup Data
  - Ads Data (PPC/Advertising)
  - Google Places Data (Reviews & Ratings)
  - Safe Browsing Data
  - Schema Validation Data
  - SEO Metrics (Domain Authority, Backlinks, Traffic)
  - Keyword Rankings
- **Database Storage Structure**: Where and how data is stored
- **Route Handler Data Flow**: How data flows through API routes
- **Frontend Data Access**: How the UI accesses and displays data
- **Data Component Summary Table**: Quick reference for all components

**For each component, the documentation includes**:
- Data Source (which API)
- Collection Process (code location and logic)
- Database Storage (table and field locations)
- Route Handler Access (how routes retrieve data)
- Frontend Access (how UI displays data)

---

## Changes Made

### 1. Updated Collection Script

**File**: `scripts/collect-spine-data.ts`
**Change**: Updated `BUSINESS_LIMIT` from `1` to `5`

```typescript
const BUSINESS_LIMIT = LIMIT_ARG 
  ? parseInt(LIMIT_ARG.split("=")[1]) 
  : 5; // Default: Collect 5 businesses for testing
```

**Impact**: The script will now collect data for 5 businesses by default instead of 1.

### 2. Created Verification Script

**File**: `scripts/verify-5-businesses.ts`

**Purpose**: Verify that all 5 businesses have complete data for all components.

**Checks**:
- ✅ Speed Scores (desktop, mobile, accessibility)
- ✅ Analytics (Google Analytics, Facebook Pixel)
- ✅ Schemas (LocalBusiness, FAQ, etc.)
- ✅ Ads data
- ✅ Google Places data
- ✅ Safe Browsing data
- ✅ Schema Validation data
- ✅ SEO Metrics (domain authority, backlinks, traffic)

**Output**: 
- Individual business reports
- Overall summary with completeness percentage
- Component coverage statistics
- List of missing data issues

---

## Testing Plan

### Step 1: Run Data Collection

```bash
cd /Users/ganesh/Desktop/Ensemblenew
pnpm tsx scripts/collect-spine-data.ts
```

**Expected**:
- Discovers businesses for "Spine" in "Chesterfield, MO"
- Processes top 5 businesses
- Collects all data components for each business
- Stores data in database

**Time Estimate**: 10-15 minutes (due to API rate limiting and async tasks)

### Step 2: Verify Data Collection

```bash
pnpm tsx scripts/verify-5-businesses.ts
```

**Expected Output**:
- List of 5 businesses with completeness scores
- Component coverage for each business
- Overall summary showing average completeness
- List of any missing data

**Success Criteria**:
- All 5 businesses have at least 80% completeness
- Speed scores present for all businesses
- Analytics data present for all businesses
- Schemas detected for all businesses
- Ads data present (if businesses are running ads)

### Step 3: Test UI Display

1. **Start Development Server**:
   ```bash
   pnpm dev
   ```

2. **Navigate to Prospect Finder**:
   - Go to `http://localhost:8082/agents/prospect-finder`
   - Search for "Spine" in "Chesterfield, MO"
   - Verify 5 businesses appear in results

3. **Test Each Business Profile**:
   - Click on each of the 5 businesses
   - Verify all tabs display correctly:
     - **Overview**: Basic business info
     - **SEO & PPC**: Speed scores, analytics, schemas, recommendations
     - **Ads**: Ad creatives (if available)
     - **Reputation**: Reviews and ratings
   - Check that data loads quickly (from database, not API)

4. **Verify Data Accuracy**:
   - Compare UI data with database data
   - Verify speed scores match stored values
   - Verify analytics detection matches stored data
   - Verify schemas match stored data

### Step 4: Document Issues

If any issues are found:
- Document which business has the issue
- Document which component is missing/incorrect
- Document the expected vs actual behavior
- Create fix plan

---

## Expected Results

### Database Records

**5 `business_profiles` records** with:
- `pageSpeed` and `mobileScore` populated
- `domainAuthority`, `backlinks`, `monthlyTraffic` populated
- `seoScore` calculated
- `isPaid` flag set correctly

**5 `serp_results` records** with:
- `raw_data.enriched.pageSpeedInsights` populated
- `raw_data.enriched.analytics` populated
- `raw_data.enriched.schemas` populated
- `raw_data.enriched.adsCreatives` populated (if available)
- `raw_data.enriched.googlePlaces` populated
- `raw_data.enriched.safeBrowsing` populated
- `raw_data.enriched.schemaValidation` populated

### UI Display

**All 5 businesses should display**:
- ✅ Speed scores in SEO & PPC tab
- ✅ Analytics status in SEO & PPC tab
- ✅ Schema status in SEO & PPC tab
- ✅ Ads data in Ads tab (if running ads)
- ✅ Reviews in Reputation tab
- ✅ Fast loading (database-only, no API calls)

---

## Troubleshooting

### Issue: Missing Speed Scores

**Check**:
1. Verify `GOOGLE_PAGESPEED_API_KEY` is set in `.env`
2. Check if On-Page API completed successfully
3. Verify `businessProfile.pageSpeed` is populated
4. Check `raw_data.enriched.pageSpeedInsights` exists

**Fix**: Run `scripts/update-pagespeed-data.ts` for specific business

### Issue: Missing Analytics/Schemas

**Check**:
1. Verify HTML was fetched successfully (check for 403/404 errors)
2. Check `raw_data.enriched.analytics` exists
3. Check `raw_data.enriched.schemas` exists

**Fix**: Run `scripts/update-analytics-schemas.ts` for specific business

### Issue: Missing Ads Data

**Check**:
1. Verify business is actually running ads
2. Check `raw_data.enriched.adsCreatives` exists
3. Check `businessProfile.isPaid` flag

**Note**: Not all businesses run ads - this is expected

### Issue: Route Returns Null Data

**Check**:
1. Verify `businessProfile.serpResultId` is set correctly
2. Check if linked `serpResult` has enriched data
3. Verify route's dynamic search logic is working

**Fix**: Check route logs for "Found serpResult with enriched data" messages

---

## Next Steps After Testing

1. **If All Tests Pass**:
   - Document successful test results
   - Consider increasing to 10 or 20 businesses
   - Optimize collection script for larger batches

2. **If Issues Found**:
   - Fix identified issues
   - Re-run collection for affected businesses
   - Re-verify data

3. **Performance Optimization**:
   - Measure collection time per business
   - Identify bottlenecks
   - Optimize API call sequencing
   - Consider parallel processing for independent APIs

---

## Files Modified/Created

### Modified
- `scripts/collect-spine-data.ts` - Changed `BUSINESS_LIMIT` to 5

### Created
- `COMPLETE_DATA_FLOW_DOCUMENTATION.md` - Comprehensive data flow documentation
- `scripts/verify-5-businesses.ts` - Verification script
- `DATA_COLLECTION_TESTING_PLAN.md` - This file

---

## Quick Reference Commands

```bash
# Run data collection for 5 businesses
pnpm tsx scripts/collect-spine-data.ts

# Verify collected data
pnpm tsx scripts/verify-5-businesses.ts

# Update PageSpeed data for a specific business
pnpm tsx scripts/update-pagespeed-data.ts

# Update Analytics/Schemas for a specific business
pnpm tsx scripts/update-analytics-schemas.ts

# Start development server
pnpm dev
```

---

**Ready for Testing**: ✅
**Documentation Complete**: ✅
**Verification Script Ready**: ✅

