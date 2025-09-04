import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export async function GET(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // Get fresh session
        const session = await fetchAuthSession(contextSpec, { forceRefresh: true });
        
        if (session.credentials) {
          try {
            // Get the actual IAM role being used
            const stsClient = new STSClient({
              region: 'ap-southeast-2',
              credentials: {
                accessKeyId: session.credentials.accessKeyId,
                secretAccessKey: session.credentials.secretAccessKey,
                sessionToken: session.credentials.sessionToken,
              }
            });
            
            const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
            
            return {
              success: true,
              identityId: session.identityId,
              roleArn: callerIdentity.Arn,
              userId: callerIdentity.UserId,
              account: callerIdentity.Account,
              credentialsType: session.identityId?.includes('unauthenticated') ? 'unauthenticated' : 'authenticated'
            };
          } catch (stsError) {
            return {
              success: false,
              error: stsError instanceof Error ? stsError.message : 'STS error',
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
    console.error('Debug IAM error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}