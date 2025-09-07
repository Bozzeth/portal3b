// Fix approved SevisPass applications that don't have SevisPassHolder records
const { generateServerClientUsingCookies } = require('@aws-amplify/adapter-nextjs/data');
const amplifyConfig = require('../amplify_outputs.json');

async function fixApprovedApplications() {
  try {
    console.log('🔍 Looking for approved applications without SevisPassHolder records...');
    
    // Create client using API key (since this is a server script)
    const { generateClient } = require('aws-amplify/api');
    const { Amplify } = require('aws-amplify');
    
    Amplify.configure(amplifyConfig);
    const client = generateClient();
    
    // Get all approved applications
    console.log('📋 Fetching approved applications...');
    const applicationsResponse = await fetch(`${amplifyConfig.custom.API.REST.default.endpoint}/models/SevisPassApplication`, {
      headers: {
        'Authorization': `Bearer ${amplifyConfig.aws_appsync_apiKey}`
      }
    });
    
    if (!applicationsResponse.ok) {
      console.error('❌ Failed to fetch applications:', applicationsResponse.status);
      return;
    }
    
    const applications = await applicationsResponse.json();
    const approvedApps = applications.filter(app => app.status === 'approved');
    
    console.log(`✅ Found ${approvedApps.length} approved applications`);
    
    for (const app of approvedApps) {
      console.log(`\n🔍 Checking application ${app.applicationId} for user ${app.userId}`);
      
      // Check if SevisPassHolder already exists
      const holdersResponse = await fetch(`${amplifyConfig.custom.API.REST.default.endpoint}/models/SevisPassHolder?userId=${app.userId}`, {
        headers: {
          'Authorization': `Bearer ${amplifyConfig.aws_appsync_apiKey}`
        }
      });
      
      if (holdersResponse.ok) {
        const holders = await holdersResponse.json();
        if (holders.length > 0) {
          console.log(`✅ SevisPassHolder already exists for user ${app.userId}`);
          continue;
        }
      }
      
      console.log(`🆕 Creating SevisPassHolder for user ${app.userId}`);
      
      const holderRecord = {
        uin: app.uin,
        userId: app.userId,
        fullName: app.fullName || '',
        dateOfBirth: app.dateOfBirth || '',
        documentNumber: app.documentNumber || '',
        nationality: app.nationality || 'Papua New Guinea',
        issuedAt: app.issuedAt,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        faceId: app.faceId,
        documentImageKey: app.documentImageKey,
        photoImageKey: app.selfieImageKey,
      };
      
      console.log('📝 Holder record:', JSON.stringify(holderRecord, null, 2));
      
      // Create the holder record
      const createResponse = await fetch(`${amplifyConfig.custom.API.REST.default.endpoint}/models/SevisPassHolder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${amplifyConfig.aws_appsync_apiKey}`
        },
        body: JSON.stringify(holderRecord)
      });
      
      if (createResponse.ok) {
        console.log(`✅ Created SevisPassHolder record for UIN: ${app.uin}`);
      } else {
        console.error(`❌ Failed to create SevisPassHolder:`, createResponse.status, await createResponse.text());
      }
    }
    
    console.log('\n🎉 Finished processing approved applications');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixApprovedApplications();