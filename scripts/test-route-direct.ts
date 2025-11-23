import { dataForSEOService } from '../server/services/dataforseoService';
import 'dotenv/config';

// Simulate EXACT route logic
async function testRouteLogic() {
  const domain = 'onlinespinecare.com';
  const businessName = 'SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery';
  const locationStr = 'Chesterfield, Missouri';
  
  // EXACT route logic for location code
  let locationCode = 2840;
  if (!locationStr.toLowerCase().includes('missouri') && !locationStr.toLowerCase().includes('mo')) {
    locationCode = dataForSEOService.getLocationCode(locationStr) || 2840;
    console.log(`Using dynamic location code ${locationCode} for ${locationStr}`);
  } else {
    console.log(`Using hardcoded Missouri location code 2840 for ${locationStr}`);
  }
  
  console.log('🔥 TESTING EXACT ROUTE LOGIC');
  console.log('='.repeat(60));
  console.log(`Domain: ${domain}`);
  console.log(`Business: ${businessName}`);
  console.log(`Location: ${locationStr}`);
  console.log(`LocationCode: ${locationCode}`);
  console.log('='.repeat(60));
  console.log('');
  
  const errors: { [key: string]: string } = {};
  let adsSearchData: any = null;
  let creatives: any[] = [];
  
  try {
    console.log('[Route Test] Fetching Ads Search...');
    console.log(`[Route Test] API Parameters: { target: "${domain}", locationCode: ${locationCode}, depth: 50 }`);
    
    adsSearchData = await dataForSEOService.getAdsForDomain({
      target: domain,
      locationCode: locationCode,
      depth: 50
    });
    
    console.log(`[Route Test] 📊 Ads Search API Response Summary:`);
    console.log(`  Status Code: ${adsSearchData?.status_code}`);
    console.log(`  Status Message: ${adsSearchData?.status_message}`);
    console.log(`  Tasks Count: ${adsSearchData?.tasks_count || 0}`);
    console.log(`  Tasks Error: ${adsSearchData?.tasks_error || 0}`);
    
    if (adsSearchData?.tasks?.[0]) {
      const task = adsSearchData.tasks[0];
      console.log(`  Task Status: ${task.status_code} - ${task.status_message}`);
      console.log(`  Result Count: ${task.result_count || 0}`);
      console.log(`  Has Result: ${!!task.result}`);
      
      if (task.result?.[0]) {
        const result = task.result[0];
        console.log(`  Items in Result: ${result.items?.length || 0}`);
        if (result.items && result.items.length > 0) {
          console.log(`  First Item Sample:`, JSON.stringify(result.items[0], null, 2).substring(0, 500));
        }
      }
    }
    
    // EXACT extraction function from route
    console.log(`[Route Test] 🔍 About to extract creatives. Response structure:`, {
      hasTasks: !!adsSearchData?.tasks,
      tasksLength: adsSearchData?.tasks?.length || 0,
      hasFirstTask: !!adsSearchData?.tasks?.[0],
      hasResult: !!adsSearchData?.tasks?.[0]?.result,
      resultLength: adsSearchData?.tasks?.[0]?.result?.length || 0,
      hasFirstResult: !!adsSearchData?.tasks?.[0]?.result?.[0],
      hasItems: !!adsSearchData?.tasks?.[0]?.result?.[0]?.items,
      itemsLength: adsSearchData?.tasks?.[0]?.result?.[0]?.items?.length || 0
    });
    
    // Extract function
    const items = adsSearchData?.tasks?.[0]?.result?.[0]?.items || [];
    console.log(`[Route Test] Direct access to items: ${items.length} items`);
    
    if (items.length === 0) {
      console.log('[Route Test] ❌ No items found in API response');
      return;
    }
    
    creatives = items.map((item: any) => ({
      creativeId: item.creative_id || item.creativeId || null,
      advertiserId: item.advertiser_id || item.advertiserId || null,
      title: item.title || item.headline || item.ad_title || '',
      description: item.description || item.description_text || item.ad_description || '',
      url: item.url || item.ad_url || item.link || '',
      format: item.format || 'text',
      previewImage: item.preview_image || item.previewImage || item.image_url || '',
      firstShown: item.first_shown || item.firstShown || null,
      lastShown: item.last_shown || item.lastShown || null,
      rankGroup: item.rank_group || item.rankGroup || null,
      rankAbsolute: item.rank_absolute || item.rankAbsolute || null,
      platform: item.platform || 'google_search',
      verified: item.verified || false
    }));
    
    console.log(`[Route Test] 📦 Extraction returned ${creatives.length} creatives`);
    
    // Transform like route does
    const advertiserId = null; // Would come from Ads Advertisers API
    const transformedAds = creatives.map((ad: any) => {
      let previewImage = '';
      if (ad.previewImage) {
        if (typeof ad.previewImage === 'string') {
          previewImage = ad.previewImage;
        } else if (ad.previewImage.url) {
          previewImage = ad.previewImage.url;
        }
      } else if (ad.preview_image) {
        if (typeof ad.preview_image === 'string') {
          previewImage = ad.preview_image;
        } else if (ad.preview_image.url) {
          previewImage = ad.preview_image.url;
        }
      }
      
      let platform = ad.platform || 'google_search';
      if (ad.url && !platform) {
        if (ad.url.includes('adstransparency.google.com')) {
          platform = 'google_search';
        } else if (ad.url.includes('youtube')) {
          platform = 'youtube';
        } else if (ad.url.includes('maps')) {
          platform = 'google_maps';
        }
      }
      
      return {
        title: ad.title || 'Ad Title',
        description: ad.description || '',
        url: ad.url || '',
        previewImage: previewImage,
        platform: platform,
        format: ad.format || 'text',
        lastShown: ad.lastShown || ad.last_shown || null,
        verified: ad.verified || false,
        creativeId: ad.creativeId || ad.creative_id || null,
        advertiserId: ad.advertiserId || ad.advertiser_id || advertiserId || null
      };
    });
    
    const isRunningAds = transformedAds.length > 0 || advertiserId !== null || false;
    const totalAds = transformedAds.length;
    
    console.log('');
    console.log('✅ FINAL RESULTS:');
    console.log(`  isRunningAds: ${isRunningAds}`);
    console.log(`  advertiserId: ${advertiserId}`);
    console.log(`  creatives: ${transformedAds.length}`);
    console.log(`  totalAds: ${totalAds}`);
    console.log('');
    
    if (transformedAds.length > 0) {
      console.log('First transformed ad:');
      console.log(JSON.stringify(transformedAds[0], null, 2));
    } else {
      console.log('❌ NO TRANSFORMED ADS!');
    }
    
  } catch (error: any) {
    console.error('[Route Test] ❌ ERROR:', error.message);
    console.error('[Route Test] Stack:', error.stack);
    errors.adsSearch = error.message;
  }
}

testRouteLogic();

