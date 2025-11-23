import axios from 'axios';

async function testApiResponse() {
  try {
    console.log('Testing API response structure...');
    
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
    const response = searchResponse.data.data;
    
    // Check the structure
    console.log('Response keys:', Object.keys(response));
    console.log('Businesses array length:', response.businesses?.length);
    
    if (response.businesses && response.businesses.length > 0) {
      const firstBusiness = response.businesses[0];
      console.log('First business keys:', Object.keys(firstBusiness));
      console.log('First business businessProfileId:', firstBusiness.businessProfileId);
      console.log('First business place_id:', firstBusiness.place_id);
    }
    
    // Check if businessProfileId is in the results array
    if (response.results && response.results.length > 0) {
      const firstResult = response.results[0];
      console.log('First result keys:', Object.keys(firstResult));
      console.log('First result businessProfileId:', firstResult.businessProfileId);
      console.log('First result place_id:', firstResult.place_id);
    }
    
  } catch (error) {
    console.error('Error testing API response:', error.response?.data || error.message);
  }
}

testApiResponse();
