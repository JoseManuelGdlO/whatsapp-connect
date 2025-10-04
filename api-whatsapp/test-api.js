const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const WEBHOOK_BASE = 'http://localhost:3001';
const SESSION_ID = 'test-session';

async function testAPI() {
  console.log('🧪 Testing WhatsApp API with Webhooks...\n');

  try {
    // 1. Test health check
    console.log('1️⃣ Testing health check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check:', health.data);

    // 2. Start session with webhook
    console.log('\n2️⃣ Starting WhatsApp session with webhook...');
    const startSession = await axios.post(`${API_BASE}/api/start`, {
      sessionId: SESSION_ID,
      webhookUrl: `${WEBHOOK_BASE}/webhook`
    });
    console.log('✅ Session started:', startSession.data);

    // 3. Get QR code
    console.log('\n3️⃣ Getting QR code...');
    const qrCode = await axios.get(`${API_BASE}/api/qrcode/${SESSION_ID}`);
    if (qrCode.data.success) {
      console.log('✅ QR code received (base64 image)');
      console.log('📱 Scan this QR code with WhatsApp to authenticate');
    } else {
      console.log('ℹ️ QR code not available (session might be authenticated)');
    }

    // 4. Check status
    console.log('\n4️⃣ Checking session status...');
    const status = await axios.get(`${API_BASE}/api/status/${SESSION_ID}`);
    console.log('✅ Status:', status.data);

    // 5. Test webhook configuration
    console.log('\n5️⃣ Testing webhook configuration...');
    const webhookConfig = await axios.get(`${API_BASE}/api/webhook/${SESSION_ID}`);
    console.log('✅ Webhook config:', webhookConfig.data);

    // 6. Test get recent messages
    console.log('\n6️⃣ Getting recent messages...');
    const messages = await axios.get(`${API_BASE}/api/messages/${SESSION_ID}`);
    console.log('✅ Recent messages:', messages.data);

    console.log('\n🎉 API test completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Scan the QR code with WhatsApp');
    console.log('2. Wait for authentication');
    console.log('3. Send a message to your WhatsApp number');
    console.log('4. Check webhook server at: http://localhost:3001/messages');
    console.log('5. Deploy to DigitalOcean');

  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

// Run test
testAPI();
