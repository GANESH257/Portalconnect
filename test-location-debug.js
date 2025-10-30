import axios from 'axios';

async function testLocationDebug() {
  try {
    console.log('🔍 Testing Location Code Debug for ZIP 63044...\n');
    
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Test with explicit St. Louis location
    console.log('2. Testing with explicit St. Louis location...');
    const stLouisResponse = await axios.post('http://localhost:3001/api/serp/search-prospects', {
      keyword: 'mental health',
      location: 'St. Louis, MO',
      locationType: 'City',
      locationValue: 'St. Louis',
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
    
    console.log('✅ St. Louis search completed\n');
    
    // Check response structure
    console.log('📋 St. Louis Response Structure:');
    console.log('Keys:', Object.keys(stLouisResponse.data));
    console.log('Data type:', typeof stLouisResponse.data.data);
    console.log('Data keys:', stLouisResponse.data.data ? Object.keys(stLouisResponse.data.data) : 'No data');
    
    // Check if we get St. Louis results
    const stLouisResults = stLouisResponse.data.data?.results || stLouisResponse.data.data?.data || stLouisResponse.data.results || [];
    console.log(`📊 St. Louis results: ${Array.isArray(stLouisResults) ? stLouisResults.length : 'Not an array'}`);
    
    if (Array.isArray(stLouisResults) && stLouisResults.length > 0) {
      // Check first few results for location
      console.log('\n🔍 First 3 St. Louis results:');
      stLouisResults.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Address: ${result.address}`);
        console.log(`   City: ${result.city || 'N/A'}`);
        console.log(`   State: ${result.state || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No results found or invalid data structure');
    }
    
    // Now test with ZIP 63044
    console.log('3. Testing with ZIP 63044...');
    const zipResponse = await axios.post('http://localhost:3001/api/serp/search-prospects', {
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
    
    console.log('✅ ZIP 63044 search completed\n');
    
    // Check if we get St. Louis results
    const zipResults = zipResponse.data.data?.results || zipResponse.data.data?.data || zipResponse.data.results || [];
    console.log(`📊 ZIP 63044 results: ${Array.isArray(zipResults) ? zipResults.length : 'Not an array'}`);
    
    if (Array.isArray(zipResults) && zipResults.length > 0) {
      // Check first few results for location
      console.log('\n🔍 First 3 ZIP 63044 results:');
      zipResults.slice(0, 3).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Address: ${result.address}`);
        console.log(`   City: ${result.city || 'N/A'}`);
        console.log(`   State: ${result.state || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No results found or invalid data structure');
    }
    
    // Compare results
    console.log('📊 COMPARISON:');
    console.log(`St. Louis explicit: ${stLouisResults.length} results`);
    console.log(`ZIP 63044: ${zipResults.length} results`);
    
    // Check if addresses contain St. Louis vs Chicago
    const stLouisAddresses = stLouisResults.filter(r => r.address && r.address.includes('St. Louis')).length;
    const chicagoAddresses = stLouisResults.filter(r => r.address && r.address.includes('Chicago')).length;
    
    const zipStLouisAddresses = zipResults.filter(r => r.address && r.address.includes('St. Louis')).length;
    const zipChicagoAddresses = zipResults.filter(r => r.address && r.address.includes('Chicago')).length;
    
    console.log(`\nSt. Louis explicit - St. Louis addresses: ${stLouisAddresses}, Chicago addresses: ${chicagoAddresses}`);
    console.log(`ZIP 63044 - St. Louis addresses: ${zipStLouisAddresses}, Chicago addresses: ${zipChicagoAddresses}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testLocationDebug();
