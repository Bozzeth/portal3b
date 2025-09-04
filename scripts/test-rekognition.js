#!/usr/bin/env node

const { RekognitionClient, ListCollectionsCommand } = require('@aws-sdk/client-rekognition');
const { Amplify } = require('aws-amplify');
const { fetchAuthSession } = require('aws-amplify/auth');
const outputs = require('../amplify_outputs.json');

async function testRekognitionAccess() {
  console.log('🧪 Testing Rekognition access...\n');
  
  try {
    // Configure Amplify
    Amplify.configure(outputs);
    
    // Get unauthenticated credentials
    const session = await fetchAuthSession();
    
    if (!session.credentials) {
      console.log('❌ No credentials available');
      console.log('   Make sure unauthenticated access is enabled');
      return;
    }
    
    console.log('✅ Got credentials:', {
      hasAccessKey: !!session.credentials.accessKeyId,
      hasSecretKey: !!session.credentials.secretAccessKey,
      hasSessionToken: !!session.credentials.sessionToken,
      identityId: session.identityId
    });
    
    // Test Rekognition access
    const rekognitionClient = new RekognitionClient({
      region: outputs.auth.aws_region,
      credentials: {
        accessKeyId: session.credentials.accessKeyId,
        secretAccessKey: session.credentials.secretAccessKey,
        sessionToken: session.credentials.sessionToken,
      }
    });
    
    const listCommand = new ListCollectionsCommand({});
    const result = await rekognitionClient.send(listCommand);
    
    console.log('✅ Rekognition access working!');
    console.log('   Collections:', result.CollectionIds?.length || 0);
    
  } catch (error) {
    console.log('❌ Rekognition access failed:', error.message);
    
    if (error.name === 'AccessDeniedException') {
      console.log('\n🔧 Fix: The IAM permissions need to be applied');
      console.log('   1. Run: npx ampx sandbox --once');
      console.log('   2. Wait for deployment to complete');
      console.log('   3. Restart your dev server');
      console.log('   4. Test again');
    }
  }
}

testRekognitionAccess().catch(console.error);