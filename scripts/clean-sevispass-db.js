// Direct DynamoDB cleanup script
const { publicServerClient } = require('../lib/utils/amplifyServerUtils');

async function cleanSevisPassDB() {
  try {
    console.log('🗑️  Starting direct SevisPass database cleanup...');
    
    // Delete all applications
    console.log('📋 Fetching all applications...');
    const { data: applications } = await publicServerClient.models.SevisPassApplication.list();
    
    if (applications && applications.length > 0) {
      console.log(`Found ${applications.length} applications to delete`);
      for (const app of applications) {
        try {
          await publicServerClient.models.SevisPassApplication.delete({ id: app.id });
          console.log(`✅ Deleted application: ${app.applicationId}`);
        } catch (error) {
          console.log(`❌ Failed to delete application ${app.applicationId}:`, error.message);
        }
      }
    } else {
      console.log('No applications found');
    }
    
    // Delete all holders
    console.log('👤 Fetching all holders...');
    const { data: holders } = await publicServerClient.models.SevisPassHolder.list();
    
    if (holders && holders.length > 0) {
      console.log(`Found ${holders.length} holders to delete`);
      for (const holder of holders) {
        try {
          await publicServerClient.models.SevisPassHolder.delete({ id: holder.id });
          console.log(`✅ Deleted holder: ${holder.uin} (${holder.fullName})`);
        } catch (error) {
          console.log(`❌ Failed to delete holder ${holder.uin}:`, error.message);
        }
      }
    } else {
      console.log('No holders found');
    }
    
    // Verify cleanup
    console.log('🔍 Verifying cleanup...');
    const { data: remainingApps } = await publicServerClient.models.SevisPassApplication.list();
    const { data: remainingHolders } = await publicServerClient.models.SevisPassHolder.list();
    
    console.log(`📊 Cleanup complete:`);
    console.log(`   Applications remaining: ${remainingApps?.length || 0}`);
    console.log(`   Holders remaining: ${remainingHolders?.length || 0}`);
    
    if ((remainingApps?.length || 0) === 0 && (remainingHolders?.length || 0) === 0) {
      console.log('✅ Database successfully cleaned!');
    } else {
      console.log('⚠️  Some records may still remain');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanSevisPassDB();