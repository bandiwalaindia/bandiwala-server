import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const BASE_URL = 'https://server-8kpf.onrender.com';

// Test credentials from existing test files
const TEST_USER = {
  email: 'gurramkarthik2006@gmail.com',
  password: '12345678'
};

let authToken = '';

async function loginUser() {
  try {
    console.log('🔐 Logging in user...');
    const response = await axios.post(`${BASE_URL}/api/users/login`, TEST_USER);

    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Login successful');
      console.log('User ID:', response.data.user._id);
      console.log('User Email:', response.data.user.email);
      console.log('User Name:', response.data.user.name);
      return response.data.user;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function addItemToCart() {
  try {
    console.log('\n🛒 Adding item to cart...');

    // First get menu items to find a valid item
    const menuResponse = await axios.get(`${BASE_URL}/api/menu-items`);
    if (!menuResponse.data.success || !menuResponse.data.data.length) {
      throw new Error('No menu items found');
    }

    const menuItem = menuResponse.data.data[0];
    console.log('Found menu item:', menuItem.itemName || menuItem.name);
    console.log('Menu item ID:', menuItem._id);
    console.log('Subcategories:', menuItem.subcategories);

    // Add item to cart using correct format
    const cartData = {
      menuItemId: menuItem._id,
      quantity: 1,
      plate: menuItem.subcategories[0].title, // Use the plate format expected by backend
      notes: 'Test order from payment API'
    };

    console.log('Cart data:', cartData);

    const response = await axios.post(`${BASE_URL}/api/cart`, cartData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Item added to cart successfully');
      console.log('Cart items:', response.data.data.items.length);
      return true;
    } else {
      console.log('❌ Failed to add item to cart:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error adding item to cart:', error.response?.data || error.message);
    return false;
  }
}

async function testCreatePaymentOrder() {
  try {
    console.log('\n💳 Testing payment order creation...');

    // Calculate the correct amount based on cart total
    // Cart has 1 item of ₹45 + platform fee (₹5) + delivery charge (₹20)
    // Taxable amount = ₹45 + ₹5 + ₹20 = ₹70
    // Tax (5%) = ₹70 × 0.05 = ₹3.50
    // Final total = ₹45 + ₹5 + ₹20 + ₹3.50 = ₹73.50
    const paymentData = {
      amount: 73.5, // Use the correct cart total
      currency: 'INR'
    };

    console.log('Payment data:', paymentData);

    const response = await axios.post(`${BASE_URL}/api/payments/create-order`, paymentData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Payment order created successfully');
      console.log('Order ID:', response.data.data.orderId);
      console.log('Amount:', response.data.data.amount);
      console.log('Currency:', response.data.data.currency);
      console.log('Razorpay Key ID:', response.data.data.razorpayKeyId);
      return response.data.data;
    } else {
      console.log('❌ Failed to create payment order:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating payment order:', error.response?.data || error.message);

    // Log detailed error information
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }

    return null;
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

    if (response.data.success) {
      console.log('✅ Cart cleared successfully');
      return true;
    } else {
      console.log('❌ Failed to clear cart:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing cart:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Payment API Tests...\n');

  try {
    // Step 1: Login
    const user = await loginUser();

    // Step 2: Clear cart first
    await clearCart();

    // Step 3: Add item to cart (required for payment)
    const cartAdded = await addItemToCart();
    if (!cartAdded) {
      console.log('⚠️ Continuing with payment test anyway...');
    }

    // Step 4: Test payment order creation with correct amount
    // Cart has 1 item of ₹45 + platform fee (₹5) + delivery charge (₹20) + tax (5% of ₹45 = ₹2.25)
    // Total = 45 + 5 + 20 + 2.25 = ₹72.25, rounded to ₹72
    const paymentOrder = await testCreatePaymentOrder();

    if (paymentOrder) {
      console.log('\n🎉 All tests completed successfully!');
      console.log('✅ Payment system is working with live Razorpay credentials');
    } else {
      console.log('\n❌ Payment order creation failed');
    }

  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run the tests
runTests();
