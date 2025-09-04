import { NextRequest, NextResponse } from 'next/server';
import { verifySevisPassRegistration, base64ToUint8Array, extractTextFromDocument } from '@/lib/aws/rekognition';
import { generateUIN, generateApplicationId } from '@/lib/utils/sevispass';
import { SevisPassService } from '@/lib/services/sevispass-service';
import { AuthGetCurrentUserServer } from '@/lib/utils/amplifyServerUtils';
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

export async function POST(req: NextRequest) {
  try {
    console.log('SevisPass registration started');
    const body = await req.json();
    const { 
      documentType, 
      documentImage, 
      selfieImage, 
      applicantInfo 
    } = body;

    // Validate required fields
    if (!documentType || !documentImage || !selfieImage || !applicantInfo) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Starting text extraction from document');
    // Extract text from document
    const documentBytes = base64ToUint8Array(documentImage);
    const textExtractionResult = await extractTextFromDocument(documentBytes);
    console.log('Text extraction completed:', textExtractionResult.success);

    // Extract document information from the text or fallback
    let extractedInfo = {
      fullName: applicantInfo.fullName || 'Unknown User',
      dateOfBirth: applicantInfo.dateOfBirth || '1990-01-01',
      documentNumber: textExtractionResult.text.match(/[A-Z]{2}\d{6,8}|P\d{7}|\d{8,12}/)?.[0] || 'DOC123456789',
      nationality: 'Papua New Guinea'
    };

    // Try to extract text-based information if available
    if (textExtractionResult.success && textExtractionResult.text) {
      // Look for name patterns in extracted text
      const nameMatch = textExtractionResult.text.match(/[A-Z][a-zA-Z]+\s+[A-Z][a-zA-Z]+/);
      if (nameMatch) {
        extractedInfo.fullName = nameMatch[0];
      }
      
      // Look for date patterns
      const dateMatch = textExtractionResult.text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{4}/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[0].split(/[-/]/);
        extractedInfo.dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Generate application ID
    const applicationId = generateApplicationId();
    
    // Get user ID from JWT token  
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub || payload['cognito:username'];
      if (!userId) throw new Error('No user ID in token');
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('Starting SevisPass verification');
    // Verify the registration
    const verificationResult = await verifySevisPassRegistration(
      selfieImage,
      documentImage,
      generateUIN() // Generate temporary UIN for verification
    );
    console.log('Verification completed:', verificationResult);

    if (verificationResult.approved) {
      // Auto-approved - generate final UIN and save
      const finalUIN = generateUIN();
      
      console.log('Saving approved application');
      await SevisPassService.saveApplication(userId, {
        applicationId,
        status: 'approved',
        submittedAt: new Date().toISOString(),
        documentType,
        extractedInfo,
        verificationData: {
          confidence: verificationResult.confidence,
          requiresManualReview: false,
          faceId: verificationResult.faceId
        },
        uin: finalUIN,
        issuedAt: new Date().toISOString()
      }, documentImage, selfieImage, req, token);
      console.log('Application saved successfully');
      
      return NextResponse.json({
        success: true,
        uin: finalUIN,
        status: 'approved',
        confidence: verificationResult.confidence,
        extractedInfo,
        message: 'SevisPass approved successfully'
      });
    } else if (verificationResult.requiresManualReview) {
      // Requires manual review - save to review queue
      console.log('Saving application for manual review');
      await SevisPassService.saveApplication(userId, {
        applicationId,
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        documentType,
        extractedInfo,
        verificationData: {
          confidence: verificationResult.confidence,
          requiresManualReview: true
        }
      }, documentImage, selfieImage, req, token);
      console.log('Review application saved successfully');
      
      return NextResponse.json({
        success: true,
        applicationId: applicationId,
        status: 'under_review',
        confidence: verificationResult.confidence,
        extractedInfo,
        message: 'Application submitted for manual review'
      });
    } else {
      // Rejected - still save for audit trail
      console.log('Saving rejected application');
      await SevisPassService.saveApplication(userId, {
        applicationId,
        status: 'rejected',
        submittedAt: new Date().toISOString(),
        documentType,
        extractedInfo,
        verificationData: {
          confidence: verificationResult.confidence,
          requiresManualReview: false
        },
        rejectionReason: verificationResult.error || 'Verification failed - insufficient confidence score'
      }, documentImage, selfieImage, req, token);
      console.log('Rejected application saved successfully');
      
      return NextResponse.json({
        success: false,
        status: 'rejected',
        confidence: verificationResult.confidence,
        extractedInfo,
        error: verificationResult.error || 'Verification failed',
        message: 'Application rejected due to insufficient verification confidence'
      });
    }
  } catch (error) {
    console.error('SevisPass registration error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process registration request'
      },
      { status: 500 }
    );
  }
}