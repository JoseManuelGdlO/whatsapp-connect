const axios = require('axios');
const config = require('../config');

class RailwayService {
  constructor() {
    this.webhookUrl = config.RAILWAY_WEBHOOK_URL;
    this.apiKey = config.RAILWAY_API_KEY;
  }

  async processMessage(messageData) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add API key if provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('🚂 Sending message to Railway webhook:', {
        sessionId: messageData.sessionId,
        type: messageData.type,
        messageLength: messageData.message?.length || messageData.message?.body?.length || 0
      });

      const response = await axios.post(this.webhookUrl, messageData, { 
        headers,
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Message sent to Railway webhook successfully');
      console.log('Railway Response:', response.status, response.data);
      
      return { success: true, response: response.data };
    } catch (error) {
      console.error('❌ Error sending message to Railway webhook:');
      console.error('Error:', error.message);
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      }
      return { success: false, error: error.message };
    }
  }

  async processOutgoingMessage(sessionId, phone, message, messageId) {
    const messageData = {
      sessionId,
      phone,
      message,
      messageId,
      timestamp: new Date().toISOString(),
      type: 'outgoing',
      source: 'whatsapp-webhook'
    };

    return await this.processMessage(messageData);
  }

  async processIncomingMessage(sessionId, message) {
    const messageData = {
      sessionId,
      message,
      timestamp: new Date().toISOString(),
      source: 'whatsapp-webhook',
      type: 'incoming'
    };

    return await this.processMessage(messageData);
  }
}

module.exports = new RailwayService();
