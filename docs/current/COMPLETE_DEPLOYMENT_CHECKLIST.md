# 🚀 Complete Deployment Checklist - Hybrid Model with DB/Live Toggle

## Overview
This checklist covers deploying the complete system with the new DB/Live toggle switch feature.

**Branch**: `Hybrid-with-switch`  
**Status**: Ready for deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Code Status
- [x] All code changes committed to `Hybrid-with-switch` branch
- [x] Branch pushed to GitHub
- [x] All tests pass locally
- [x] Frontend toggle switch working
- [x] Backend DB/Live mode routing working

### ✅ Files Ready
- [x] `client/agents/prospect-finder/index.tsx` - Toggle switch UI
- [x] `server/routes/serp-intelligence.ts` - Mode routing logic
- [x] `server/services/dataforseoService.ts` - Service updates
- [x] `data/missouri_locations_transformed.csv` - Location data
- [x] All documentation updated

---

## 🔧 Step 1: Backend Deployment (Railway)

### 1.1 Update Railway Branch Configuration

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Navigate to your project

2. **Update Branch Selection**
   - Go to: Settings → Source
   - Change branch from `hybrid-model-implementation` to `Hybrid-with-switch`
   - Save changes
   - Railway will automatically trigger a new deployment

### 1.2 Verify Build Settings

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

### 1.3 Set Environment Variables

Go to Railway Dashboard → Your Service → Variables tab:

#### Database
```env
DATABASE_URL=mysql://portal_db_user:Techsodream2021%21@p3plzcpnl504611.prod.phx3.secureserver.net:3306/clinicprospect
```

#### Authentication
```env
JWT_SECRET=<your-jwt-secret-here>
JWT_REFRESH_SECRET=<your-refresh-secret-here>
NODE_ENV=production
PORT=3000
```

#### Frontend URLs
```env
FRONTEND_URL=https://ensembledemospace.com,http://localhost:8080
```

#### DataForSEO API
```env
DATAFORSEO_BASE_URL=https://api.dataforseo.com/v3
DATAFORSEO_LOGIN=<your-dataforseo-login>
DATAFORSEO_PASSWORD=<your-dataforseo-password>
```

#### Google APIs (REQUIRED)
```env
GOOGLE_PAGESPEED_API_KEY=<your-google-pagespeed-api-key>
# OR (alternative name)
GOOGLE_PAGESPEED_INSIGHTS_API_KEY=<your-google-pagespeed-api-key>
```

**Note**: Google Places API and Safe Browsing API use the same key as PageSpeed.

#### LLM API Keys (Optional)
```env
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
GEMINI_API_KEY=<your-gemini-key>
```

#### Other
```env
PING_MESSAGE=ping
```

### 1.4 Monitor Deployment

1. **Watch Build Logs**
   - Go to Railway Dashboard → Deployments
   - Monitor build progress
   - Check for any errors

2. **Verify Deployment**
   - Wait for "Deployed" status
   - Check service is running (green indicator)

### 1.5 Test Backend Endpoints

After deployment, test these endpoints:

```bash
# Health check
curl https://your-railway-url.up.railway.app/api/ping
# Expected: {"message":"ping"}

# Database health
curl https://your-railway-url.up.railway.app/api/health/db
# Expected: {"ok":true}
```

**✅ Backend Deployment Complete When:**
- [ ] Build completes without errors
- [ ] Service shows "Deployed" status
- [ ] `/api/ping` returns `{"message": "ping"}`
- [ ] `/api/health/db` returns `{"ok": true}`

---

## 🎨 Step 2: Frontend Deployment (GoDaddy cPanel)

### 2.1 Build Frontend Locally

```bash
# Navigate to project root
cd /Users/ganesh/Desktop/Ensemblenew

# Build frontend (creates dist/spa/ folder)
pnpm build
```

**Verify Build Output:**
- Check `dist/spa/` folder exists
- Check `dist/spa/index.html` exists

### 2.2 Update API Base URL in index.html

**CRITICAL**: Before creating ZIP, update the API base URL:

1. **Open** `dist/spa/index.html`
2. **Find** the script tag in `<head>`:
   ```html
   <script>window.__API_BASE__=''</script>
   ```
3. **Replace** with your Railway backend URL (NO trailing `/api`):
   ```html
   <script>window.__API_BASE__='https://portalconnect-production.up.railway.app'</script>
   ```
   **OR** if using a different Railway URL:
   ```html
   <script>window.__API_BASE__='https://your-railway-url.up.railway.app'</script>
   ```

**Important Notes:**
- ✅ NO trailing `/api` in the base URL
- ✅ Script must be in `<head>` BEFORE app bundle loads
- ✅ Use `window.__API_BASE__` (not `window.API_BASE`)

### 2.3 Create Deployment ZIP

```bash
# Navigate to dist folder
cd dist

# Create ZIP file
zip -r spa-godaddy-upload.zip spa
```

**Verify ZIP:**
- Check `dist/spa-godaddy-upload.zip` exists
- File size should be reasonable (typically 1-5 MB)

### 2.4 Upload to GoDaddy cPanel

1. **Login to GoDaddy cPanel**
   - Go to your GoDaddy account
   - Open cPanel File Manager

2. **Navigate to public_html**
   - Go to `public_html` folder (your website root)

3. **Backup Current Files (Recommended)**
   - Select all files in `public_html`
   - Click "Compress" to create a backup ZIP
   - Name it: `backup-before-toggle-deploy-YYYY-MM-DD.zip`

4. **Upload ZIP File**
   - Click "Upload" button
   - Select `spa-godaddy-upload.zip` from your `dist/` folder
   - Wait for upload to complete

5. **Extract Files**
   - Right-click on `spa-godaddy-upload.zip`
   - Select "Extract"
   - Extract to `public_html` (this extracts the `spa/` folder)

6. **Move Files to Root (If Needed)**
   - If files are in `public_html/spa/`, move all contents from `spa/` to `public_html/`
   - OR ensure `index.html` is at `public_html/index.html`
   - All files should be directly in `public_html/`, not in a subfolder

7. **Verify .htaccess File**
   - Check that `.htaccess` file exists in `public_html/`
   - This file is required for React Router to work
   - If missing, check if it was in the ZIP

8. **Delete ZIP File (Cleanup)**
   - Delete `spa-godaddy-upload.zip` after extraction

**✅ Frontend Deployment Complete When:**
- [ ] ZIP uploaded successfully
- [ ] Files extracted to `public_html/`
- [ ] `index.html` is at `public_html/index.html`
- [ ] `.htaccess` file exists
- [ ] API base URL script is correct in `index.html`

---

## 🧪 Step 3: Testing & Verification

### 3.1 Frontend Testing

1. **Visit Your Website**
   - Go to: `https://ensembledemospace.com`
   - Check browser console for errors (F12 → Console)

2. **Test Login/Signup**
   - Verify authentication works
   - Check API calls go to Railway backend

3. **Test Prospect Finder**
   - Navigate to Prospect Finder agent
   - Verify toggle switch appears (above search form)
   - Toggle should show "Database" / "Live API" labels

### 3.2 Test Database Mode

1. **Set Toggle to "Database"**
   - Toggle switch should be on "Database" side

2. **Search for Prospects**
   - Keyword: `spine`
   - Location: `Chesterfield`
   - Click "Search Prospects"

3. **Verify Results**
   - Should load quickly (from database)
   - Should show ~100 businesses (if data exists)
   - Loading message: "Loading from database..."
   - Results should display with map

### 3.3 Test Live Mode

1. **Set Toggle to "Live API"**
   - Toggle switch should be on "Live API" side

2. **Search for Prospects**
   - Keyword: `spine`
   - Location: `Chesterfield`
   - Click "Search Prospects"

3. **Verify Results**
   - Should take 6-8 seconds (API calls)
   - Loading message: "Fetching live results from APIs..."
   - Should return fresh results from DataForSEO
   - Results should display with map
   - Results should be stored in database for future DB mode searches

### 3.4 Test Mode Persistence

1. **Refresh Page**
   - Toggle selection should persist (via sessionStorage)
   - Mode should remain the same after refresh

2. **Test in New Tab**
   - Open new tab
   - Navigate to Prospect Finder
   - Toggle should default to "Database" (new session)

### 3.5 Test Business Details

1. **Click on a Business**
   - Should load business profile
   - Should show tabs: Overview, SEO & PPC, Ads, Reputation

2. **Test SEO & PPC Tab**
   - Should load competitor data
   - Should show dynamic competitor keywords
   - Should show location-aware competitors

3. **Test Ads Tab**
   - Should load ad data
   - Should show competitor ads

4. **Test Reputation Tab**
   - Should load reviews and ratings
   - Should show Google Places data

**✅ Testing Complete When:**
- [ ] Frontend loads without errors
- [ ] Toggle switch appears and works
- [ ] Database mode returns cached results
- [ ] Live mode makes API calls and returns fresh results
- [ ] Mode persists across page refresh
- [ ] Business details tabs work correctly
- [ ] Competitor data loads dynamically

---

## 🔍 Step 4: Troubleshooting

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- API calls fail
- Network errors in browser console
- "Failed to fetch" errors

**Solutions:**
1. Check `index.html` has correct API base URL
2. Verify Railway backend is running
3. Check CORS settings in backend
4. Verify `FRONTEND_URL` in Railway includes your domain

### Issue: Toggle Switch Not Appearing

**Symptoms:**
- No toggle switch in Prospect Finder
- UI looks different

**Solutions:**
1. Verify frontend build includes latest changes
2. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for JavaScript errors
4. Verify `client/agents/prospect-finder/index.tsx` was included in build

### Issue: Database Mode Returns No Results

**Symptoms:**
- Database mode shows "No results found"
- But Live mode works

**Solutions:**
1. Check database has data for the search
2. Verify database connection in Railway
3. Check Railway logs for database errors
4. Run a Live mode search first to populate database

### Issue: Live Mode Fails

**Symptoms:**
- Live mode shows error
- API calls fail

**Solutions:**
1. Check DataForSEO API credentials in Railway
2. Verify `GOOGLE_PAGESPEED_API_KEY` is set
3. Check Railway logs for API errors
4. Verify API quotas/limits not exceeded

### Issue: Competitor Data Not Loading

**Symptoms:**
- SEO & PPC tab shows "No competitor data"
- Competitors section empty

**Solutions:**
1. Check `data/missouri_locations_transformed.csv` exists in repository
2. Verify location string format is correct
3. Check Railway logs for competitor search errors
4. Verify dynamic keyword selection is working

---

## 📊 Step 5: Post-Deployment Monitoring

### Monitor Railway Logs

1. **Check Deployment Logs**
   - Railway Dashboard → Deployments → Latest deployment
   - Look for any warnings or errors

2. **Check Runtime Logs**
   - Railway Dashboard → Your Service → Logs
   - Monitor for errors or issues

### Monitor Frontend

1. **Check Browser Console**
   - Visit website
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

2. **Test User Flows**
   - Login/Signup
   - Prospect search (both modes)
   - Business details
   - All tabs

### Monitor Database

1. **Check Database Connection**
   - Use Railway health endpoint: `/api/health/db`
   - Should return `{"ok": true}`

2. **Check Data Growth**
   - Monitor database size
   - Check if new searches are being stored

---

## ✅ Final Deployment Checklist

### Backend (Railway)
- [ ] Branch updated to `Hybrid-with-switch`
- [ ] Build completes successfully
- [ ] All environment variables set
- [ ] Service deployed and running
- [ ] Health endpoints working
- [ ] API endpoints responding

### Frontend (GoDaddy cPanel)
- [ ] Frontend built successfully
- [ ] API base URL updated in `index.html`
- [ ] ZIP file created
- [ ] Files uploaded to cPanel
- [ ] Files extracted to `public_html/`
- [ ] `.htaccess` file present
- [ ] Website loads without errors

### Testing
- [ ] Frontend connects to backend
- [ ] Toggle switch appears and works
- [ ] Database mode works
- [ ] Live mode works
- [ ] Mode persistence works
- [ ] Business details load
- [ ] All tabs work correctly
- [ ] Competitor data loads

### Documentation
- [ ] Deployment guide updated
- [ ] Branch reference updated in docs
- [ ] All changes documented

---

## 🎉 Deployment Complete!

Once all checkboxes are marked, your deployment is complete!

**Next Steps:**
- Monitor for any issues
- Collect user feedback
- Plan future improvements

---

## 📝 Important Notes

1. **Branch Reference**: Make sure Railway is using `Hybrid-with-switch` branch (not `hybrid-model-implementation`)

2. **API Base URL**: Must be updated in `dist/spa/index.html` BEFORE creating ZIP

3. **Database**: No changes needed - already configured and working

4. **Environment Variables**: All must be set in Railway dashboard

5. **Backup**: Always backup current files before deploying frontend

6. **Testing**: Test both DB and Live modes thoroughly before considering deployment complete

---

**Last Updated**: January 2025  
**Branch**: `Hybrid-with-switch`  
**Status**: Ready for Deployment

