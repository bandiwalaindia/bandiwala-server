import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';

const BASE_URL = 'http://localhost:6111';

// Test user credentials
const testUser = {
  phone: '+918688660055',
  email: 'gurramkarthik2006@gmail.com',
  password: '12345678',
  name: 'karthik'
};

async function testPromoCodeFeature() {
  try {
    console.log('🧪 Testing Promo Code Feature...\n');

    console.log('1. Registering test user...');
    const registerResponse = await fetch(`${BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...testUser,
        verificationMethod: 'phone'
      }),
    });

    let registerData;
    if (registerResponse.ok) {
      registerData = await registerResponse.json();
      console.log('✅ User registered successfully');
    } else {
      registerData = await registerResponse.json();
      console.log('Registration response:', registerData.message || 'Registration failed');
    }

    // Step 2: Login to get token
    console.log('2. Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: testUser.phone,
        password: testUser.password,
      }),
    });

    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.log('Login error:', loginError);
      throw new Error(`Login failed: ${loginError.message || 'Unknown error'}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Step 3: Test promo code validation - Valid code
    console.log('\n3. Testing valid promo code (FREESHIP3)...');
    const validPromoResponse = await fetch(`${BASE_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: 'FREESHIP3',
        subtotal: 100
      }),
    });

    const validPromoData = await validPromoResponse.json();
    console.log('Valid promo response:', JSON.stringify(validPromoData, null, 2));

    if (validPromoData.success) {
      console.log('✅ Valid promo code test passed');
      console.log(`   - Type: ${validPromoData.data.type}`);
      console.log(`   - Is Free Delivery: ${validPromoData.data.isFreeDelivery}`);
      console.log(`   - Remaining Uses: ${validPromoData.data.remainingUses}`);
    } else {
      console.log('❌ Valid promo code test failed');
    }

    // Step 4: Test promo code validation - Invalid code
    console.log('\n4. Testing invalid promo code...');
    const invalidPromoResponse = await fetch(`${BASE_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: 'INVALID123',
        subtotal: 100
      }),
    });

    const invalidPromoData = await invalidPromoResponse.json();
    console.log('Invalid promo response:', JSON.stringify(invalidPromoData, null, 2));

    if (!invalidPromoData.success) {
      console.log('✅ Invalid promo code test passed');
    } else {
      console.log('❌ Invalid promo code test failed');
    }

    // Step 5: Test promo usage tracking
    console.log('\n5. Testing promo usage tracking...');
    const usageResponse = await fetch(`${BASE_URL}/api/promo-codes/usage?promoCode=FREESHIP3`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    const usageData = await usageResponse.json();
    console.log('Usage tracking response:', JSON.stringify(usageData, null, 2));

    if (usageData.success) {
      console.log('✅ Usage tracking test passed');
      console.log(`   - Current usage count: ${usageData.data.length}`);
    } else {
      console.log('❌ Usage tracking test failed');
    }

    console.log('\n🎉 Promo code feature tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testPromoCodeFeature();
