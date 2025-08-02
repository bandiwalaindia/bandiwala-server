import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:6111';

async function testNewUserPromo() {
  try {
    console.log('🧪 Testing FREESHIP3 with new user...');

    // Step 1: Login with the new test user
    console.log('\n1. Logging in with new test user...');
    const loginResponse = await fetch(`${BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+919999999999',
        password: 'testpass123'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Step 2: Test promo code validation - FREESHIP3
    console.log('\n2. Testing FREESHIP3 promo code...');
    const promoResponse = await fetch(`${BASE_URL}/api/promo-codes/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        code: 'FREESHIP3',
        subtotal: 110
      }),
    });

    const promoData = await promoResponse.json();
    console.log('Promo response:', JSON.stringify(promoData, null, 2));

    if (promoData.success) {
      console.log('✅ FREESHIP3 validation test passed');
      console.log(`   - Type: ${promoData.data.type}`);
      console.log(`   - Is Free Delivery: ${promoData.data.isFreeDelivery}`);
      console.log(`   - Discount Amount: ₹${promoData.data.discountAmount}`);
      console.log(`   - Remaining Uses: ${promoData.data.remainingUses}`);
      
      // Verify the expected values
      if (promoData.data.discountAmount === 0 && 
          promoData.data.isFreeDelivery === true && 
          promoData.data.type === 'free_delivery') {
        console.log('🎉 All validation checks passed! FREESHIP3 is working correctly.');
      } else {
        console.log('❌ Validation checks failed. Expected: discountAmount=0, isFreeDelivery=true, type=free_delivery');
      }
    } else {
      console.log('❌ FREESHIP3 validation test failed');
      console.log(`   - Message: ${promoData.message}`);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testNewUserPromo();
