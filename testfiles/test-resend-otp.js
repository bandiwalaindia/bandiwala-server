// Test resend OTP functionality
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4000';

async function testResendOTP() {
  console.log('🧪 Testing Resend OTP Functionality...');
  
  // First, register a user
  const registrationData = {
    name: 'Resend OTP User',
    email: `resend${Date.now()}@example.com`,
    phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    password: 'resendotppassword123',
    verificationMethod: 'email'
  };
  
  console.log('📤 Registration Data:', registrationData);
  
  try {
    // Register user
    const response1 = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });
    
    const result1 = await response1.json();
    console.log('📥 Registration Response:', result1);
    
    if (!result1.success) {
      throw new Error(`Registration failed: ${result1.message}`);
    }
    
    console.log('✅ Registration successful');
    
    // Now test resend OTP
    console.log('\n🔄 Testing Resend OTP...');
    
    const resendData = {
      email: registrationData.email,
      phone: registrationData.phone,
      verificationMethod: registrationData.verificationMethod
    };
    
    console.log('📤 Resend OTP Data:', resendData);
    
    const response2 = await fetch(`${baseUrl}/api/users/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resendData)
    });
    
    const result2 = await response2.json();
    console.log('📥 Resend OTP Response Status:', response2.status);
    console.log('📥 Resend OTP Response Body:', result2);
    
    if (result2.success) {
      console.log('✅ Resend OTP successful');
    } else {
      console.log('❌ Resend OTP failed:', result2.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testResendOTPForNonExistentUser() {
  console.log('\n🧪 Testing Resend OTP for Non-existent User...');
  
  const resendData = {
    email: 'nonexistent@example.com',
    phone: '+919876543210',
    verificationMethod: 'email'
  };
  
  console.log('📤 Resend OTP Data:', resendData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resendData)
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
console.log('🚀 Starting Resend OTP Tests...\n');
testResendOTP()
  .then(() => testResendOTPForNonExistentUser())
  .then(() => {
    console.log('\n🎉 Resend OTP tests completed!');
  })
  .catch(console.error);
