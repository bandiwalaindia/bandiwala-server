// Test script to verify registration works
import fetch from 'node-fetch';
import readline from 'readline';

const baseUrl = 'http://localhost:4000';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testRegistration() {
  try {
    console.log('🧪 Testing Registration...');

    const registrationData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`, // Unique email
      phone: `+91987654${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`, // Unique phone with exactly 10 digits
      password: 'testpassword123',
      verificationMethod: 'email'
    };

    console.log('📤 Registration Data:', registrationData);
    
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const result = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Body:', result);
    
    if (result.success) {
      console.log('✅ Registration successful!');

      // Extract OTP from the response message if available
      const otpMatch = result.message.match(/OTP: (\d+)/);
      let otp;

      if (otpMatch) {
        otp = otpMatch[1];
        console.log('🔢 Found OTP in response:', otp);
      } else {
        console.log('⚠️ No OTP found in response message');
        console.log('📋 Please check the server console for the OTP and enter it manually:');
        otp = await askQuestion('Enter the OTP from server console: ');
      }

      if (otp) {
        // Test OTP verification
        console.log('\n🧪 Testing OTP Verification...');

        const otpData = {
          email: registrationData.email,
          phone: registrationData.phone,
          otp: otp
        };

        console.log('📤 OTP Data:', otpData);
        
        const otpResponse = await fetch(`${baseUrl}/api/users/otp-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(otpData)
        });
        
        const otpResult = await otpResponse.json();
        
        console.log('📥 OTP Response Status:', otpResponse.status);
        console.log('📥 OTP Response Body:', otpResult);
        
        if (otpResult.success) {
          console.log('✅ OTP verification successful!');
          console.log('🎉 Complete registration flow works!');
          
          // Test login
          console.log('\n🧪 Testing Login...');
          
          const loginData = {
            phone: registrationData.phone,
            password: registrationData.password
          };
          
          console.log('📤 Login Data:', loginData);
          
          const loginResponse = await fetch(`${baseUrl}/api/users/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
          });
          
          const loginResult = await loginResponse.json();
          
          console.log('📥 Login Response Status:', loginResponse.status);
          console.log('📥 Login Response Body:', loginResult);
          
          if (loginResult.success) {
            console.log('✅ Login successful!');
            console.log('🎉 Complete authentication flow works!');
          } else {
            console.log('❌ Login failed:', loginResult.message);
          }
        } else {
          console.log('❌ OTP verification failed:', otpResult.message);
        }
      } else {
        console.log('❌ No OTP provided, skipping verification test');
      }
    } else {
      console.log('❌ Registration failed:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
testRegistration();
