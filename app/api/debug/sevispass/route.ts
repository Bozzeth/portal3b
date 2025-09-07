import { NextRequest, NextResponse } from 'next/server';
import { publicServerClient } from '@/lib/utils/amplifyServerUtils';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching all SevisPass applications for debugging...');
    
    // Get all applications using public server client
    const { data: applications } = await publicServerClient.models.SevisPassApplication.list();
    
    console.log('Found applications:', applications?.length || 0);
    
    // Get all holders using public server client  
    const { data: holders } = await publicServerClient.models.SevisPassHolder.list();
    
    console.log('Found holders:', holders?.length || 0);
    
    return NextResponse.json({
      success: true,
      debug: {
        applicationCount: applications?.length || 0,
        holderCount: holders?.length || 0,
        applications: applications?.map(app => ({
          userId: app.userId,
          applicationId: app.applicationId,
          status: app.status,
          submittedAt: app.submittedAt,
          uin: app.uin,
          fullName: app.fullName
        })),
        holders: holders?.map(holder => ({
          userId: holder.userId,
          uin: holder.uin,
          fullName: holder.fullName,
          issuedAt: holder.issuedAt
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: { applicationCount: 0, holderCount: 0 }
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('Deleting all SevisPass data...');
    
    // Delete all applications
    const { data: applications } = await publicServerClient.models.SevisPassApplication.list();
    if (applications) {
      for (const app of applications) {
        await publicServerClient.models.SevisPassApplication.delete({ userId: app.userId });
      }
    }
    
    // Delete all holders
    const { data: holders } = await publicServerClient.models.SevisPassHolder.list();
    if (holders) {
      for (const holder of holders) {
        await publicServerClient.models.SevisPassHolder.delete({ uin: holder.uin });
      }
    }
    
    console.log(`Deleted ${applications?.length || 0} applications and ${holders?.length || 0} holders`);
    
    return NextResponse.json({
      success: true,
      message: 'All SevisPass data deleted',
      deleted: {
        applications: applications?.length || 0,
        holders: holders?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Delete API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete data'
    }, { status: 500 });
  }
}