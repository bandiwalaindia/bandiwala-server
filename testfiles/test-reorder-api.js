// Test script for cart reorder functionality
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-url.com' 
  : 'http://localhost:4000';

let authToken = '';

async function loginUser() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/api/users/login`, {
      phone: '8247696048',
      password: '12345678'
    });

    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      return response.data.user;
    } else {
      throw new Error('Login failed: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getCart() {
  try {
    console.log('\n🛒 Getting cart...');
    const response = await axios.get(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Cart retrieved successfully');
      console.log('Items in cart:', response.data.data.items.length);
      
      // Log current order
      response.data.data.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name} (${item.selectedSubcategory.title}) - Order: ${item.order || 0}`);
      });
      
      return response.data.data;
    } else {
      throw new Error('Failed to get cart');
    }
  } catch (error) {
    console.error('❌ Get cart failed:', error.response?.data || error.message);
    throw error;
  }
}

async function addItemsToCart() {
  try {
    console.log('\n➕ Adding items to cart for testing...');
    
    // Get menu items first
    const menuResponse = await axios.get(`${BASE_URL}/api/menu-items`);
    const menuItems = menuResponse.data.data;
    
    if (menuItems.length < 2) {
      throw new Error('Need at least 2 menu items for testing');
    }

    // Add first item
    const item1 = menuItems[0];
    await axios.post(`${BASE_URL}/api/cart`, {
      menuItemId: item1._id,
      quantity: 1,
      plate: item1.subcategories[0].title,
      notes: 'Test item 1'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    // Add second item
    const item2 = menuItems[1];
    await axios.post(`${BASE_URL}/api/cart`, {
      menuItemId: item2._id,
      quantity: 2,
      plate: item2.subcategories[0].title,
      notes: 'Test item 2'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('✅ Test items added to cart');
  } catch (error) {
    console.error('❌ Failed to add test items:', error.response?.data || error.message);
    throw error;
  }
}

async function testReorderItems() {
  try {
    console.log('\n🔄 Testing reorder functionality...');
    
    // Get current cart
    const cart = await getCart();
    
    if (cart.items.length < 2) {
      console.log('Adding test items first...');
      await addItemsToCart();
      const updatedCart = await getCart();
      cart.items = updatedCart.items;
    }

    // Create reorder data - reverse the order
    const itemOrders = cart.items.map((item, index) => ({
      menuItemId: item.menuItemId,
      subcategoryTitle: item.selectedSubcategory.title,
      order: cart.items.length - 1 - index // Reverse order
    }));

    console.log('Reordering items...');
    console.log('New order:', itemOrders);

    const response = await axios.put(`${BASE_URL}/api/cart/reorder`, {
      itemOrders
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Reorder successful');
      
      // Get cart again to verify order
      console.log('\n📋 Verifying new order...');
      const reorderedCart = await getCart();
      
      return reorderedCart;
    } else {
      throw new Error('Reorder failed: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Reorder test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function clearCart() {
  try {
    console.log('\n🗑️ Clearing cart...');
    const response = await axios.delete(`${BASE_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ Cart cleared successfully');
    } else {
      throw new Error('Failed to clear cart');
    }
  } catch (error) {
    console.error('❌ Clear cart failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testReorderFlow() {
  try {
    console.log('🚀 Starting reorder API test...\n');

    // Step 1: Login
    await loginUser();

    // Step 2: Clear cart first
    await clearCart();

    // Step 3: Add test items
    await addItemsToCart();

    // Step 4: Get initial cart state
    console.log('\n📋 Initial cart state:');
    await getCart();

    // Step 5: Test reorder
    await testReorderItems();

    // Step 6: Clean up
    await clearCart();

    console.log('\n🎉 Reorder test completed successfully!');

  } catch (error) {
    console.error('\n💥 Reorder test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testReorderFlow();
