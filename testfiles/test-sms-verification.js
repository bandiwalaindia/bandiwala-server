// Test SMS verification functionality
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4000';

async function testSMSVerification() {
  console.log('🧪 Testing SMS Verification (without Twilio config)...');
  
  const registrationData = {
    name: 'SMS Test User',
    email: `sms${Date.now()}@example.com`,
    phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    password: 'smspassword123',
    verificationMethod: 'phone' // Using phone verification
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
      console.log('✅ SMS registration handled gracefully (check server logs for OTP)');
    } else {
      console.log('❌ SMS registration failed:', result.message);
      if (result.message.includes('Twilio') || result.message.includes('SMS')) {
        console.log('ℹ️ This is expected since Twilio is not configured');
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testInvalidVerificationMethod() {
  console.log('\n🧪 Testing Invalid Verification Method...');
  
  const registrationData = {
    name: 'Invalid Method User',
    email: `invalid${Date.now()}@example.com`,
    phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    password: 'invalidmethodpassword123',
    verificationMethod: 'invalid' // Invalid method
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

// Run tests
console.log('🚀 Starting SMS Verification Tests...\n');
testSMSVerification()
  .then(() => testInvalidVerificationMethod())
  .then(() => {
    console.log('\n🎉 SMS verification tests completed!');
  })
  .catch(console.error);
