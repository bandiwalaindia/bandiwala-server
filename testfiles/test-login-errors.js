// Test login error cases
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4000';

async function testInvalidCredentials() {
  console.log('🧪 Testing Invalid Login Credentials...');
  
  const loginData = {
    phone: '+919876543210',
    password: 'wrongpassword'
  };
  
  console.log('📤 Login Data:', loginData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
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

async function testMissingLoginFields() {
  console.log('\n🧪 Testing Missing Login Fields...');
  
  const loginData = {
    phone: '+919876543210'
    // Missing password
  };
  
  console.log('📤 Login Data:', loginData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
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

async function testInvalidPhoneLogin() {
  console.log('\n🧪 Testing Invalid Phone Format in Login...');
  
  const loginData = {
    phone: '+91987654321', // Invalid format
    password: 'somepassword'
  };
  
  console.log('📤 Login Data:', loginData);
  
  try {
    const response = await fetch(`${baseUrl}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
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
console.log('🚀 Starting Login Error Tests...\n');
testInvalidCredentials()
  .then(() => testMissingLoginFields())
  .then(() => testInvalidPhoneLogin())
  .then(() => {
    console.log('\n🎉 Login error tests completed!');
  })
  .catch(console.error);
