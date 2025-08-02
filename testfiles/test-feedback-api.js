import axios from 'axios';
import { config } from 'dotenv';

// Load environment variables
config({ path: './config.env' });

const BASE_URL = 'http://localhost:4000';

// Test credentials - using vendor credentials provided
const VENDOR_CREDENTIALS = {
  phone: '+919876543210',
  password: 'vendor123'
};

// Admin credentials from memories
const ADMIN_CREDENTIALS = {
  phone: '+918688660055',
  password: 'plplplpl'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing vendor login...');
  try {
    const response = await makeRequest('POST', '/login', VENDOR_CREDENTIALS);
    
    if (response.success && response.token) {
      authToken = response.token;
      console.log('✅ Login successful');
      console.log('User role:', response.user?.role);
      return true;
    } else {
      console.log('❌ Login failed:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
};

const testSubmitFeedback = async () => {
  console.log('\n📝 Testing feedback submission...');
  try {
    const feedbackData = {
      type: 'feedback',
      category: 'app_functionality',
      subject: 'Test Feedback from API',
      message: 'This is a test feedback message to verify the feedback system is working correctly.',
      priority: 'medium',
      rating: 4
    };

    const response = await makeRequest('POST', '/api/feedback/submit', feedbackData);
    
    if (response.success) {
      console.log('✅ Feedback submitted successfully');
      console.log('Feedback ID:', response.feedback._id);
      return response.feedback._id;
    } else {
      console.log('❌ Feedback submission failed:', response.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Feedback submission error:', error.message);
    return null;
  }
};

const testGetUserFeedback = async () => {
  console.log('\n📋 Testing get user feedback...');
  try {
    const response = await makeRequest('GET', '/api/feedback/my-feedback');
    
    if (response.success) {
      console.log('✅ User feedback retrieved successfully');
      console.log('Total feedback:', response.feedbacks?.length || 0);
      if (response.feedbacks?.length > 0) {
        console.log('Latest feedback subject:', response.feedbacks[0].subject);
      }
      return true;
    } else {
      console.log('❌ Get user feedback failed:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Get user feedback error:', error.message);
    return false;
  }
};

const testAdminFeedback = async () => {
  console.log('\n👑 Testing admin feedback endpoints...');
  try {
    // Test get all feedback (admin)
    const response = await makeRequest('GET', '/api/admin/feedback');
    
    if (response.success) {
      console.log('✅ Admin feedback list retrieved successfully');
      console.log('Total feedback:', response.feedbacks?.length || 0);
      console.log('Stats:', response.stats);
      return true;
    } else {
      console.log('❌ Admin feedback list failed:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin feedback error:', error.message);
    return false;
  }
};

const testFeedbackStats = async () => {
  console.log('\n📊 Testing feedback statistics...');
  try {
    const response = await makeRequest('GET', '/api/admin/feedback/stats');
    
    if (response.success) {
      console.log('✅ Feedback statistics retrieved successfully');
      console.log('General stats:', response.stats);
      console.log('Category stats:', response.categoryStats?.length || 0, 'categories');
      return true;
    } else {
      console.log('❌ Feedback statistics failed:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Feedback statistics error:', error.message);
    return false;
  }
};

const testComplaintSubmission = async () => {
  console.log('\n⚠️ Testing complaint submission...');
  try {
    const complaintData = {
      type: 'complaint',
      category: 'order_issues',
      subject: 'Test Complaint - Order Delay',
      message: 'This is a test complaint about order delivery delay. The order was supposed to arrive 2 hours ago.',
      priority: 'high'
    };

    const response = await makeRequest('POST', '/api/feedback/submit', complaintData);
    
    if (response.success) {
      console.log('✅ Complaint submitted successfully');
      console.log('Complaint ID:', response.feedback._id);
      return response.feedback._id;
    } else {
      console.log('❌ Complaint submission failed:', response.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Complaint submission error:', error.message);
    return null;
  }
};

// Test admin login
const testAdminLogin = async () => {
  console.log('\n🔐 Testing admin login...');
  try {
    const response = await makeRequest('POST', '/login', ADMIN_CREDENTIALS);

    if (response.success && response.token) {
      authToken = response.token;
      console.log('✅ Admin login successful');
      console.log('User role:', response.user?.role);
      return true;
    } else {
      console.log('❌ Admin login failed:', response.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Feedback API Tests...');
  console.log('=====================================');

  // Test vendor login first
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Test feedback submission
  const feedbackId = await testSubmitFeedback();

  // Test complaint submission
  const complaintId = await testComplaintSubmission();

  // Test get user feedback
  await testGetUserFeedback();

  // Now test admin functionality
  console.log('\n🔄 Switching to admin user...');
  const adminLoginSuccess = await testAdminLogin();
  if (adminLoginSuccess) {
    await testAdminFeedback();
    await testFeedbackStats();
  } else {
    console.log('⚠️ Skipping admin tests due to login failure');
  }

  console.log('\n🎉 All tests completed!');
  console.log('=====================================');
};

// Run the tests
runTests().catch(console.error);
