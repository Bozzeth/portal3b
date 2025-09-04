#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Amplify Gen 2 deployment status...\n');

// Check if amplify_outputs.json exists
const outputsPath = path.join(process.cwd(), 'amplify_outputs.json');
if (!fs.existsSync(outputsPath)) {
  console.log('❌ amplify_outputs.json not found');
  console.log('   Run: npx ampx sandbox');
  process.exit(1);
}

// Read and validate outputs
try {
  const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  
  console.log('✅ amplify_outputs.json found');
  console.log(`   Region: ${outputs.auth?.aws_region || 'Not set'}`);
  console.log(`   User Pool: ${outputs.auth?.user_pool_id || 'Not set'}`);
  console.log(`   Identity Pool: ${outputs.auth?.identity_pool_id || 'Not set'}`);
  console.log(`   Unauthenticated Access: ${outputs.auth?.unauthenticated_identities_enabled ? '✅' : '❌'}`);
  
  if (outputs.storage) {
    console.log(`   Storage Bucket: ${outputs.storage?.bucket_name || 'Not set'}`);
  }
  
  if (outputs.data) {
    console.log(`   GraphQL API: ${outputs.data?.url ? '✅' : '❌'}`);
  }
  
  console.log('\n🚀 Backend appears to be deployed!');
  console.log('   If you\'re still getting credential errors, try:');
  console.log('   1. npx ampx sandbox --once');
  console.log('   2. Restart your dev server');
  
} catch (error) {
  console.log('❌ Error reading amplify_outputs.json:', error.message);
  console.log('   Run: npx ampx sandbox');
  process.exit(1);
}