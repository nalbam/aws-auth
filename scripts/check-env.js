#!/usr/bin/env node

/**
 * Validates that all required Auth0 environment variables are set
 * Run this before starting your development server
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'APP_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_DOMAIN',
  'AUTH0_SECRET'
];

const envLocalPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Checking Auth0 environment configuration...\n');

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local file not found!');
  console.log('\n📝 To fix this:');
  console.log('   1. Copy .env.example to .env.local');
  console.log('   2. Fill in your Auth0 credentials');
  console.log('\n   $ cp .env.example .env.local');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = {};

// Parse environment variables
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Check each required variable
let allValid = true;
const issues = [];

REQUIRED_VARS.forEach(varName => {
  const value = envVars[varName];
  
  if (!value) {
    allValid = false;
    issues.push(`❌ ${varName} is not set`);
  } else if (value.includes('your_') || value.includes('test_')) {
    allValid = false;
    issues.push(`⚠️  ${varName} appears to be a placeholder value`);
  } else {
    console.log(`✅ ${varName} is set`);
  }
});

if (!allValid) {
  console.log('\n⚠️  Issues found:\n');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n📚 For help setting up Auth0:');
  console.log('   https://auth0.com/docs/quickstart/webapp/nextjs\n');
  process.exit(1);
}

// Validate AUTH0_SECRET length
const secret = envVars['AUTH0_SECRET'];
if (secret && secret.length < 32) {
  console.log('\n⚠️  AUTH0_SECRET should be at least 32 characters');
  console.log('   Generate a secure secret with:');
  console.log('   $ openssl rand -hex 32\n');
  process.exit(1);
}

console.log('\n✅ All Auth0 environment variables are configured!');
console.log('🚀 You can now run: npm run dev\n');
