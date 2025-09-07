import { NextRequest, NextResponse } from 'next/server';
import { SevisPassService } from '@/lib/services/sevispass-service';
import { publicServerClient } from '@/lib/utils/amplifyServerUtils';
import { getUrl } from 'aws-amplify/storage';

// Helper function to get photo URL from S3 key
async function getPhotoUrl(photoKey: string | null): Promise<string | null> {
  if (!photoKey) return null;
  
  try {
    const urlResult = await getUrl({
      path: photoKey,
      options: {
        expiresIn: 3600 // 1 hour
      }
    });
    return urlResult.url.toString();
  } catch (error) {
    console.error('Error generating photo URL:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('🌐 /api/sevispass/user-data GET request received');
  
  try {
    // Get user ID from query parameter
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('🆔 User ID from query:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check for approved SevisPass for this specific user only
    console.log('🔍 Calling getSevisPassHolder for userId:', userId);
    let sevisPassHolder = await SevisPassService.getSevisPassHolder(userId);
    console.log(`📊 SevisPass holder lookup for user ${userId}:`, sevisPassHolder ? 'Found' : 'Not found');
    if (sevisPassHolder) {
      console.log('📋 SevisPass holder data:', JSON.stringify(sevisPassHolder, null, 2));
    }

    if (sevisPassHolder) {
      // User has an approved SevisPass
      return NextResponse.json({
        exists: true,
        hasApplication: true,
        applicationStatus: 'approved',
        data: {
          ...sevisPassHolder,
          photoUrl: sevisPassHolder.photo
        }
      });
    }
    
    // Check for application for this specific user only
    let application = await SevisPassService.getApplication(userId);
    console.log(`📋 Application lookup for user ${userId}:`, application ? `Found (${application.status})` : 'Not found');
    
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
    console.error('❌ Error in user-data API:', error);
    
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