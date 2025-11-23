# PageSpeed Insights vs On-Page API Comparison

## Quick Answer
**Both are good!** Use **On-Page API as primary** (when it works) and **PageSpeed Insights as fallback** (when On-Page fails).

---

## Detailed Comparison

### 1. **DataForSEO On-Page API** (Current Primary)

#### What It Provides:
- ✅ **Page Timing Data** (LCP, FID, CLS, TTI) - Core Web Vitals
- ✅ **Mobile Score** (0-100) - Mobile usability
- ✅ **Accessibility Score** (0-100) - WCAG compliance
- ✅ **Technologies** - Detected tech stack
- ✅ **Schemas** - Structured data detection
- ✅ **Page Analysis** - Detailed page-level insights

#### Pros:
- ✅ Already integrated in our system
- ✅ Part of DataForSEO subscription (no extra cost)
- ✅ Provides detailed page-level analysis
- ✅ Includes schema and technology detection

#### Cons:
- ❌ Currently failing with **40503 "POST Data Is Invalid"** error
- ❌ Requires DataForSEO subscription
- ❌ Task-based (async) - requires waiting for results
- ❌ Sometimes returns 404 if task not ready

#### Current Status:
- ⚠️ **Not Working** - 40503 error when `location_code` is included
- ✅ **Fixed** - Removed `location_code` parameter
- ⚠️ **Still Testing** - May still have issues

---

### 2. **Google PageSpeed Insights API** (Fallback)

#### What It Provides:
- ✅ **Performance Score** (0-100) - Desktop & Mobile
- ✅ **Accessibility Score** (0-100) - WCAG compliance
- ✅ **SEO Score** (0-100) - SEO best practices
- ✅ **Best Practices Score** (0-100) - Code quality & security
- ✅ **Core Web Vitals** - FCP, LCP, FID, CLS, TTI, Speed Index
- ✅ **Opportunities** - Specific recommendations for improvement
- ✅ **Diagnostics** - Detailed performance insights
- ✅ **Field Data** - Real-world user experience (Chrome UX Report)

#### Pros:
- ✅ **FREE** - No cost (25k requests/day free tier)
- ✅ **Reliable** - Google's official API, very stable
- ✅ **Comprehensive** - Provides SEO score and best practices (On-Page doesn't)
- ✅ **Real-world Data** - Includes Chrome UX Report (actual user data)
- ✅ **Synchronous** - Returns results immediately (no waiting)
- ✅ **Well-documented** - Extensive Google documentation

#### Cons:
- ⚠️ Requires Google Cloud account (free, but needs signup)
- ⚠️ Requires API key setup
- ⚠️ Rate limits (25k/day free tier - but that's plenty)
- ⚠️ Doesn't provide technology/schema detection (On-Page does)

---

## Recommendation: **Use Both (Hybrid Approach)**

### Strategy:
1. **Primary**: Try On-Page API first (if it works)
2. **Fallback**: Use PageSpeed Insights if On-Page fails or returns null
3. **Best of Both**: Combine data from both when available

### Implementation:
```typescript
// 1. Try On-Page API first
let pageSpeed = null;
let mobileScore = null;
let accessibilityScore = null;

try {
  const onPageData = await dataForSEOService.getOnPageAnalysis({ domain });
  // Extract scores from On-Page...
} catch (error) {
  console.log("On-Page failed, trying PageSpeed Insights...");
}

// 2. Fallback to PageSpeed Insights if On-Page failed
if (!pageSpeed && !mobileScore) {
  const psiData = await getPageSpeedInsights(websiteUrl);
  if (psiData) {
    pageSpeed = psiData.performance;
    mobileScore = psiData.mobile;
    accessibilityScore = psiData.accessibility;
    // Also get SEO score and best practices (bonus!)
  }
}
```

---

## Which Is Better?

### **For Speed Scores:**
- **PageSpeed Insights** is more reliable (Google's official tool)
- **On-Page API** provides more detailed page-level analysis

### **For SEO Analysis:**
- **PageSpeed Insights** provides SEO score (On-Page doesn't)
- **On-Page API** provides schema/technology detection (PageSpeed doesn't)

### **For Reliability:**
- **PageSpeed Insights** wins - very stable, rarely fails
- **On-Page API** - currently having issues, but when it works, it's good

### **For Cost:**
- **PageSpeed Insights** - FREE
- **On-Page API** - Part of DataForSEO subscription

---

## Current Implementation Status

### ✅ **Already Implemented:**
- PageSpeed Insights integration in `scripts/add-pagespeed-insights.ts`
- Fallback logic in `scripts/fix-single-business.ts`
- Enhanced to extract ALL data (SEO, best practices, opportunities, diagnostics)

### ⏳ **To Do:**
1. Add `GOOGLE_PAGESPEED_API_KEY` to `.env` (optional but recommended)
2. Add PageSpeed Insights fallback to main collection script
3. Update routes to use PageSpeed Insights data when On-Page is missing

---

## Setup Instructions

### 1. Get Google PageSpeed Insights API Key (FREE):
1. Go to https://console.cloud.google.com/
2. Create a project (or use existing)
3. Enable "PageSpeed Insights API"
4. Create API key (Credentials → Create Credentials → API Key)
5. (Optional) Restrict API key to PageSpeed Insights API only

### 2. Add to `.env`:
```bash
GOOGLE_PAGESPEED_API_KEY=your_api_key_here
```

### 3. That's it! The system will automatically use it as fallback.

---

## Final Recommendation

**✅ YES, add the API key!** Here's why:

1. **Free** - No cost, just requires Google account
2. **Reliable** - Works when On-Page fails
3. **Bonus Data** - Provides SEO score and best practices (On-Page doesn't)
4. **Better UX** - Users get speed scores even when On-Page API has issues
5. **No Downside** - Only used as fallback, doesn't interfere with On-Page

**Best Practice**: Use both APIs - On-Page for detailed analysis, PageSpeed Insights for reliability and bonus SEO data.

---

## Data We Get from Each

### On-Page API:
- Page timing (LCP, FID, CLS, TTI)
- Mobile score
- Accessibility score
- Technologies detected
- Schemas detected
- Page-level analysis

### PageSpeed Insights:
- Performance score (desktop & mobile)
- Accessibility score
- **SEO score** ⭐ (On-Page doesn't provide this)
- **Best Practices score** ⭐ (On-Page doesn't provide this)
- Core Web Vitals
- **Opportunities** ⭐ (specific recommendations)
- **Diagnostics** ⭐ (detailed insights)
- **Field Data** ⭐ (real-world user experience)

**Conclusion**: PageSpeed Insights provides **more comprehensive data** and is **more reliable**, but On-Page provides **deeper page-level analysis**. Using both gives us the best of both worlds!

