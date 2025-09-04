import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import outputs from '@/amplify_outputs.json';

export async function GET(request: NextRequest) {
  try {
    // Test Amplify configuration
    const config = Amplify.getConfig();
    console.log('Amplify config check:', {
      hasAuth: !!config.Auth,
      hasUserPool: !!config.Auth?.Cognito?.userPoolId,
      region: config.Auth?.Cognito?.userPoolId?.split('_')[0] || 'unknown'
    });

    // Test server context
    const result = await runWithAmplifyServerContext({
      nextServerContext: { request },
      operation: async (contextSpec) => {
        try {
          const session = await fetchAuthSession(contextSpec);
          
          // Test Rekognition access
          let rekognitionTest = null;
          if (session.credentials) {
            try {
              const { RekognitionClient, ListCollectionsCommand } = await import('@aws-sdk/client-rekognition');
              const rekognitionClient = new RekognitionClient({
                region: outputs.auth.aws_region,
                credentials: {
                  accessKeyId: session.credentials.accessKeyId,
                  secretAccessKey: session.credentials.secretAccessKey,
                  sessionToken: session.credentials.sessionToken,
                }
              });
              
              const listCommand = new ListCollectionsCommand({});
              await rekognitionClient.send(listCommand);
              rekognitionTest = { success: true, message: 'Rekognition access working' };
            } catch (rekError) {
              rekognitionTest = { 
                success: false, 
                error: rekError instanceof Error ? rekError.message : 'Unknown Rekognition error' 
              };
            }
          }
          
          return {
            hasCredentials: !!session.credentials,
            credentialsType: session.credentials ? 'available' : 'none',
            region: outputs.auth.aws_region,
            identityId: session.identityId,
            rekognitionTest
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            hasCredentials: false
          };
        }
      }
    });

    return NextResponse.json({
      success: true,
      amplifyConfigured: true,
      config: {
        region: outputs.auth.aws_region,
        userPoolId: outputs.auth.user_pool_id,
        identityPoolId: outputs.auth.identity_pool_id,
        unauthenticatedEnabled: outputs.auth.unauthenticated_identities_enabled
      },
      sessionTest: result
    });

  } catch (error) {
    console.error('Amplify test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      amplifyConfigured: false
    }, { status: 500 });
  }
}