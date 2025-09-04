import { NextRequest, NextResponse } from 'next/server';
import { SevisPassService } from '@/lib/services/sevispass-service';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    const token = authHeader.slice(7);
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload['cognito:username'];
      if (!userId) throw new Error('No user ID in token');
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid authentication token'
      }, { status: 401 });
    }
    
    // Check for approved SevisPass first
    const sevisPassHolder = await SevisPassService.getSevisPassHolder(userId);
    
    if (sevisPassHolder) {
      // User has an approved SevisPass
      return NextResponse.json({
        exists: true,
        hasApplication: true,
        applicationStatus: 'approved',
        data: sevisPassHolder
      });
    }
    
    // Check for application
    const application = await SevisPassService.getApplication(userId);
    
    if (!application) {
      // No application found
      return NextResponse.json({
        exists: false,
        hasApplication: false,
        data: null
      });
    }

    if (application.status === 'under_review' || application.status === 'pending') {
      // Application under review
      return NextResponse.json({
        exists: false,
        hasApplication: true,
        applicationStatus: 'under_review',
        applicationData: {
          applicationId: application.applicationId,
          submittedAt: application.submittedAt,
          expectedReviewTime: '3-5 business days',
          documentType: application.documentType,
          extractedInfo: application.extractedInfo,
          confidence: application.verificationData.confidence,
          status: 'pending'
        }
      });
    } else if (application.status === 'rejected') {
      // Application rejected
      return NextResponse.json({
        exists: false,
        hasApplication: true,
        applicationStatus: 'rejected',
        applicationData: {
          applicationId: application.applicationId,
          submittedAt: application.submittedAt,
          rejectedAt: application.reviewedAt || application.submittedAt,
          rejectionReason: application.rejectionReason || 'Application did not meet verification requirements.',
          extractedInfo: application.extractedInfo,
          confidence: application.verificationData.confidence,
          status: 'rejected',
          canReapply: true
        }
      });
    }

    // Fallback - no application
    return NextResponse.json({
      exists: false,
      hasApplication: false,
      data: null
    });

  } catch (error) {
    console.error('Error fetching user SevisPass data:', error);
    
    return NextResponse.json({
      exists: false,
      hasApplication: false,
      data: null,
      error: 'Failed to fetch SevisPass data'
    }, { status: 500 });
  }
}

// In a real implementation, this endpoint would also handle POST requests
// to save SevisPass data after successful registration
export async function POST(request: NextRequest) {
  try {
    const { sevisPassData } = await request.json();
    
    // Here you would:
    // 1. Validate the user is authenticated
    // 2. Save the SevisPass data to your database
    // 3. Associate it with the user's account
    
    console.log('SevisPass data would be saved:', sevisPassData);
    
    return NextResponse.json({
      success: true,
      message: 'SevisPass data saved successfully'
    });

  } catch (error) {
    console.error('Error saving SevisPass data:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save SevisPass data'
    }, { status: 500 });
  }
}