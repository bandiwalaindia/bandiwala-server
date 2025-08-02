// Comprehensive test script for user registration
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:4000';

async function testScenario(name, testFunction) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🧪 Testing: ${name}`);
  console.log(`${'='.repeat(50)}`);
  
  try {
    await testFunction();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED:`, error.message);
  }
}

async function testValidRegistration() {
  const registrationData = {
    name: 'Valid User',
    email: `valid${Date.now()}@example.com`,
    phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    password: 'validpassword123',
    verificationMethod: 'email'
  };
  
  console.log('📤 Registration Data:', registrationData);
  
  const response = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result = await response.json();
  console.log('📥 Response:', result);
  
  if (!result.success) {
    throw new Error(`Registration failed: ${result.message}`);
  }
}

async function testInvalidPhoneNumber() {
  const registrationData = {
    name: 'Invalid Phone User',
    email: `invalid${Date.now()}@example.com`,
    phone: '+919876543', // Invalid - too short
    password: 'validpassword123',
    verificationMethod: 'email'
  };
  
  const response = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result = await response.json();
  console.log('📥 Response:', result);
  
  if (result.success) {
    throw new Error('Expected registration to fail with invalid phone number');
  }
  
  if (!result.message.includes('Invalid phone number')) {
    throw new Error(`Expected "Invalid phone number" error, got: ${result.message}`);
  }
}

async function testMissingFields() {
  const registrationData = {
    name: 'Missing Fields User',
    // Missing email, phone, password
    verificationMethod: 'email'
  };
  
  const response = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result = await response.json();
  console.log('📥 Response:', result);
  
  if (result.success) {
    throw new Error('Expected registration to fail with missing fields');
  }
  
  if (!result.message.includes('required')) {
    throw new Error(`Expected "required" error, got: ${result.message}`);
  }
}

async function testDuplicateRegistration() {
  const email = `duplicate${Date.now()}@example.com`;
  const phone = `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  const registrationData = {
    name: 'Duplicate User',
    email: email,
    phone: phone,
    password: 'duplicatepassword123',
    verificationMethod: 'email'
  };
  
  // First registration
  console.log('📤 First Registration:', registrationData);
  const response1 = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result1 = await response1.json();
  console.log('📥 First Response:', result1);
  
  if (!result1.success) {
    throw new Error(`First registration failed: ${result1.message}`);
  }
  
  // Second registration with same email
  console.log('📤 Second Registration (duplicate email):', registrationData);
  const response2 = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result2 = await response2.json();
  console.log('📥 Second Response:', result2);
  
  // Should succeed and resend OTP for unverified user
  if (!result2.success) {
    throw new Error(`Expected duplicate registration to resend OTP, got: ${result2.message}`);
  }
}

async function testInvalidOTP() {
  const registrationData = {
    name: 'Invalid OTP User',
    email: `invalidotp${Date.now()}@example.com`,
    phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
    password: 'invalidotppassword123',
    verificationMethod: 'email'
  };
  
  // Register user
  const response1 = await fetch(`${baseUrl}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  const result1 = await response1.json();
  if (!result1.success) {
    throw new Error(`Registration failed: ${result1.message}`);
  }
  
  // Try to verify with invalid OTP
  const otpData = {
    email: registrationData.email,
    phone: registrationData.phone,
    otp: '000000' // Invalid OTP
  };
  
  console.log('📤 Invalid OTP Data:', otpData);
  const response2 = await fetch(`${baseUrl}/api/users/otp-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(otpData)
  });
  
  const result2 = await response2.json();
  console.log('📥 OTP Response:', result2);
  
  if (result2.success) {
    throw new Error('Expected OTP verification to fail with invalid OTP');
  }
  
  if (!result2.message.includes('Invalid OTP')) {
    throw new Error(`Expected "Invalid OTP" error, got: ${result2.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Registration Tests...\n');
  
  await testScenario('Valid Registration', testValidRegistration);
  await testScenario('Invalid Phone Number', testInvalidPhoneNumber);
  await testScenario('Missing Required Fields', testMissingFields);
  await testScenario('Duplicate Registration (Resend OTP)', testDuplicateRegistration);
  await testScenario('Invalid OTP Verification', testInvalidOTP);
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('🎉 All tests completed!');
  console.log(`${'='.repeat(50)}`);
}

// Run all tests
runAllTests().catch(console.error);
