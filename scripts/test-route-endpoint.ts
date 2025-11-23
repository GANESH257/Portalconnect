import 'dotenv/config';

async function testRouteEndpoint() {
  const profileId = 'cmi9609w30009u9phmpy4t6s0';
  const location = 'Chesterfield, Missouri';
  
  console.log('🔥 TESTING ROUTE ENDPOINT DIRECTLY');
  console.log('='.repeat(60));
  console.log(`Profile ID: ${profileId}`);
  console.log(`Location: ${location}`);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const url = `http://localhost:8080/api/serp/business/${profileId}/ads?location=${encodeURIComponent(location)}`;
    console.log(`📡 Calling: ${url}`);
    console.log('');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📊 RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    if (data.success && data.data) {
      console.log(`✅ Success: ${data.data.totalAds} ads found`);
      console.log(`   isRunningAds: ${data.data.isRunningAds}`);
      console.log(`   creativesCount: ${data.data.creativesCount}`);
      console.log(`   isFromLiveAPI: ${data.isFromLiveAPI}`);
      
      if (data.data.ads && data.data.ads.length > 0) {
        console.log('');
        console.log('First ad:');
        console.log(JSON.stringify(data.data.ads[0], null, 2));
      } else {
        console.log('');
        console.log('❌ NO ADS IN RESPONSE');
      }
    } else {
      console.log('❌ Request failed:', data.message || 'Unknown error');
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRouteEndpoint();

