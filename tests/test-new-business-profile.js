import axios from 'axios';

async function testNewBusinessProfile() {
  try {
    console.log('Testing new business profile...');
    
    // Login
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');
    
    // Test with the new business profile ID
    const businessProfileId = 'cmh52f1ta0181rqy5t5pssxc1';
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

testNewBusinessProfile();
