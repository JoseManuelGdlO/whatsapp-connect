#!/bin/bash

echo "🚀 Deploying WhatsApp API to DigitalOcean..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js
echo "📱 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "⚡ Installing PM2..."
sudo npm install -g pm2

# Install project dependencies
echo "📚 Installing project dependencies..."
npm install

# Create logs directory
mkdir -p logs tokens

# Start the application with PM2
echo "🚀 Starting WhatsApp API..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

echo "✅ Deployment completed!"
echo "📱 Your WhatsApp API is running on port 3000"
echo "🔗 Access your API at: http://YOUR_SERVER_IP:3000"
echo ""
echo "📋 Useful commands:"
echo "  - pm2 status          # Check status"
echo "  - pm2 logs            # View logs"
echo "  - pm2 restart all     # Restart app"
echo "  - pm2 stop all        # Stop app"
