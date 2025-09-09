import { NextRequest, NextResponse } from 'next/server';
import { verifySevisPassLogin, base64ToUint8Array } from '@/lib/aws/rekognition';
import { validateUIN } from '@/lib/utils/sevispass';
import { publicServerClient } from '@/lib/utils/amplifyServerUtils';
import crypto from 'crypto';

// Temporary in-memory store for login tokens (use Redis in production)
const loginTokenStore = new Map<string, { userId: string; uin: string; expiresAt: number }>();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of Array.from(loginTokenStore.entries())) {
    if (data.expiresAt < now) {
      loginTokenStore.delete(token);
    }
  }
}, 5 * 60 * 1000);

// Generate secure login token
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store login token with expiration (10 minutes)
function storeLoginToken(token: string, userId: string, uin: string): void {
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
  loginTokenStore.set(token, { userId, uin, expiresAt });
  console.log(`🔐 Stored login token for user ${userId}, expires in 10 minutes`);
}

// Verify and consume login token (one-time use)
export function verifyLoginToken(token: string): { userId: string; uin: string } | null {
  const data = loginTokenStore.get(token);
  if (!data || data.expiresAt < Date.now()) {
    loginTokenStore.delete(token);
    return null;
  }
  
  // Token is valid - consume it (one-time use)
  loginTokenStore.delete(token);
  return { userId: data.userId, uin: data.uin };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uin, selfieImage } = body;

    console.log('🔐 SevisPass login attempt for UIN:', uin);

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
        { error: 'Invalid UIN format. UIN should be PNG followed by 10 digits (e.g., PNG1234567890)' },
        { status: 400 }
      );
    }

    // First, check if UIN exists in our database
    console.log('🔍 Looking up user with UIN in database...');
    const existingHolder = await lookupSevisPassHolder(uin);
    
    if (!existingHolder) {
      console.log('❌ No SevisPassHolder found for UIN:', uin);
      return NextResponse.json({
        success: false,
        authenticated: false,
        confidence: 0,
        error: 'UIN not found. Please register for SevisPass first or verify your UIN is correct.',
        message: 'No active SevisPass account found'
      }, { status: 404 });
    }

    console.log('✅ Found SevisPassHolder:', { uin: existingHolder.uin, fullName: existingHolder.fullName, status: existingHolder.status });

    // Check if account is active
    if (existingHolder.status !== 'active') {
      console.log('❌ SevisPass account is not active:', existingHolder.status);
      return NextResponse.json({
        success: false,
        authenticated: false,
        confidence: 0,
        error: `SevisPass account is ${existingHolder.status}. Please contact support.`,
        message: 'Account not active'
      }, { status: 403 });
    }

    // Verify the face using AWS Rekognition
    console.log('🤖 Starting facial recognition verification...');
    const verificationResult = await verifySevisPassLogin(selfieImage, uin);
    
    console.log('🔍 Verification result:', {
      authenticated: verificationResult.authenticated,
      confidence: verificationResult.confidence,
      foundUin: verificationResult.uin,
      expectedUin: uin,
      error: verificationResult.error
    });

    if (verificationResult.authenticated) {
      // Success - user verified
      console.log('✅ Face verification successful. Confidence:', verificationResult.confidence);
      console.log('🔗 Cognito userId for session:', existingHolder.userId);
      
      // Generate a secure temporary login token for Cognito authentication
      const loginToken = generateSecureToken();
      
      // Store the token temporarily for Cognito auto-sign-in
      storeLoginToken(loginToken, existingHolder.userId, existingHolder.uin);
      
      const userData = {
        uin: existingHolder.uin,
        fullName: existingHolder.fullName,
        nationality: existingHolder.nationality,
        issuedDate: existingHolder.issuedAt,
        expiryDate: existingHolder.expiryDate,
        status: existingHolder.status,
        cognitoUserId: existingHolder.userId, // The Cognito user ID
        loginTime: new Date().toISOString(),
        loginToken, // Token for Cognito authentication
        // Add email for Cognito sign-in (derived from UIN)
        email: `${existingHolder.uin}@sevispass.gov.pg`
      };

      return NextResponse.json({
        success: true,
        authenticated: true,
        confidence: verificationResult.confidence,
        user: userData,
        message: 'Face verification successful. Completing Cognito authentication...'
      });
    } else {
      // Face verification failed
      console.log('❌ Face verification failed. Confidence:', verificationResult.confidence);
      return NextResponse.json({
        success: false,
        authenticated: false,
        confidence: verificationResult.confidence || 0,
        error: verificationResult.error || 'Face verification failed. Please ensure good lighting and look directly at the camera.',
        message: 'Facial recognition verification failed'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ SevisPass login error:', error);
    return NextResponse.json(
      { 
        success: false,
        authenticated: false,
        error: 'Internal server error during authentication',
        message: 'Failed to process login request'
      },
      { status: 500 }
    );
  }
}

// Helper function to lookup SevisPassHolder by UIN
async function lookupSevisPassHolder(uin: string) {
  try {
    console.log('🔍 Searching for SevisPassHolder with UIN:', uin);
    
    const result = await publicServerClient.models.SevisPassHolder.list({
      filter: { uin: { eq: uin } }
    });

    console.log('🔍 Database search result:', { 
      found: result.data?.length || 0,
      errors: result.errors?.length || 0 
    });

    if (result.errors && result.errors.length > 0) {
      console.error('❌ Database errors:', result.errors);
      return null;
    }

    if (result.data && result.data.length > 0) {
      const holder = result.data[0];
      console.log('✅ Found holder:', {
        uin: holder.uin,
        fullName: holder.fullName,
        status: holder.status
      });
      return holder;
    }
    
    console.log('❌ No SevisPassHolder found for UIN:', uin);
    return null;
  } catch (error) {
    console.error('❌ Error looking up SevisPassHolder:', error);
    return null;
  }
}