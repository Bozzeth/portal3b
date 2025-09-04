import { NextRequest, NextResponse } from 'next/server';
import { verifySevisPassRegistration, base64ToUint8Array, extractTextFromDocument } from '@/lib/aws/rekognition';
import { generateUIN, generateApplicationId } from '@/lib/utils/sevispass';
import { SevisPassStore } from '@/lib/store/sevispass-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      documentType, 
      documentImage, 
      selfieImage, 
      applicantInfo 
    } = body;

    // Validate required fields
    if (!documentType || !documentImage || !selfieImage || !applicantInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract text from document
    const documentBytes = base64ToUint8Array(documentImage);
    const textExtractionResult = await extractTextFromDocument(documentBytes);

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
    const userId = SevisPassStore.getUserIdFromRequest();

    // Verify the registration
    const verificationResult = await verifySevisPassRegistration(
      selfieImage,
      documentImage,
      generateUIN() // Generate temporary UIN for verification
    );

    if (verificationResult.approved) {
      // Auto-approved - generate final UIN and save
      const finalUIN = generateUIN();
      
      SevisPassStore.saveApplication(userId, {
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
      });
      
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
      SevisPassStore.saveApplication(userId, {
        applicationId,
        status: 'under_review',
        submittedAt: new Date().toISOString(),
        documentType,
        extractedInfo,
        verificationData: {
          confidence: verificationResult.confidence,
          requiresManualReview: true
        }
      });
      
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
      SevisPassStore.saveApplication(userId, {
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
      });
      
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