#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting automatic deployment to Cloudflare...');

try {
  // Install dependencies
  console.log('1. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install the latest version of wrangler
  console.log('2. Installing the latest version of wrangler...');
  execSync('npm install wrangler@latest --save-dev', { stdio: 'inherit' });
  
  // Deploy to Cloudflare
  console.log('3. Deploying to Cloudflare...');
  execSync('npx wrangler deploy', { stdio: 'inherit' });
  
  console.log('✅ Deployment completed successfully!');
} catch (error) {
  console.error('❌ An error occurred during deployment:', error.message);
  process.exit(1);
}
