import axios from 'axios';

async function testSimpleZip() {
  try {
    console.log('🔍 Testing ZIP 63044 directly...\n');

    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Test ZIP 63044 search
      console.log('\n2. Testing ZIP 63044 search...');
      const searchResponse = await axios.post('http://localhost:8080/api/serp-intelligence/search-prospects', {
        keyword: 'mental health',
        location: '63044',
        category: 'health'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', searchResponse.status);
      console.log('Response data keys:', Object.keys(searchResponse.data));
      
      if (searchResponse.data.success) {
        const results = searchResponse.data.data?.results || [];
        console.log(`📊 Results: ${results.length}`);
        
        // Show first 3 results
        console.log('\n🔍 First 3 results:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`${index + 1}. ${result.title}`);
          console.log(`   Address: ${result.address || 'N/A'}`);
        });
        
      } else {
        console.log('❌ Search failed:', searchResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testSimpleZip();
