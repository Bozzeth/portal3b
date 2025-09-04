import { NextRequest, NextResponse } from 'next/server';
import { SevisPassService } from '@/lib/services/sevispass-service';
import { publicServerClient } from '@/lib/utils/amplifyServerUtils';

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
    let sevisPassHolder = await SevisPassService.getSevisPassHolder(userId);
    
    // If no holder found with userId, also check recent guest applications
    // This handles cases where registration used a guest ID but user is now authenticated
    if (!sevisPassHolder) {
      console.log('No SevisPass found for user ID, checking recent applications...');
      // Get all recent applications (last 24 hours) to see if any could belong to this user
      const { data: recentApplications } = await publicServerClient.models.SevisPassApplication.list();
      
      if (recentApplications) {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentApproved = recentApplications.filter(app => 
          app.status === 'approved' && 
          app.submittedAt > last24Hours &&
          app.uin
        );
        
        console.log(`Found ${recentApproved.length} recent approved applications`);
        
        // If there's exactly one recent approved application, assume it belongs to this user
        if (recentApproved.length === 1) {
          const app = recentApproved[0];
          console.log('Assuming recent application belongs to current user:', app.applicationId);
          
          // Try to get the holder record for this UIN
          const { data: holders } = await publicServerClient.models.SevisPassHolder.list();
          sevisPassHolder = holders?.find(h => h.uin === app.uin);
        }
      }
    }
    
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
    let application = await SevisPassService.getApplication(userId);
    
    // If no application found with userId, check recent applications
    if (!application) {
      console.log('No application found for user ID, checking recent applications...');
      const { data: recentApplications } = await publicServerClient.models.SevisPassApplication.list();
      
      if (recentApplications) {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const userRecentApps = recentApplications.filter(app => 
          app.submittedAt > last24Hours && 
          (app.status === 'under_review' || app.status === 'pending' || app.status === 'rejected')
        );
        
        console.log(`Found ${userRecentApps.length} recent applications`);
        
        // If there's exactly one recent application, assume it belongs to this user
        if (userRecentApps.length === 1) {
          const app = userRecentApps[0];
          console.log('Assuming recent application belongs to current user:', app.applicationId);
          application = {
            applicationId: app.applicationId,
            status: app.status as 'pending' | 'under_review' | 'approved' | 'rejected',
            submittedAt: app.submittedAt,
            documentType: app.documentType,
            extractedInfo: {
              fullName: app.fullName || '',
              dateOfBirth: app.dateOfBirth || '',
              documentNumber: app.documentNumber || '',
              nationality: app.nationality || 'Papua New Guinea',
            },
            verificationData: {
              confidence: app.confidence || 0,
              requiresManualReview: app.requiresManualReview || false,
              faceId: app.faceId || undefined,
            },
            uin: app.uin || undefined,
            issuedAt: app.issuedAt || undefined,
            rejectionReason: app.rejectionReason || undefined,
            reviewedBy: app.reviewedBy || undefined,
            reviewedAt: app.reviewedAt || undefined,
          };
        }
      }
    }
    
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