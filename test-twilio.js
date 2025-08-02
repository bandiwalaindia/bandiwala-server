import twilio from 'twilio';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

console.log('🔧 Testing Twilio Configuration');
console.log('================================');

// Check environment variables
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

console.log('TWILIO_SID:', accountSid ? `${accountSid.substring(0, 10)}...` : '❌ Missing');
console.log('TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 10)}...` : '❌ Missing');
console.log('TWILIO_PHONE_NUMBER:', fromNumber || '❌ Missing');

if (!accountSid || !authToken || !fromNumber) {
  console.log('\n❌ Missing Twilio credentials. Please update config.env with valid Twilio credentials.');
  console.log('\nTo get Twilio credentials:');
  console.log('1. Sign up at https://www.twilio.com/');
  console.log('2. Get your Account SID and Auth Token from the Console Dashboard');
  console.log('3. Get a Twilio phone number from the Phone Numbers section');
  console.log('4. Update the config.env file with these values');
  process.exit(1);
}

// Test phone number to send OTP to
const testPhoneNumber = '+918688660055';
const testOTP = Math.floor(100000 + Math.random() * 900000);

console.log('\n📱 Testing SMS to:', testPhoneNumber);
console.log('🔢 Test OTP:', testOTP);

try {
  // Initialize Twilio client
  const client = twilio(accountSid, authToken);
  
  console.log('\n⏳ Sending test SMS...');
  
  // Send test SMS
  const message = await client.messages.create({
    body: `Your Bandiwala verification code is: ${testOTP}. This code will expire in 10 minutes.`,
    from: fromNumber,
    to: testPhoneNumber,
  });

  console.log('\n✅ SMS sent successfully!');
  console.log('📧 Message SID:', message.sid);
  console.log('📱 To:', message.to);
  console.log('📞 From:', message.from);
  console.log('📝 Status:', message.status);
  console.log('💰 Price:', message.price || 'N/A');
  
} catch (error) {
  console.log('\n❌ SMS sending failed:');
  console.log('Error Code:', error.code);
  console.log('Error Message:', error.message);
  console.log('More Info:', error.moreInfo);
  
  // Common error codes and solutions
  if (error.code === 21211) {
    console.log('\n💡 Solution: Invalid phone number format. Make sure the number includes country code (+91)');
  } else if (error.code === 21608) {
    console.log('\n💡 Solution: Phone number not verified with Twilio. In trial mode, you can only send to verified numbers.');
    console.log('   - Go to Twilio Console > Phone Numbers > Manage > Verified Caller IDs');
    console.log('   - Add and verify the phone number +916302678114');
  } else if (error.code === 21614) {
    console.log('\n💡 Solution: Invalid Twilio phone number. Check your TWILIO_PHONE_NUMBER in config.env');
  } else if (error.code === 20003) {
    console.log('\n💡 Solution: Authentication failed. Check your TWILIO_SID and TWILIO_AUTH_TOKEN');
  } else if (error.message === 'username is required') {
    console.log('\n💡 Solution: Invalid Account SID format. Make sure TWILIO_SID starts with "AC"');
  }
}
