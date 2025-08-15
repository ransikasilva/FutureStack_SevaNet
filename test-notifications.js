/**
 * Test script for SevaNet notification system
 * Tests both SMS (Notify.lk) and Email (Resend) notifications
 */

const API_BASE = 'http://localhost:3000/api';

// Test data
const testData = {
  appointmentConfirmation: {
    type: 'appointment_confirmation',
    appointmentId: 'test-appointment-id',
    userId: 'test-user-id',
    data: {
      phone: '+94701234567', // Sri Lankan test number
      email: 'test@example.com',
      citizenName: 'John Doe',
      serviceName: 'Passport Application',
      appointmentDate: 'Friday, August 15, 2025',
      appointmentTime: '10:00 AM',
      bookingReference: 'BOOK1234',
      department: 'Department of Immigration & Emigration'
    }
  },
  appointmentReminder: {
    type: 'appointment_reminder',
    appointmentId: 'test-appointment-id',
    userId: 'test-user-id',
    data: {
      phone: '+94701234567',
      email: 'test@example.com',
      citizenName: 'John Doe',
      serviceName: 'Passport Application',
      appointmentDate: 'Friday, August 15, 2025',
      appointmentTime: '10:00 AM',
      bookingReference: 'BOOK1234',
      requiredDocuments: ['National ID Copy', 'Birth Certificate', 'Passport Photos']
    }
  },
  documentStatus: {
    type: 'document_status',
    appointmentId: 'test-appointment-id',
    userId: 'test-user-id',
    data: {
      documentName: 'National ID Copy',
      status: 'approved',
      comments: 'Document is clear and valid'
    }
  }
};

/**
 * Test notification endpoint
 */
async function testNotificationEndpoint(testCase, caseName) {
  console.log(`\n🧪 Testing ${caseName}...`);
  
  try {
    const response = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You may need to adjust this
      },
      body: JSON.stringify(testCase)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${caseName} - SUCCESS`);
      console.log(`   SMS: ${result.smsResult?.success ? '✅' : '❌'} ${result.smsResult?.messageId || result.smsResult?.error || 'N/A'}`);
      console.log(`   Email: ${result.emailResult?.success ? '✅' : '❌'} ${result.emailResult?.messageId || result.emailResult?.error || 'N/A'}`);
    } else {
      console.log(`❌ ${caseName} - FAILED`);
      console.log(`   Error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ ${caseName} - ERROR`);
    console.log(`   ${error.message}`);
    return null;
  }
}

/**
 * Test reminder endpoint
 */
async function testReminderEndpoint() {
  console.log(`\n🧪 Testing Reminder System...`);
  
  try {
    const response = await fetch(`${API_BASE}/notifications/reminders`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer development-secret'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Reminder System - SUCCESS`);
      console.log(`   Total appointments: ${result.totalAppointments || 0}`);
      console.log(`   Sent: ${result.sentCount || 0}`);
      console.log(`   Failed: ${result.failedCount || 0}`);
    } else {
      console.log(`❌ Reminder System - FAILED`);
      console.log(`   Error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Reminder System - ERROR`);
    console.log(`   ${error.message}`);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 SevaNet Notification System Test Suite');
  console.log('==========================================');
  
  // Test individual notification types
  await testNotificationEndpoint(testData.appointmentConfirmation, 'Appointment Confirmation');
  await testNotificationEndpoint(testData.appointmentReminder, 'Appointment Reminder');
  await testNotificationEndpoint(testData.documentStatus, 'Document Status Update');
  
  // Test reminder system
  await testReminderEndpoint();
  
  console.log('\n✨ Test Suite Complete!');
  console.log('\n📝 Notes:');
  console.log('- SMS notifications require NOTIFY_LK_API_KEY and NOTIFY_LK_USER_ID environment variables');
  console.log('- Email notifications require RESEND_API_KEY environment variable');
  console.log('- Some tests may fail if environment variables are not configured');
  console.log('- Check the console logs for detailed error messages');
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testNotificationEndpoint,
  testReminderEndpoint,
  runTests,
  testData
};