import axios from 'axios';

async function testFullFlow() {
  try {
    console.log('Testing full flow with authentication...');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    // Step 2: Search for prospects
    console.log('Step 2: Searching for prospects...');
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
    
    console.log('Search response:', searchResponse.data);
    
    // Step 3: Try to get a business profile
    console.log('Step 3: Getting business profile...');
    const businessResponse = await axios.get('http://localhost:8080/api/serp/business/ChIJgfh0jNpU2ocRL3Z_a6ru7LA', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Business profile response:', businessResponse.data);
    
  } catch (error) {
    console.error('Error in full flow test:', error.response?.data || error.message);
  }
}

testFullFlow();
