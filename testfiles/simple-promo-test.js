import mongoose from 'mongoose';
import { User } from '../models/usermodel.js';
import PromoCode from '../models/PromoCode.js';
import { validatePromoCode, applyPromoCode, recordPromoCodeUsage } from '../controllers/promoCodeController.js';

async function testPromoCodeLogic() {
  try {
    console.log('🧪 Testing Promo Code Logic...\n');

    // Connect to database
    await mongoose.connect('mongodb+srv://bandiwala:karthik@bandiwala.lyx1xbj.mongodb.net/bandiwala?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Create a test user if not exists
    let testUser = await User.findOne({ phone: '+918688660055' });
    if (!testUser) {
      testUser = new User({
        phone: '+918688660055',
        email: 'testuser@example.com',
        password: '12345678',
        name: 'Test User',
        accountVerified: true,
        role: 'user'
      });
      await testUser.save();
      console.log('✅ Test user created');
    } else {
      console.log('✅ Test user found');
    }

    // Test 1: Check if FREESHIP3 promo code exists
    console.log('\n1. Checking FREESHIP3 promo code...');
    const promoCode = await PromoCode.findOne({ code: 'FREESHIP3' });
    if (promoCode) {
      console.log('✅ FREESHIP3 promo code found');
      console.log(`   - Type: ${promoCode.type}`);
      console.log(`   - Max usage per user: ${promoCode.maxUsagePerUser}`);
      console.log(`   - Is active: ${promoCode.isActive}`);
    } else {
      console.log('❌ FREESHIP3 promo code not found');
      return;
    }

    // Test 2: Test promo code application logic
    console.log('\n2. Testing promo code application logic...');
    try {
      const result = await applyPromoCode(testUser._id, 'FREESHIP3', 100, 20);
      console.log('✅ Promo code application test passed');
      console.log(`   - Success: ${result.success}`);
      console.log(`   - Discount amount: ₹${result.discountAmount}`);
      console.log(`   - Delivery charge: ₹${result.deliveryCharge}`);
      console.log(`   - Promo type: ${result.promoType}`);
    } catch (error) {
      console.log('❌ Promo code application test failed:', error.message);
    }

    // Test 3: Test usage recording
    console.log('\n3. Testing usage recording...');
    try {
      // Create a mock order ID
      const mockOrderId = new mongoose.Types.ObjectId();
      await recordPromoCodeUsage(testUser._id, 'FREESHIP3', mockOrderId, 20);
      console.log('✅ Usage recording test passed');
    } catch (error) {
      console.log('❌ Usage recording test failed:', error.message);
    }

    // Test 4: Test usage limit
    console.log('\n4. Testing usage limit...');
    try {
      // Try to apply the promo code again after recording usage
      const result = await applyPromoCode(testUser._id, 'FREESHIP3', 100, 20);
      console.log('✅ Second application successful');
      console.log(`   - Delivery charge: ₹${result.deliveryCharge}`);
    } catch (error) {
      console.log('❌ Second application failed:', error.message);
    }

    // Test 5: Test invalid promo code
    console.log('\n5. Testing invalid promo code...');
    try {
      const result = await applyPromoCode(testUser._id, 'INVALID123', 100, 20);
      console.log('❌ Invalid promo code test failed - should have thrown error');
    } catch (error) {
      console.log('✅ Invalid promo code test passed:', error.message);
    }

    console.log('\n🎉 All promo code logic tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testPromoCodeLogic();
