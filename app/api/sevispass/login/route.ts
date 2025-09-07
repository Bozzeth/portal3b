import { NextRequest, NextResponse } from 'next/server';
import { verifySevisPassLogin, base64ToUint8Array } from '@/lib/aws/rekognition';
import { validateUIN } from '@/lib/utils/sevispass';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uin, selfieImage } = body;

    // Validate required fields
    if (!uin || !selfieImage) {
      return NextResponse.json(
        { error: 'UIN and selfie image are required' },
        { status: 400 }
      );
    }

    // Validate UIN format
    if (!validateUIN(uin)) {
      return NextResponse.json(
        { error: 'Invalid UIN format' },
        { status: 400 }
      );
    }

    // Verify the login
    const verificationResult = await verifySevisPassLogin(selfieImage, uin);

    if (verificationResult.authenticated) {
      // In a real implementation, you would:
      // 1. Query user details from database using UIN
      // 2. Generate JWT token or session
      // 3. Log the successful authentication
      
      // Mock user data - replace with database query
      const userData = {
        uin: verificationResult.uin,
        fullName: 'User Name', // Would come from database
        email: 'user@example.com', // Would come from database
        loginTime: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        authenticated: true,
        confidence: verificationResult.confidence,
        user: userData,
        message: 'Authentication successful'
      });
    } else {
      // Authentication failed
      return NextResponse.json({
        success: false,
        authenticated: false,
        confidence: verificationResult.confidence,
        error: verificationResult.error || 'Authentication failed',
        message: 'Face verification failed or UIN not found'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('SevisPass login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process login request'
      },
      { status: 500 }
    );
  }
}