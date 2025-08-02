import twilio from 'twilio';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('🔧 Testing Twilio Account Access');
console.log('================================');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? `${authToken.substring(0, 10)}...` : 'Missing');

try {
  // Initialize Twilio client
  const client = twilio(accountSid, authToken);
  
  console.log('\n⏳ Testing account access...');
  
  // Try to fetch account information
  const account = await client.api.accounts(accountSid).fetch();
  
  console.log('\n✅ Account access successful!');
  console.log('Account Status:', account.status);
  console.log('Account Type:', account.type);
  
  // Try to list phone numbers
  console.log('\n⏳ Fetching phone numbers...');
  const phoneNumbers = await client.incomingPhoneNumbers.list();
  
  console.log('\n📱 Available phone numbers:');
  phoneNumbers.forEach((number, index) => {
    console.log(`${index + 1}. ${number.phoneNumber} (${number.friendlyName})`);
  });
  
  if (phoneNumbers.length === 0) {
    console.log('❌ No phone numbers found in this account');
    console.log('💡 You need to purchase a phone number from Twilio Console');
  }
  
} catch (error) {
  console.log('\n❌ Account access failed:');
  console.log('Error Code:', error.code);
  console.log('Error Message:', error.message);
  console.log('Status:', error.status);
  
  if (error.code === 20003) {
    console.log('\n💡 Authentication failed - check your Account SID and Auth Token');
  }
}
