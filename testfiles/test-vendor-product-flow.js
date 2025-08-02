import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

async function testVendorProductFlow() {
  try {
    console.log('🧪 Testing vendor product flow...');
    
    // Step 1: Login as vendor
    console.log('\n📱 Step 1: Logging in as vendor...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, {
      phone: '+919876543211', // BFC Chicken Owner
      password: 'vendor123'
    });

    if (!loginResponse.data.success) {
      throw new Error('Vendor login failed');
    }

    const token = loginResponse.data.token;
    console.log('✅ Vendor login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Get vendor profile
    console.log('\n🏪 Step 2: Getting vendor profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/vendors/profile/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!profileResponse.data.success) {
      throw new Error('Failed to get vendor profile');
    }

    const vendor = profileResponse.data.data;
    console.log('✅ Vendor profile retrieved');
    console.log(`   Vendor: ${vendor.name}`);
    console.log(`   Vendor ID: ${vendor._id}`);

    // Step 3: Add a new product
    console.log('\n➕ Step 3: Adding new product...');
    const newProduct = {
      itemName: 'Test Vendor Special Chicken',
      description: 'A special chicken dish added by vendor for testing',
      itemCategory: 'Non-Veg',
      subcategories: [
        {
          title: 'Half Plate',
          quantity: '250g',
          price: 120
        },
        {
          title: 'Full Plate', 
          quantity: '500g',
          price: 220
        }
      ],
      image: '/bandiwala-items-pics/test-vendor-chicken.jpg'
    };

    const addProductResponse = await axios.post(`${API_BASE_URL}/api/vendors/menu-items`, newProduct, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!addProductResponse.data.success) {
      throw new Error('Failed to add product');
    }

    const addedProduct = addProductResponse.data.data;
    console.log('✅ Product added successfully');
    console.log(`   Product ID: ${addedProduct._id}`);
    console.log(`   Product Name: ${addedProduct.itemName}`);
    console.log(`   Is Available: ${addedProduct.isAvailable}`);

    // Step 4: Check if product appears in general menu items
    console.log('\n🔍 Step 4: Checking if product appears in general menu items...');
    const allMenuItemsResponse = await axios.get(`${API_BASE_URL}/api/menu-items`);

    if (!allMenuItemsResponse.data.success) {
      throw new Error('Failed to get all menu items');
    }

    const allMenuItems = allMenuItemsResponse.data.data;
    const foundProduct = allMenuItems.find(item => item._id === addedProduct._id);

    if (foundProduct) {
      console.log('✅ Product found in general menu items list!');
      console.log(`   Found: ${foundProduct.itemName}`);
      console.log(`   Vendor ID: ${foundProduct.vendorId}`);
      console.log(`   Available: ${foundProduct.isAvailable}`);
    } else {
      console.log('❌ Product NOT found in general menu items list');
      console.log(`   Total menu items: ${allMenuItems.length}`);
      console.log(`   Looking for product ID: ${addedProduct._id}`);
    }

    // Step 5: Check vendor-specific menu items
    console.log('\n🏪 Step 5: Checking vendor-specific menu items...');
    const vendorMenuItemsResponse = await axios.get(`${API_BASE_URL}/api/menu-items/vendor/${vendor._id}`);

    if (!vendorMenuItemsResponse.data.success) {
      throw new Error('Failed to get vendor menu items');
    }

    const vendorMenuItems = vendorMenuItemsResponse.data.data;
    const foundInVendorItems = vendorMenuItems.find(item => item._id === addedProduct._id);

    if (foundInVendorItems) {
      console.log('✅ Product found in vendor-specific menu items!');
      console.log(`   Found: ${foundInVendorItems.itemName}`);
    } else {
      console.log('❌ Product NOT found in vendor-specific menu items');
    }

    // Step 6: Check by category
    console.log('\n📂 Step 6: Checking by category...');
    const categoryResponse = await axios.get(`${API_BASE_URL}/api/menu-items/category/${encodeURIComponent(newProduct.itemCategory)}`);

    if (categoryResponse.data.success) {
      const categoryItems = categoryResponse.data.data;
      const foundInCategory = categoryItems.find(item => item._id === addedProduct._id);

      if (foundInCategory) {
        console.log('✅ Product found in category items!');
        console.log(`   Found: ${foundInCategory.itemName}`);
      } else {
        console.log('❌ Product NOT found in category items');
      }
    }

    // Step 7: Clean up - delete the test product
    console.log('\n🗑️ Step 7: Cleaning up test product...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/vendors/menu-items/${addedProduct._id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (deleteResponse.data.success) {
      console.log('✅ Test product deleted successfully');
    } else {
      console.log('❌ Failed to delete test product');
    }

    console.log('\n🎉 Vendor product flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testVendorProductFlow();
