import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const BASE_URL = 'http://localhost:4000';

// Test credentials
const TEST_USER = {
  email: 'gurramkarthik2006@gmail.com',
  password: '12345678'
};

let authToken = '';

async function loginUser() {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${BASE_URL}/login`, TEST_USER);

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('User ID:', response.data.user._id);
      console.log('User Email:', response.data.user.email);
      console.log('User Name:', response.data.user.name);
      console.log('Account Verified:', response.data.user.accountVerified);
      return response.data.user;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getCart() {
  try {
    console.log('\n📦 Getting cart...');
    const response = await axios.get(`${BASE_URL}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cart retrieved successfully');
    console.log('Cart items:', response.data.data.items.length);
    console.log('Items:', JSON.stringify(response.data.data.items, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Get cart failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getMenuItems() {
  try {
    console.log('\n🍽️ Getting menu items...');
    const response = await axios.get(`${BASE_URL}/api/menu-items`);

    if (response.data.success && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      console.log('✅ Found menu items');
      console.log('First item:', firstItem.itemName);
      console.log('Item ID:', firstItem._id);
      console.log('Subcategories:', firstItem.subcategories);
      return firstItem;
    } else {
      throw new Error('No menu items found');
    }
  } catch (error) {
    console.error('❌ Get menu items failed:', error.response?.data || error.message);
    throw error;
  }
}

async function addToCart(menuItem) {
  try {
    console.log('\n➕ Adding item to cart...');

    // Use the first subcategory as the plate size
    const firstSubcategory = menuItem.subcategories[0];

    const cartData = {
      menuItemId: menuItem._id,
      quantity: 2,
      plate: firstSubcategory.title,
      notes: 'Test order from API'
    };

    console.log('Cart data:', cartData);

    const response = await axios.post(`${BASE_URL}/api/cart`, cartData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Item added to cart successfully');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('❌ Add to cart failed:', error.response?.data || error.message);
    throw error;
  }
}

async function clearCart() {
  try {
    console.log('\n🗑️ Clearing cart...');

    const response = await axios.delete(`${BASE_URL}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Cart cleared successfully');
    console.log('Cart items count after clearing:', response.data.data.items.length);
    return response.data.data;
  } catch (error) {
    console.error('❌ Clear cart failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCartFlow() {
  try {
    console.log('🚀 Starting cart API test...\n');

    // Step 1: Login
    const user = await loginUser();

    // Step 2: Clear cart first
    await clearCart();

    // Step 3: Get initial cart state (should be empty)
    await getCart();

    // Step 4: Get menu items
    const menuItem = await getMenuItems();

    // Step 5: Add item to cart
    await addToCart(menuItem);

    // Step 6: Get cart again to verify item was added
    await getCart();

    console.log('\n🎉 Cart test completed successfully!');

  } catch (error) {
    console.error('\n💥 Cart test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCartFlow();
