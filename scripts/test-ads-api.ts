/**
 * Test script to verify ads API returns data for Amit's business
 * Run: pnpm tsx scripts/test-ads-api.ts
 */

import { dataForSEOService } from '../server/services/dataforseoService.js';

async function testAdsAPI() {
  console.log('🧪 Testing Ads API for Amit\'s business...\n');
  
  const domain = 'onlinespinecare.com';
  const businessName = 'SPINE Center: Dr. Amit Bhandarkar';
  const location = 'Chesterfield, Missouri';
  
  console.log(`Domain: ${domain}`);
  console.log(`Business: ${businessName}`);
  console.log(`Location: ${location}\n`);
  
  try {
    // Test 1: Ads Search API (for ad creatives)
    console.log('📢 Test 1: Ads Search API (getAdsForDomain)...');
    const adsSearchData = await dataForSEOService.getAdsForDomain({
      target: domain, // ✅ Use 'target' not 'domain'
      locationCode: 2840, // ✅ Use locationCode for Missouri (not locationName)
      depth: 50 // Get up to 50 ads
    });
    
    const creatives = adsSearchData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`✅ Found ${creatives.length} ad creatives`);
    if (creatives.length > 0) {
      console.log('   First 3 ads:');
      creatives.slice(0, 3).forEach((ad: any, i: number) => {
        console.log(`   ${i + 1}. ${ad.title || 'No title'}`);
        console.log(`      Description: ${ad.description?.substring(0, 50) || 'No description'}...`);
        console.log(`      Platform: ${ad.platform || 'unknown'}`);
      });
    }
    console.log('');
    
    // Test 2: Ads Advertisers API
    console.log('📢 Test 2: Ads Advertisers API...');
    const advertisersData = await dataForSEOService.getAdsAdvertisers({
      keyword: businessName,
      locationCode: 2840 // ✅ Use locationCode for Missouri (not locationName)
    });
    
    const advertisers = advertisersData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`✅ Found ${advertisers.length} advertisers`);
    
    // Find matching advertiser
    const matchingAdvertiser = advertisers.find((adv: any) => {
      const advDomain = (adv.domain || adv.website || '').toLowerCase();
      return advDomain.includes(domain.replace('www.', '')) || 
             domain.replace('www.', '').includes(advDomain);
    });
    
    if (matchingAdvertiser) {
      console.log(`✅ Matched advertiser: ${matchingAdvertiser.domain || matchingAdvertiser.website}`);
      console.log(`   Advertiser ID: ${matchingAdvertiser.advertiser_id}`);
      console.log(`   Approx Ads Count: ${matchingAdvertiser.approx_ads_count || 'N/A'}`);
      console.log(`   Verified: ${matchingAdvertiser.verified || false}`);
    } else {
      console.log('⚠️  No matching advertiser found');
      if (advertisers.length > 0) {
        console.log('   Available advertisers:');
        advertisers.slice(0, 5).forEach((adv: any, i: number) => {
          console.log(`   ${i + 1}. ${adv.domain || adv.website} (${adv.approx_ads_count || 0} ads)`);
        });
      }
    }
    console.log('');
    
    // Test 3: Get ads for advertiser (if found)
    if (matchingAdvertiser?.advertiser_id) {
      console.log('📢 Test 3: Get Ads for Advertiser...');
      const advertiserAds = await dataForSEOService.getAdsForAdvertisers({
        advertiserIds: [matchingAdvertiser.advertiser_id],
        locationCode: 2840, // ✅ Use locationCode for Missouri (not locationName)
        depth: 50
      });
      
      const advertiserCreatives = advertiserAds?.tasks?.[0]?.result?.[0]?.items || [];
      console.log(`✅ Found ${advertiserCreatives.length} ads for advertiser`);
      if (advertiserCreatives.length > 0) {
        console.log('   First 3 ads:');
        advertiserCreatives.slice(0, 3).forEach((ad: any, i: number) => {
          console.log(`   ${i + 1}. ${ad.title || 'No title'}`);
          console.log(`      Platform: ${ad.platform || 'unknown'}`);
        });
      }
      console.log('');
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   Ads Search Creatives: ${creatives.length}`);
    console.log(`   Advertisers Found: ${advertisers.length}`);
    console.log(`   Matching Advertiser: ${matchingAdvertiser ? 'Yes' : 'No'}`);
    if (matchingAdvertiser) {
      console.log(`   Approx Ads Count: ${matchingAdvertiser.approx_ads_count || 'N/A'}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error testing ads API:', error.message);
    console.error(error);
  }
}

testAdsAPI();
