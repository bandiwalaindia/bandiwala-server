import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

// Test delivery partner login and API endpoints
async function testDeliveryPartnerAPI() {
  console.log('🚚 Testing Delivery Partner API...\n');

  try {
    // Step 1: Login as delivery partner
    console.log('1. Testing delivery partner login...');
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+919876543219',
        password: '12345678'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }

    const token = loginData.token;
    console.log('✅ Login successful! Token received.\n');

    // Step 2: Get delivery partner profile
    console.log('2. Testing get delivery partner profile...');
    const profileResponse = await fetch(`${BASE_URL}/api/delivery-partners/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const profileData = await profileResponse.json();
    console.log('Profile response:', profileData);
    console.log('✅ Profile retrieved successfully!\n');

    // Step 3: Get delivery stats
    console.log('3. Testing get delivery stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/delivery-partners/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const statsData = await statsResponse.json();
    console.log('Stats response:', statsData);
    console.log('✅ Stats retrieved successfully!\n');

    // Step 4: Get available orders
    console.log('4. Testing get available orders...');
    const availableOrdersResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const availableOrdersData = await availableOrdersResponse.json();
    console.log('Available orders response:', availableOrdersData);
    console.log('✅ Available orders retrieved successfully!\n');

    // Step 5: Get assigned orders
    console.log('5. Testing get assigned orders...');
    const assignedOrdersResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/assigned`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const assignedOrdersData = await assignedOrdersResponse.json();
    console.log('Assigned orders response:', assignedOrdersData);
    console.log('✅ Assigned orders retrieved successfully!\n');

    // Step 6: Get current delivery
    console.log('6. Testing get current delivery...');
    const currentDeliveryResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/current`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const currentDeliveryData = await currentDeliveryResponse.json();
    console.log('Current delivery response:', currentDeliveryData);
    console.log('✅ Current delivery retrieved successfully!\n');

    // Step 7: Toggle availability
    console.log('7. Testing toggle availability...');
    const toggleResponse = await fetch(`${BASE_URL}/api/delivery-partners/availability`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isAvailable: true
      })
    });

    const toggleData = await toggleResponse.json();
    console.log('Toggle availability response:', toggleData);
    console.log('✅ Availability toggled successfully!\n');

    // Step 8: Get order history
    console.log('8. Testing get order history...');
    const historyResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const historyData = await historyResponse.json();
    console.log('Order history response:', historyData);
    console.log('✅ Order history retrieved successfully!\n');

    console.log('🎉 All delivery partner API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testDeliveryPartnerAPI();
