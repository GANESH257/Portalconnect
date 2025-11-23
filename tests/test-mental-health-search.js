import axios from 'axios';

async function testMentalHealthSearch() {
  try {
    console.log('🔍 Testing Mental Health Search in ZIP 63044...\n');
    
    // First, let's login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Now test the search
    console.log('2. Searching for mental health in ZIP 63044...');
    const searchResponse = await axios.post('http://localhost:8080/api/serp/search-prospects', {
      keyword: 'mental health',
      location: '63044',
      locationType: 'ZIP',
      locationValue: '63044',
      device: 'desktop',
      radius: 10,
      mapView: 'standard',
      selectedZipCodes: [],
      selectedCounties: []
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Search completed successfully\n');
    
    // Analyze the results
    const results = searchResponse.data.data;
    console.log('📊 SEARCH RESULTS ANALYSIS:');
    console.log('========================');
    console.log(`Total results: ${results.length}`);
    console.log(`Job ID: ${searchResponse.data.jobId}\n`);
    
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
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMentalHealthSearch();
