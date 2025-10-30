import axios from 'axios';

async function testDataForSEODirect() {
  try {
    console.log('🔍 Testing DataForSEO API directly for mental health in 63044...\n');
    
    // Test the DataForSEO API directly
    const dataForSEOUrl = 'https://api.dataforseo.com/v3/business_data/business_listings/search/live';
    const dataForSEOAuth = {
      username: process.env.DATAFORSEO_LOGIN || 'your_login',
      password: process.env.DATAFORSEO_PASSWORD || 'your_password'
    };
    
    console.log('Using DataForSEO credentials...');
    
    const requestData = [{
      keyword: 'mental health',
      location_name: '63044',
      language_code: 'en',
      device: 'desktop',
      depth: 20
    }];
    
    console.log('Sending request to DataForSEO...');
    const response = await axios.post(dataForSEOUrl, requestData, {
      auth: dataForSEOAuth,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ DataForSEO API call successful!\n');
    
    // Analyze the results
    const results = response.data?.tasks?.[0]?.result?.[0]?.items || [];
    console.log('📊 DATA FOR SEO RESULTS ANALYSIS:');
    console.log('=================================');
    console.log(`Total results: ${results.length}`);
    console.log(`Status code: ${response.data?.tasks?.[0]?.status_code}`);
    console.log(`Status message: ${response.data?.tasks?.[0]?.status_message}\n`);
    
    if (results.length === 0) {
      console.log('❌ No results returned from DataForSEO API');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      return;
    }
    
    // Check first few results for data accuracy
    console.log('🔍 DETAILED RESULT ANALYSIS:');
    console.log('===========================');
    
    results.slice(0, 5).forEach((business, index) => {
      console.log(`\n--- Business ${index + 1} ---`);
      console.log(`Name: ${business.title || business.name || 'N/A'}`);
      console.log(`Address: ${business.address_info?.formatted_address || business.address || 'N/A'}`);
      console.log(`Phone: ${business.phone || 'N/A'}`);
      console.log(`Website: ${business.website || business.url || 'N/A'}`);
      console.log(`Domain: ${business.domain || 'N/A'}`);
      console.log(`Rating: ${business.rating?.value || business.rating || 'N/A'}`);
      console.log(`Reviews: ${business.rating?.votes_count || business.reviews_count || 'N/A'}`);
      console.log(`Category: ${business.category || 'N/A'}`);
      console.log(`Place ID: ${business.place_id || 'N/A'}`);
      console.log(`CID: ${business.cid || 'N/A'}`);
      console.log(`Latitude: ${business.latitude || business.gps_coordinates?.latitude || 'N/A'}`);
      console.log(`Longitude: ${business.longitude || business.gps_coordinates?.longitude || 'N/A'}`);
      console.log(`Is Claimed: ${business.is_claimed || 'N/A'}`);
      console.log(`Work Time: ${business.work_time ? 'Available' : 'N/A'}`);
      console.log(`Popular Times: ${business.popular_times ? 'Available' : 'N/A'}`);
      
      // Check for mental health related keywords
      const name = (business.title || business.name || '').toLowerCase();
      const category = (business.category || '').toLowerCase();
      const isMentalHealth = name.includes('mental') || name.includes('psychology') || 
                            name.includes('therapy') || name.includes('counseling') ||
                            name.includes('psychiatrist') || name.includes('psychologist') ||
                            category.includes('mental') || category.includes('health');
      console.log(`Mental Health Related: ${isMentalHealth ? '✅ YES' : '❌ NO'}`);
    });
    
    // Check data quality metrics
    console.log('\n📈 DATA QUALITY METRICS:');
    console.log('========================');
    
    const totalResults = results.length;
    const withAddress = results.filter(b => b.address_info?.formatted_address || b.address).length;
    const withPhone = results.filter(b => b.phone).length;
    const withWebsite = results.filter(b => b.website || b.url).length;
    const withRating = results.filter(b => b.rating?.value || b.rating).length;
    const withCoordinates = results.filter(b => b.latitude || b.gps_coordinates?.latitude).length;
    const mentalHealthRelated = results.filter(b => {
      const name = (b.title || b.name || '').toLowerCase();
      const category = (b.category || '').toLowerCase();
      return name.includes('mental') || name.includes('psychology') || 
             name.includes('therapy') || name.includes('counseling') ||
             name.includes('psychiatrist') || name.includes('psychologist') ||
             category.includes('mental') || category.includes('health');
    }).length;
    
    console.log(`Total Results: ${totalResults}`);
    console.log(`With Address: ${withAddress} (${Math.round(withAddress/totalResults*100)}%)`);
    console.log(`With Phone: ${withPhone} (${Math.round(withPhone/totalResults*100)}%)`);
    console.log(`With Website: ${withWebsite} (${Math.round(withWebsite/totalResults*100)}%)`);
    console.log(`With Rating: ${withRating} (${Math.round(withRating/totalResults*100)}%)`);
    console.log(`With Coordinates: ${withCoordinates} (${Math.round(withCoordinates/totalResults*100)}%)`);
    console.log(`Mental Health Related: ${mentalHealthRelated} (${Math.round(mentalHealthRelated/totalResults*100)}%)`);
    
    // Check location accuracy
    console.log('\n📍 LOCATION ACCURACY:');
    console.log('===================');
    const zip63044Results = results.filter(b => {
      const address = b.address_info?.formatted_address || b.address || '';
      return address.includes('63044') || address.includes('St. Louis') || address.includes('Missouri');
    }).length;
    console.log(`Results in 63044/St. Louis area: ${zip63044Results} (${Math.round(zip63044Results/totalResults*100)}%)`);
    
    // Check for duplicates
    const uniqueNames = new Set(results.map(b => b.title || b.name));
    const duplicates = totalResults - uniqueNames.size;
    console.log(`Duplicate businesses: ${duplicates}`);
    
    // Check result types
    console.log('\n📋 RESULT TYPES:');
    console.log('================');
    const resultTypes = {};
    results.forEach(b => {
      const type = b.type || 'unknown';
      resultTypes[type] = (resultTypes[type] || 0) + 1;
    });
    Object.entries(resultTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} results`);
    });
    
    console.log('\n✅ DataForSEO API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testDataForSEODirect();
