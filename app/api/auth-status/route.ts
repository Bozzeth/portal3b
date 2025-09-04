import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth/server';

export async function GET(_request: NextRequest) {
  try {
    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        // Check user authentication
        let userResult;
        try {
          const currentUser = await getCurrentUser(contextSpec);
          userResult = {
            authenticated: true,
            userId: currentUser.userId,
            username: currentUser.username
          };
        } catch (authError) {
          userResult = {
            authenticated: false,
            error: authError instanceof Error ? authError.message : 'Unknown auth error'
          };
        }

        // Check session and credentials
        const session = await fetchAuthSession(contextSpec, { forceRefresh: true });
        
        return {
          user: userResult,
          session: {
            hasCredentials: !!session.credentials,
            identityId: session.identityId,
            // Check if identity ID indicates authenticated or unauthenticated
            identityType: session.identityId?.includes(':') ? 
              (session.identityId.split(':')[1].length > 20 ? 'authenticated' : 'unauthenticated') : 'unknown',
            tokens: {
              hasAccessToken: !!session.tokens?.accessToken,
              hasIdToken: !!session.tokens?.idToken,
              hasRefreshToken: !!(session.tokens as any)?.refreshToken
            }
          }
        };
      }
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}