import axios from 'axios';

async function testBusinessProfileId() {
  try {
    console.log('Testing business profile with ID...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Try to get business profile using the businessProfileId
    const businessProfileId = 'cmh52601h00dlrqy5b9ub4dgp';
    console.log('Trying to get business profile with ID:', businessProfileId);
    
    const businessResponse = await axios.get(`http://localhost:8080/api/serp/business/${businessProfileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Business profile found:', businessResponse.data);
    
  } catch (error) {
    console.error('Error testing business profile ID:', error.response?.data || error.message);
  }
}

testBusinessProfileId();
