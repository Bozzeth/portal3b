import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { fetchAuthSession } from 'aws-amplify/auth/server';

export async function GET(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // Force a fresh session
        const session = await fetchAuthSession(contextSpec, { forceRefresh: true });
        
        if (session.credentials) {
          try {
            const { RekognitionClient, ListCollectionsCommand } = await import('@aws-sdk/client-rekognition');
            const rekognitionClient = new RekognitionClient({
              region: 'ap-southeast-2',
              credentials: {
                accessKeyId: session.credentials.accessKeyId,
                secretAccessKey: session.credentials.secretAccessKey,
                sessionToken: session.credentials.sessionToken,
              }
            });
            
            const listCommand = new ListCollectionsCommand({});
            const response = await rekognitionClient.send(listCommand);
            
            return {
              success: true,
              message: 'Rekognition access successful with refreshed credentials',
              collections: response.CollectionIds,
              identityId: session.identityId
            };
          } catch (rekError) {
            return {
              success: false,
              error: rekError instanceof Error ? rekError.message : 'Unknown error',
              identityId: session.identityId
            };
          }
        } else {
          return {
            success: false,
            error: 'No credentials available'
          };
        }
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Refresh test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}