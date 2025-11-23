# SEO Score and Domain Authority Calculation Explained

## Current Calculation Methods

### 1. **SEO Score (0-100)**

**How It's Calculated:**
The SEO Score is calculated from 6 components, weighted as follows:

| Component | Weight | Max Points | How It's Scored |
|-----------|--------|------------|-----------------|
| **Domain Authority** | 30% | 30 points | Proportional: `(DA / 100) * 30` |
| **Backlinks** | 20% | 20 points | Thresholds: 10k+ = 20, 5k+ = 15, 1k+ = 10, 100+ = 5 |
| **Monthly Traffic** | 20% | 20 points | Thresholds: 100k+ = 20, 50k+ = 15, 10k+ = 10, 1k+ = 5, 100+ = 2, >0 = 1 |
| **Page Speed** | 15% | 15 points | Thresholds: 90+ = 15, 70+ = 10, 50+ = 5 |
| **Mobile Score** | 10% | 10 points | Thresholds: 90+ = 10, 70+ = 7, 50+ = 4 |
| **Accessibility Score** | 5% | 5 points | Thresholds: 90+ = 5, 70+ = 3, 50+ = 1 |

**Final Score:** `(Total Points / Max Possible Points) * 100`

**Example for SPINE Center:**
- Domain Authority: 38 → `(38/100)*30 = 11.4` → **11 points**
- Backlinks: 0 → **0 points**
- Monthly Traffic: 218.57 → **2 points** (218 >= 100)
- Page Speed: 67 → **5 points** (67 >= 50)
- Mobile Score: 43 → **0 points** (43 < 50)
- Accessibility: null → **0 points** (missing)
- **Total: 18 / 95 = 19%** (but shows 24, so PageSpeed Insights SEO score is being used)

---

### 2. **Domain Authority (0-100)**

**How It's Calculated:**
Domain Authority is calculated from DataForSEO Domain Rank API metrics:

| Component | Weight | Max Points | Calculation |
|-----------|--------|------------|-------------|
| **ETV Score** | 40% | 40 points | `min(40, (ETV / 10000) * 40)` |
| **Keyword Count** | 30% | 30 points | `min(30, (Keywords / 1000) * 30)` |
| **Position Score** | 30% | 30 points | `(pos_1 * 10) + (pos_2_3 * 5) + (pos_4_10 * 2)` |

**Final DA:** `ETV Score + Keyword Score + Position Score` (max 100)

**Example for SPINE Center:**
- ETV: 205.86 → `(205.86/10000)*40 = 0.82` → **1 point**
- Keywords: 235 → `(235/1000)*30 = 7.05` → **7 points**
- Positions: pos_1=1, pos_2_3=2, pos_4_10=6 → `(1*10) + (2*5) + (6*2) = 32` → **30 points** (capped)
- **Total: 1 + 7 + 30 = 38**

---

## Current Data Sources

### ✅ **What We're Using:**

1. **DataForSEO APIs:**
   - Domain Rank API → Domain Authority calculation
   - Traffic Estimation API → Monthly Traffic
   - Backlinks API → Backlinks count (if subscription available)
   - On-Page API → Page Speed, Mobile Score, Accessibility Score (when it works)

2. **Google PageSpeed Insights API:**
   - Performance Score → Page Speed (fallback)
   - Mobile Score → Mobile Score (fallback)
   - Accessibility Score → Accessibility Score (fallback)
   - **SEO Score** → Currently extracted but NOT used in calculation
   - **Best Practices Score** → Currently extracted but NOT used

---

## Improvements Needed

### ❌ **What's Missing:**

1. **PageSpeed Insights SEO Score Not Used:**
   - We extract it but don't use it in SEO Score calculation
   - Should integrate it as a component

2. **Accessibility Score Null:**
   - PageSpeed Insights should provide it, but it's coming back as null
   - Need to check why and fix

3. **Best Practices Score Not Used:**
   - We extract it but don't use it
   - Could be added as another component

---

## Proposed Improvements

### 1. **Integrate PageSpeed Insights SEO Score**

Add PageSpeed Insights SEO score as a component in SEO Score calculation:

```typescript
// Add to calculateSEOScore function:
if (metrics.pageSpeedInsightsSEO != null) {
  maxPossible += 15;
  // Use PageSpeed Insights SEO score directly
  score += Math.round((metrics.pageSpeedInsightsSEO / 100) * 15);
}
```

### 2. **Fix Accessibility Score**

Ensure PageSpeed Insights accessibility score is properly extracted and used.

### 3. **Add Best Practices Score**

Include PageSpeed Insights Best Practices score as a component.

---

## Updated SEO Score Calculation (Proposed)

| Component | Weight | Source |
|-----------|--------|--------|
| Domain Authority | 25% | DataForSEO Domain Rank |
| Backlinks | 15% | DataForSEO Backlinks |
| Monthly Traffic | 15% | DataForSEO Traffic |
| Page Speed | 10% | PageSpeed Insights / On-Page |
| Mobile Score | 10% | PageSpeed Insights / On-Page |
| **PageSpeed SEO Score** | **15%** | **PageSpeed Insights** ⭐ NEW |
| Accessibility Score | 5% | PageSpeed Insights / On-Page |
| Best Practices | 5% | PageSpeed Insights ⭐ NEW |

This would give us a more comprehensive SEO score using Google's official SEO analysis.

