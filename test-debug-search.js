import axios from 'axios';

async function testDebugSearch() {
  try {
    console.log('Testing search with debugging...');
    
    // Step 1: Login
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Step 2: Search for prospects
    console.log('Searching for prospects...');
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
    console.log('Job ID:', searchResponse.data.data.jobId);
    console.log('Results count:', searchResponse.data.data.results.length);
    
    // Let's check the first few results
    const results = searchResponse.data.data.results;
    console.log('First result:', JSON.stringify(results[0], null, 2));
    
    // Try to get business profile for the first result
    if (results[0] && results[0].place_id) {
      console.log('Trying to get business profile for:', results[0].place_id);
      const businessResponse = await axios.get(`http://localhost:8080/api/serp/business/${results[0].place_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Business profile found:', businessResponse.data);
    }
    
  } catch (error) {
    console.error('Error in debug search:', error.response?.data || error.message);
  }
}

testDebugSearch();
