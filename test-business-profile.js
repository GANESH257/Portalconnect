import axios from 'axios';

async function testBusinessProfile() {
  try {
    console.log('Testing business profile creation...');
    
    // First, let's check if we can get business profiles
    const response = await axios.get('http://localhost:8080/api/serp/business/ChIJgfh0jNpU2ocRL3Z_a6ru7LA');
    console.log('Business profile response:', response.data);
    
  } catch (error) {
    console.error('Error testing business profile:', error.response?.data || error.message);
  }
}

testBusinessProfile();
