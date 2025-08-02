import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const ADMIN_CREDENTIALS = {
  phone: '+918688660055',
  password: 'plplplpl'
};

async function testAdminAPIs() {
  try {
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, ADMIN_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test Dashboard
    console.log('\n📊 Testing Dashboard...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, { headers });
      console.log('✅ Dashboard API working');
      console.log('📈 Total users:', dashboardResponse.data.data.totals.users);
      console.log('📈 Total orders:', dashboardResponse.data.data.totals.orders);
    } catch (error) {
      console.log('❌ Dashboard error:', error.response?.data?.message || error.message);
      console.log('Full error:', error.response?.data);
    }

    // Test Orders
    console.log('\n📦 Testing Orders...');
    try {
      const ordersResponse = await axios.get(`${BASE_URL}/api/admin/orders?page=1&limit=5`, { headers });
      console.log('✅ Orders API working');
      console.log('📦 Total orders:', ordersResponse.data.data.pagination.totalOrders);
    } catch (error) {
      console.log('❌ Orders error:', error.response?.data?.message || error.message);
      console.log('Full error:', error.response?.data);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testAdminAPIs();
