import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: "To test SevisPass registration, you need to:",
    steps: [
      "1. Navigate to your sign-in page",
      "2. Sign in with a valid Cognito user account", 
      "3. After successful sign-in, try the SevisPass registration",
      "4. The authenticated user should have Rekognition permissions"
    ],
    currentStatus: "User is not authenticated - no JWT tokens found",
    nextAction: "Please sign in first, then test the registration endpoint"
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}