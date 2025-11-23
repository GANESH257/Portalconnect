# Collection Script Optimization Plan for Hybrid Model

## 🎯 Goal

Optimize `scripts/collect-spine-data.ts` to collect **only** the data needed for Prospect Finder initial display, since detailed data (SEO/PPC, Ads, Reputation) is now fetched live when users click tabs.

---

## 📊 Current vs Optimized Collection

### Current Collection (Full)
- **Phase 1**: Discovery (Maps, Local Pack, Business Listings) ✅ KEEP
- **Phase 2**: Full Enrichment:
  - GMB Info ✅ KEEP (for services, specialties)
  - Reviews ❌ REMOVE (now live)
  - Ranked Keywords ❌ REMOVE (not used in initial display)
  - Traffic ❌ REMOVE (not used in initial display)
  - On-Page Analysis ❌ REMOVE (now live)
  - PageSpeed Insights ❌ REMOVE (now live)
  - HTML Analysis ❌ REMOVE (now live)
  - Safe Browsing ❌ REMOVE (now live)
  - Ads Creatives ❌ REMOVE (now live)
  - Ads Advertisers ❌ REMOVE (now live)
  - Google Places Reviews ❌ REMOVE (now live)
  - Schema Validation ❌ REMOVE (now live)
  - Backlinks ❌ REMOVE (not used in initial display)
  - Domain Rank ❌ REMOVE (not used in initial display)

### Optimized Collection (Minimal)
- **Phase 1**: Discovery (Maps, Local Pack, Business Listings) ✅
- **Phase 2**: Basic Enrichment:
  - GMB Info ✅ (for services, specialties, email)
  - Basic rating/reviewsCount (already in Phase 1, but GMB can provide more accurate)

---

## 🔧 Changes Required in `collect-spine-data.ts`

### Section to REMOVE (Lines ~338-700):

1. **Reviews Collection** (Lines ~338-350)
   ```typescript
   // REMOVE: 2.2: Reviews
   ```

2. **Ranked Keywords** (Lines ~351-365)
   ```typescript
   // REMOVE: 2.3: Ranked Keywords
   ```

3. **Traffic Estimation** (Lines ~366-380)
   ```typescript
   // REMOVE: 2.4: Traffic Estimation
   ```

4. **Ads Creatives** (Lines ~397-440)
   ```typescript
   // REMOVE: 2.4b: Fetch Ads Creatives
   ```

5. **On-Page Analysis** (Lines ~442-494)
   ```typescript
   // REMOVE: 2.5: On-Page Analysis
   ```

6. **Google Places Reviews** (Lines ~496-517)
   ```typescript
   // REMOVE: 2.5a: Google Places Reviews
   ```

7. **Safe Browsing** (Lines ~519-531)
   ```typescript
   // REMOVE: 2.5b: Safe Browsing
   ```

8. **PageSpeed Insights** (Lines ~533-562)
   ```typescript
   // REMOVE: 2.5c: PageSpeed Insights
   ```

9. **Schema Validation** (Lines ~564-572)
   ```typescript
   // REMOVE: 2.5d: Schema Validation
   ```

10. **HTML Analysis** (Lines ~574-678)
    ```typescript
    // REMOVE: 2.5e: HTML Fetch and Analytics/Schema Detection
    ```

11. **Backlinks** (Lines ~680-693)
    ```typescript
    // REMOVE: 2.6: Backlinks
    ```

12. **Domain Rank** (Lines ~695-710)
    ```typescript
    // REMOVE: 2.7: Domain Rank
    ```

### Section to KEEP:

1. **Phase 1: Discovery** (Lines ~225-284) ✅
   - Maps API
   - Local Pack API
   - Business Listings API

2. **Phase 2: GMB Info** (Lines ~321-336) ✅
   - Google My Business Info (for services, specialties, email)

3. **Phase 3: Storage** (Lines ~787-1117) ✅
   - But update to store only minimal enriched data

---

## 📝 Updated `enrichBusiness` Function

### Current Structure:
```typescript
const enriched: any = {
  ...business,
  gmbInfo: null,
  reviews: null,           // REMOVE
  rankedKeywords: null,    // REMOVE
  traffic: null,           // REMOVE
  onPage: null,            // REMOVE
  backlinks: null,         // REMOVE
  domainRank: null,        // REMOVE
  ads: null                // REMOVE
};
```

### Optimized Structure:
```typescript
const enriched: any = {
  ...business,
  gmbInfo: null  // KEEP - needed for services, specialties
};
```

---

## 📝 Updated Storage Function

### Current `rawDataWithAds` Structure:
```typescript
enriched: {
  gmbInfo: ...,
  reviews: ...,              // REMOVE
  rankedKeywords: ...,       // REMOVE
  traffic: ...,              // REMOVE
  onPage: ...,               // REMOVE
  onPageResults: ...,        // REMOVE
  backlinks: ...,            // REMOVE
  domainRank: ...,           // REMOVE
  analytics: ...,            // REMOVE
  schemas: ...,              // REMOVE
  htmlContent: ...,          // REMOVE
  ads: ...,                  // REMOVE
  adsCreatives: ...,         // REMOVE
  pageSpeedInsights: ...,    // REMOVE
  googlePlaces: ...,         // REMOVE
  safeBrowsing: ...,         // REMOVE
  schemaValidation: ...      // REMOVE
}
```

### Optimized Structure:
```typescript
enriched: {
  gmbInfo: ...  // KEEP - for services, specialties, email
}
```

---

## ⏱️ Expected Improvements

### Time Savings:
- **Before**: ~30-60 seconds per business
- **After**: ~5-10 seconds per business
- **Savings**: ~80% faster collection

### API Call Savings:
- **Before**: ~15-20 API calls per business
- **After**: ~3-4 API calls per business
- **Savings**: ~75% fewer API calls

### Cost Savings:
- **Before**: ~$0.03-0.04 per business (at $0.002 per call)
- **After**: ~$0.006-0.008 per business
- **Savings**: ~75% cost reduction

---

## ✅ Implementation Steps

1. **Backup current script**: `cp scripts/collect-spine-data.ts scripts/collect-spine-data-full.ts`
2. **Remove unnecessary sections** from `enrichBusiness` function
3. **Update storage function** to only store minimal enriched data
4. **Update comments** to reflect hybrid model
5. **Test** with `--test --limit=5` to verify it works
6. **Run full collection** when ready

---

## 🧪 Testing Checklist

- [ ] Script runs without errors
- [ ] Phase 1 (Discovery) still works
- [ ] Phase 2 (GMB Info) still works
- [ ] Phase 3 (Storage) stores minimal data correctly
- [ ] Prospect Finder displays businesses correctly
- [ ] Business Profile Overview tab loads correctly
- [ ] SEO & PPC tab fetches live data correctly
- [ ] Ads tab fetches live data correctly
- [ ] Reputation tab fetches live data correctly

