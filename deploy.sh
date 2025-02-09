#!/bin/bash

# Build the application
npm run build

# Create a tarball of the dist directory
tar -czf dist.tar.gz dist/

# Deploy to your server (replace with your server details)
scp dist.tar.gz user@your-server:/path/to/app/

# SSH into server and update the application
ssh user@your-server << 'ENDSSH'
cd /path/to/app
pm2 stop journal-app
tar -xzf dist.tar.gz
npm install --production
pm2 start dist/index.js --name "journal-app"
rm dist.tar.gz
ENDSSH

# Clean up local tarball
rm dist.tar.gz 