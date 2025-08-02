import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

async function testVendorLogin() {
  try {
    console.log('🧪 Testing vendor login...');
    
    // Test vendor credentials
    const vendorCredentials = [
      { phone: '+919876543210', password: 'vendor123', name: 'Jai Bhavani Chat Owner' },
      { phone: '+919876543211', password: 'vendor123', name: 'BFC Chicken Owner' },
      { phone: '+919876543212', password: 'vendor123', name: 'Rajahmundry Owner' },
      { phone: '+919876543213', password: 'vendor123', name: 'Sangamesh Bhavani Owner' },
    ];

    for (const vendor of vendorCredentials) {
      console.log(`\n📱 Testing login for ${vendor.name}...`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
          phone: vendor.phone,
          password: vendor.password
        });

        if (response.data.success) {
          console.log(`✅ Login successful for ${vendor.name}`);
          console.log(`   Role: ${response.data.user.role}`);
          console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
          
          // Test vendor profile endpoint
          const profileResponse = await axios.get(`${API_BASE_URL}/api/vendors/profile/me`, {
            headers: {
              'Authorization': `Bearer ${response.data.token}`
            }
          });

          if (profileResponse.data.success) {
            console.log(`✅ Vendor profile retrieved successfully`);
            console.log(`   Vendor Name: ${profileResponse.data.data.name}`);
            console.log(`   Vendor ID: ${profileResponse.data.data._id}`);

            // Test vendor dashboard endpoint
            try {
              const dashboardResponse = await axios.get(`${API_BASE_URL}/api/vendors/${profileResponse.data.data._id}/dashboard`);

              if (dashboardResponse.data.success) {
                console.log(`✅ Vendor dashboard retrieved successfully`);
                console.log(`   Today's Orders: ${dashboardResponse.data.data.todaysSummary.orders}`);
                console.log(`   Today's Earnings: ₹${dashboardResponse.data.data.todaysSummary.earnings}`);

                // Test new earnings data
                const earningsData = dashboardResponse.data.data.earningsData;
                if (earningsData) {
                  console.log(`✅ Earnings data retrieved successfully`);
                  console.log(`   Total Earnings: ₹${earningsData.total || 0}`);
                  console.log(`   Weekly Earnings: ₹${earningsData.weekly || 0}`);
                  console.log(`   Monthly Earnings: ₹${earningsData.monthly || 0}`);
                  console.log(`   Daily Breakdown: ${earningsData.dailyBreakdown?.length || 0} days`);
                  console.log(`   Weekly Stats: ${earningsData.weeklyStats?.orders || 0} orders, ${earningsData.weeklyStats?.itemsSold || 0} items`);
                  console.log(`   Monthly Stats: ${earningsData.monthlyStats?.orders || 0} orders, ${earningsData.monthlyStats?.itemsSold || 0} items`);
                } else {
                  console.log(`⚠️  No earnings data found`);
                }
              } else {
                console.log(`❌ Failed to get vendor dashboard: ${dashboardResponse.data.message}`);
              }
            } catch (dashboardError) {
              console.log(`❌ Dashboard error: ${dashboardError.response?.data?.message || dashboardError.message}`);
              console.log(`   Status: ${dashboardError.response?.status}`);
              if (dashboardError.response?.data) {
                console.log(`   Response:`, dashboardError.response.data);
              }
            }
          } else {
            console.log(`❌ Failed to get vendor profile: ${profileResponse.data.message}`);
          }
        } else {
          console.log(`❌ Login failed for ${vendor.name}: ${response.data.message}`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${vendor.name}: ${error.response?.data?.message || error.message}`);
      }
    }

    console.log('\n🎉 Vendor login test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVendorLogin();
