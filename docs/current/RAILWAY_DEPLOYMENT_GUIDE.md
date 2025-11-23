# Railway Deployment Guide - Hybrid Model

## 🚀 Complete Railway Deployment Setup

This guide covers deploying the complete hybrid model project to Railway.

---

## 📋 Prerequisites

1. **GitHub Repository**: Code must be pushed to GitHub
2. **Railway Account**: Connected to GitHub
3. **Database**: GoDaddy MySQL (already configured)
4. **API Keys**: DataForSEO and Google APIs

---

## 🔧 Railway Project Setup

### Step 1: Connect Repository

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `GANESH257/Portalconnect`
5. **IMPORTANT**: Select branch: `hybrid-model-implementation`

### Step 2: Configure Build Settings

Railway will auto-detect the build settings, but verify:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Root Directory:**
```
/ (root)
```

---

## 🔐 Environment Variables (CRITICAL)

Set these in Railway Dashboard → Your Service → Variables:

### Database
```env
DATABASE_URL=mysql://portal_db_user:Techsodream2021%21@p3plzcpnl504611.prod.phx3.secureserver.net:3306/clinicprospect
```

### Authentication
```env
JWT_SECRET=<your-jwt-secret-here>
JWT_REFRESH_SECRET=<your-refresh-secret-here>
NODE_ENV=production
PORT=3000
```

### Frontend URLs
```env
FRONTEND_URL=https://ensembledemospace.com,http://localhost:8080
```

### DataForSEO API
```env
DATAFORSEO_BASE_URL=https://api.dataforseo.com/v3
DATAFORSEO_LOGIN=<your-dataforseo-login>
DATAFORSEO_PASSWORD=<your-dataforseo-password>
```

### Google APIs (REQUIRED for Hybrid Model)
```env
GOOGLE_PAGESPEED_API_KEY=<your-google-pagespeed-api-key>
# OR (alternative name)
GOOGLE_PAGESPEED_INSIGHTS_API_KEY=<your-google-pagespeed-api-key>
```

**Note**: Google Places API and Safe Browsing API use the same key as PageSpeed.

### LLM API Keys (Optional - for Multi-LLM Chatbot)
```env
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
GEMINI_API_KEY=<your-gemini-key>
```

### Other
```env
PING_MESSAGE=ping
```

---

## 📦 Build Process

Railway will automatically:

1. **Install Dependencies**: `pnpm install`
2. **Build Client**: `vite build` → Creates `dist/spa/`
3. **Build Server**: `vite build --config vite.config.server.ts` → Creates `dist/server/`
4. **Start Server**: `node dist/server/node-build.mjs`

---

## ✅ Verification Checklist

After deployment:

- [ ] Railway build completes successfully
- [ ] Service shows "Deployed" status
- [ ] Health check endpoint works: `https://your-railway-url.up.railway.app/api/ping`
- [ ] Database connection works: `https://your-railway-url.up.railway.app/api/health/db`
- [ ] API endpoints respond correctly
- [ ] Hybrid model routes work:
  - `/api/serp/business/:id` (database-first)
  - `/api/serp/business/:id/seo-ppc` (live API)
  - `/api/serp/business/:id/ads` (live API)
  - `/api/serp/business/:id/reputation` (live API)

---

## 🔍 Troubleshooting

### Build Fails

**Issue**: `pnpm: command not found`
**Solution**: Railway should auto-detect pnpm from `packageManager` in package.json. If not, add build command: `npm install -g pnpm && pnpm install && pnpm build`

**Issue**: TypeScript errors
**Solution**: Check `tsconfig.json` and ensure all dependencies are in `package.json`

### Runtime Errors

**Issue**: Database connection fails
**Solution**: 
- Verify `DATABASE_URL` is set correctly in Railway
- Check GoDaddy MySQL is accessible from Railway IP
- Ensure database user has correct permissions

**Issue**: API calls fail
**Solution**:
- Verify `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` are set
- Verify `GOOGLE_PAGESPEED_API_KEY` is set
- Check Railway logs for specific API errors

**Issue**: CSV file not found
**Solution**: The file `data/missouri_locations_transformed.csv` should be in the repository. Verify it's committed.

---

## 🔄 Deployment Workflow

### Initial Deployment

1. Push code to `hybrid-model-implementation` branch
2. Railway auto-detects and starts build
3. Set all environment variables in Railway dashboard
4. Wait for deployment to complete
5. Verify endpoints work

### Updates

1. Push changes to `hybrid-model-implementation` branch
2. Railway automatically rebuilds and redeploys
3. No manual steps needed

---

## 📊 Monitoring

### Railway Logs

View logs in Railway dashboard:
- Build logs: Shows build process
- Deploy logs: Shows runtime output
- Error logs: Shows any runtime errors

### Health Checks

Monitor these endpoints:
- `/api/ping` - Basic health check
- `/api/health/db` - Database connection check

---

## 🎯 Hybrid Model Specific Notes

### Database-First Routes
- `/api/serp/search-prospects` - Uses database only
- `/api/serp/business/:id` - Uses database, returns `needsLiveData` flag

### Live API Routes (Called on Tab Click)
- `/api/serp/business/:id/seo-ppc` - Calls: On-Page, PageSpeed, HTML Analysis, Safe Browsing, Ads APIs
- `/api/serp/business/:id/ads` - Calls: Ads Search, Ads Advertisers APIs
- `/api/serp/business/:id/reputation` - Calls: Google Places, DataForSEO Reviews APIs

### Required Services
All these services must be available:
- `server/services/dataforseoService.ts` - DataForSEO API calls
- `server/services/googleApiService.ts` - Google API calls (PageSpeed, Safe Browsing, Places)
- `server/services/htmlAnalysisService.ts` - HTML fetching and analysis
- `server/services/scoreCalculationService.ts` - Score calculations

---

## 📝 Important Files

### Must Be in Repository
- `package.json` - Dependencies and scripts
- `server/node-build.ts` - Production server entry
- `server/index.ts` - Server setup
- `server/routes/serp-intelligence.ts` - Hybrid model routes
- `server/services/*.ts` - All service files
- `prisma/schema.prisma` - Database schema
- `data/missouri_locations_transformed.csv` - Location data
- All other source files

### Build Output
- `dist/spa/` - Frontend build (not needed for Railway backend-only)
- `dist/server/` - Server build (used by `pnpm start`)

---

## 🚨 Common Issues

### Issue: "Cannot find module"
**Cause**: Missing dependency or incorrect import path
**Solution**: Check `package.json` has all dependencies, run `pnpm install` locally to verify

### Issue: "Port already in use"
**Cause**: Railway sets PORT automatically
**Solution**: Use `process.env.PORT || 3000` in code (already done)

### Issue: "CSV file not found"
**Cause**: File path changed after organization
**Solution**: Updated in `server/routes/serp-intelligence.ts` to use `data/missouri_locations_transformed.csv`

---

## ✅ Success Criteria

Deployment is successful when:
1. ✅ Railway build completes without errors
2. ✅ Service is "Deployed" and running
3. ✅ `/api/ping` returns `{"message": "ping"}`
4. ✅ `/api/health/db` returns `{"ok": true}`
5. ✅ Search prospects endpoint works (database)
6. ✅ Business profile endpoint works (database)
7. ✅ SEO/PPC tab works (live APIs)
8. ✅ Ads tab works (live APIs)
9. ✅ Reputation tab works (live APIs)

---

**Last Updated**: January 2025  
**Branch**: `hybrid-model-implementation`  
**Status**: Ready for Railway Deployment

