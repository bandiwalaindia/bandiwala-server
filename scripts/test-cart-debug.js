// Test script to debug cart API issues
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../config.env' });

const BASE_URL = 'http://localhost:6111';

async function testCartAPI() {
  try {
    console.log('🔍 Testing Cart API with credentials...');
    
    // First, login to get a token
    console.log('📱 Logging in with phone: +918688660055');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      phone: '+918688660055',
      password: '12345678'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Get a menu item to test with
    console.log('📋 Fetching menu items...');
    const menuResponse = await axios.get(`${BASE_URL}/api/menu-items`);
    const menuItem = menuResponse.data.data[0];
    console.log('Using menu item:', menuItem.itemName);
    console.log('Menu item ID:', menuItem._id);
    console.log('Subcategories:', menuItem.subcategories);
    
    // Test adding to cart
    const cartData = {
      menuItemId: menuItem._id,
      quantity: 1,
      plate: menuItem.subcategories[0].title,
      notes: 'Test from debug script'
    };
    
    console.log('📦 Adding to cart with data:', JSON.stringify(cartData, null, 2));
    
    const cartResponse = await axios.post(`${BASE_URL}/api/cart`, cartData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Cart API successful:', cartResponse.data);
    
    // Test getting cart
    console.log('📋 Getting cart...');
    const getCartResponse = await axios.get(`${BASE_URL}/api/cart`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Get cart successful:', getCartResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Request data that failed:', error.config?.data);
    }
  }
}

testCartAPI();
