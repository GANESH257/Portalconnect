# PageSpeed Insights API - Categories Issue

## Current Status

### ✅ **What's Working:**
- **Performance Score** (0-100) - ✅ Working perfectly
- **Core Web Vitals** (LCP, FID, CLS, TTI, FCP, Speed Index) - ✅ Available in audits

### ❌ **What's NOT Working:**
- **Accessibility Score** - Returns `null` (not in categories)
- **SEO Score** - Returns `null` (not in categories)
- **Best Practices Score** - Returns `null` (not in categories)

## Investigation Results

### API Response Structure:
```json
{
  "lighthouseResult": {
    "categories": {
      "performance": {
        "score": 0.87,
        "id": "performance",
        "title": "Performance"
      }
      // Only performance category is returned
    },
    "audits": {
      // 47+ audits available, but no accessibility/SEO/best-practices categories
    }
  }
}
```

### What We Tried:
1. ✅ Requesting all categories together: `category: ["performance", "accessibility", "seo", "best-practices"]`
2. ✅ Requesting individual categories: `category: ["accessibility"]`
3. ✅ Not specifying category (default): Returns only performance
4. ✅ Different websites (google.com, example.com, onlinespinecare.com): All return only performance

### Conclusion:
**The PageSpeed Insights API v5 appears to only return the Performance category by default.** The Accessibility, SEO, and Best Practices categories are not included in the API response, even though they exist in the Lighthouse tool itself.

## Possible Solutions

### Option 1: Use Lighthouse Programmatically (Recommended)
- Run Lighthouse directly (not via PageSpeed Insights API)
- Get ALL categories: Performance, Accessibility, SEO, Best Practices
- Requires: `lighthouse` npm package + `puppeteer`
- **Pros**: Get all scores, no API limits
- **Cons**: More resource-intensive, requires headless browser

### Option 2: Calculate Scores from Audits
- Extract accessibility/SEO/best-practices audits from the API response
- Calculate scores manually based on audit results
- **Pros**: Use existing API
- **Cons**: Complex, may not match Lighthouse scores exactly

### Option 3: Use Different API Endpoint
- Check if there's a different PageSpeed Insights endpoint
- Or use older API version (v4)
- **Pros**: Simple if it works
- **Cons**: May not exist or may be deprecated

## Recommendation

**Use Lighthouse Programmatically** - This will give us:
- ✅ Performance Score
- ✅ Accessibility Score
- ✅ SEO Score
- ✅ Best Practices Score
- ✅ All Core Web Vitals
- ✅ All audits and recommendations

## Other Scores Available from Google APIs

### ✅ **Google Places API** (Same API Key)
- Business Reviews Score
- Rating (0-5 stars)
- Review Count
- Business Details

### ✅ **Google Safe Browsing API** (Same API Key)
- Security Score (Safe/Unsafe)
- Malware Detection
- Phishing Detection

### ❌ **Google Search Console API** (Requires OAuth)
- Search Performance
- Keyword Rankings
- Click-through Rates
- Requires website owner to grant access

### ❌ **Google Analytics API** (Requires OAuth)
- Real Traffic Data
- User Behavior
- Requires website owner to grant access

## Next Steps

1. **Implement Lighthouse Programmatically** to get all scores
2. **Keep PageSpeed Insights API** as fallback for performance score
3. **Consider adding Google Places API** for reviews (optional)

