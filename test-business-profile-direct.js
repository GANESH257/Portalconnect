import axios from 'axios';

async function testBusinessProfileDirect() {
  try {
    console.log('Testing business profile with correct ID...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Test with the correct business profile ID from the logs
    const businessProfileId = 'cmh52d3nm00xvrqy5l7ynxyrj';
    console.log('Testing business profile ID:', businessProfileId);
    
    const businessResponse = await axios.get(`http://localhost:8080/api/serp/business/${businessProfileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Business profile found!');
    console.log('Business name:', businessResponse.data.data.name);
    console.log('Business address:', businessResponse.data.data.address);
    console.log('Business phone:', businessResponse.data.data.phone);
    console.log('Business rating:', businessResponse.data.data.rating);
    
    return businessResponse.data;
    
  } catch (error) {
    console.error('❌ Error testing business profile:', error.response?.data || error.message);
  }
}

testBusinessProfileDirect();
