const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 3000,
  WEBHOOK_PORT: process.env.WEBHOOK_PORT || 3001,
  
  // Railway Webhook Configuration
  RAILWAY_WEBHOOK_URL: process.env.RAILWAY_WEBHOOK_URL || 'http://localhost:3005/webhook',
  RAILWAY_API_KEY: process.env.RAILWAY_API_KEY || '',
  
  // File paths
  SESSIONS_FILE: './sessions.json',
  
  // Puppeteer Configuration
  PUPPETEER_ARGS: [
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
    '--disable-renderer-backgrounding',
    '--disable-extensions',
    '--disable-plugins',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-hang-monitor',
    '--disable-prompt-on-repost',
    '--disable-domain-reliability',
    '--disable-ipc-flooding-protection',
    '--single-process'
  ]
};
