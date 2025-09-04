import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { cookiesClient } from '@/lib/utils/amplifyServerUtils';

export async function POST(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const client = cookiesClient;
        
        // Get all SevisPass applications
        const applications = await client.models.SevisPassApplication.list();
        console.log(`Found ${applications.data.length} applications to delete`);
        
        // Get all SevisPass holders
        const holders = await client.models.SevisPassHolder.list();
        console.log(`Found ${holders.data.length} holders to delete`);
        
        const deletedApplications = [];
        const deletedHolders = [];
        
        // Delete all applications
        for (const app of applications.data) {
          try {
            await client.models.SevisPassApplication.delete({ userId: app.userId });
            deletedApplications.push(app.userId);
            console.log(`Deleted application for user: ${app.userId}`);
          } catch (error) {
            console.error(`Failed to delete application ${app.userId}:`, error);
          }
        }
        
        // Delete all holders
        for (const holder of holders.data) {
          try {
            await client.models.SevisPassHolder.delete({ uin: holder.uin });
            deletedHolders.push(holder.uin);
            console.log(`Deleted holder with UIN: ${holder.uin}`);
          } catch (error) {
            console.error(`Failed to delete holder ${holder.uin}:`, error);
          }
        }
        
        return {
          deletedApplications,
          deletedHolders,
          totalDeleted: deletedApplications.length + deletedHolders.length
        };
      }
    });

    return NextResponse.json({
      success: true,
      message: "SevisPass entries cleanup completed",
      ...result
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const client = cookiesClient;
        
        // Get all SevisPass applications
        const applications = await client.models.SevisPassApplication.list();
        
        // Get all SevisPass holders
        const holders = await client.models.SevisPassHolder.list();
        
        return {
          applications: applications.data.map(app => ({
            userId: app.userId,
            applicationId: app.applicationId,
            status: app.status,
            fullName: app.fullName,
            submittedAt: app.submittedAt
          })),
          holders: holders.data.map(holder => ({
            uin: holder.uin,
            fullName: holder.fullName,
            status: holder.status,
            issuedAt: holder.issuedAt
          })),
          counts: {
            applications: applications.data.length,
            holders: holders.data.length,
            total: applications.data.length + holders.data.length
          }
        };
      }
    });

    return NextResponse.json({
      success: true,
      message: "Current SevisPass entries",
      ...result
    });

  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}