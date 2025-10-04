const fs = require('fs');
const sessionManager = require('./sessionManager');

class AutoRestoreService {
  async restoreSessions() {
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
        const webhookUrl = sessionManager.getWebhookUrl(sessionId);
        if (webhookUrl) {
          console.log(`   - ${sessionId}: webhook configured (${webhookUrl})`);
        } else {
          console.log(`   - ${sessionId}: no webhook configured`);
        }
      });
      
      for (const sessionId of authSessions) {
        try {
          console.log(`🔄 Auto-restoring session: ${sessionId}`);
          
          const client = sessionManager.createClient(sessionId);
          sessionManager.setupClientEvents(client, sessionId);
          
          // Store client first
          sessionManager.whatsappInstances.set(sessionId, client);
          
          // Initialize with timeout
          const initPromise = client.initialize();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Initialization timeout')), 30000)
          );
          
          await Promise.race([initPromise, timeoutPromise]);
          
          console.log(`✅ Successfully auto-restored session: ${sessionId}`);
          
        } catch (error) {
          console.error(`❌ Failed to auto-restore session ${sessionId}:`, error.message);
          
          // Clean up failed session
          const client = sessionManager.whatsappInstances.get(sessionId);
          if (client) {
            try {
              await client.destroy();
            } catch (destroyError) {
              console.error(`Error destroying failed client ${sessionId}:`, destroyError.message);
            }
            sessionManager.whatsappInstances.delete(sessionId);
          }
        }
      }
      
      console.log(`🎉 Auto-restore complete! Total active sessions: ${sessionManager.whatsappInstances.size}`);
      
    } catch (error) {
      console.error('Error during auto-restore:', error);
    }
  }
}

module.exports = new AutoRestoreService();
