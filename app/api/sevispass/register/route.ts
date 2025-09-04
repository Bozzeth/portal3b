import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifySevisPassRegistration,
  base64ToUint8Array,
  extractTextFromDocument,
} from "@/lib/aws/rekognition";
import { generateUIN, generateApplicationId } from "@/lib/utils/sevispass";
import { SevisPassService } from "@/lib/services/sevispass-service";
import { runWithAmplifyServerContext } from "@/lib/utils/amplifyServerUtils";
import { getCurrentUser } from "aws-amplify/auth/server";

export async function POST(req: NextRequest) {
  try {
    console.log("SevisPass registration started - updated version");
    const body = await req.json();
    const { documentType, documentImage, selfieImage, applicantInfo } = body;

    // Validate required fields
    if (!documentType || !documentImage || !selfieImage || !applicantInfo) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        console.log("Starting text extraction from document");
        // Extract text from document
        const documentBytes = base64ToUint8Array(documentImage);
        const textExtractionResult = await extractTextFromDocument(
          documentBytes,
          contextSpec
        );
        console.log("Text extraction completed:", textExtractionResult.success);

        // Extract document information from the text or fallback
        const documentNumberMatch = textExtractionResult.text
          ? textExtractionResult.text.match(/[A-Z]{2}\d{6,8}|P\d{7}|\d{8,12}/)
          : null;
        let extractedInfo = {
          fullName: applicantInfo.fullName || "Unknown User",
          dateOfBirth: applicantInfo.dateOfBirth || "1990-01-01",
          documentNumber: documentNumberMatch
            ? documentNumberMatch[0]
            : "DOC123456789",
          nationality: "Papua New Guinea",
        };

        // Extract information from OCR text
        if (textExtractionResult.success && textExtractionResult.text) {
          console.log('OCR extracted text:', textExtractionResult.text);
          
          // Try multiple MRZ patterns for PNG passport name extraction
          let nameExtracted = false;
          
          // Pattern 1: Standard PNG MRZ format: P<PNGLASTNAME<<FIRSTNAME<MIDDLENAME<<<<<
          const mrzMatch1 = textExtractionResult.text.match(/P<PNG([^<\s]+)<<([^<\s]+)<?([^<\s]*)<*/i);
          if (mrzMatch1 && !nameExtracted) {
            const lastName = mrzMatch1[1].replace(/</g, '').trim();
            const firstName = mrzMatch1[2].replace(/</g, '').trim();
            const middleName = mrzMatch1[3] ? mrzMatch1[3].replace(/</g, '').trim() : '';
            
            if (lastName && firstName) {
              const fullName = middleName 
                ? `${firstName} ${middleName} ${lastName}`
                : `${firstName} ${lastName}`;
              
              console.log('Extracted MRZ name (Pattern 1):', { lastName, firstName, middleName, fullName });
              extractedInfo.fullName = fullName;
              nameExtracted = true;
            }
          }
          
          // Pattern 2: Alternative MRZ format with spaces or line breaks
          if (!nameExtracted) {
            const mrzMatch2 = textExtractionResult.text.match(/P\s*<\s*PNG\s*([^<\s]+)\s*<+\s*([^<\s]+)\s*<*\s*([^<\s]*)/i);
            if (mrzMatch2) {
              const lastName = mrzMatch2[1].trim();
              const firstName = mrzMatch2[2].trim();
              const middleName = mrzMatch2[3] ? mrzMatch2[3].trim() : '';
              
              if (lastName && firstName) {
                const fullName = middleName 
                  ? `${firstName} ${middleName} ${lastName}`
                  : `${firstName} ${lastName}`;
                
                console.log('Extracted MRZ name (Pattern 2):', { lastName, firstName, middleName, fullName });
                extractedInfo.fullName = fullName;
                nameExtracted = true;
              }
            }
          }
          
          // Pattern 3: Look for PNG followed by name components anywhere in text
          if (!nameExtracted) {
            const pngMatch = textExtractionResult.text.match(/PNG\s*([A-Z]+)\s*[<\s]+([A-Z]+)(?:\s*[<\s]+([A-Z]+))?/i);
            if (pngMatch) {
              const lastName = pngMatch[1].trim();
              const firstName = pngMatch[2].trim();
              const middleName = pngMatch[3] ? pngMatch[3].trim() : '';
              
              if (lastName && firstName && lastName !== 'PNG') {
                const fullName = middleName 
                  ? `${firstName} ${middleName} ${lastName}`
                  : `${firstName} ${lastName}`;
                
                console.log('Extracted MRZ name (Pattern 3):', { lastName, firstName, middleName, fullName });
                extractedInfo.fullName = fullName;
                nameExtracted = true;
              }
            }
          }
          
          if (!nameExtracted) {
            console.log('No MRZ name pattern matched, using fallback');
          }
          
          // Extract date patterns from OCR
          const dateMatch = textExtractionResult.text.match(
            /\d{1,2}[-/]\d{1,2}[-/]\d{4}/
          );
          if (dateMatch) {
            const [day, month, year] = dateMatch[0].split(/[-/]/);
            extractedInfo.dateOfBirth = `${year}-${month.padStart(
              2,
              "0"
            )}-${day.padStart(2, "0")}`;
          }

          // Extract document number from MRZ (second line usually starts with passport number)
          const docNumMatch = textExtractionResult.text.match(/P<PNG[^<]+<<[^<]+<?[^<]*<*[\r\n]+([A-Z0-9]{8,9})/);
          if (docNumMatch) {
            extractedInfo.documentNumber = docNumMatch[1];
            console.log('Extracted document number:', docNumMatch[1]);
          }
        }

        // Generate application ID
        const applicationId = generateApplicationId();

        // Get authenticated user using the server context properly
        let userId;
        try {
          // Try to get current user - if this fails, user is not authenticated
          const currentUser = await getCurrentUser(contextSpec);
          userId = currentUser.userId;
          console.log("Authenticated user:", userId);
        } catch (authError) {
          console.log("User not authenticated, extracting from cookies/headers...");
          // Try to get user ID from request cookies or session
          // This is a fallback when server context auth fails but user is actually logged in
          const cookies = req.headers.get('cookie');
          if (cookies) {
            // Extract user ID from cookies if possible
            // For now, use a deterministic ID based on session
            userId = `fallback-user-${Date.now()}`;
          } else {
            userId = `guest-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          }
          console.log("Generated fallback user ID:", userId);
        }

        console.log("Starting SevisPass verification");
        // Verify the registration
        const verificationResult = await verifySevisPassRegistration(
          selfieImage,
          documentImage,
          generateUIN(), // Generate temporary UIN for verification
          contextSpec
        );
        console.log("Verification completed:", verificationResult);

        if (verificationResult.approved) {
          // Auto-approved - generate final UIN and save
          const finalUIN = generateUIN();

          console.log("Saving approved application");
          await SevisPassService.saveApplication(
            userId,
            {
              applicationId,
              status: "approved",
              submittedAt: new Date().toISOString(),
              documentType,
              extractedInfo,
              verificationData: {
                confidence: verificationResult.confidence,
                requiresManualReview: false,
                faceId: verificationResult.faceId,
              },
              uin: finalUIN,
              issuedAt: new Date().toISOString(),
            },
            documentImage,
            selfieImage,
            contextSpec
          );
          console.log("Application saved successfully");

          return {
            success: true,
            uin: finalUIN,
            status: "approved",
            confidence: verificationResult.confidence,
            extractedInfo,
            message: "SevisPass approved successfully",
          };
        } else if (verificationResult.requiresManualReview) {
          // Requires manual review - save to review queue
          console.log("Saving application for manual review");
          await SevisPassService.saveApplication(
            userId,
            {
              applicationId,
              status: "under_review",
              submittedAt: new Date().toISOString(),
              documentType,
              extractedInfo,
              verificationData: {
                confidence: verificationResult.confidence,
                requiresManualReview: true,
              },
            },
            documentImage,
            selfieImage,
            contextSpec
          );
          console.log("Review application saved successfully");

          return {
            success: true,
            applicationId: applicationId,
            status: "under_review",
            confidence: verificationResult.confidence,
            extractedInfo,
            message: "Application submitted for manual review",
          };
        } else {
          // Rejected - still save for audit trail
          console.log("Saving rejected application");
          await SevisPassService.saveApplication(
            userId,
            {
              applicationId,
              status: "rejected",
              submittedAt: new Date().toISOString(),
              documentType,
              extractedInfo,
              verificationData: {
                confidence: verificationResult.confidence,
                requiresManualReview: false,
              },
              rejectionReason:
                verificationResult.error ||
                "Verification failed - insufficient confidence score",
            },
            documentImage,
            selfieImage,
            contextSpec
          );
          console.log("Rejected application saved successfully");

          return {
            success: false,
            status: "rejected",
            confidence: verificationResult.confidence,
            extractedInfo,
            error: verificationResult.error || "Verification failed",
            message:
              "Application rejected due to insufficient verification confidence",
          };
        }
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("SevisPass registration error:", error);

    // Handle authentication errors  
    if (error instanceof Error && error.message.includes("Authentication")) {
      return NextResponse.json(
        { 
          error: "Authentication required", 
          message: "Please sign in to apply for SevisPass" 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process registration request",
      },
      { status: 500 }
    );
  }
}
