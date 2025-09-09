import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginToken } from '../login/route';
import { publicServerClient } from '@/lib/utils/amplifyServerUtils';

export async function POST(req: NextRequest) {
  try {
    const { loginToken } = await req.json();
    
    if (!loginToken) {
      return NextResponse.json({ error: 'Login token is required' }, { status: 400 });
    }

    // Verify the login token
    const tokenData = verifyLoginToken(loginToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired login token' }, { status: 401 });
    }

    console.log('🔐 Completing Cognito authentication for user:', tokenData.userId);

    // Get the SevisPass holder data
    const holderResult = await publicServerClient.models.SevisPassHolder.list({
      filter: { userId: { eq: tokenData.userId } }
    });

    if (!holderResult.data || holderResult.data.length === 0) {
      return NextResponse.json({ error: 'SevisPass holder not found' }, { status: 404 });
    }

    const holder = holderResult.data[0];

    // Return user data for Cognito sign-in
    return NextResponse.json({
      success: true,
      userData: {
        userId: holder.userId,
        email: `${holder.uin}@sevispass.gov.pg`,
        fullName: holder.fullName,
        uin: holder.uin,
        nationality: holder.nationality,
        attributes: {
          given_name: holder.fullName.split(' ')[0],
          family_name: holder.fullName.split(' ').slice(1).join(' '),
          'custom:sevispass_uin': holder.uin,
          'custom:user_role': 'CITIZEN'
        }
      }
    });

  } catch (error) {
    console.error('❌ Complete Cognito auth error:', error);
    return NextResponse.json({ error: 'Authentication completion failed' }, { status: 500 });
  }
}