import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const BASE_URL = 'http://localhost:4000';

// Test admin credentials - you'll need to create an admin user first
const ADMIN_CREDENTIALS = {
  phone: '+918688660055', // Replace with your admin phone
  password: 'plplplpl'     // Replace with your admin password
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${BASE_URL}/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Admin login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.response?.data?.message || error.message);
    return false;
  }
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

async function testDashboardStats() {
  try {
    console.log('\n📊 Testing Dashboard Stats...');
    const response = await axios.get(`${BASE_URL}/api/admin/dashboard/stats`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Dashboard stats retrieved successfully');
      console.log('📈 Stats:', JSON.stringify(response.data.data.totals, null, 2));
    } else {
      console.log('❌ Dashboard stats failed');
    }
  } catch (error) {
    console.log('❌ Dashboard stats error:', error.response?.data?.message || error.message);
  }
}

async function testUsersManagement() {
  try {
    console.log('\n👥 Testing Users Management...');
    const response = await axios.get(`${BASE_URL}/admin/users?page=1&limit=5`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Users retrieved successfully');
      console.log(`📊 Total users: ${response.data.data.pagination.totalUsers}`);
    } else {
      console.log('❌ Users retrieval failed');
    }
  } catch (error) {
    console.log('❌ Users management error:', error.response?.data?.message || error.message);
  }
}

async function testVendorsManagement() {
  try {
    console.log('\n🏪 Testing Vendors Management...');
    const response = await axios.get(`${BASE_URL}/api/admin/vendors?page=1&limit=5`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Vendors retrieved successfully');
      console.log(`📊 Total vendors: ${response.data.data.pagination.totalVendors}`);
    } else {
      console.log('❌ Vendors retrieval failed');
    }
  } catch (error) {
    console.log('❌ Vendors management error:', error.response?.data?.message || error.message);
  }
}

async function testOrdersManagement() {
  try {
    console.log('\n📦 Testing Orders Management...');
    const response = await axios.get(`${BASE_URL}/api/admin/orders?page=1&limit=5`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Orders retrieved successfully');
      console.log(`📊 Total orders: ${response.data.data.pagination.totalOrders}`);
    } else {
      console.log('❌ Orders retrieval failed');
    }
  } catch (error) {
    console.log('❌ Orders management error:', error.response?.data?.message || error.message);
  }
}

async function testMenuItemsManagement() {
  try {
    console.log('\n🍽️ Testing Menu Items Management...');
    const response = await axios.get(`${BASE_URL}/api/admin/items?page=1&limit=5`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Menu items retrieved successfully');
      console.log(`📊 Total items: ${response.data.data.pagination.totalItems}`);
    } else {
      console.log('❌ Menu items retrieval failed');
    }
  } catch (error) {
    console.log('❌ Menu items management error:', error.response?.data?.message || error.message);
  }
}

async function testReviewsManagement() {
  try {
    console.log('\n⭐ Testing Reviews Management...');
    const response = await axios.get(`${BASE_URL}/api/admin/reviews?page=1&limit=5`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Reviews retrieved successfully');
      console.log(`📊 Total reviews: ${response.data.data.pagination.totalReviews}`);
    } else {
      console.log('❌ Reviews retrieval failed');
    }
  } catch (error) {
    console.log('❌ Reviews management error:', error.response?.data?.message || error.message);
  }
}

async function testReportsData() {
  try {
    console.log('\n📈 Testing Reports Data...');
    const response = await axios.get(`${BASE_URL}/api/admin/reports`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ Reports data retrieved successfully');
      console.log('📊 Summary:', JSON.stringify(response.data.data.summary, null, 2));
    } else {
      console.log('❌ Reports data retrieval failed');
    }
  } catch (error) {
    console.log('❌ Reports data error:', error.response?.data?.message || error.message);
  }
}

async function testAppSettings() {
  try {
    console.log('\n⚙️ Testing App Settings...');
    const response = await axios.get(`${BASE_URL}/api/admin/settings`, {
      headers: getHeaders()
    });
    
    if (response.data.success) {
      console.log('✅ App settings retrieved successfully');
      console.log('⚙️ Maintenance mode:', response.data.settings.maintenanceMode);
    } else {
      console.log('❌ App settings retrieval failed');
    }
  } catch (error) {
    console.log('❌ App settings error:', error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Admin API Tests...\n');
  
  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin authentication');
    return;
  }
  
  // Run all tests
  await testDashboardStats();
  await testUsersManagement();
  await testVendorsManagement();
  await testOrdersManagement();
  await testMenuItemsManagement();
  await testReviewsManagement();
  await testReportsData();
  await testAppSettings();
  
  console.log('\n✅ All admin API tests completed!');
}

// Run the tests
runAllTests().catch(console.error);
