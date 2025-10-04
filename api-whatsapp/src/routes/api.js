const express = require('express');
const qrcode = require('qrcode');
const sessionManager = require('../services/sessionManager');
const railwayService = require('../services/railwayService');

const router = express.Router();

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp API - Similar to UltraMSG',
    version: '1.0.0',
    note: 'Real WhatsApp connection using whatsapp-web.js',
    features: {
      'Session Persistence': 'Sessions are saved and restored on restart',
      'Graceful Shutdown': 'Sessions are properly closed on shutdown',
      'Multi-Account': 'Support for multiple WhatsApp accounts',
      'Webhooks': 'Receive incoming messages via webhooks',
      'Railway Integration': 'Process messages with Railway API'
    },
    endpoints: {
      '/api/start': 'Start WhatsApp session',
      '/api/qrcode': 'Get QR code',
      '/api/wait-qr': 'Wait for QR code (polling)',
      '/api/send-message': 'Send message',
      '/api/status': 'Check connection status',
      '/api/webhook/:sessionId': 'Set/Get webhook URL',
      '/api/messages/:sessionId': 'Get recent messages',
      '/api/sessions': 'List all sessions',
      '/api/cleanup/:sessionId': 'Delete specific session',
      '/api/cleanup/all': 'Delete all sessions'
    }
  });
});

// Start WhatsApp session
router.post('/start', async (req, res) => {
  try {
    const { sessionId = 'default', webhookUrl } = req.body;
    
    if (sessionManager.whatsappInstances.has(sessionId)) {
      return res.json({ 
        success: false, 
        message: 'Session already exists' 
      });
    }

    console.log(`🚀 Starting WhatsApp session: ${sessionId}`);

    const client = sessionManager.createClient(sessionId);
    sessionManager.setupClientEvents(client, sessionId);

    // Store and initialize
    sessionManager.whatsappInstances.set(sessionId, client);
    
    // Set webhook URL if provided
    if (webhookUrl) {
      sessionManager.setWebhookUrl(sessionId, webhookUrl);
    }
    
    await client.initialize();
    
    res.json({ 
      success: true, 
      message: 'Session started successfully',
      sessionId,
      webhookUrl: sessionManager.getWebhookUrl(sessionId)
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get QR code
router.get('/qrcode/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const qrCode = sessionManager.qrCodes.get(sessionId);
    
    if (!qrCode) {
      return res.status(404).json({ 
        success: false, 
        message: 'QR code not available' 
      });
    }

    const qrCodeDataUrl = await qrcode.toDataURL(qrCode);
    
    res.json({ 
      success: true, 
      qrCode: qrCodeDataUrl,
      sessionId 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Wait for QR code (polling)
router.get('/wait-qr/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const maxAttempts = 30; // 30 seconds
    let attempts = 0;

    const checkQR = async () => {
      const qrCode = sessionManager.qrCodes.get(sessionId);
      
      if (qrCode) {
        const qrCodeDataUrl = await qrcode.toDataURL(qrCode);
        return res.json({ 
          success: true, 
          qrCode: qrCodeDataUrl,
          sessionId 
        });
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        return res.status(408).json({ 
          success: false, 
          message: 'QR code not received within timeout' 
        });
      }
      
      setTimeout(checkQR, 1000);
    };

    checkQR();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send message
router.post('/send-message', async (req, res) => {
  try {
    const { 
      phone, 
      message, 
      sessionId = 'default' 
    } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone and message are required' 
      });
    }

    const client = sessionManager.whatsappInstances.get(sessionId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Check if client is ready and connected
    if (!(await sessionManager.isClientReady(sessionId))) {
      return res.status(400).json({ 
        success: false, 
        message: 'WhatsApp client is not ready. Please wait for the session to be fully connected.' 
      });
    }

    const formattedPhone = phone.replace(/\D/g, '');
    const chatId = `${formattedPhone}@c.us`;
    
    try {
      // Add a small delay to ensure client is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to send message with retry mechanism
      let result;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          result = await client.sendMessage(chatId, message);
          break; // Success, exit retry loop
        } catch (retryError) {
          attempts++;
          console.log(`Send attempt ${attempts} failed:`, retryError.message);
          
          if (attempts >= maxAttempts) {
            throw retryError; // Re-throw the last error
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Process message in Railway
      const railwayResult = await railwayService.processOutgoingMessage(
        sessionId, 
        formattedPhone, 
        message, 
        result.id._serialized
      );
      
      res.json({ 
        success: true, 
        messageId: result.id._serialized,
        phone: formattedPhone,
        note: 'Message sent via WhatsApp',
        railwayProcessed: railwayResult.success,
        railwayResponse: railwayResult.response || railwayResult.error
      });
    } catch (sendError) {
      console.error('Error sending message:', sendError);
      res.status(500).json({ 
        success: false, 
        message: sendError.message 
      });
    }
  } catch (error) {
    console.error('Error in send-message endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Check status
router.get('/status/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const sessionInfo = await sessionManager.getSessionInfo(sessionId);
    
    res.json({ 
      success: true, 
      ...sessionInfo,
      note: 'Session will persist after server restart'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Debug client state
router.get('/debug/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const debugInfo = await sessionManager.forceCheckClientState(sessionId);
    const sessionInfo = sessionManager.getSessionInfo(sessionId);
    
    res.json({ 
      success: true, 
      sessionId,
      debug: debugInfo,
      session: sessionInfo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Set webhook URL for a session
router.post('/webhook/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { webhookUrl } = req.body;

    if (!sessionManager.whatsappInstances.has(sessionId)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    sessionManager.setWebhookUrl(sessionId, webhookUrl);
    
    res.json({ 
      success: true, 
      message: 'Webhook URL updated and saved',
      sessionId,
      webhookUrl 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get webhook URL for a session
router.get('/webhook/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const webhookUrl = sessionManager.getWebhookUrl(sessionId);
    
    res.json({ 
      success: true, 
      sessionId,
      webhookUrl 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get messages for a session
router.get('/messages/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const messages = sessionManager.getMessages(sessionId);
    
    res.json({ 
      success: true, 
      sessionId,
      count: messages.length,
      messages 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// List all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await sessionManager.getAllSessions();
    
    res.json({ 
      success: true, 
      count: sessions.length,
      sessions 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Cleanup endpoint to remove sessions and clear auth data
router.delete('/cleanup/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'all';
    
    if (sessionId === 'all') {
      // Clean up all sessions
      console.log('🧹 Cleaning up all sessions...');
      
      for (const [id, client] of sessionManager.whatsappInstances) {
        try {
          console.log(`🔌 Closing session: ${id}`);
          await client.destroy();
        } catch (error) {
          console.error(`Error closing session ${id}:`, error.message);
        }
      }
      
      sessionManager.whatsappInstances.clear();
      sessionManager.qrCodes.clear();
      sessionManager.webhookUrls.clear();
      
      // Clear auth directory
      try {
        const fs = require('fs');
        if (fs.existsSync('.wwebjs_auth')) {
          fs.rmSync('.wwebjs_auth', { recursive: true, force: true });
          console.log('🗑️ Auth directory cleared');
        }
      } catch (error) {
        console.error('Error clearing auth directory:', error.message);
      }
      
      res.json({
        success: true,
        message: 'All sessions cleaned up',
        sessionsRemoved: 'all'
      });
    } else {
      // Clean up specific session
      const client = sessionManager.whatsappInstances.get(sessionId);
      
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      try {
        console.log(`🔌 Closing session: ${sessionId}`);
        await client.destroy();
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error.message);
      }
      
      sessionManager.whatsappInstances.delete(sessionId);
      sessionManager.qrCodes.delete(sessionId);
      sessionManager.webhookUrls.delete(sessionId);
      
      res.json({
        success: true,
        message: 'Session cleaned up',
        sessionRemoved: sessionId
      });
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
