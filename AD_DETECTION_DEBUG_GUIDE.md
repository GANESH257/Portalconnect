# Ad Detection Debug Guide

## Issue
Everything shows "no ads running" even when businesses should have ads.

## Fixes Applied

### 1. Enhanced Domain Extraction
Updated `server/routes/serp-intelligence.ts` to check multiple fields for domain/website:
- `result.domain`
- `result.website`
- `result.url`
- `result.website_url`
- `result.raw_data.domain`
- `result.raw_data.website`
- `result.raw_data.url`

### 2. Improved Domain Normalization
- Removes protocols (http://, https://)
- Removes www. prefix
- Removes paths and query strings
- Normalizes to lowercase

### 3. Enhanced Logging
Added detailed console logs to debug ad enrichment:
- `[Ad Enrichment] ✅ Advertisers data fetched: X advertisers found`
- `[Ad Enrichment] Checking domain: X for business: Y`
- `[Ad Enrichment] ✅ Found advertiser ID` (when match found)
- `[Ad Enrichment] ❌ No match` (with sample domains for comparison)

## How to Test

### Step 1: Perform a Fresh Search
1. Go to Prospect Finder
2. Clear localStorage: `localStorage.clear()` in browser console
3. Search for a keyword known to have advertisers (e.g., "dental clinic", "lawyer", "plumber")
4. Check server logs: `tail -f /tmp/server.log | grep "\[Ad Enrichment\]"`

### Step 2: Check Logs
Look for these log patterns:

**Good signs:**
```
[Ad Enrichment] ✅ Advertisers data fetched: 15 advertisers found for keyword "spine clinic" in St. Louis, MO
[Ad Enrichment] Sample advertiser domains: example.com, competitor.com, ...
[Ad Enrichment] Checking domain: businessname.com for business: Business Name
[Ad Enrichment] ✅ Found advertiser ID AR123... for domain: businessname.com
```

**Problems to watch for:**
```
[Ad Enrichment] ⚠️ No advertisers data available
[Ad Enrichment] ❌ Could not fetch advertisers data
[Ad Enrichment] No domain available for: Business Name
```

### Step 3: Verify Results
- Check if `isRunningAds` badge appears in search results
- Check Business Profile → Ads tab for ad creatives

## Common Issues & Solutions

### Issue 1: No Advertisers Data
**Symptom:** Logs show "No advertisers data available"
**Possible causes:**
- DataForSEO API quota exceeded
- Invalid API credentials
- Network/timeout issues
**Solution:** Check DataForSEO API status and credentials

### Issue 2: Domains Don't Match
**Symptom:** Logs show domains being checked but "No match"
**Possible causes:**
- Domain formats differ (www vs non-www)
- Subdomain differences
- Different TLDs
**Solution:** Enhanced normalization should handle this, but check logs for format differences

### Issue 3: No Domain in Results
**Symptom:** Logs show "No domain available"
**Possible causes:**
- Business doesn't have a website
- DataForSEO Maps API didn't return website field
**Solution:** This is expected for businesses without websites

## API Endpoints Used

1. **Get Advertisers**: `POST /v3/serp/google/ads_advertisers/task_post`
   - Returns list of advertisers for keyword+location
   - Used for lightweight enrichment in search results

2. **Get Ads for Business**: `GET /api/serp/business/:profileId/ads`
   - Returns detailed ad creatives for a specific business
   - Used in Business Profile page

## Next Steps

1. **Restart server** to pick up code changes
2. **Perform fresh search** (clear cache/storage)
3. **Monitor logs** during search
4. **Check UI** for "Running Ads" badges
5. **Review logs** to identify any remaining issues

## Expected Behavior

- **Search Results**: Businesses with matching domains in advertisers data should show "Running Ads" badge
- **Business Profile**: Ads tab should display ad creatives when available
- **Performance**: Ad enrichment should not block search (non-blocking)
