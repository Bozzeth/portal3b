import { NextRequest, NextResponse } from 'next/server';
import { SevisPassStore } from '@/lib/store/sevispass-store';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from request (in production, this would be from JWT token)
    const userId = SevisPassStore.getUserIdFromRequest();
    
    // Get the actual application data
    const application = SevisPassStore.getApplication(userId);
    
    if (!application) {
      // No application found
      return NextResponse.json({
        exists: false,
        hasApplication: false,
        data: null
      });
    }

    if (application.status === 'approved' && application.uin) {
      // Application approved - return SevisPass data with real extracted info
      return NextResponse.json({
        exists: true,
        hasApplication: true,
        applicationStatus: 'approved',
        data: {
          uin: application.uin,
          fullName: application.extractedInfo.fullName,
          dateOfBirth: application.extractedInfo.dateOfBirth,
          documentNumber: application.extractedInfo.documentNumber,
          nationality: application.extractedInfo.nationality,
          issuedDate: application.issuedAt || application.submittedAt,
          expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years from now
          status: 'active' as const,
          confidence: application.verificationData.confidence,
          photo: undefined // In production, this would be the user's registered photo
        }
      });
    } else if (application.status === 'under_review' || application.status === 'pending') {
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