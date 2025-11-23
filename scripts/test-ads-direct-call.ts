import { dataForSEOService } from '../server/services/dataforseoService';
import 'dotenv/config';

async function testDirectCall() {
  const domain = 'onlinespinecare.com';
  const locationCode = 2840;
  
  console.log('🔥 DIRECT API TEST - EXACT ROUTE PARAMETERS');
  console.log('='.repeat(60));
  console.log(`Domain: ${domain}`);
  console.log(`LocationCode: ${locationCode}`);
  console.log(`Depth: 50`);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    console.log('📡 Calling dataForSEOService.getAdsForDomain()...');
    const startTime = Date.now();
    
    const adsSearchData = await dataForSEOService.getAdsForDomain({
      target: domain,
      locationCode: locationCode,
      depth: 50
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ API call completed in ${duration}ms`);
    console.log('');
    
    // Check response structure
    console.log('📊 RESPONSE STRUCTURE:');
    console.log(`  Status Code: ${adsSearchData?.status_code}`);
    console.log(`  Status Message: ${adsSearchData?.status_message}`);
    console.log(`  Tasks Count: ${adsSearchData?.tasks_count || 0}`);
    console.log(`  Tasks Error: ${adsSearchData?.tasks_error || 0}`);
    console.log('');
    
    if (adsSearchData?.tasks?.[0]) {
      const task = adsSearchData.tasks[0];
      console.log('📦 TASK DETAILS:');
      console.log(`  Task Status: ${task.status_code} - ${task.status_message}`);
      console.log(`  Result Count: ${task.result_count || 0}`);
      console.log(`  Has Result: ${!!task.result}`);
      console.log(`  Result Length: ${task.result?.length || 0}`);
      console.log('');
      
      if (task.result?.[0]) {
        const result = task.result[0];
        console.log('📋 RESULT DETAILS:');
        console.log(`  Has Items: ${!!result.items}`);
        console.log(`  Items Length: ${result.items?.length || 0}`);
        console.log('');
        
        if (result.items && result.items.length > 0) {
          console.log(`✅ FOUND ${result.items.length} ITEMS!`);
          console.log('');
          console.log('First 3 items:');
          result.items.slice(0, 3).forEach((item: any, i: number) => {
            console.log(`  ${i + 1}. Keys: ${Object.keys(item).join(', ')}`);
            console.log(`     Title: ${item.title || item.headline || 'N/A'}`);
            console.log(`     URL: ${item.url || item.ad_url || 'N/A'}`);
            console.log(`     Platform: ${item.platform || 'N/A'}`);
            console.log('');
          });
          
          // Test extraction
          console.log('🔧 TESTING EXTRACTION FUNCTION:');
          const items = adsSearchData?.tasks?.[0]?.result?.[0]?.items || [];
          const creatives = items.map((item: any) => ({
            creativeId: item.creative_id || item.creativeId || null,
            advertiserId: item.advertiser_id || item.advertiserId || null,
            title: item.title || item.headline || item.ad_title || '',
            description: item.description || item.description_text || item.ad_description || '',
            url: item.url || item.ad_url || item.link || '',
            format: item.format || 'text',
            previewImage: item.preview_image || item.previewImage || item.image_url || '',
            platform: item.platform || 'google_search',
            verified: item.verified || false
          }));
          
          console.log(`✅ Extracted ${creatives.length} creatives`);
          if (creatives.length > 0) {
            console.log('First extracted creative:');
            console.log(JSON.stringify(creatives[0], null, 2));
          }
        } else {
          console.log('❌ NO ITEMS FOUND IN RESULT');
          console.log('Full result object:');
          console.log(JSON.stringify(result, null, 2).substring(0, 1000));
        }
      } else {
        console.log('❌ NO RESULT IN TASK');
        console.log('Task object:');
        console.log(JSON.stringify(task, null, 2).substring(0, 1000));
      }
    } else {
      console.log('❌ NO TASKS IN RESPONSE');
      console.log('Full response:');
      console.log(JSON.stringify(adsSearchData, null, 2).substring(0, 2000));
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testDirectCall();

