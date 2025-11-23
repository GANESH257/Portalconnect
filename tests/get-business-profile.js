import axios from 'axios';

async function getBusinessProfile() {
  try {
    console.log('🔍 Getting business profile for Center For Psychiatric Services...\n');

    // Login first
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      
      // First, search for the business to get its profile ID
      console.log('\n2. Searching for Center For Psychiatric Services...');
      const searchResponse = await axios.post('http://localhost:3001/api/serp/search-prospects', {
        keyword: 'Center For Psychiatric Services',
        location: 'Rolla, MO',
        category: 'health'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResponse.data.success) {
        const results = searchResponse.data.data?.results || [];
        console.log(`📊 Found ${results.length} results`);
        
        // Find the specific business
        const targetBusiness = results.find(result => 
          result.title && result.title.toLowerCase().includes('center for psychiatric services')
        );
        
        if (targetBusiness) {
          console.log('\n✅ Found target business:');
          console.log(`Title: ${targetBusiness.title}`);
          console.log(`Address: ${targetBusiness.address}`);
          console.log(`Profile ID: ${targetBusiness.businessProfileId}`);
          
          // Get the business profile
          console.log('\n3. Fetching detailed business profile...');
          const profileResponse = await axios.get(`http://localhost:3001/api/serp/business/${targetBusiness.businessProfileId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (profileResponse.data.success) {
            const profile = profileResponse.data.data;
            console.log('\n📋 DETAILED BUSINESS PROFILE:');
            console.log('================================');
            console.log(`Name: ${profile.name}`);
            console.log(`Address: ${profile.address}`);
            console.log(`City: ${profile.city}`);
            console.log(`State: ${profile.state}`);
            console.log(`ZIP: ${profile.zipCode}`);
            console.log(`Phone: ${profile.phone}`);
            console.log(`Website: ${profile.websiteUrl}`);
            console.log(`Domain: ${profile.domain}`);
            console.log(`Category: ${profile.category}`);
            console.log(`Rating: ${profile.rating}`);
            console.log(`Reviews Count: ${profile.reviewsCount}`);
            console.log(`Description: ${profile.description}`);
            
            if (profile.adPerformance) {
              console.log('\n💰 AD PERFORMANCE:');
              console.log('==================');
              console.log(`Paid ETV: ${profile.adPerformance.paidETV}`);
              console.log(`Creatives Count: ${profile.adPerformance.creativesCount}`);
              console.log(`Approx Ads Count: ${profile.adPerformance.approxAdsCount}`);
              console.log(`Ad Recency: ${profile.adPerformance.adRecency}`);
              console.log(`Verified Advertiser: ${profile.adPerformance.verifiedAdvertiser}`);
              console.log(`Platforms: ${profile.adPerformance.platforms?.join(', ')}`);
              console.log(`Ad Activity Score: ${profile.adPerformance.adActivityScore}`);
            }
            
            if (profile.comprehensiveScore) {
              console.log('\n📊 COMPREHENSIVE SCORES:');
              console.log('========================');
              console.log(`Lead Score: ${profile.comprehensiveScore.leadScore}`);
              console.log(`Presence Score: ${profile.comprehensiveScore.presenceScore}`);
              console.log(`SEO Score: ${profile.comprehensiveScore.seoScore}`);
              console.log(`Ads Activity Score: ${profile.comprehensiveScore.adsActivityScore}`);
              console.log(`Engagement Score: ${profile.comprehensiveScore.engagementScore}`);
            }
            
          } else {
            console.log('❌ Failed to fetch business profile:', profileResponse.data.message);
          }
          
        } else {
          console.log('❌ Center For Psychiatric Services not found in search results');
          console.log('\nAvailable businesses:');
          results.slice(0, 5).forEach((result, index) => {
            console.log(`${index + 1}. ${result.title} - ${result.address}`);
          });
        }
        
      } else {
        console.log('❌ Search failed:', searchResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

getBusinessProfile();
