// Configuration example for Railway webhook integration
// Copy this file to config.js and update with your actual values

module.exports = {
  // Railway Webhook Configuration for Message Processing
  RAILWAY_WEBHOOK_URL: 'http://localhost:3005/webhook',
  RAILWAY_API_KEY: 'your_railway_api_key_here',
  
  // Server Configuration
  PORT: 3000,                    // Main WhatsApp server
  WEBHOOK_PORT: 3001             // Webhook server for incoming messages
};
