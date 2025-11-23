# Page Speed, Mobile Score, Accessibility Score - Source Analysis

## Current Calculation Sources

### 1. **Page Speed Score** (0-100)
**Source**: Calculated from `page_timing` data from On-Page API

**Data Required**:
- `largest_contentful_paint` (LCP) - Time for largest content to load
- `first_input_delay` (FID) - Time until user can interact
- `cumulative_layout_shift` (CLS) - Visual stability measure
- `time_to_interactive` (TTI) - Time until page is fully interactive

**Calculation Logic** (in `calculateSpeedScore()`):
```typescript
const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 70 : 40;
const fidScore = fid <= 100 ? 100 : fid <= 200 ? 70 : 40;
const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 70 : 40;
const ttiScore = tti <= 2000 ? 100 : tti <= 4000 ? 70 : 40;

const score = Math.round(
  lcpScore * 0.4 + 
  fidScore * 0.2 + 
  clsScore * 0.2 + 
  ttiScore * 0.2
);
```

**Where It Comes From**:
- ✅ `onPageResults.tasks[0].result[0].items[0].page_timing` (full results)
- ✅ `onPage.page_timing` (task data)
- ❌ **Cannot be calculated from HTML alone** - requires actual performance measurement

---

### 2. **Mobile Score** (0-100)
**Source**: Directly extracted from On-Page API results

**Data Required**:
- `mobile_score` - Pre-calculated mobile usability score from On-Page API

**Where It Comes From**:
- ✅ `onPageResults.tasks[0].result[0].items[0].mobile_score` (full results)
- ✅ `onPage.mobile_score` (task data)
- ❌ **Cannot be calculated from HTML alone** - requires mobile usability testing

---

### 3. **Accessibility Score** (0-100)
**Source**: Directly extracted from On-Page API results

**Data Required**:
- `accessibility_score` - Pre-calculated WCAG accessibility score from On-Page API

**Where It Comes From**:
- ✅ `onPageResults.tasks[0].result[0].items[0].accessibility_score` (full results)
- ✅ `onPage.accessibility_score` (task data)
- ❌ **Cannot be calculated from HTML alone** - requires accessibility auditing

---

## Why We Can't Use Alternative Sources

### ❌ **HTML Content Alone**
- HTML doesn't contain performance metrics (LCP, FID, CLS)
- HTML doesn't contain mobile usability scores
- HTML doesn't contain accessibility scores
- These require **actual testing/measurement**, not static analysis

### ❌ **Other DataForSEO APIs**
- No other DataForSEO API provides these metrics
- Domain Analysis API: Only provides domain authority, backlinks
- Traffic Estimation API: Only provides traffic estimates
- Ranked Keywords API: Only provides keyword rankings

### ✅ **Possible Alternative Sources** (But Require Additional APIs/Tools)

1. **Google PageSpeed Insights API**
   - Provides: Page speed, mobile score, accessibility score
   - **Requires**: Google API key, additional API calls
   - **Cost**: Free tier available, but rate limits

2. **Lighthouse (Programmatic)**
   - Provides: All three scores
   - **Requires**: Headless browser (Puppeteer/Playwright), server resources
   - **Cost**: Free but resource-intensive

3. **WebPageTest API**
   - Provides: Detailed performance metrics
   - **Requires**: API key, additional setup
   - **Cost**: Free tier available

---

## Current Status After Fix

### ✅ **On-Page API Fix Applied**
- Removed `location_code` from On-Page API request
- On-Page API should now work correctly
- **This is the best solution** - use the data source we already have

### ⚠️ **If On-Page Still Fails**
- Page Speed: Will be `null` (cannot calculate without `page_timing`)
- Mobile Score: Will be `null` (cannot get without API)
- Accessibility Score: Will be `null` (cannot get without API)
- SEO Score: Will be calculated without these components (still works, just lower max score)

---

## Recommendation

**✅ Keep Using On-Page API** (After Fix)
- We already have it integrated
- Provides all three scores accurately
- No additional APIs needed
- The fix (removing `location_code`) should resolve the 40503 error

**❌ Don't Add Alternative Sources** (Unless On-Page Continues to Fail)
- Would require additional API keys
- Additional API calls = more cost/time
- More complexity
- On-Page API is the best source for these metrics

---

## What Happens in UI

### **If On-Page API Succeeds** (After Fix):
- ✅ Page Speed: Shows calculated score (0-100)
- ✅ Mobile Score: Shows score from API (0-100)
- ✅ Accessibility Score: Shows score from API (0-100)
- ✅ SEO Score: Includes all components

### **If On-Page API Still Fails** (Rare):
- ⚠️ Page Speed: Shows "N/A" or null
- ⚠️ Mobile Score: Shows "N/A" or null
- ⚠️ Accessibility Score: Shows "N/A" or null
- ✅ SEO Score: Still calculated (just without these 3 components)
- ✅ All other data: Still available (analytics, schemas, keywords, traffic, ads)

---

## Conclusion

**We cannot change the source** - these scores require actual performance/usability testing that only On-Page API (or similar tools) can provide. HTML analysis alone is not sufficient.

**The fix we applied** (removing `location_code`) should resolve the 40503 error, allowing On-Page API to work correctly and provide all three scores.

