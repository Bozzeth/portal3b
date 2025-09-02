import { NextRequest, NextResponse } from 'next/server';
import { verifySevisPassRegistration, base64ToUint8Array, extractTextFromDocument } from '@/lib/aws/rekognition';
import { generateUIN, generateApplicationId } from '@/lib/utils/sevispass';

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

    // Verify the registration
    const verificationResult = await verifySevisPassRegistration(
      selfieImage,
      documentImage,
      generateUIN() // Generate temporary UIN for verification
    );

    if (verificationResult.approved) {
      // Auto-approved - generate final UIN
      const finalUIN = generateUIN();
      
      // In a real implementation, you would:
      // 1. Save user data to database with UIN
      // 2. Store face in Rekognition collection with UIN as ExternalImageId
      // 3. Send approval email/SMS
      
      return NextResponse.json({
        success: true,
        uin: finalUIN,
        status: 'approved',
        confidence: verificationResult.confidence,
        message: 'SevisPass approved successfully'
      });
    } else if (verificationResult.requiresManualReview) {
      // Requires manual review
      const applicationId = generateApplicationId();
      
      // In a real implementation, you would:
      // 1. Save application data to review queue
      // 2. Store images for admin review
      // 3. Send pending review notification
      
      return NextResponse.json({
        success: true,
        uin: applicationId,
        status: 'pending',
        confidence: verificationResult.confidence,
        message: 'Application submitted for manual review'
      });
    } else {
      // Rejected
      return NextResponse.json({
        success: false,
        status: 'rejected',
        confidence: verificationResult.confidence,
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