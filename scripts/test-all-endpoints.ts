/**
 * Test All Endpoints - Verify Database Access
 * Tests all critical endpoints to ensure data is accessible
 */

import "dotenv/config";
import axios from "axios";

const API_BASE = process.env.API_BASE || "http://localhost:3001/api";
const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test12345";

let authToken: string | null = null;

async function login() {
  console.log("\n🔐 Testing Login...");
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log("✅ Login successful");
      return true;
    } else {
      console.log("❌ Login failed: No token received");
      return false;
    }
  } catch (error: any) {
    console.log(`❌ Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testSearchProspects() {
  console.log("\n🔍 Testing Search Prospects...");
  try {
    const response = await axios.get(`${API_BASE}/serp/prospects`, {
      params: {
        keyword: "Spine",
        location: "Chesterfield, MO",
        maxResults: 20
      },
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response keys: ${Object.keys(response.data).join(', ')}`);
    
    // The route returns { success: true, data: { businesses: [...], total: ... } }
    const businesses = response.data.data?.businesses || response.data.businesses || [];
    const count = businesses.length;
    
    if (response.data.success) {
      console.log(`✅ Search successful: Found ${count} businesses`);
      
      if (count > 0) {
        const first = businesses[0];
        console.log(`   First business: ${first.name}`);
        console.log(`   Has coordinates: ${!!(first.lat && first.lng)}`);
        console.log(`   Has domain: ${!!first.domain}`);
        return { success: true, profileId: first.id, count };
      }
      console.log("   ⚠️  No businesses found in response");
      return { success: true, profileId: null, count: 0 };
    } else {
      console.log("❌ Search failed: Invalid response");
      console.log(`   Full response: ${JSON.stringify(response.data, null, 2)}`);
      return { success: false, profileId: null, count: 0 };
    }
  } catch (error: any) {
    console.log(`❌ Search failed: ${error.response?.data?.message || error.message}`);
    return { success: false, profileId: null, count: 0 };
  }
}

async function testGetBusinessProfile(profileId: string) {
  console.log(`\n📋 Testing Get Business Profile (${profileId})...`);
  try {
    const response = await axios.get(`${API_BASE}/serp/business/${profileId}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    
    if (response.data.success && response.data.business) {
      const business = response.data.business;
      console.log(`✅ Business profile loaded: ${business.name}`);
      console.log(`   Domain: ${business.domain || 'N/A'}`);
      console.log(`   SEO Score: ${business.seoScore ?? 'N/A'}`);
      console.log(`   Page Speed: ${business.pageSpeed ?? 'N/A'}`);
      console.log(`   Mobile Score: ${business.mobileScore ?? 'N/A'}`);
      console.log(`   Domain Authority: ${business.domainAuthority ?? 'N/A'}`);
      return { success: true, business };
    } else {
      console.log("❌ Business profile failed: Invalid response");
      return { success: false, business: null };
    }
  } catch (error: any) {
    console.log(`❌ Business profile failed: ${error.response?.data?.message || error.message}`);
    return { success: false, business: null };
  }
}

async function testGetSEOAndPPC(profileId: string) {
  console.log(`\n📊 Testing Get SEO & PPC (${profileId})...`);
  try {
    const response = await axios.get(`${API_BASE}/serp/business/${profileId}/seo-ppc`, {
      params: { location: "Chesterfield, MO" },
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log(`✅ SEO & PPC data loaded`);
      console.log(`   Desktop Speed: ${data.speedScores?.desktop ?? 'N/A'}`);
      console.log(`   Mobile Speed: ${data.speedScores?.mobile ?? 'N/A'}`);
      console.log(`   Google Analytics: ${data.analytics?.googleAnalytics?.found ? 'Found' : 'Not Found'}`);
      console.log(`   Facebook Pixel: ${data.analytics?.facebookPixel?.found ? 'Found' : 'Not Found'}`);
      console.log(`   Local Business Schema: ${data.schemas?.localBusiness ? 'Yes' : 'No'}`);
      console.log(`   Running Ads: ${data.ppcStatus?.runningAds ? 'Yes' : 'No'}`);
      console.log(`   Ad Count: ${data.ppcStatus?.adCount ?? 0}`);
      console.log(`   Opportunity Score: ${data.opportunityScore ?? 'N/A'}`);
      console.log(`   Core Web Vitals: ${data.coreWebVitals ? 'Present' : 'Missing'}`);
      return { success: true, data };
    } else {
      console.log("❌ SEO & PPC failed: Invalid response");
      return { success: false, data: null };
    }
  } catch (error: any) {
    console.log(`❌ SEO & PPC failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, data: null };
  }
}

async function testGetAds(profileId: string) {
  console.log(`\n📢 Testing Get Ads (${profileId})...`);
  try {
    const response = await axios.get(`${API_BASE}/serp/business/${profileId}/ads`, {
      params: { location: "Chesterfield, MO" },
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    
    if (response.data.success) {
      const ads = response.data.ads || [];
      const isPaid = response.data.isPaid || false;
      console.log(`✅ Ads data loaded`);
      console.log(`   Is Paid: ${isPaid}`);
      console.log(`   Ad Count: ${ads.length}`);
      if (ads.length > 0) {
        console.log(`   First ad: ${ads[0].title || 'N/A'}`);
        console.log(`   First ad platform: ${ads[0].platform || 'N/A'}`);
      }
      return { success: true, ads, isPaid };
    } else {
      console.log("❌ Ads failed: Invalid response");
      return { success: false, ads: [], isPaid: false };
    }
  } catch (error: any) {
    console.log(`❌ Ads failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return { success: false, ads: [], isPaid: false };
  }
}

async function testComprehensiveScore(profileId: string) {
  console.log(`\n📈 Testing Comprehensive Score (${profileId})...`);
  try {
    const response = await axios.get(`${API_BASE}/serp/business/${profileId}/comprehensive-score`, {
      params: { location: "Chesterfield, MO" },
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    });
    
    if (response.data.success && response.data.score) {
      const score = response.data.score;
      console.log(`✅ Comprehensive score loaded`);
      console.log(`   Overall Score: ${score.overall ?? 'N/A'}`);
      console.log(`   SEO Score: ${score.seo ?? 'N/A'}`);
      console.log(`   PPC Score: ${score.ppc ?? 'N/A'}`);
      console.log(`   Opportunity Score: ${score.opportunity ?? 'N/A'}`);
      return { success: true, score };
    } else {
      console.log("❌ Comprehensive score failed: Invalid response");
      return { success: false, score: null };
    }
  } catch (error: any) {
    console.log(`❌ Comprehensive score failed: ${error.response?.data?.message || error.message}`);
    return { success: false, score: null };
  }
}

async function runAllTests() {
  console.log("🚀 Starting Endpoint Tests...");
  console.log(`   API Base: ${API_BASE}`);
  
  // Test 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log("\n⚠️  Login failed, but continuing with tests (some endpoints may work without auth)");
  }
  
  // Test 2: Search Prospects
  const searchResult = await testSearchProspects();
  if (!searchResult.success || !searchResult.profileId) {
    console.log("\n❌ Cannot continue tests - no businesses found");
    return;
  }
  
  const profileId = searchResult.profileId;
  console.log(`\n✅ Using profile ID: ${profileId}`);
  
  // Test 3: Get Business Profile
  const profileResult = await testGetBusinessProfile(profileId);
  
  // Test 4: Get SEO & PPC
  const seoResult = await testGetSEOAndPPC(profileId);
  
  // Test 5: Get Ads
  const adsResult = await testGetAds(profileId);
  
  // Test 6: Comprehensive Score
  const scoreResult = await testComprehensiveScore(profileId);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Login: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`Search: ${searchResult.success ? '✅' : '❌'} (${searchResult.count} businesses)`);
  console.log(`Business Profile: ${profileResult.success ? '✅' : '❌'}`);
  console.log(`SEO & PPC: ${seoResult.success ? '✅' : '❌'}`);
  console.log(`Ads: ${adsResult.success ? '✅' : '❌'} (${adsResult.ads.length} ads, isPaid: ${adsResult.isPaid})`);
  console.log(`Comprehensive Score: ${scoreResult.success ? '✅' : '❌'}`);
  
  // Data Quality Check
  if (seoResult.success && seoResult.data) {
    console.log("\n📋 Data Quality Check:");
    const data = seoResult.data;
    const checks = [
      { name: "Desktop Speed", value: data.speedScores?.desktop, has: data.speedScores?.desktop != null },
      { name: "Mobile Speed", value: data.speedScores?.mobile, has: data.speedScores?.mobile != null },
      { name: "Google Analytics", value: data.analytics?.googleAnalytics?.found, has: data.analytics?.googleAnalytics?.found != null },
      { name: "Facebook Pixel", value: data.analytics?.facebookPixel?.found, has: data.analytics?.facebookPixel?.found != null },
      { name: "Local Business Schema", value: data.schemas?.localBusiness, has: data.schemas?.localBusiness != null },
      { name: "Core Web Vitals", value: data.coreWebVitals, has: !!data.coreWebVitals },
      { name: "Opportunity Score", value: data.opportunityScore, has: data.opportunityScore != null }
    ];
    
    checks.forEach(check => {
      console.log(`   ${check.has ? '✅' : '❌'} ${check.name}: ${check.value ?? 'N/A'}`);
    });
  }
  
  console.log("\n" + "=".repeat(60));
}

runAllTests().catch(console.error);

