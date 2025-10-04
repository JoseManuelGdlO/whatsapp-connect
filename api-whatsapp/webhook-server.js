const express = require('express');
const config = require('./src/config');
const railwayService = require('./src/services/railwayService');

const app = express();
const PORT = config.WEBHOOK_PORT;

// Middleware
app.use(express.json());

// Store received messages
const receivedMessages = [];

// Webhook endpoint to receive incoming messages from WhatsApp
app.post('/webhook', async (req, res) => {
  const { sessionId, message } = req.body;
  
  console.log('📨 Webhook received incoming message:');
  console.log('Session ID:', sessionId);
  console.log('Message:', message);
  
  // Store message
  const messageData = {
    timestamp: new Date().toISOString(),
    sessionId,
    message
  };
  
  receivedMessages.push(messageData);
  
  // Keep only last 100 messages
  if (receivedMessages.length > 100) {
    receivedMessages.shift();
  }
  
  // Send to Railway API for processing
  const apiResult = await railwayService.processIncomingMessage(sessionId, message);
  
  res.json({ 
    success: true, 
    message: 'Webhook received and sent to Railway API',
    sentToRailway: apiResult.success,
    railwayResponse: apiResult.response || apiResult.error
  });
});

// View all received messages
app.get('/messages', (req, res) => {
  res.json({
    count: receivedMessages.length,
    messages: receivedMessages
  });
});

// Clear messages
app.delete('/messages', (req, res) => {
  receivedMessages.length = 0;
  res.json({ success: true, message: 'Messages cleared' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    messageCount: receivedMessages.length,
    railwayWebhookUrl: config.RAILWAY_WEBHOOK_URL
  });
});

app.listen(PORT, () => {
  console.log(`📨 Webhook server running on port ${PORT}`);
  console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`📋 View messages: http://localhost:${PORT}/messages`);
  console.log(`🚂 Railway Webhook URL: ${config.RAILWAY_WEBHOOK_URL}`);
});
