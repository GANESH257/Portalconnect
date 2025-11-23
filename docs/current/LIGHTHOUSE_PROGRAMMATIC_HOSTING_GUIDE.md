# Lighthouse Programmatic - Hosting Guide

## Quick Answer

**✅ NO POPUPS** - Lighthouse runs **server-side** (backend), users never see it.

**⚠️ HOSTING CONSIDERATIONS** - Requires more resources and may not work on all platforms.

---

## How It Works

### Server-Side Execution (No User Impact)
- Lighthouse runs on **your server** (backend), not in the user's browser
- Uses **headless Chrome** (Puppeteer) - no GUI, no popups
- User makes request → Server runs Lighthouse → Returns results
- **User never sees anything** - it's completely invisible to them

### Example Flow:
```
User clicks "Analyze Website" 
  → Frontend sends request to backend
  → Backend runs Lighthouse programmatically
  → Lighthouse audits website (10-30 seconds)
  → Backend returns results
  → Frontend displays results
```

**User Experience**: Just sees a loading spinner, then results appear.

---

## Hosting Requirements

### ✅ What You Need:
1. **Node.js Server** (you have this - Express)
2. **Puppeteer** npm package
3. **Chrome/Chromium Binary** (Puppeteer downloads this automatically)
4. **Memory**: ~500MB-1GB per concurrent Lighthouse run
5. **CPU**: Moderate (Lighthouse is CPU-intensive)

### ⚠️ Platform Restrictions:

#### ✅ **Works Well On:**
- **Railway** - Full Node.js support, allows headless browsers
- **Heroku** - Supports Puppeteer (may need buildpack)
- **AWS EC2/Lambda** - Full control, works great
- **DigitalOcean** - VPS with full control
- **Vercel/Netlify** - ❌ **DOES NOT WORK** (serverless functions have restrictions)

#### ❌ **Won't Work On:**
- **Vercel Serverless Functions** - 10-second timeout, no headless browsers
- **Netlify Functions** - Similar restrictions
- **GoDaddy Shared Hosting** - No Node.js, no headless browsers
- **Any shared hosting** - No Node.js support

---

## Resource Usage

### Memory:
- **Per Lighthouse Run**: ~500MB-1GB RAM
- **Concurrent Runs**: Multiply by number of concurrent requests
- **Example**: 3 users analyzing at once = 1.5-3GB RAM needed

### CPU:
- **Per Run**: 10-30 seconds of high CPU usage
- **Concurrent Runs**: Can slow down server significantly

### Time:
- **Per Audit**: 10-30 seconds (depends on website complexity)
- **User Experience**: Shows loading spinner during this time

---

## Better Alternatives

### Option 1: Background Jobs (Recommended)
Run Lighthouse in background, not real-time:

```typescript
// User requests analysis
// → Create job in database
// → Return job ID immediately
// → Run Lighthouse in background worker
// → User polls for results or gets notification when done
```

**Pros:**
- ✅ No timeout issues
- ✅ Better user experience (instant response)
- ✅ Can queue multiple requests
- ✅ Works on all platforms

**Cons:**
- ⚠️ Requires job queue system (Bull, BullMQ, etc.)
- ⚠️ More complex setup

### Option 2: Use Existing APIs (Current Approach)
You already have:
- ✅ **DataForSEO On-Page API** - Gives mobile score, accessibility score
- ✅ **PageSpeed Insights API** - Gives performance score
- ✅ **Schema Validation** - Custom validation (no API needed)

**Combined, you get:**
- Performance Score (PageSpeed Insights)
- Mobile Score (On-Page API)
- Accessibility Score (On-Page API)
- SEO Score (calculated from multiple factors)
- Best Practices (can be calculated from other data)

**Pros:**
- ✅ Already working
- ✅ Fast (API calls are quick)
- ✅ No resource issues
- ✅ Works on all platforms

**Cons:**
- ⚠️ PageSpeed Insights only gives Performance (not Accessibility/SEO/Best Practices)
- ⚠️ But you can calculate these from other data sources

### Option 3: Hybrid Approach
- Use **PageSpeed Insights API** for Performance (fast, reliable)
- Use **DataForSEO On-Page API** for Mobile/Accessibility (already integrated)
- Calculate **SEO Score** from multiple factors (already doing this)
- Calculate **Best Practices** from security checks, schema validation, etc.

**This is what you're already doing!** ✅

---

## When to Use Lighthouse Programmatically

### ✅ **Good Use Cases:**
1. **Background Jobs** - Run audits overnight, store results
2. **Internal Tools** - Admin dashboard for detailed audits
3. **Scheduled Reports** - Weekly/monthly audits
4. **High-Resource Hosting** - VPS, dedicated server, AWS EC2

### ❌ **Bad Use Cases:**
1. **Real-Time User Requests** - Too slow, resource-intensive
2. **Serverless Functions** - Timeout restrictions
3. **Shared Hosting** - No Node.js support
4. **High Traffic** - Will crash server with too many concurrent runs

---

## Implementation Example (If You Want It)

### Install Dependencies:
```bash
pnpm add lighthouse puppeteer
```

### Code:
```typescript
import lighthouse from 'lighthouse';
import * as puppeteer from 'puppeteer';

async function runLighthouse(url: string) {
  // Launch headless Chrome
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Run Lighthouse
  const result = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'json',
    logLevel: 'info',
  }, {
    extends: 'lighthouse:default',
  });

  await browser.close();

  // Extract scores
  const scores = {
    performance: result.lhr.categories.performance.score * 100,
    accessibility: result.lhr.categories.accessibility.score * 100,
    seo: result.lhr.categories.seo.score * 100,
    bestPractices: result.lhr.categories['best-practices'].score * 100,
    // Core Web Vitals
    lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
    fid: result.lhr.audits['max-potential-fid'].numericValue,
    cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
  };

  return scores;
}
```

### ⚠️ **Important Notes:**
- This takes **10-30 seconds** per run
- Uses **500MB-1GB RAM** per run
- **Don't run this in real-time** - use background jobs instead

---

## Recommendation for Your Project

### ✅ **Stick with Current Approach:**
1. **PageSpeed Insights API** - Performance score (fast, reliable)
2. **DataForSEO On-Page API** - Mobile & Accessibility scores (already integrated)
3. **Custom Calculations** - SEO Score, Best Practices (from multiple data sources)
4. **Schema Validation** - Custom validation (no API needed)
5. **Safe Browsing API** - Security checks (already added)

**Why?**
- ✅ Already working
- ✅ Fast response times
- ✅ Works on all hosting platforms
- ✅ No resource issues
- ✅ Gives you all the data you need

### 🔄 **If You Need Lighthouse:**
- Use it for **background jobs only**
- Run audits overnight
- Store results in database
- Don't run in real-time user requests

---

## Summary

| Aspect | Lighthouse Programmatic | Current Approach (APIs) |
|--------|------------------------|-------------------------|
| **User Popups** | ❌ None (server-side) | ❌ None |
| **Hosting** | ⚠️ Requires VPS/dedicated | ✅ Works everywhere |
| **Speed** | ⚠️ 10-30 seconds | ✅ 1-3 seconds |
| **Resources** | ⚠️ High (500MB-1GB per run) | ✅ Low |
| **All Scores** | ✅ Yes (Performance, Accessibility, SEO, Best Practices) | ⚠️ Partial (but can calculate) |
| **Reliability** | ⚠️ Can fail on some platforms | ✅ Very reliable |

**Recommendation**: Stick with current approach unless you specifically need Lighthouse's detailed audit data and can run it in background jobs.

