const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store WhatsApp instances
const whatsappInstances = new Map();

// Store webhook URLs for each session
const webhookUrls = new Map();

// Store QR codes for each session
const qrCodes = new Map();

// Store incoming messages for each session
const messageHistory = new Map();

// Session persistence file
const SESSIONS_FILE = './sessions.json';

// Railway Framework Configuration
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://your-railway-app.railway.app/api/process-message';
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY || '';

// Function to process message in Railway framework
async function processMessageInRailway(messageData) {
  try {
    const axios = require('axios');
    
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add API key if provided
    if (RAILWAY_API_KEY) {
      headers['Authorization'] = `Bearer ${RAILWAY_API_KEY}`;
    }

    console.log('🚂 Sending message to Railway for processing:', {
      sessionId: messageData.sessionId,
      phone: messageData.phone,
      messageLength: messageData.message.length
    });

    const response = await axios.post(RAILWAY_API_URL, messageData, { 
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Message processed in Railway successfully');
    console.log('Railway Response:', response.status, response.data);
    
    return { success: true, response: response.data };
  } catch (error) {
    console.error('❌ Error processing message in Railway:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Load saved sessions on startup
function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf8');
      
      // Check if file is empty or contains only whitespace
      if (!fileContent || fileContent.trim() === '') {
        console.log('📂 Sessions file is empty, starting fresh');
        return;
      }
      
      const data = JSON.parse(fileContent);
      
      // Load webhook URLs (backward compatibility)
      webhookUrls.clear();
      if (data.webhookUrls) {
        Object.entries(data.webhookUrls).forEach(([sessionId, webhookUrl]) => {
          webhookUrls.set(sessionId, webhookUrl);
        });
      }
      
      // Load session metadata (new format)
      if (data.sessions) {
        console.log(`📂 Loaded ${Object.keys(data.sessions).length} session configurations from file`);
        Object.entries(data.sessions).forEach(([sessionId, sessionData]) => {
          if (sessionData.webhookUrl) {
            webhookUrls.set(sessionId, sessionData.webhookUrl);
          }
          console.log(`   - ${sessionId}: ${sessionData.status} (webhook: ${sessionData.webhookUrl ? 'yes' : 'no'})`);
        });
      } else {
        console.log(`📂 Loaded ${webhookUrls.size} webhook URLs from file`);
      }
    } else {
      console.log('📂 No sessions file found, starting fresh');
    }
    
    // Check for existing WhatsApp auth sessions
    const authDir = '.wwebjs_auth';
    if (fs.existsSync(authDir)) {
      try {
        const authSessions = fs.readdirSync(authDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name.replace('session-', ''));
        
        if (authSessions.length > 0) {
          console.log(`🔍 Found ${authSessions.length} existing WhatsApp auth sessions: ${authSessions.join(', ')}`);
          console.log('💡 These sessions will be automatically restored when you start them');
          
          // Check which sessions have webhooks configured
          authSessions.forEach(sessionId => {
            const webhookUrl = webhookUrls.get(sessionId);
            if (webhookUrl) {
              console.log(`   - ${sessionId}: webhook configured (${webhookUrl})`);
            } else {
              console.log(`   - ${sessionId}: no webhook configured`);
            }
          });
        }
      } catch (error) {
        console.error('Error reading auth directory:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error loading sessions:', error.message);
    console.log('🔄 Starting with empty sessions');
    
    // Try to backup corrupted file and create new one
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const backupFile = `${SESSIONS_FILE}.backup.${Date.now()}`;
        fs.renameSync(SESSIONS_FILE, backupFile);
        console.log(`💾 Corrupted sessions file backed up to: ${backupFile}`);
      }
    } catch (backupError) {
      console.error('❌ Could not backup corrupted sessions file:', backupError.message);
    }
  }
}

// Save sessions to file
function saveSessions() {
  try {
    // Load existing data first to preserve webhooks
    let existingData = {};
    if (fs.existsSync(SESSIONS_FILE)) {
      try {
        const fileContent = fs.readFileSync(SESSIONS_FILE, 'utf8');
        if (fileContent && fileContent.trim() !== '') {
          existingData = JSON.parse(fileContent);
        }
      } catch (error) {
        console.log('Could not load existing sessions file, starting fresh');
      }
    }
    
    const sessionsData = {};
    
    // Save webhook URLs and preserve existing ones
    for (const [sessionId, client] of whatsappInstances) {
      // Preserve existing webhook URL if not set in memory
      const existingWebhook = existingData.sessions?.[sessionId]?.webhookUrl || 
                             existingData.webhookUrls?.[sessionId];
      const currentWebhook = webhookUrls.get(sessionId);
      
      sessionsData[sessionId] = {
        webhookUrl: currentWebhook || existingWebhook || null,
        status: client.pupPage ? 'CONNECTED' : 'DISCONNECTED',
        lastUpdated: new Date().toISOString(),
        hasAuthData: fs.existsSync(`.wwebjs_auth/session-${sessionId}`)
      };
      
      // Update webhookUrls map with preserved webhook
      if (existingWebhook && !currentWebhook) {
        webhookUrls.set(sessionId, existingWebhook);
        console.log(`🔗 Restored webhook for ${sessionId}: ${existingWebhook}`);
      }
    }
    
    // Merge existing webhookUrls with current ones
    const mergedWebhookUrls = { ...existingData.webhookUrls };
    for (const [sessionId, webhookUrl] of webhookUrls) {
      mergedWebhookUrls[sessionId] = webhookUrl;
    }
    
    const data = {
      sessions: sessionsData,
      webhookUrls: mergedWebhookUrls,
      timestamp: new Date().toISOString(),
      totalSessions: whatsappInstances.size
    };
    
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
    console.log(`💾 Sessions saved to file (${whatsappInstances.size} sessions, ${Object.keys(mergedWebhookUrls).length} webhooks)`);
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Save sessions before closing
  saveSessions();
  
  // Close all WhatsApp clients
  for (const [sessionId, client] of whatsappInstances) {
    try {
      console.log(`🔌 Closing session: ${sessionId}`);
      await client.destroy();
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

// Load sessions on startup
loadSessions();

// Auto-restore sessions on startup
async function autoRestoreSessions() {
  try {
    const authDir = '.wwebjs_auth';
    
    if (!fs.existsSync(authDir)) {
      console.log('🔍 No existing auth sessions found to restore');
      return;
    }
    
    const authSessions = fs.readdirSync(authDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name.replace('session-', ''));
    
    if (authSessions.length === 0) {
      console.log('🔍 No existing auth sessions found to restore');
      return;
    }
    
    console.log(`🔄 Auto-restoring ${authSessions.length} sessions on startup: ${authSessions.join(', ')}`);
    
    // Check webhook configurations for each session
    authSessions.forEach(sessionId => {
      const webhookUrl = webhookUrls.get(sessionId);
      if (webhookUrl) {
        console.log(`   - ${sessionId}: webhook configured (${webhookUrl})`);
      } else {
        console.log(`   - ${sessionId}: no webhook configured`);
      }
    });
    
    for (const sessionId of authSessions) {
      try {
        console.log(`🔄 Auto-restoring session: ${sessionId}`);
        
        const client = new Client({
          authStrategy: new LocalAuth({ clientId: sessionId }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding'
            ]
          }
        });
        
        // Set up event handlers
        client.on('qr', (qr) => {
          console.log(`📱 QR Code received for auto-restored session ${sessionId}`);
          qrCodes.set(sessionId, qr);
        });
        
        client.on('ready', () => {
          console.log(`✅ Auto-restored client ${sessionId} is ready!`);
          qrCodes.delete(sessionId);
          saveSessions();
        });
        
        client.on('message', async (message) => {
          console.log('📨 New message received:', message);
          
          // Store message in history
          if (!messageHistory.has(sessionId)) {
            messageHistory.set(sessionId, []);
          }
          
          const messageData = {
            id: message.id?._serialized || message.id || 'unknown',
            from: message.from || 'unknown',
            to: message.to || 'unknown',
            body: message.body || '',
            type: message.type || 'unknown',
            timestamp: message.timestamp || Date.now() / 1000,
            notifyName: message._data?.notifyName || 'unknown',
            fromMe: message.fromMe || false,
            chat: message.chat?.id?._serialized || message.chat?.id || 'unknown',
            receivedAt: new Date().toISOString()
          };
          
          messageHistory.get(sessionId).push(messageData);
          
          // Keep only last 100 messages per session
          if (messageHistory.get(sessionId).length > 100) {
            messageHistory.get(sessionId).shift();
          }
          
          console.log(`💾 Message stored for auto-restored session ${sessionId}. Total messages: ${messageHistory.get(sessionId).length}`);
          
          // Send to webhook if configured
          const webhookUrl = webhookUrls.get(sessionId);
          if (webhookUrl) {
            try {
              const axios = require('axios');
              await axios.post(webhookUrl, {
                sessionId,
                message: messageData
              });
              console.log(`📤 Message sent to webhook: ${webhookUrl}`);
            } catch (error) {
              console.error('Error sending webhook:', error);
            }
          } else {
            console.log(`⚠️ No webhook configured for auto-restored session ${sessionId}. Message stored locally.`);
          }
        });
        
        client.on('disconnected', (reason) => {
          console.log(`❌ Auto-restored client ${sessionId} disconnected:`, reason);
          whatsappInstances.delete(sessionId);
          qrCodes.delete(sessionId);
        });
        
        client.on('auth_failure', (msg) => {
          console.log(`❌ Auth failure for auto-restored session ${sessionId}:`, msg);
          qrCodes.delete(sessionId);
        });
        
        client.on('loading_screen', (percent, message) => {
          console.log(`⏳ Loading auto-restored ${sessionId}: ${percent}% - ${message}`);
        });
        
        // Store and initialize
        whatsappInstances.set(sessionId, client);
        await client.initialize();
        
        console.log(`✅ Successfully auto-restored session: ${sessionId}`);
        
      } catch (error) {
        console.error(`❌ Failed to auto-restore session ${sessionId}:`, error.message);
      }
    }
    
    console.log(`🎉 Auto-restore complete! Total active sessions: ${whatsappInstances.size}`);
    
  } catch (error) {
    console.error('Error during auto-restore:', error);
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp API - Similar to UltraMSG',
    version: '1.0.0',
    note: 'Real WhatsApp connection using whatsapp-web.js',
    features: {
      'Session Persistence': 'Sessions are saved and restored on restart',
      'Graceful Shutdown': 'Sessions are properly closed on shutdown',
      'Multi-Account': 'Support for multiple WhatsApp accounts',
      'Webhooks': 'Receive incoming messages via webhooks'
    },
          endpoints: {
        '/api/start': 'Start WhatsApp session',
        '/api/qrcode': 'Get QR code',
        '/api/wait-qr': 'Wait for QR code (polling)',
        '/api/send-message': 'Send message',
        '/api/status': 'Check connection status',
        '/api/webhook/:sessionId': 'Set/Get webhook URL',
        '/api/messages/:sessionId': 'Get recent messages',
        '/api/sessions': 'List all sessions'
      }
  });
});

// Start WhatsApp session
app.post('/api/start', async (req, res) => {
  try {
    const { sessionId = 'default', webhookUrl } = req.body;
    
    if (whatsappInstances.has(sessionId)) {
      return res.json({ 
        success: false, 
        message: 'Session already exists' 
      });
    }

    console.log(`🚀 Starting WhatsApp session: ${sessionId}`);

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      }
    });

    // QR Code event
    client.on('qr', (qr) => {
      console.log(`📱 QR Code received for session ${sessionId}`);
      qrCodes.set(sessionId, qr);
    });

    // Ready event
    client.on('ready', () => {
      console.log(`✅ Client ${sessionId} is ready!`);
      qrCodes.delete(sessionId); // Clear QR when connected
      saveSessions(); // Save sessions when new one is ready
    });

    // Message event
    client.on('message', async (message) => {
      console.log('📨 New message received:', message);
      
      // Store message in history
      if (!messageHistory.has(sessionId)) {
        messageHistory.set(sessionId, []);
      }
      
      // Safe message data extraction with error handling
      const messageData = {
        id: message.id?._serialized || message.id || 'unknown',
        from: message.from || 'unknown',
        to: message.to || 'unknown',
        body: message.body || '',
        type: message.type || 'unknown',
        timestamp: message.timestamp || Date.now() / 1000,
        notifyName: message._data?.notifyName || 'unknown',
        fromMe: message.fromMe || false,
        chat: message.chat?.id?._serialized || message.chat?.id || 'unknown',
        receivedAt: new Date().toISOString()
      };
      
      messageHistory.get(sessionId).push(messageData);
      
      // Keep only last 100 messages per session
      if (messageHistory.get(sessionId).length > 100) {
        messageHistory.get(sessionId).shift();
      }
      
      console.log(`💾 Message stored for session ${sessionId}. Total messages: ${messageHistory.get(sessionId).length}`);
      
      // Send to webhook if configured
      const webhookUrl = webhookUrls.get(sessionId);
      if (webhookUrl) {
        try {
          const axios = require('axios');
          await axios.post(webhookUrl, {
            sessionId,
            message: messageData
          });
          console.log(`📤 Message sent to webhook: ${webhookUrl}`);
        } catch (error) {
          console.error('Error sending webhook:', error);
        }
      } else {
        console.log(`⚠️ No webhook configured for session ${sessionId}. Message stored locally.`);
      }
    });

    // Disconnected event
    client.on('disconnected', (reason) => {
      console.log(`❌ Client ${sessionId} disconnected:`, reason);
      whatsappInstances.delete(sessionId);
      qrCodes.delete(sessionId);
    });

    // Authentication failure event
    client.on('auth_failure', (msg) => {
      console.log(`❌ Auth failure for session ${sessionId}:`, msg);
      qrCodes.delete(sessionId);
    });

    // Loading screen event
    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading ${sessionId}: ${percent}% - ${message}`);
    });

    // Store the client BEFORE initialization to prevent race conditions
    whatsappInstances.set(sessionId, client);
    console.log(`💾 Session ${sessionId} stored BEFORE initialization. Total sessions: ${whatsappInstances.size}`);

    // Initialize client with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Initializing client (attempt ${retryCount + 1}/${maxRetries})`);
        await client.initialize();
        console.log(`✅ Session ${sessionId} initialized successfully. Total sessions: ${whatsappInstances.size}`);
        break;
      } catch (error) {
        retryCount++;
        console.error(`❌ Initialization attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to initialize after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (webhookUrl) {
      webhookUrls.set(sessionId, webhookUrl);
      saveSessions();
    }
    
    res.json({ 
      success: true, 
      message: 'WhatsApp session started',
      sessionId,
      webhookUrl,
      note: 'Scan the QR code with WhatsApp to connect. Session will persist after restart.',
      nextStep: 'Call /api/qrcode/' + sessionId + ' to get the QR code',
      debug: {
        sessionsCount: whatsappInstances.size,
        sessionStored: whatsappInstances.has(sessionId),
        clientInitialized: !!client,
        pupPageExists: !!client.pupPage,
        initializationAttempts: retryCount + 1
      }
    });
  } catch (error) {
    console.error('Error starting session:', error);
    
    // Clean up on error
    const { sessionId = 'default' } = req.body;
    whatsappInstances.delete(sessionId);
    qrCodes.delete(sessionId);
    
    res.status(500).json({ 
      success: false, 
      message: error.message,
      debug: {
        sessionsCount: whatsappInstances.size,
        sessionStored: whatsappInstances.has(sessionId),
        errorType: error.constructor.name
      }
    });
  }
});

// Get QR Code with better error handling and debugging
app.get('/api/qrcode/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const qrCode = qrCodes.get(sessionId);
    const client = whatsappInstances.get(sessionId);
    
    console.log(`🔍 Looking for session: ${sessionId}`);
    console.log(`📊 Available sessions: ${Array.from(whatsappInstances.keys()).join(', ')}`);
    console.log(`📱 QR codes available: ${Array.from(qrCodes.keys()).join(', ')}`);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found. Please start a session first with /api/start',
        debug: {
          requestedSession: sessionId,
          availableSessions: Array.from(whatsappInstances.keys()),
          totalSessions: whatsappInstances.size
        }
      });
    }

    if (qrCode) {
      const qrImage = await qrcode.toDataURL(qrCode);
      res.json({ 
        success: true, 
        qrCode: qrImage,
        note: 'This is a REAL WhatsApp QR code. Scan it with your phone!',
        instructions: [
          '1. Open WhatsApp Business on your phone',
          '2. Go to Settings > Linked Devices',
          '3. Tap "Link a Device"',
          '4. Scan this QR code',
          '5. Confirm the connection'
        ]
      });
    } else {
      // Check if client is already authenticated
      if (client.pupPage) {
        res.json({ 
          success: false, 
          message: 'QR code not available because session is already connected.',
          status: 'CONNECTED',
          note: 'Your WhatsApp is already linked. You can send messages now.'
        });
      } else {
        res.json({ 
          success: false, 
          message: 'QR code not available yet. Please wait a moment and try again.',
          status: 'WAITING_FOR_QR',
          note: 'The QR code is being generated. Try again in 5-10 seconds.',
          retryIn: '5-10 seconds',
          debug: {
            sessionExists: true,
            clientInitialized: !!client,
            pupPageExists: !!client.pupPage
          }
        });
      }
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// New endpoint: Wait for QR code with polling
app.get('/api/wait-qr/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const client = whatsappInstances.get(sessionId);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Wait up to 30 seconds for QR code
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const qrCode = qrCodes.get(sessionId);
      
      if (qrCode) {
        const qrImage = await qrcode.toDataURL(qrCode);
        return res.json({ 
          success: true, 
          qrCode: qrImage,
          note: 'QR code found!',
          attempts: attempts + 1
        });
      }
      
      // Check if already connected
      if (client.pupPage) {
        return res.json({ 
          success: false, 
          message: 'Already connected',
          status: 'CONNECTED'
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;
    }
    
    res.json({ 
      success: false, 
      message: 'QR code not generated after 30 seconds',
      note: 'Try restarting the session'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Send message
app.post('/api/send-message', async (req, res) => {
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

    const client = whatsappInstances.get(sessionId);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    const formattedPhone = phone.replace(/\D/g, '');
    const chatId = `${formattedPhone}@c.us`;
    const result = await client.sendMessage(chatId, message);
    
    // Prepare message data for Railway processing
    const messageData = {
      sessionId,
      phone: formattedPhone,
      message,
      messageId: result.id._serialized,
      timestamp: new Date().toISOString(),
      type: 'outgoing',
      source: 'whatsapp-api'
    };

    // Send to Railway framework for processing
    const railwayResult = await processMessageInRailway(messageData);
    
    res.json({ 
      success: true, 
      messageId: result.id._serialized,
      phone: formattedPhone,
      note: 'Message sent via WhatsApp',
      railwayProcessed: railwayResult.success,
      railwayResponse: railwayResult.response || railwayResult.error
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Check status
app.get('/api/status/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const client = whatsappInstances.get(sessionId);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    const state = client.pupPage ? 'CONNECTED' : 'DISCONNECTED';
    res.json({ 
      success: true, 
      status: state,
      sessionId,
      webhookUrl: webhookUrls.get(sessionId) || null,
      note: 'Session will persist after server restart'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Set webhook URL for a session
app.post('/api/webhook/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { webhookUrl } = req.body;

    if (!whatsappInstances.has(sessionId)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    webhookUrls.set(sessionId, webhookUrl);
    saveSessions();
    
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
app.get('/api/webhook/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const webhookUrl = webhookUrls.get(sessionId);
    
    res.json({ 
      success: true, 
      sessionId,
      webhookUrl: webhookUrl || null
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// List all sessions
app.get('/api/sessions', (req, res) => {
  const sessions = [];
  
  for (const [sessionId, client] of whatsappInstances) {
    sessions.push({
      sessionId,
      status: client.pupPage ? 'CONNECTED' : 'DISCONNECTED',
      webhookUrl: webhookUrls.get(sessionId) || null
    });
  }
  
  res.json({
    success: true,
    sessions,
    total: sessions.length,
    note: 'Sessions are automatically restored on server restart'
  });
});

// Get recent messages (last 50)
app.get('/api/messages/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const client = whatsappInstances.get(sessionId);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Get messages from local history (faster and more reliable)
    const localMessages = messageHistory.get(sessionId) || [];
    
    // Also try to get messages from WhatsApp (as backup)
    let whatsappMessages = [];
    try {
      const chats = await client.getChats();
      
      for (const chat of chats.slice(0, 5)) { // Get last 5 chats
        const chatMessages = await chat.fetchMessages({ limit: 10 });
                 whatsappMessages.push(...chatMessages.map(msg => ({
           id: msg.id?._serialized || msg.id || 'unknown',
           from: msg.from || 'unknown',
           to: msg.to || 'unknown',
           body: msg.body || '',
           type: msg.type || 'unknown',
           timestamp: msg.timestamp || Date.now() / 1000,
           notifyName: msg._data?.notifyName || 'unknown',
           fromMe: msg.fromMe || false,
           chat: chat.id?._serialized || chat.id || 'unknown',
           source: 'whatsapp'
         })));
      }
    } catch (error) {
      console.log('Could not fetch WhatsApp messages, using local history only');
    }

    // Combine and sort messages
    const allMessages = [...localMessages, ...whatsappMessages];
    allMessages.sort((a, b) => new Date(b.timestamp * 1000) - new Date(a.timestamp * 1000));

    res.json({ 
      success: true, 
      messages: allMessages.slice(0, 50), // Limit to 50 messages
      sessionId,
      totalLocalMessages: localMessages.length,
      totalWhatsAppMessages: whatsappMessages.length,
      note: 'Messages are stored locally and retrieved from WhatsApp'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Configure webhook for existing session
app.post('/api/configure-webhook', async (req, res) => {
  try {
    const { sessionId = 'mi-sesion', webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'webhookUrl is required'
      });
    }
    
    // Check if session exists
    const client = whatsappInstances.get(sessionId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Session not found. Please start the session first.'
      });
    }
    
    // Set webhook URL
    webhookUrls.set(sessionId, webhookUrl);
    saveSessions();
    
    console.log(`🔗 Webhook configured for session ${sessionId}: ${webhookUrl}`);
    
    res.json({
      success: true,
      message: 'Webhook configured successfully',
      sessionId,
      webhookUrl,
      note: 'All incoming messages will now be sent to this webhook URL'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get real-time message count and recent messages
app.get('/api/messages-count/:sessionId?', (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const messages = messageHistory.get(sessionId) || [];
    
    res.json({
      success: true,
      sessionId,
      totalMessages: messages.length,
      recentMessages: messages.slice(-10), // Last 10 messages
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
      note: 'Messages are stored in memory and will be lost on server restart'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Auto-restore existing sessions endpoint
app.post('/api/restore-sessions', async (req, res) => {
  try {
    const authDir = '.wwebjs_auth';
    const restoredSessions = [];
    
    if (!fs.existsSync(authDir)) {
      return res.json({
        success: true,
        message: 'No existing auth sessions found',
        restoredSessions: []
      });
    }
    
    const authSessions = fs.readdirSync(authDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name.replace('session-', ''));
    
    console.log(`🔄 Attempting to restore ${authSessions.length} sessions: ${authSessions.join(', ')}`);
    
    for (const sessionId of authSessions) {
      if (whatsappInstances.has(sessionId)) {
        console.log(`⏭️ Session ${sessionId} already active, skipping`);
        continue;
      }
      
      try {
        console.log(`🔄 Restoring session: ${sessionId}`);
        
        const client = new Client({
          authStrategy: new LocalAuth({ clientId: sessionId }),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding'
            ]
          }
        });
        
        // Set up event handlers
        client.on('qr', (qr) => {
          console.log(`📱 QR Code received for restored session ${sessionId}`);
          qrCodes.set(sessionId, qr);
        });
        
        client.on('ready', () => {
          console.log(`✅ Restored client ${sessionId} is ready!`);
          qrCodes.delete(sessionId);
          saveSessions();
        });
        
                 client.on('message', async (message) => {
           console.log('📨 New message received:', message);
           
           const webhookUrl = webhookUrls.get(sessionId);
           if (webhookUrl) {
             try {
               const axios = require('axios');
               await axios.post(webhookUrl, {
                 sessionId,
                 message: {
                   id: message.id?._serialized || message.id || 'unknown',
                   from: message.from || 'unknown',
                   to: message.to || 'unknown',
                   body: message.body || '',
                   type: message.type || 'unknown',
                   timestamp: message.timestamp || Date.now() / 1000,
                   notifyName: message._data?.notifyName || 'unknown',
                   fromMe: message.fromMe || false,
                   chat: message.chat?.id?._serialized || message.chat?.id || 'unknown'
                 }
               });
             } catch (error) {
               console.error('Error sending webhook:', error);
             }
           }
         });
        
        client.on('disconnected', (reason) => {
          console.log(`❌ Restored client ${sessionId} disconnected:`, reason);
          whatsappInstances.delete(sessionId);
          qrCodes.delete(sessionId);
        });
        
        client.on('auth_failure', (msg) => {
          console.log(`❌ Auth failure for restored session ${sessionId}:`, msg);
          qrCodes.delete(sessionId);
        });
        
        client.on('loading_screen', (percent, message) => {
          console.log(`⏳ Loading restored ${sessionId}: ${percent}% - ${message}`);
        });
        
        // Store and initialize
        whatsappInstances.set(sessionId, client);
        await client.initialize();
        
        restoredSessions.push({
          sessionId,
          status: 'RESTORED',
          ready: !!client.pupPage
        });
        
        console.log(`✅ Successfully restored session: ${sessionId}`);
        
      } catch (error) {
        console.error(`❌ Failed to restore session ${sessionId}:`, error.message);
        restoredSessions.push({
          sessionId,
          status: 'FAILED',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Restored ${restoredSessions.filter(s => s.status === 'RESTORED').length} sessions`,
      restoredSessions,
      totalSessions: whatsappInstances.size
    });
    
  } catch (error) {
    console.error('Error restoring sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Cleanup endpoint to remove sessions and clear auth data
app.delete('/api/cleanup/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'all';
    
    if (sessionId === 'all') {
      // Clean up all sessions
      console.log('🧹 Cleaning up all sessions...');
      
      for (const [id, client] of whatsappInstances) {
        try {
          console.log(`🔌 Closing session: ${id}`);
          await client.destroy();
        } catch (error) {
          console.error(`Error closing session ${id}:`, error.message);
        }
      }
      
      whatsappInstances.clear();
      qrCodes.clear();
      webhookUrls.clear();
      
      // Clear auth directory
      try {
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
      const client = whatsappInstances.get(sessionId);
      
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
      
      whatsappInstances.delete(sessionId);
      qrCodes.delete(sessionId);
      webhookUrls.delete(sessionId);
      
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

// Test endpoint to verify session creation
app.get('/api/test-session/:sessionId?', async (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const client = whatsappInstances.get(sessionId);
    
    res.json({
      success: true,
      sessionId,
      sessionExists: !!client,
      totalSessions: whatsappInstances.size,
      allSessions: Array.from(whatsappInstances.keys()),
      clientInfo: client ? {
        hasPupPage: !!client.pupPage,
        isReady: !!client.pupPage,
        hasQRCode: qrCodes.has(sessionId)
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Debug endpoint to check session status
app.get('/api/debug/sessions', (req, res) => {
  const sessions = [];
  
  for (const [sessionId, client] of whatsappInstances) {
    sessions.push({
      sessionId,
      clientExists: !!client,
      pupPageExists: !!client.pupPage,
      hasQRCode: qrCodes.has(sessionId),
      webhookUrl: webhookUrls.get(sessionId) || null
    });
  }
  
  res.json({
    success: true,
    totalSessions: whatsappInstances.size,
    sessions,
    qrCodes: Array.from(qrCodes.keys()),
    webhookUrls: Array.from(webhookUrls.keys())
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    sessions: whatsappInstances.size,
    features: {
      persistence: true,
      gracefulShutdown: true
    }
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 WhatsApp API running on port ${PORT}`);
  console.log(`📱 Endpoints available:`);
  console.log(`   - POST /api/start`);
  console.log(`   - GET /api/qrcode/:sessionId`);
  console.log(`   - GET /api/wait-qr/:sessionId`);
  console.log(`   - POST /api/send-message`);
  console.log(`   - GET /api/status/:sessionId`);
  console.log(`   - POST /api/webhook/:sessionId`);
  console.log(`   - GET /api/webhook/:sessionId`);
  console.log(`   - GET /api/messages/:sessionId`);
  console.log(`   - GET /api/sessions`);
  console.log(`   - GET /api/debug/sessions`);
  console.log(`   - GET /api/test-session/:sessionId`);
  console.log(`   - DELETE /api/cleanup/:sessionId`);
  console.log(`   - POST /api/restore-sessions`);
  console.log(`   - GET /api/messages-count/:sessionId`);
  console.log(`   - POST /api/configure-webhook`);
  console.log(`\n✅ WhatsApp API ready with session persistence!`);
  console.log(`💾 Sessions will be saved to: ${SESSIONS_FILE}`);
  
  // Auto-restore sessions after server starts
  console.log(`\n🔄 Starting automatic session restoration...`);
  await autoRestoreSessions();
  console.log(`🎉 Server startup complete!`);
});
