import { dataForSEOService } from '../server/services/dataforseoService.js';

async function testAdsDirect() {
  const domain = 'onlinespinecare.com';
  const businessName = 'SPINE Center: Dr. Amit Bhandarkar | Spine Surgeon | Minimally Invasive Spine Surgery';
  const locationStr = 'Chesterfield, Missouri';
  const locationCode = dataForSEOService.getLocationCode(locationStr);
  
  console.log('🧪 Testing Ads API with exact server parameters...\n');
  console.log(`Domain: ${domain}`);
  console.log(`Business Name: ${businessName}`);
  console.log(`Location: ${locationStr}`);
  console.log(`Location Code: ${locationCode}\n`);
  
  try {
    // Test 1: Ads Search API (exactly as server calls it)
    console.log('📢 Test 1: getAdsForDomain (exact server call)...');
    const adsSearchData = await dataForSEOService.getAdsForDomain({
      target: domain,
      locationCode: locationCode,
      depth: 50
    });
    
    console.log('\n📊 API Response Structure:');
    console.log('Status Code:', adsSearchData?.status_code);
    console.log('Status Message:', adsSearchData?.status_message);
    console.log('Tasks Count:', adsSearchData?.tasks_count);
    console.log('Tasks Error:', adsSearchData?.tasks_error);
    
    if (adsSearchData?.tasks?.[0]) {
      const task = adsSearchData.tasks[0];
      console.log('\n📋 Task Details:');
      console.log('  Task Status Code:', task.status_code);
      console.log('  Task Status Message:', task.status_message);
      console.log('  Result Count:', task.result_count);
      console.log('  Has Result:', !!task.result);
      console.log('  Result Length:', task.result?.length || 0);
      
      if (task.result?.[0]) {
        const result = task.result[0];
        console.log('\n📦 Result Details:');
        console.log('  Has Items:', !!result.items);
        console.log('  Items Length:', result.items?.length || 0);
        
        if (result.items && result.items.length > 0) {
          console.log('\n✅ Found items! First item structure:');
          console.log(JSON.stringify(result.items[0], null, 2));
        } else {
          console.log('\n⚠️  No items in result');
          console.log('Result keys:', Object.keys(result));
        }
      } else {
        console.log('\n⚠️  No result in task');
      }
    } else {
      console.log('\n⚠️  No tasks in response');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testAdsDirect();

