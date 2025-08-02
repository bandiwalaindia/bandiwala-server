// Test script for cart functionality
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testMenuItemId = '';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

// Helper function to make authenticated requests
async function fetchWithAuth(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

// Login to get auth token
async function login() {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      console.log('✅ Login successful');
    } else {
      console.error('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
  }
}

// Get a menu item ID for testing
async function getTestMenuItem() {
  try {
    const response = await fetchWithAuth(`${API_URL}/menu-items`);
    const data = await response.json();
    
    if (data.success && data.data.length > 0) {
      testMenuItemId = data.data[0]._id;
      console.log(`✅ Got test menu item ID: ${testMenuItemId}`);
    } else {
      console.error('❌ Failed to get menu items');
    }
  } catch (error) {
    console.error('❌ Error getting menu items:', error.message);
  }
}

// Test adding an item to cart
async function testAddToCart() {
  try {
    const cartItem = {
      menuItemId: testMenuItemId,
      quantity: 2,
      plate: 'full',
      notes: 'Test notes'
    };

    const response = await fetchWithAuth(`${API_URL}/cart`, {
      method: 'POST',
      body: JSON.stringify(cartItem)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Add to cart successful');
      console.log('Cart items:', data.data.items);
    } else {
      console.error('❌ Add to cart failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error adding to cart:', error.message);
  }
}

// Test getting the cart
async function testGetCart() {
  try {
    const response = await fetchWithAuth(`${API_URL}/cart`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Get cart successful');
      console.log('Cart items:', data.data.items);
    } else {
      console.error('❌ Get cart failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error getting cart:', error.message);
  }
}

// Test updating a cart item
async function testUpdateCartItem() {
  try {
    const updateData = {
      menuItemId: testMenuItemId,
      quantity: 3,
      plate: 'full'
    };

    const response = await fetchWithAuth(`${API_URL}/cart`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Update cart item successful');
      console.log('Updated cart items:', data.data.items);
    } else {
      console.error('❌ Update cart item failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error updating cart item:', error.message);
  }
}

// Test removing an item from cart
async function testRemoveFromCart() {
  try {
    const response = await fetchWithAuth(`${API_URL}/cart/${testMenuItemId}?plate=full`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Remove from cart successful');
      console.log('Remaining cart items:', data.data.items);
    } else {
      console.error('❌ Remove from cart failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error removing from cart:', error.message);
  }
}

// Test clearing the cart
async function testClearCart() {
  try {
    const response = await fetchWithAuth(`${API_URL}/cart`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Clear cart successful');
      console.log('Cart items after clearing:', data.data.items);
    } else {
      console.error('❌ Clear cart failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Error clearing cart:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting cart tests...');
  
  await login();
  await getTestMenuItem();
  
  if (testMenuItemId) {
    await testAddToCart();
    await testGetCart();
    await testUpdateCartItem();
    await testRemoveFromCart();
    await testClearCart();
  } else {
    console.error('❌ Cannot run tests without a valid menu item ID');
  }
  
  console.log('🧪 Cart tests completed');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test error:', error);
});
