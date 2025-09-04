import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { fetchAuthSession } from 'aws-amplify/auth/server';

export async function GET(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // Test authentication
        let authResult;
        try {
          const currentUser = await getCurrentUser(contextSpec);
          authResult = {
            authenticated: true,
            userId: currentUser.userId,
            username: currentUser.username
          };
        } catch (authError) {
          authResult = {
            authenticated: false,
            error: authError instanceof Error ? authError.message : 'Unknown auth error'
          };
        }

        // Test credentials
        let credentialsResult: any;
        try {
          const session = await fetchAuthSession(contextSpec);
          credentialsResult = {
            hasCredentials: !!session.credentials,
            identityId: session.identityId,
            credentialsType: authResult.authenticated ? 'authenticated' : 'unauthenticated'
          };

          // Test Rekognition access if we have credentials
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
              await rekognitionClient.send(listCommand);
              credentialsResult.rekognitionAccess = 'success';
            } catch (rekError) {
              credentialsResult.rekognitionAccess = 'failed';
              credentialsResult.rekognitionError = rekError instanceof Error ? rekError.message : 'Unknown error';
            }
          }
        } catch (credError) {
          credentialsResult = {
            hasCredentials: false,
            error: credError instanceof Error ? credError.message : 'Unknown credentials error'
          };
        }

        return {
          auth: authResult,
          credentials: credentialsResult
        };
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}