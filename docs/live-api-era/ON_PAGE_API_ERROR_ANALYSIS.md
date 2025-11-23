# On-Page API Error 40503 Analysis

## Error Details
- **Error Code**: 40503
- **Error Message**: "POST Data Is Invalid"
- **API Endpoint**: `/v3/on_page/task_post`
- **Status**: Task fails immediately (status_code: 40503)

## Current Request Being Sent
```json
[{
  "url": "https://example.com",
  "language_name": "English",
  "location_code": 1020256  // Chesterfield, MO location code
}]
```

## Why This Is Happening

### Possible Causes:

1. **Location Not Required for On-Page Analysis**
   - On-Page Analysis analyzes a **website's technical SEO**, not location-based search results
   - The API might not accept `location_code` or `location_name` at all
   - Location is relevant for SERP searches, but On-Page is about the website itself

2. **Invalid Location Code for On-Page API**
   - Location code 1020256 (Chesterfield, MO) might be valid for SERP APIs but not for On-Page API
   - On-Page API might use a different location code system or not use location at all

3. **API Parameter Mismatch**
   - The On-Page API might expect different parameter names or structure
   - Some On-Page APIs don't require location because they analyze the website globally

## What Data Is Affected

### ❌ **Missing Data When On-Page API Fails:**

1. **Page Speed Metrics** (from `page_timing`):
   - `largest_contentful_paint` (LCP)
   - `first_input_delay` (FID)
   - `cumulative_layout_shift` (CLS)
   - Calculated `pageSpeed` score (0-100)

2. **Mobile Score**:
   - Mobile usability score (0-100)
   - Mobile-specific performance metrics

3. **Accessibility Score**:
   - WCAG accessibility score (0-100)
   - Accessibility issues detected

4. **Technologies Detected**:
   - CMS (WordPress, Drupal, etc.)
   - Analytics tools (Google Analytics, etc.)
   - JavaScript frameworks
   - Server technologies

5. **Schema Markup** (from On-Page):
   - Structured data detected by crawler
   - Schema.org types found

6. **Page Load Times**:
   - Time to first byte (TTFB)
   - Total page load time
   - Resource load times

### ✅ **Data We Still Have (Fallbacks):**

1. **Analytics Detection**:
   - ✅ We fetch HTML directly and detect Google Analytics/Facebook Pixel
   - ✅ Stored in `enriched.analytics`

2. **Schema Detection**:
   - ✅ We detect schemas from HTML directly
   - ✅ Stored in `enriched.schemas` (6 types: LocalBusiness, FAQ, Organization, etc.)

3. **Basic SEO Data**:
   - ✅ Domain Authority (from Domain Analysis API)
   - ✅ Backlinks (from Backlinks API, if subscription available)
   - ✅ Traffic estimates (from Traffic Estimation API)
   - ✅ Ranked keywords (from Ranked Keywords API)

4. **HTML Content**:
   - ✅ Full HTML stored in `enriched.htmlContent` (if fetchable)
   - ✅ Can be analyzed later

## Impact on Business Profiles

### **What Shows in UI:**

1. **SEO & PPC Tab**:
   - ⚠️ **Page Speed**: Will show "N/A" or null (no `pageSpeed` score)
   - ⚠️ **Mobile Score**: Will show "N/A" or null
   - ⚠️ **Accessibility Score**: Will show "N/A" or null
   - ✅ **Analytics**: Will show (from HTML detection)
   - ✅ **Schemas**: Will show (from HTML detection)
   - ✅ **Domain Authority**: Will show (from Domain Analysis)
   - ✅ **Backlinks**: Will show (if subscription available)
   - ✅ **Traffic**: Will show (from Traffic Estimation)

2. **Comprehensive Score**:
   - ⚠️ **SEO Score**: Will be calculated without page speed/mobile/accessibility components
   - ✅ **Domain Authority**: Included
   - ✅ **Backlinks**: Included
   - ✅ **Traffic**: Included

## Solution Options

### **Option 1: Remove Location from On-Page API** (Recommended)
On-Page Analysis doesn't need location - it analyzes the website globally.

```typescript
const requestBody: any = [{
  url: params.domain.startsWith('http') ? params.domain : `https://${params.domain}`,
  language_name: 'English'
  // Remove location_code entirely
}];
```

### **Option 2: Make Location Optional**
Only include location if the API documentation specifically requires it.

### **Option 3: Use Different Location Code**
If location is required, try using a country-level location code (e.g., United States) instead of city-level.

## Current Behavior

- ✅ Script **continues** even if On-Page fails
- ✅ Other data (ads, keywords, traffic, domain rank) still collected
- ✅ Analytics and schemas detected from HTML directly
- ⚠️ Page speed/mobile/accessibility scores will be null
- ⚠️ SEO score will be calculated without speed components

## Recommendation

**Remove `location_code` from On-Page API request** - On-Page Analysis is about the website's technical SEO, not location-based search results. Location is not needed for analyzing a website's performance.

