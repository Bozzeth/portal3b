import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginToken } from '../login/route';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { loginToken } = body;

    if (!loginToken) {
      return NextResponse.json(
        { error: 'Login token is required' },
        { status: 400 }
      );
    }

    console.log('🔐 Attempting to complete SevisPass authentication with token');

    // Verify the login token
    const tokenData = verifyLoginToken(loginToken);
    
    if (!tokenData) {
      console.log('❌ Invalid or expired login token');
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired login token'
      }, { status: 401 });
    }

    console.log('✅ Login token verified:', {
      userId: tokenData.userId,
      uin: tokenData.uin
    });

    // Return success with user data for frontend to complete authentication
    return NextResponse.json({
      success: true,
      cognitoUserId: tokenData.userId,
      uin: tokenData.uin,
      message: 'Token verified - proceed with authentication'
    });

  } catch (error) {
    console.error('❌ Complete auth error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during authentication completion'
      },
      { status: 500 }
    );
  }
}