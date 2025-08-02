import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

// Test available orders endpoint in detail
async function testAvailableOrdersDetailed() {
  console.log('🚚 Testing Available Orders API in detail...\n');

  try {
    // Step 1: Login as delivery partner
    console.log('1. Logging in as delivery partner...');
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
    if (!loginData.success) {
      throw new Error('Login failed: ' + loginData.message);
    }

    const token = loginData.token;
    console.log('✅ Login successful!\n');

    // Step 2: Get available orders with detailed logging
    console.log('2. Getting available orders...');
    const availableOrdersResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/available`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const availableOrdersData = await availableOrdersResponse.json();
    console.log('Available orders response status:', availableOrdersResponse.status);
    console.log('Available orders response:', JSON.stringify(availableOrdersData, null, 2));

    if (availableOrdersData.success && availableOrdersData.data.length > 0) {
      console.log(`\n✅ Found ${availableOrdersData.data.length} available orders!`);
      
      availableOrdersData.data.forEach((order, index) => {
        console.log(`\nOrder ${index + 1}:`);
        console.log(`  Order Number: ${order.orderNumber}`);
        console.log(`  Total: ₹${order.total}`);
        console.log(`  Status: ${order.orderStatus}`);
        console.log(`  Customer: ${order.user ? order.user.name : 'Unknown'}`);
        console.log(`  Items: ${order.items ? order.items.length : 0}`);
        console.log(`  Delivery Address: ${order.deliveryAddress ? order.deliveryAddress.formatted : 'Unknown'}`);
      });

      // Step 3: Try to accept the first order
      const firstOrder = availableOrdersData.data[0];
      console.log(`\n3. Trying to accept order ${firstOrder.orderNumber}...`);
      
      const acceptResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/${firstOrder._id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const acceptData = await acceptResponse.json();
      console.log('Accept order response status:', acceptResponse.status);
      console.log('Accept order response:', JSON.stringify(acceptData, null, 2));

      if (acceptData.success) {
        console.log('✅ Order accepted successfully!');
        
        // Step 4: Check assigned orders
        console.log('\n4. Checking assigned orders...');
        const assignedOrdersResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/assigned`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const assignedOrdersData = await assignedOrdersResponse.json();
        console.log('Assigned orders response:', JSON.stringify(assignedOrdersData, null, 2));

        // Step 5: Check current delivery
        console.log('\n5. Checking current delivery...');
        const currentDeliveryResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/current`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const currentDeliveryData = await currentDeliveryResponse.json();
        console.log('Current delivery response:', JSON.stringify(currentDeliveryData, null, 2));

        // Step 6: Mark as delivered
        if (currentDeliveryData.success && currentDeliveryData.data) {
          console.log('\n6. Marking order as delivered...');
          const deliveredResponse = await fetch(`${BASE_URL}/api/delivery-partners/orders/${currentDeliveryData.data._id}/status`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderStatus: 'delivered'
            })
          });

          const deliveredData = await deliveredResponse.json();
          console.log('Mark as delivered response:', JSON.stringify(deliveredData, null, 2));

          if (deliveredData.success) {
            console.log('✅ Order marked as delivered successfully!');
          }
        }
      }
    } else {
      console.log('❌ No available orders found or error occurred');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAvailableOrdersDetailed();
