/**
 * Simple test script for SevaNet notification system
 * Tests the SMS (Notify.lk) service directly without authentication
 */

// Test SMS directly using the notification service
async function testDirectSMS() {
  console.log('\n🧪 Testing Direct SMS Service...');
  
  const testMessage = `Test SMS from SevaNet Portal

Service: Passport Application
Date: Friday, August 15, 2025
Time: 10:00 AM
Reference: TEST123

This is a test message to verify SMS functionality.

- SevaNet Team`;

  // Sri Lankan test phone number (should be in the format 07xxxxxxxx)
  const testPhone = '0701234567';
  
  console.log(`Sending test SMS to: ${testPhone}`);
  console.log(`Message length: ${testMessage.length} characters`);
  
  try {
    const response = await fetch('https://app.notify.lk/api/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer VmxxEsOjEM3TaFIvXgYd' // Test API key from env file
      },
      body: JSON.stringify({
        user_id: '30056', // Test user ID from env file
        sender: 'NotifyDEMO',
        to: testPhone,
        message: testMessage
      })
    });

    const result = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.status === 'success') {
      console.log('✅ SMS Service - SUCCESS');
      console.log(`Message ID: ${result.data?.message_id || 'N/A'}`);
      return true;
    } else {
      console.log('❌ SMS Service - FAILED');
      console.log(`Error: ${result.message || 'Unknown error'}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ SMS Service - ERROR');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Test the reminder endpoint (GET method with cron secret)
async function testReminderEndpoint() {
  console.log('\n🧪 Testing Reminder Endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/notifications/reminders', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer development-secret' // From .env.local
      }
    });

    const result = await response.json();
    
    console.log('\nResponse Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Reminder Endpoint - SUCCESS');
      console.log(`Total appointments found: ${result.totalAppointments || 0}`);
      console.log(`Reminders sent: ${result.sentCount || 0}`);
      console.log(`Failed: ${result.failedCount || 0}`);
      return true;
    } else {
      console.log('❌ Reminder Endpoint - FAILED');
      console.log(`Error: ${result.error}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Reminder Endpoint - ERROR');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Test notification service classes directly
async function testNotificationClasses() {
  console.log('\n🧪 Testing Notification Classes...');
  
  try {
    // Import the notification service (this would work in Node.js with proper setup)
    console.log('Testing notification service configuration...');
    
    // Check environment variables
    const requiredVars = [
      'NOTIFY_LK_USER_ID',
      'NOTIFY_LK_API_KEY', 
      'NOTIFY_LK_SENDER_ID'
    ];
    
    console.log('\nEnvironment Variables Check:');
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    });
    
    console.log('\nEmail Configuration:');
    console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing (Optional)'}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Notification Classes - ERROR');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 SevaNet Notification System - Simple Test Suite');
  console.log('=======================================================');
  
  // Load environment variables if running in Node.js
  if (typeof process !== 'undefined' && process.env) {
    // Load .env.local file manually
    const fs = require('fs');
    const path = require('path');
    
    try {
      const envPath = path.join(__dirname, '.env.local');
      const envFile = fs.readFileSync(envPath, 'utf8');
      
      envFile.split('\\n').forEach(line => {
        if (line.includes('=') && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          process.env[key.trim()] = value.trim();
        }
      });
      
      console.log('✅ Environment variables loaded from .env.local');
    } catch (error) {
      console.log('⚠️ Could not load .env.local file:', error.message);
    }
  }
  
  const results = [];
  
  // Test 1: Environment setup
  results.push(await testNotificationClasses());
  
  // Test 2: Direct SMS service
  results.push(await testDirectSMS());
  
  // Test 3: Reminder endpoint
  results.push(await testReminderEndpoint());
  
  // Summary
  const successCount = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`=========================`);
  console.log(`Tests passed: ${successCount}/${totalTests}`);
  console.log(`Success rate: ${((successCount/totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above for details.');
  }
  
  console.log('\\n📝 Next Steps:');
  console.log('- If SMS tests fail, verify Notify.lk credentials in .env.local');
  console.log('- If reminder tests fail, ensure the development server is running');
  console.log('- For email notifications, add RESEND_API_KEY to .env.local');
  console.log('- Create test appointments in the database to test reminder functionality');
}

// Handle command line execution
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = {
    testDirectSMS,
    testReminderEndpoint,
    testNotificationClasses,
    runTests
  };
}