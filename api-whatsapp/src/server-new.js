const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const sessionManager = require('./services/sessionManager');
const autoRestoreService = require('./services/autoRestore');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load sessions on startup
sessionManager.loadSessions();

// Auto-restore sessions
autoRestoreService.restoreSessions();

// API Routes
app.use('/api', apiRoutes);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    // Close all WhatsApp clients
    for (const [sessionId, client] of sessionManager.whatsappInstances) {
      console.log(`🔌 Closing session: ${sessionId}`);
      await client.destroy();
    }
    
    console.log('✅ All sessions closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  
  try {
    // Close all WhatsApp clients
    for (const [sessionId, client] of sessionManager.whatsappInstances) {
      console.log(`🔌 Closing session: ${sessionId}`);
      await client.destroy();
    }
    
    console.log('✅ All sessions closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 WhatsApp API server running on port ${config.PORT}`);
  console.log(`📱 API Documentation: http://localhost:${config.PORT}/api`);
  console.log(`🔗 Railway Webhook URL: ${config.RAILWAY_WEBHOOK_URL}`);
});
