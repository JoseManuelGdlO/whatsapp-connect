const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('../config');

class SessionManager {
  constructor() {
    this.whatsappInstances = new Map();
    this.webhookUrls = new Map();
    this.qrCodes = new Map();
    this.messageHistory = new Map();
  }

  // Load saved sessions from file
  loadSessions() {
    try {
      if (fs.existsSync(config.SESSIONS_FILE)) {
        const fileContent = fs.readFileSync(config.SESSIONS_FILE, 'utf8');
        
        if (!fileContent || fileContent.trim() === '') {
          console.log('📂 Sessions file is empty, starting fresh');
          return;
        }
        
        const data = JSON.parse(fileContent);
        
        // Load webhook URLs (backward compatibility)
        this.webhookUrls.clear();
        if (data.webhookUrls) {
          Object.entries(data.webhookUrls).forEach(([sessionId, webhookUrl]) => {
            this.webhookUrls.set(sessionId, webhookUrl);
          });
        }
        
        // Load session metadata (new format)
        if (data.sessions) {
          console.log(`📂 Loaded ${Object.keys(data.sessions).length} session configurations from file`);
          Object.entries(data.sessions).forEach(([sessionId, sessionData]) => {
            if (sessionData.webhookUrl) {
              this.webhookUrls.set(sessionId, sessionData.webhookUrl);
            }
            console.log(`   - ${sessionId}: ${sessionData.status} (webhook: ${sessionData.webhookUrl ? 'yes' : 'no'})`);
          });
        } else {
          console.log(`📂 Loaded ${this.webhookUrls.size} webhook URLs from file`);
        }
      } else {
        console.log('📂 No sessions file found, starting fresh');
      }
      
      this.checkExistingAuthSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  // Check for existing WhatsApp auth sessions
  checkExistingAuthSessions() {
    const authDir = '.wwebjs_auth';
    if (fs.existsSync(authDir)) {
      try {
        const authSessions = fs.readdirSync(authDir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name.replace('session-', ''));
        
        if (authSessions.length > 0) {
          console.log(`🔍 Found ${authSessions.length} existing WhatsApp auth sessions: ${authSessions.join(', ')}`);
          console.log('💡 These sessions will be automatically restored when you start them');
          
          authSessions.forEach(sessionId => {
            const webhookUrl = this.webhookUrls.get(sessionId);
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
  }

  // Save sessions to file
  saveSessions() {
    try {
      const sessionsData = {
        webhookUrls: Object.fromEntries(this.webhookUrls),
        sessions: {}
      };

      // Add session metadata
      this.webhookUrls.forEach((webhookUrl, sessionId) => {
        const client = this.whatsappInstances.get(sessionId);
        sessionsData.sessions[sessionId] = {
          status: client ? 'active' : 'inactive',
          webhookUrl: webhookUrl,
          lastUpdated: new Date().toISOString()
        };
      });

      fs.writeFileSync(config.SESSIONS_FILE, JSON.stringify(sessionsData, null, 2));
      console.log('💾 Sessions saved to file');
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  // Create new WhatsApp client
  createClient(sessionId) {
    return new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        headless: true,
        args: config.PUPPETEER_ARGS
      }
    });
  }

  // Setup client event handlers
  setupClientEvents(client, sessionId) {
    client.on('qr', (qr) => {
      console.log(`📱 QR Code received for session ${sessionId}`);
      this.qrCodes.set(sessionId, qr);
    });

    // Add event for when QR code is cleared (scanned)
    client.on('authenticated', () => {
      console.log(`🔐 Client ${sessionId} authenticated!`);
      this.qrCodes.delete(sessionId);
    });

    client.on('ready', () => {
      console.log(`✅ Client ${sessionId} is ready!`);
      console.log(`📱 Client info:`, client.info);
      this.qrCodes.delete(sessionId);
      this.saveSessions();
    });

    client.on('message', async (message) => {
      console.log('📨 New message received:', message);
      
      // Store message in history
      if (!this.messageHistory.has(sessionId)) {
        this.messageHistory.set(sessionId, []);
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
      
      this.messageHistory.get(sessionId).push(messageData);
      
      // Keep only last 100 messages per session
      if (this.messageHistory.get(sessionId).length > 100) {
        this.messageHistory.get(sessionId).shift();
      }
      
      console.log(`💾 Message stored for session ${sessionId}. Total messages: ${this.messageHistory.get(sessionId).length}`);
      
      // Send to webhook if configured
      const webhookUrl = this.webhookUrls.get(sessionId);
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

    client.on('disconnected', (reason) => {
      console.log(`❌ Client ${sessionId} disconnected:`, reason);
      this.cleanupSession(sessionId);
    });

    client.on('auth_failure', (msg) => {
      console.log(`❌ Auth failure for session ${sessionId}:`, msg);
      this.cleanupSession(sessionId);
    });

    client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading ${sessionId}: ${percent}% - ${message}`);
    });
  }

  // Check if client is ready
  async isClientReady(sessionId) {
    const client = this.whatsappInstances.get(sessionId);
    if (!client) return false;
    
    // Check if client has info and wid
    if (!client.info || !client.info.wid) {
      return false;
    }
    
    // Additional checks: verify the client is actually functional
    try {
      // Check 1: Get client state
      const state = await client.getState();
      if (state !== 'CONNECTED') {
        console.log(`Client ${sessionId} state is ${state}, not CONNECTED`);
        return false;
      }
      
      // Check 2: Try to get a simple property to verify internal objects exist
      if (!client.pupPage || client.pupPage.isClosed()) {
        console.log(`Client ${sessionId} page is closed or doesn't exist`);
        return false;
      }
      
      // Check 3: Verify the internal WhatsApp object exists
      try {
        await client.pupPage.evaluate(() => {
          // This will fail if the WhatsApp object is not properly initialized
          return window.Store && window.Store.Msg;
        });
      } catch (error) {
        console.log(`Client ${sessionId} WhatsApp objects not ready:`, error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log(`Client ${sessionId} not ready:`, error.message);
      return false;
    }
  }

  // Get session info
  async getSessionInfo(sessionId) {
    const client = this.whatsappInstances.get(sessionId);
    const webhookUrl = this.webhookUrls.get(sessionId);
    const qrCode = this.qrCodes.get(sessionId);
    const messages = this.messageHistory.get(sessionId) || [];
    const isReady = await this.isClientReady(sessionId);

    return {
      sessionId,
      status: isReady ? 'CONNECTED' : (client ? 'CONNECTING' : 'DISCONNECTED'),
      isReady,
      webhookUrl,
      qrCode,
      messageCount: messages.length,
      lastMessage: messages.length > 0 ? messages[messages.length - 1] : null
    };
  }

  // Get all sessions
  async getAllSessions() {
    const sessions = [];
    for (const [sessionId, client] of this.whatsappInstances) {
      const sessionInfo = await this.getSessionInfo(sessionId);
      sessions.push(sessionInfo);
    }
    return sessions;
  }

  // Get messages for a session
  getMessages(sessionId) {
    return this.messageHistory.get(sessionId) || [];
  }

  // Set webhook URL for a session
  setWebhookUrl(sessionId, webhookUrl) {
    this.webhookUrls.set(sessionId, webhookUrl);
    this.saveSessions();
  }

  // Get webhook URL for a session
  getWebhookUrl(sessionId) {
    return this.webhookUrls.get(sessionId);
  }

  // Cleanup session data
  cleanupSession(sessionId) {
    try {
      const client = this.whatsappInstances.get(sessionId);
      if (client) {
        // Don't destroy here as it might already be destroyed
        this.whatsappInstances.delete(sessionId);
      }
      this.qrCodes.delete(sessionId);
      console.log(`🧹 Cleaned up session data for: ${sessionId}`);
    } catch (error) {
      console.error(`Error cleaning up session ${sessionId}:`, error.message);
    }
  }

  // Force check client state (for debugging)
  async forceCheckClientState(sessionId) {
    const client = this.whatsappInstances.get(sessionId);
    if (!client) {
      return { exists: false, ready: false, error: 'Client not found' };
    }

    try {
      const state = {
        exists: true,
        hasInfo: !!client.info,
        hasWid: !!(client.info && client.info.wid),
        hasPupPage: !!client.pupPage,
        pupPageClosed: client.pupPage ? client.pupPage.isClosed() : 'N/A',
        ready: this.isClientReady(sessionId)
      };
      
      console.log(`🔍 Client state for ${sessionId}:`, state);
      return state;
    } catch (error) {
      return { exists: true, ready: false, error: error.message };
    }
  }
}

module.exports = new SessionManager();
