// Test script for Favorites API endpoints via HTTP
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

// Test user credentials (you'll need to use a real user or create one)
const TEST_USER = {
  phone: '9999999999', // Replace with a real test user
  password: 'testpassword123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test authentication
const testAuth = async () => {
  console.log('🔐 Testing Authentication...');
  
  try {
    // Try to login with test user
    const loginResponse = await makeRequest('POST', '/login', TEST_USER);
    
    if (loginResponse.success && loginResponse.token) {
      authToken = loginResponse.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed - no token received');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed:', error.response?.data?.message || error.message);
    console.log('💡 Please ensure you have a test user with phone:', TEST_USER.phone);
    return false;
  }
};

// Test server connectivity
const testConnectivity = async () => {
  console.log('🌐 Testing Server Connectivity...');
  
  try {
    const response = await axios.get(`${API_URL}/test`);
    if (response.data.success) {
      console.log('✅ Server is running and accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Server connectivity failed:', error.message);
    return false;
  }
};

// Test favorites endpoints
const testFavoritesEndpoints = async () => {
  console.log('\n🧪 Testing Favorites API Endpoints...');

  const testVendor = {
    itemId: 'test_vendor_123',
    itemType: 'vendor',
    itemName: 'Test Vendor for API',
    description: 'A test vendor for API testing',
    metadata: {
      rating: 4.5,
      category: 'Street Food',
      isAvailable: true
    }
  };

  const testMenuItem = {
    itemId: 'test_menuitem_456',
    itemType: 'menuItem',
    itemName: 'Test Menu Item for API',
    vendorId: 'test_vendor_123',
    vendorName: 'Test Vendor for API',
    price: 99.99,
    description: 'A delicious test item',
    metadata: {
      rating: 4.8,
      category: 'Main Course',
      tags: ['spicy', 'vegetarian']
    }
  };

  try {
    // Test 1: Add vendor to favorites
    console.log('\n1️⃣ Testing Add Vendor to Favorites...');
    const addVendorResponse = await makeRequest('POST', '/favorites', testVendor);
    console.log('✅ Vendor added to favorites:', addVendorResponse.success);

    // Test 2: Add menu item to favorites
    console.log('\n2️⃣ Testing Add Menu Item to Favorites...');
    const addMenuItemResponse = await makeRequest('POST', '/favorites', testMenuItem);
    console.log('✅ Menu item added to favorites:', addMenuItemResponse.success);

    // Test 3: Get all favorites
    console.log('\n3️⃣ Testing Get All Favorites...');
    const allFavoritesResponse = await makeRequest('GET', '/favorites/user');
    console.log('✅ All favorites retrieved:', allFavoritesResponse.data.length, 'items');

    // Test 4: Get favorite vendors
    console.log('\n4️⃣ Testing Get Favorite Vendors...');
    const vendorFavoritesResponse = await makeRequest('GET', '/favorites/vendors');
    console.log('✅ Vendor favorites retrieved:', vendorFavoritesResponse.data.length, 'items');

    // Test 5: Get favorite menu items
    console.log('\n5️⃣ Testing Get Favorite Menu Items...');
    const menuItemFavoritesResponse = await makeRequest('GET', '/favorites/menu-items');
    console.log('✅ Menu item favorites retrieved:', menuItemFavoritesResponse.data.length, 'items');

    // Test 6: Check favorite status
    console.log('\n6️⃣ Testing Check Favorite Status...');
    const checkStatusResponse = await makeRequest('GET', `/favorites/check/vendor/${testVendor.itemId}`);
    console.log('✅ Favorite status checked:', checkStatusResponse.data.isFavorite);

    // Test 7: Get favorites count
    console.log('\n7️⃣ Testing Get Favorites Count...');
    const countResponse = await makeRequest('GET', '/favorites/user/count');
    console.log('✅ Favorites count:', countResponse.data);

    // Test 8: Toggle favorite (should remove)
    console.log('\n8️⃣ Testing Toggle Favorite (Remove)...');
    const toggleResponse = await makeRequest('POST', '/favorites/toggle', testVendor);
    console.log('✅ Favorite toggled:', !toggleResponse.data.isFavorite ? 'Removed' : 'Added');

    // Test 9: Toggle favorite again (should add back)
    console.log('\n9️⃣ Testing Toggle Favorite (Add Back)...');
    const toggleBackResponse = await makeRequest('POST', '/favorites/toggle', testVendor);
    console.log('✅ Favorite toggled back:', toggleBackResponse.data.isFavorite ? 'Added' : 'Removed');

    // Test 10: Search favorites
    console.log('\n🔟 Testing Search Favorites...');
    const searchResponse = await makeRequest('GET', '/favorites/user?search=test');
    console.log('✅ Search results:', searchResponse.data.length, 'items');

    // Test 11: Pagination
    console.log('\n1️⃣1️⃣ Testing Pagination...');
    const paginationResponse = await makeRequest('GET', '/favorites/user?page=1&limit=1');
    console.log('✅ Pagination working:', paginationResponse.pagination);

    // Test 12: Remove specific favorite
    console.log('\n1️⃣2️⃣ Testing Remove Specific Favorite...');
    const removeResponse = await makeRequest('DELETE', `/favorites/menuItem/${testMenuItem.itemId}`);
    console.log('✅ Favorite removed:', removeResponse.success);

    // Test 13: Bulk add favorites
    console.log('\n1️⃣3️⃣ Testing Bulk Add Favorites...');
    const bulkFavorites = [
      {
        itemId: 'bulk_vendor_1',
        itemType: 'vendor',
        itemName: 'Bulk Vendor 1'
      },
      {
        itemId: 'bulk_vendor_2',
        itemType: 'vendor',
        itemName: 'Bulk Vendor 2'
      }
    ];
    const bulkResponse = await makeRequest('POST', '/favorites/bulk', { favorites: bulkFavorites });
    console.log('✅ Bulk favorites added:', bulkResponse.data.insertedCount, 'items');

    // Test 14: Clear all favorites
    console.log('\n1️⃣4️⃣ Testing Clear All Favorites...');
    const clearResponse = await makeRequest('DELETE', '/favorites/user');
    console.log('✅ All favorites cleared:', clearResponse.data.deletedCount, 'items');

    console.log('\n🎉 All Favorites API tests completed successfully!');

  } catch (error) {
    console.error('❌ Favorites API test failed:', error.response?.data || error.message);
  }
};

// Test error handling
const testErrorHandling = async () => {
  console.log('\n🚨 Testing Error Handling...');

  try {
    // Test 1: Invalid item type
    console.log('\n1️⃣ Testing Invalid Item Type...');
    try {
      await makeRequest('POST', '/favorites', {
        itemId: 'test_id',
        itemType: 'invalid_type',
        itemName: 'Test Item'
      });
      console.log('❌ Should have failed with invalid item type');
    } catch (error) {
      console.log('✅ Invalid item type error handled correctly');
    }

    // Test 2: Missing required fields
    console.log('\n2️⃣ Testing Missing Required Fields...');
    try {
      await makeRequest('POST', '/favorites', {
        itemType: 'vendor'
        // Missing itemId and itemName
      });
      console.log('❌ Should have failed with missing fields');
    } catch (error) {
      console.log('✅ Missing required fields error handled correctly');
    }

    // Test 3: Menu item without vendor info
    console.log('\n3️⃣ Testing Menu Item Without Vendor Info...');
    try {
      await makeRequest('POST', '/favorites', {
        itemId: 'test_item',
        itemType: 'menuItem',
        itemName: 'Test Menu Item'
        // Missing vendorId, vendorName, price
      });
      console.log('❌ Should have failed with missing vendor info');
    } catch (error) {
      console.log('✅ Missing vendor info error handled correctly');
    }

    // Test 4: Duplicate favorite
    console.log('\n4️⃣ Testing Duplicate Favorite...');
    const testItem = {
      itemId: 'duplicate_test',
      itemType: 'vendor',
      itemName: 'Duplicate Test Vendor'
    };
    
    // Add first time
    await makeRequest('POST', '/favorites', testItem);
    
    // Try to add again
    try {
      await makeRequest('POST', '/favorites', testItem);
      console.log('❌ Should have failed with duplicate error');
    } catch (error) {
      console.log('✅ Duplicate favorite error handled correctly');
    }

    // Clean up
    await makeRequest('DELETE', `/favorites/vendor/${testItem.itemId}`);

    console.log('\n✅ Error handling tests completed!');

  } catch (error) {
    console.error('❌ Error handling test failed:', error.response?.data || error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Favorites API HTTP Tests...\n');

  // Test server connectivity
  const isServerRunning = await testConnectivity();
  if (!isServerRunning) {
    console.log('❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  // Test authentication
  const isAuthenticated = await testAuth();
  if (!isAuthenticated) {
    console.log('❌ Authentication failed. Cannot proceed with API tests.');
    console.log('💡 Please ensure you have a test user or update the TEST_USER credentials.');
    process.exit(1);
  }

  // Run all tests
  await testFavoritesEndpoints();
  await testErrorHandling();

  console.log('\n🎉 All HTTP API tests completed successfully!');
  process.exit(0);
};

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Run tests
runTests();
