import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const BASE_URL = 'https://server-8kpf.onrender.com';

// Test credentials
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
    console.log('\n🛒 Getting cart contents...');

    const response = await axios.get(`${BASE_URL}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Cart retrieved successfully');
      console.log('Cart items:', JSON.stringify(response.data.data.items, null, 2));
      
      // Calculate totals manually
      const subtotal = response.data.data.items.reduce((total, item) => {
        return total + (item.selectedSubcategory.price * item.quantity);
      }, 0);
      
      const platformFee = 5;
      const deliveryCharge = 20;
      const taxableAmount = subtotal + platformFee + deliveryCharge;
      const tax = parseFloat((taxableAmount * 0.05).toFixed(2));
      const total = subtotal + platformFee + deliveryCharge + tax;
      
      console.log('\nCalculated totals:');
      console.log('Subtotal:', subtotal);
      console.log('Platform fee:', platformFee);
      console.log('Delivery charge:', deliveryCharge);
      console.log('Tax (5%):', tax);
      console.log('Total:', total);
      
      return response.data.data;
    } else {
      console.log('❌ Failed to get cart:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting cart:', error.response?.data || error.message);
    return null;
  }
}

async function runDebug() {
  console.log('🔍 Starting Cart Debug...\n');

  try {
    // Step 1: Login
    await loginUser();

    // Step 2: Get cart contents
    await getCart();

  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
  }
}

// Run the debug
runDebug();
