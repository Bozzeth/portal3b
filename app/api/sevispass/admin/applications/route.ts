import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth';

// Mock database - in real implementation, this would be a proper database
const mockApplications = [
  {
    id: '1',
    applicationId: 'APP1703856012ABC',
    applicantName: 'John Doe',
    documentType: 'nid',
    documentNumber: 'NID123456789',
    dateOfBirth: '1990-01-01',
    phoneNumber: '+67512345678',
    email: 'john.doe@example.com',
    documentImage: 'base64-document-image',
    selfieImage: 'base64-selfie-image',
    confidenceScore: 85,
    submittedAt: '2024-01-15T10:30:00Z',
    extractedInfo: {
      documentText: 'PAPUA NEW GUINEA NATIONAL IDENTITY CARD\nJOHN DOE\n01/01/1990\nNID123456789',
      faceMatchScore: 85,
      documentQuality: 90,
      livenessScore: 95
    },
    status: 'pending'
  },
  {
    id: '2',
    applicationId: 'APP1703856098DEF',
    applicantName: 'Jane Smith',
    documentType: 'drivers_license',
    documentNumber: 'DL987654321',
    dateOfBirth: '1985-03-15',
    phoneNumber: '+67598765432',
    email: 'jane.smith@example.com',
    documentImage: 'base64-document-image',
    selfieImage: 'base64-selfie-image',
    confidenceScore: 82,
    submittedAt: '2024-01-15T11:45:00Z',
    extractedInfo: {
      documentText: 'PAPUA NEW GUINEA DRIVERS LICENSE\nJANE SMITH\n15/03/1985\nDL987654321',
      faceMatchScore: 82,
      documentQuality: 88,
      livenessScore: 92
    },
    status: 'pending'
  }
];

async function checkAdminAccess(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    
    // Check if user has admin privileges
    // In a real implementation, this would check user groups or attributes
    const isAdmin = user.signInDetails?.loginId?.includes('admin') || 
                    user.username?.includes('admin');
    
    return !!isAdmin;
  } catch (error) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    let filteredApplications = mockApplications;
    
    if (status && status !== 'all') {
      filteredApplications = mockApplications.filter(app => app.status === status);
    }

    return NextResponse.json({
      success: true,
      applications: filteredApplications,
      total: filteredApplications.length
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, decision, reviewNote } = body;

    if (!applicationId || !decision || !['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Find and update application
    const applicationIndex = mockApplications.findIndex(app => app.id === applicationId);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    mockApplications[applicationIndex].status = decision;
    
    // In a real implementation, you would:
    // 1. Update database record
    // 2. If approved, generate UIN and index face in Rekognition
    // 3. Send notification email/SMS to applicant
    // 4. Log the admin action

    if (decision === 'approved') {
      // Generate UIN for approved application
      const uin = `PNG${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
      
      return NextResponse.json({
        success: true,
        message: `Application ${decision} successfully`,
        uin: uin,
        application: mockApplications[applicationIndex]
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `Application ${decision} successfully`,
        application: mockApplications[applicationIndex]
      });
    }
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}