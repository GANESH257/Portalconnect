import axios from 'axios';

async function testPerryville() {
  try {
    console.log('🔍 Testing Perryville, MO search...\n');

    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // Test Perryville search
      console.log('\n2. Testing Perryville search...');
      const searchResponse = await axios.post('http://localhost:3001/api/serp/search-prospects', {
        keyword: 'mental health',
        location: 'Perryville',
        category: 'health'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResponse.data.success) {
        const results = searchResponse.data.data?.results || [];
        console.log(`📊 Results: ${results.length}`);
        
        // Show first 5 results with addresses
        console.log('\n🔍 First 5 Perryville results:');
        results.slice(0, 5).forEach((result, index) => {
          console.log(`${index + 1}. ${result.title}`);
          console.log(`   Address: ${result.address || 'N/A'}`);
          console.log(`   City: ${result.city || 'N/A'}`);
          console.log(`   State: ${result.state || 'N/A'}`);
          console.log('');
        });
        
        // Count addresses by location
        let perryvilleCount = 0;
        let stLouisCount = 0;
        let chicagoCount = 0;
        let otherCount = 0;
        
        results.forEach(result => {
          const address = result.address || '';
          if (address.includes('Perryville')) {
            perryvilleCount++;
          } else if (address.includes('St. Louis, MO')) {
            stLouisCount++;
          } else if (address.includes('Chicago, IL')) {
            chicagoCount++;
          } else {
            otherCount++;
          }
        });
        
        console.log('📊 Perryville Address Analysis:');
        console.log(`Perryville addresses: ${perryvilleCount}`);
        console.log(`St. Louis addresses: ${stLouisCount}`);
        console.log(`Chicago addresses: ${chicagoCount}`);
        console.log(`Other addresses: ${otherCount}`);
        
      } else {
        console.log('❌ Perryville search failed:', searchResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testPerryville();
