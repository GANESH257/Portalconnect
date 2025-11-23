# How to Get Google PageSpeed Insights API Key

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Make sure you're logged in with your Google account

### 2. Select Your Project
- If you already have a project, select it from the dropdown at the top
- If not, create a new project:
  - Click "Select a project" → "New Project"
  - Enter project name (e.g., "Ensemble PageSpeed")
  - Click "Create"

### 3. Enable PageSpeed Insights API
- In the left sidebar, go to **"APIs & Services"** → **"Library"**
- Search for: **"PageSpeed Insights API"**
- Click on it
- Click **"Enable"** button
- Wait for it to enable (usually instant)

### 4. Create API Key
- Go to **"APIs & Services"** → **"Credentials"** (in left sidebar)
- Click **"+ CREATE CREDENTIALS"** button at the top
- Select **"API key"**
- Your API key will be generated and displayed

### 5. Copy the API Key
- The API key will look like: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Copy it immediately** - you won't be able to see it again!

### 6. (Optional but Recommended) Restrict the API Key
- Click **"Restrict key"** button
- Under **"API restrictions"**, select **"Restrict key"**
- Check only **"PageSpeed Insights API"**
- Click **"Save"**

### 7. Add to Your .env File
- Open your `.env` file in the project root
- Add this line:
```bash
GOOGLE_PAGESPEED_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Replace `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual API key
- Save the file

### 8. Test It (Optional)
You can test the API key works by running:
```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://example.com&key=YOUR_API_KEY"
```

## Quick Visual Guide

```
Google Cloud Console
├── Select/Create Project
├── APIs & Services
│   ├── Library
│   │   └── Search "PageSpeed Insights API" → Enable
│   └── Credentials
│       └── + CREATE CREDENTIALS → API key
│           └── Copy key → Add to .env
```

## Important Notes

- ✅ **Free Tier**: 25,000 requests per day (plenty for our use case)
- ✅ **No Credit Card Required**: Free tier doesn't require billing
- ✅ **Rate Limits**: 25k/day is more than enough for 20-100 businesses
- ⚠️ **Keep It Secret**: Don't commit the API key to git (it's in `.env` which should be in `.gitignore`)

## Troubleshooting

### "API not enabled" error
- Make sure you enabled "PageSpeed Insights API" in step 3
- Wait a few minutes if you just enabled it

### "Invalid API key" error
- Check you copied the full key (no spaces)
- Make sure it's in `.env` file as `GOOGLE_PAGESPEED_API_KEY=...`
- Restart your server/script after adding to `.env`

### "Quota exceeded" error
- You've hit the 25k/day limit (unlikely for 20 businesses)
- Wait 24 hours or upgrade to paid tier (not needed for our use case)

## That's It!

Once you add the key to `.env`, the system will automatically use PageSpeed Insights as a fallback when On-Page API fails. No code changes needed!

