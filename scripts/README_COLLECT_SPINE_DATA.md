# Data Collection Script: "Spine" in Chesterfield, MO

## 📋 Overview

This script collects complete business intelligence data for businesses found when searching for "Spine" in Chesterfield, MO.

## 🚀 Usage

### Test Mode (5 businesses)
```bash
pnpm tsx scripts/collect-spine-data.ts --test
```

### Custom Limit
```bash
pnpm tsx scripts/collect-spine-data.ts --limit=10
```

### Full Mode (100 businesses)
```bash
pnpm tsx scripts/collect-spine-data.ts
```

## 📊 What It Does

### Phase 1: Discovery
1. Calls Maps API → Gets ~30-80 businesses
2. Calls Local Pack API → Gets ~20 businesses  
3. Calls Business Listings API → Gets ~100 businesses
4. Deduplicates by placeId/cid → ~100 unique businesses

### Phase 2: Enrichment (Per Business)
For each business, collects:
1. **GMB Info** → Business hours, social media, services, languages
2. **Reviews** → Ratings and review counts
3. **Ranked Keywords** → Top 100 keywords (if domain exists)
4. **Traffic Estimation** → Monthly traffic (if domain exists)
5. **On-Page Analysis** → SEO scores, Core Web Vitals (if domain exists)
6. **Backlinks** → Backlink profile (if domain exists)
7. **Domain Rank** → Domain authority (if domain exists)

### Phase 3: Database Storage
1. Creates `serp_jobs` record
2. Creates `serp_results` records
3. Creates `business_profiles` records
4. Creates `keyword_rankings` records

## ⏱️ Estimated Time

- **Test Mode (5 businesses)**: ~5-8 minutes
- **Full Mode (100 businesses)**: ~15-20 minutes

## 💰 Estimated Cost

- **Test Mode**: ~$0.10 (50 API calls)
- **Full Mode**: ~$1.21 (605 API calls)

## 📝 Output

The script prints:
- Progress for each phase
- Statistics (API calls, businesses processed, errors)
- Final summary with costs and duration

## ⚠️ Requirements

1. DataForSEO API credentials in `.env`:
   ```
   DATAFORSEO_LOGIN=your_login
   DATAFORSEO_PASSWORD=your_password
   ```

2. Database connection in `.env`:
   ```
   DATABASE_URL=mysql://user:password@host:port/database
   ```

3. At least one user in the database (or script will create a system user)

## 🔍 Troubleshooting

### Rate Limit Errors
- Script includes 1-second delays between API calls
- If you hit rate limits, wait and rerun

### Database Errors
- Ensure database is accessible
- Check that Prisma migrations are up to date
- Verify user exists in database

### API Errors
- Check DataForSEO credentials
- Verify API quota hasn't been exceeded
- Some APIs may fail for businesses without domains (this is expected)

## 📈 Expected Results

After running in test mode, you should have:
- 1 `serp_jobs` record
- ~5-10 `serp_results` records
- 5 `business_profiles` records
- ~400-500 `keyword_rankings` records (if businesses have domains)

## ✅ Success Indicators

- Script completes without fatal errors
- Statistics show businesses stored > 0
- Database contains new records
- Response times improve for cached queries

