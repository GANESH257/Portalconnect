import axios from 'axios';

async function testZipLocationCode() {
  try {
    console.log('🔍 Testing ZIP 63044 location code lookup...\n');

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
      
      if (searchResponse.data.success) {
        console.log('✅ ZIP 63044 search completed');
        console.log(`📊 Results: ${searchResponse.data.data?.results?.length || 0}`);
        
        // Show first few results with addresses
        const results = searchResponse.data.data?.results || [];
        console.log('\n🔍 First 5 ZIP 63044 results:');
        results.slice(0, 5).forEach((result, index) => {
          console.log(`${index + 1}. ${result.title}`);
          console.log(`   Address: ${result.address || 'N/A'}`);
          console.log(`   City: ${result.city || 'N/A'}`);
          console.log(`   State: ${result.state || 'N/A'}`);
          console.log('');
        });
        
        // Count addresses by location
        let stLouisCount = 0;
        let chicagoCount = 0;
        let otherCount = 0;
        
        results.forEach(result => {
          const address = result.address || '';
          if (address.includes('St. Louis, MO')) {
            stLouisCount++;
          } else if (address.includes('Chicago, IL')) {
            chicagoCount++;
          } else {
            otherCount++;
          }
        });
        
        console.log('📊 ZIP 63044 Address Analysis:');
        console.log(`St. Louis addresses: ${stLouisCount}`);
        console.log(`Chicago addresses: ${chicagoCount}`);
        console.log(`Other addresses: ${otherCount}`);
        
      } else {
        console.log('❌ ZIP 63044 search failed:', searchResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testZipLocationCode();
