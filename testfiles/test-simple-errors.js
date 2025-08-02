// Simple test for error cases
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4000';

async function testInvalidPhone() {
  console.log('🧪 Testing Invalid Phone Number...');
  
  const registrationData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+919876543', // Invalid - too short
    password: 'testpassword123',
    verificationMethod: 'email'
  };
  
  console.log('📤 Registration Data:', registrationData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    const result = await response.json();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', result);
    
    if (result.success) {
      console.log('❌ Expected failure but got success');
    } else {
      console.log('✅ Correctly failed with error:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testMissingFields() {
  console.log('\n🧪 Testing Missing Fields...');
  
  const registrationData = {
    name: 'Test User',
    // Missing email, phone, password
    verificationMethod: 'email'
  };
  
  console.log('📤 Registration Data:', registrationData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    const result = await response.json();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', result);
    
    if (result.success) {
      console.log('❌ Expected failure but got success');
    } else {
      console.log('✅ Correctly failed with error:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testInvalidOTP() {
  console.log('\n🧪 Testing Invalid OTP...');
  
  const otpData = {
    email: 'nonexistent@example.com',
    phone: '+919876543210',
    otp: '000000'
  };
  
  console.log('📤 OTP Data:', otpData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/otp-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otpData)
    });
    
    const result = await response.json();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', result);
    
    if (result.success) {
      console.log('❌ Expected failure but got success');
    } else {
      console.log('✅ Correctly failed with error:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting Error Case Tests...\n');
testInvalidPhone()
  .then(() => testMissingFields())
  .then(() => testInvalidOTP())
  .then(() => {
    console.log('\n🎉 Error case tests completed!');
  })
  .catch(console.error);
