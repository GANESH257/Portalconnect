import axios from 'axios';

async function testSearchResults() {
  try {
    console.log('Testing search results structure...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Search for prospects
    const searchResponse = await axios.post('http://localhost:8080/api/serp/search-prospects', {
      keyword: 'dental clinic',
      location: 'St. Louis, MO',
      locationType: 'city',
      locationValue: 'St. Louis, MO',
      device: 'desktop',
      radius: 10,
      mapView: 'standard'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Search completed successfully');
    const results = searchResponse.data.data.results;
    console.log('Results count:', results.length);
    
    // Check the first result structure
    const firstResult = results[0];
    console.log('First result keys:', Object.keys(firstResult));
    console.log('First result businessProfileId:', firstResult.businessProfileId);
    console.log('First result place_id:', firstResult.place_id);
    console.log('First result cid:', firstResult.cid);
    
    // Check if businessProfileId exists in the result
    if (firstResult.businessProfileId) {
      console.log('✅ businessProfileId found in search results');
      console.log('businessProfileId value:', firstResult.businessProfileId);
    } else {
      console.log('❌ businessProfileId NOT found in search results');
      console.log('Available fields:', Object.keys(firstResult));
    }
    
  } catch (error) {
    console.error('Error testing search results:', error.response?.data || error.message);
  }
}

testSearchResults();
