# Hybrid Model UI Testing Plan - Detailed Todos

## Phase 1: Data Collection (2 businesses)

### Todo 1.1: Run Collection Script
- **Action**: Execute `pnpm tsx scripts/collect-spine-data.ts --test --limit=2`
- **Verify**: Script completes without errors
- **Verify**: Console shows "✅ Data collection complete!"
- **Verify**: Statistics show 2 businesses processed and stored
- **Dependencies**: None

### Todo 1.2: Verify Database Records Created
- **Action**: Check `serp_results` table for 2 new records
- **Verify**: Records have `serpJobId` matching the created job
- **Verify**: `rawData.enriched.gmbInfo` exists in both records
- **Verify**: `rawData.ads` exists (if ads matched) or is null (if no ads)
- **Dependencies**: [1.1]

### Todo 1.3: Verify Business Profiles Created
- **Action**: Check `business_profiles` table for 2 new records
- **Verify**: `name` field populated correctly
- **Verify**: `domain` field populated (if available)
- **Verify**: `websiteUrl` field populated (if available)
- **Verify**: `isPaid` flag set correctly (true if ads matched, false otherwise)
- **Verify**: Basic fields populated: `phone`, `address`, `city`, `state`, `zipCode`, `rating`, `reviewsCount`
- **Dependencies**: [1.1]

### Todo 1.4: Verify Ads Advertisers API Success
- **Action**: Check collection script output for Ads Advertisers API response
- **Verify**: No "Invalid Field: 'location_name'" errors
- **Verify**: API call completes successfully (status_code: 20000)
- **Verify**: Advertisers matched to businesses (if any found)
- **Dependencies**: [1.1]

## Phase 2: Browser Authentication

### Todo 2.1: Check Authentication Token
- **Action**: Open browser DevTools → Application → Local Storage
- **Verify**: `token` key exists in localStorage
- **Verify**: Token value is not empty or null
- **Dependencies**: None

### Todo 2.2: Verify Token Validity (if token exists)
- **Action**: Navigate to app home page
- **Verify**: User is logged in (no redirect to login page)
- **Verify**: User profile/name visible in UI
- **Dependencies**: [2.1]

### Todo 2.3: Login (if token missing or invalid)
- **Action**: Navigate to login page
- **Action**: Enter valid credentials
- **Action**: Click login button
- **Verify**: Token stored in localStorage after login
- **Verify**: Redirect to dashboard/home page
- **Verify**: User profile/name visible in UI
- **Dependencies**: [2.1]

## Phase 3: Prospect Finder Testing

### Todo 3.1: Navigate to Prospect Finder
- **Action**: Click on "Prospect Finder" in navigation
- **Verify**: Prospect Finder page loads
- **Verify**: Search form visible
- **Dependencies**: [2.2 or 2.3]

### Todo 3.2: Perform Search
- **Action**: Enter keyword: "Spine"
- **Action**: Enter location: "Chesterfield, MO"
- **Action**: Click search button
- **Verify**: Loading state appears
- **Verify**: Results appear after loading
- **Verify**: At least 2 businesses shown in results
- **Dependencies**: [3.1, 1.2, 1.3]

### Todo 3.3: Verify Business Card 1 - Basic Info
- **Action**: Locate first business in results
- **Verify**: Business name/title displays correctly
- **Verify**: Category displays
- **Verify**: Location (city, state) displays
- **Verify**: Rating displays with star icon
- **Verify**: Review count displays
- **Verify**: Phone number displays (if available)
- **Verify**: Website/domain displays (if available)
- **Dependencies**: [3.2]

### Todo 3.4: Verify Business Card 1 - Running Ads Badge
- **Action**: Check first business card
- **Verify**: "Running Ads" badge appears if `isRunningAds: true`
- **Verify**: Badge shows `approxAdsCount` in parentheses if available
- **Verify**: Badge does NOT appear if `isRunningAds: false`
- **Dependencies**: [3.3]

### Todo 3.5: Verify Business Card 1 - Scores
- **Action**: Check first business card
- **Verify**: Lead Score displays (number)
- **Verify**: Score breakdown visible (Presence, SEO, Ads, Engagement scores)
- **Verify**: Scores are numeric values (not null/undefined)
- **Dependencies**: [3.3]

### Todo 3.6: Verify Business Card 1 - Contact Info
- **Action**: Expand first business card (if expandable)
- **Verify**: Phone number displays correctly
- **Verify**: Email displays (if from GMB)
- **Verify**: Website URL displays and is clickable
- **Dependencies**: [3.3]

### Todo 3.7: Verify Business Card 1 - Additional Data
- **Action**: Check first business card for additional fields
- **Verify**: Specialties display (if from GMB)
- **Verify**: Insurance Accepted displays (if from GMB)
- **Dependencies**: [3.3]

### Todo 3.8: Verify Business Card 2 - All Fields
- **Action**: Repeat todos 3.3-3.7 for second business
- **Verify**: All fields display correctly for second business
- **Dependencies**: [3.2]

### Todo 3.9: Verify Data Association
- **Action**: Click on first business card
- **Verify**: URL changes to `/business-profile/{profileId}`
- **Verify**: `profileId` in URL matches database `business_profiles.id`
- **Verify**: Business name in profile matches card name
- **Dependencies**: [3.3]

## Phase 4: Business Profile Overview Tab Testing

### Todo 4.1: Load Business Profile Page
- **Action**: Navigate to business profile (from Prospect Finder click)
- **Verify**: URL is `/business-profile/{profileId}`
- **Verify**: Page loads without errors
- **Verify**: Loading spinner appears then disappears
- **Verify**: Business name visible at top of page
- **Dependencies**: [3.9]

### Todo 4.2: Verify Business Card (Top Section)
- **Action**: Check top business card section
- **Verify**: Business name displays
- **Verify**: Category displays
- **Verify**: Subcategory/specialty displays (if available)
- **Verify**: Rating displays with star icon and numeric value
- **Verify**: Reviews count displays (e.g., "X reviews")
- **Verify**: Full address displays (street, city, state, zip)
- **Verify**: Phone number displays and is clickable
- **Verify**: Website URL displays and is clickable link
- **Verify**: Email displays (if available from GMB)
- **Dependencies**: [4.1]

### Todo 4.3: Verify Business Overview Section
- **Action**: Check "Business Overview" section in Overview tab
- **Verify**: Category displays correctly
- **Verify**: Specialty/Subcategory displays
- **Verify**: Rating displays with star icon
- **Verify**: Reviews count displays
- **Verify**: Services list displays (if from GMB)
- **Verify**: Specialties display (if from GMB)
- **Verify**: Insurance Accepted displays (if from GMB)
- **Verify**: Business Hours display (if from GMB)
- **Dependencies**: [4.1]

### Todo 4.4: Verify Key Metrics (if available)
- **Action**: Check for key metrics section
- **Verify**: Domain Authority displays (if available)
- **Verify**: Backlinks count displays (if available)
- **Verify**: Monthly Traffic displays (if available)
- **Verify**: PageSpeed score displays (if available)
- **Dependencies**: [4.1]

### Todo 4.5: Verify Data Matching with Database
- **Action**: Compare displayed data with database records
- **Verify**: Name matches `business_profiles.name`
- **Verify**: Domain matches `business_profiles.domain`
- **Verify**: Phone matches `business_profiles.phone`
- **Verify**: Address matches `business_profiles.address`
- **Verify**: Rating matches `business_profiles.rating`
- **Verify**: Reviews count matches `business_profiles.reviewsCount`
- **Dependencies**: [4.1, 1.3]

## Phase 5: SEO & PPC Tab Testing (Live API)

### Todo 5.1: Click SEO & PPC Tab
- **Action**: Click "SEO & PPC" tab in Business Profile
- **Verify**: Tab becomes active
- **Verify**: Loading spinner appears immediately
- **Verify**: Tab content shows loading state
- **Dependencies**: [4.1]

### Todo 5.2: Verify On-Page Analysis Loads
- **Action**: Wait for SEO & PPC tab to finish loading
- **Verify**: On-Page Analysis section displays
- **Verify**: Issues list displays (or empty state if no issues)
- **Verify**: Technologies detected list displays
- **Verify**: Meta tags information displays
- **Dependencies**: [5.1]

### Todo 5.3: Verify PageSpeed Insights Loads
- **Action**: Check PageSpeed section in SEO & PPC tab
- **Verify**: Desktop performance score displays (0-100)
- **Verify**: Mobile performance score displays (0-100)
- **Verify**: Accessibility score displays (0-100)
- **Verify**: Scores are numeric values (not null/undefined)
- **Dependencies**: [5.1]

### Todo 5.4: Verify Analytics Detection Loads
- **Action**: Check Analytics section in SEO & PPC tab
- **Verify**: Google Analytics status displays (found/not found)
- **Verify**: Facebook Pixel status displays (found/not found)
- **Verify**: GA ID displays (if found)
- **Verify**: GA Type displays (if found)
- **Dependencies**: [5.1]

### Todo 5.5: Verify Schema Detection Loads
- **Action**: Check Schema section in SEO & PPC tab
- **Verify**: Schema types detected list displays (LocalBusiness, FAQ, etc.)
- **Verify**: Schema validation status displays
- **Verify**: Schema details visible (if schemas found)
- **Dependencies**: [5.1]

### Todo 5.6: Verify Safe Browsing Loads
- **Action**: Check Safe Browsing section in SEO & PPC tab
- **Verify**: Safe browsing status displays
- **Verify**: Status is clear (safe/unsafe/unknown)
- **Dependencies**: [5.1]

### Todo 5.7: Verify Keyword Rankings Loads
- **Action**: Check Keyword Rankings section in SEO & PPC tab
- **Verify**: SERP position displays
- **Verify**: Ranked keywords list displays (or empty state)
- **Verify**: Keywords show rank and URL
- **Dependencies**: [5.1]

### Todo 5.8: Verify Scores Calculate After Load
- **Action**: Wait for all live data to finish loading
- **Verify**: SEO Score calculated and displays
- **Verify**: Opportunity Score calculated and displays
- **Verify**: Score breakdown visible (all component scores)
- **Dependencies**: [5.2, 5.3, 5.4, 5.5, 5.6, 5.7]

### Todo 5.9: Verify Error Handling (if API fails)
- **Action**: If any API fails, check error display
- **Verify**: Error message displays (not blank/empty)
- **Verify**: Error icon (AlertTriangle) appears
- **Verify**: Retry button appears
- **Verify**: Section shows error state (not broken UI)
- **Dependencies**: [5.1]

## Phase 6: Ads Tab Testing (Live API)

### Todo 6.1: Click Ads Tab
- **Action**: Click "Ads" tab in Business Profile
- **Verify**: Tab becomes active
- **Verify**: Loading spinner appears immediately
- **Verify**: Tab content shows loading state
- **Dependencies**: [4.1]

### Todo 6.2: Verify Ad Creatives Load
- **Action**: Wait for Ads tab to finish loading
- **Verify**: List of ad creatives displays (or empty state if no ads)
- **Verify**: Each creative shows: title, description, URL, preview image, platform
- **Verify**: Creatives are clickable/expandable (if applicable)
- **Dependencies**: [6.1]

### Todo 6.3: Verify Advertiser Info Loads
- **Action**: Check Advertiser Info section in Ads tab
- **Verify**: Advertiser ID displays (if found)
- **Verify**: Verified status displays
- **Verify**: Approximate ads count displays
- **Dependencies**: [6.1]

### Todo 6.4: Verify Key Metrics Load
- **Action**: Check Key Metrics section in Ads tab
- **Verify**: Paid ETV (Estimated Traffic Value) displays
- **Verify**: Total ads count displays
- **Verify**: Ad recency score displays
- **Verify**: Platforms list displays
- **Dependencies**: [6.1]

### Todo 6.5: Verify Traffic Estimation Loads
- **Action**: Check Traffic Estimation section in Ads tab
- **Verify**: Paid traffic estimates display (if available)
- **Dependencies**: [6.1]

### Todo 6.6: Verify Error Handling (if API fails)
- **Action**: If any API fails, check error display
- **Verify**: Error message displays
- **Verify**: Error icon appears
- **Verify**: Retry button appears
- **Verify**: Section handles error gracefully
- **Dependencies**: [6.1]

## Phase 7: Reputation Tab Testing (Live API)

### Todo 7.1: Click Reputation Tab
- **Action**: Click "Reputation" tab in Business Profile
- **Verify**: Tab becomes active
- **Verify**: Loading spinner appears immediately
- **Verify**: Tab content shows loading state
- **Dependencies**: [4.1]

### Todo 7.2: Verify Google Places Reviews Load
- **Action**: Wait for Reputation tab to finish loading
- **Verify**: Recent reviews list displays
- **Verify**: Review text displays
- **Verify**: Rating displays for each review
- **Verify**: Author name displays
- **Verify**: Review date displays
- **Verify**: Reviews are properly formatted
- **Dependencies**: [7.1]

### Todo 7.3: Verify DataForSEO Reviews Load
- **Action**: Check for DataForSEO reviews section
- **Verify**: Additional reviews from DataForSEO API display (if available)
- **Dependencies**: [7.1]

### Todo 7.4: Verify Review Statistics Load
- **Action**: Check Review Statistics section
- **Verify**: Average rating displays
- **Verify**: Total review count displays
- **Verify**: Review distribution displays (if available)
- **Verify**: Response rate displays (if available)
- **Dependencies**: [7.1]

### Todo 7.5: Verify Error Handling (if API fails)
- **Action**: If any API fails, check error display
- **Verify**: Error message displays
- **Verify**: Error icon appears
- **Verify**: Retry button appears
- **Verify**: Section handles error gracefully
- **Dependencies**: [7.1]

## Phase 8: Second Business Profile Testing

### Todo 8.1: Navigate to Second Business
- **Action**: Go back to Prospect Finder
- **Action**: Click on second business from results
- **Verify**: URL changes to second business profile ID
- **Verify**: Business name in profile matches second business card
- **Dependencies**: [3.2, 4.1]

### Todo 8.2: Test Second Business - Overview Tab
- **Action**: Verify Overview tab for second business
- **Verify**: All data from todos 4.2-4.5 displays correctly
- **Verify**: Data matches second business (not first business)
- **Dependencies**: [8.1]

### Todo 8.3: Test Second Business - SEO & PPC Tab
- **Action**: Click SEO & PPC tab for second business
- **Verify**: All data from todos 5.2-5.8 loads correctly
- **Verify**: Data matches second business (not first business)
- **Dependencies**: [8.1]

### Todo 8.4: Test Second Business - Ads Tab
- **Action**: Click Ads tab for second business
- **Verify**: All data from todos 6.2-6.5 loads correctly
- **Verify**: Data matches second business (not first business)
- **Dependencies**: [8.1]

### Todo 8.5: Test Second Business - Reputation Tab
- **Action**: Click Reputation tab for second business
- **Verify**: All data from todos 7.2-7.4 loads correctly
- **Verify**: Data matches second business (not first business)
- **Dependencies**: [8.1]

### Todo 8.6: Verify No Data Leakage
- **Action**: Switch between first and second business profiles
- **Verify**: Business 1 data doesn't appear in Business 2 profile
- **Verify**: Business 2 data doesn't appear in Business 1 profile
- **Verify**: Tab switching doesn't mix data between tabs
- **Dependencies**: [8.2, 8.3, 8.4, 8.5]

## Phase 9: Error Fixing and Retesting

### Todo 9.1: Document Errors
- **Action**: Note any errors encountered during testing
- **Verify**: Error type identified (API error, UI error, navigation error, auth error)
- **Verify**: Error location documented (which tab, which business, which API)
- **Verify**: Error message captured
- **Dependencies**: [All previous todos]

### Todo 9.2: Fix Backend API Errors
- **Action**: If backend API errors found, fix route handlers
- **Action**: Check server logs for error details
- **Action**: Fix code in `server/routes/serp-intelligence.ts`
- **Verify**: Route returns correct data structure
- **Dependencies**: [9.1]

### Todo 9.3: Fix Frontend Display Errors
- **Action**: If frontend display errors found, fix component rendering
- **Action**: Check browser console for errors
- **Action**: Fix code in `client/pages/BusinessProfilePage.tsx` or `client/agents/prospect-finder/index.tsx`
- **Verify**: UI displays data correctly
- **Dependencies**: [9.1]

### Todo 9.4: Fix Data Mapping Errors
- **Action**: If data mapping errors found, fix data transformation
- **Action**: Verify API response structure matches expected format
- **Action**: Fix mapping logic in routes
- **Verify**: Data maps correctly from API to UI
- **Dependencies**: [9.1]

### Todo 9.5: Fix Authentication Errors
- **Action**: If authentication errors found, verify token handling
- **Action**: Check token validation in routes
- **Action**: Verify token storage/retrieval in frontend
- **Verify**: Authentication works correctly
- **Dependencies**: [9.1]

### Todo 9.6: Retest After Fixes
- **Action**: After each fix, retest the affected functionality
- **Verify**: Fix resolves the issue
- **Verify**: No new errors introduced
- **Verify**: Continue testing remaining functionality
- **Dependencies**: [9.2, 9.3, 9.4, 9.5]

## Phase 10: Final Verification

### Todo 10.1: Complete End-to-End Flow Test
- **Action**: Perform complete flow without errors
- **Action**: 1. Login (if needed)
- **Action**: 2. Search in Prospect Finder
- **Action**: 3. View both businesses in results
- **Action**: 4. Click first business → Verify Overview tab
- **Action**: 5. Click SEO & PPC tab → Verify live data loads
- **Action**: 6. Click Ads tab → Verify live data loads
- **Action**: 7. Click Reputation tab → Verify live data loads
- **Action**: 8. Go back, click second business → Repeat steps 4-7
- **Verify**: All steps complete without errors
- **Dependencies**: [All previous todos]

### Todo 10.2: Performance Check
- **Action**: Measure loading times
- **Verify**: Initial page load is fast (database data, < 2 seconds)
- **Verify**: Tab clicks trigger loading states appropriately
- **Verify**: Live API calls complete within reasonable time (< 10 seconds)
- **Verify**: No unnecessary API calls on page load
- **Dependencies**: [10.1]

### Todo 10.3: Data Integrity Check
- **Action**: Verify data consistency
- **Verify**: Scores recalculate correctly after live data loads
- **Verify**: No data mixing between businesses
- **Verify**: No data mixing between tabs
- **Verify**: All displayed data matches database records
- **Dependencies**: [10.1]

## Success Criteria Summary

- [ ] Collection script runs successfully for 2 businesses
- [ ] Database contains correct data for both businesses
- [ ] Authentication works (login if needed)
- [ ] Prospect Finder search returns correct results
- [ ] Initial cards display all required data correctly
- [ ] "Running Ads" badge appears/disappears correctly
- [ ] Business Profile Overview tab displays all database data
- [ ] SEO & PPC tab loads live data correctly
- [ ] Ads tab loads live data correctly
- [ ] Reputation tab loads live data correctly
- [ ] Error handling works for all tabs
- [ ] Both businesses can be viewed and verified
- [ ] No data mixing between businesses
- [ ] Scores calculate correctly after live data loads
- [ ] Performance is acceptable (fast initial load, reasonable API call times)

