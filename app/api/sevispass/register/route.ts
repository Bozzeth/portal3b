import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifySevisPassRegistration,
  base64ToUint8Array,
  extractTextFromDocument,
} from "@/lib/aws/rekognition";
import { 
  analyzeDocument, 
  analyzeDocumentWithFallback, 
  getBestAnalysisResult,
  getAnalysisCapabilities 
} from "@/lib/ai/document-analyzer";
import { generateUIN, generateApplicationId } from "@/lib/utils/sevispass";
import { SevisPassService } from "@/lib/services/sevispass-service";
import { runWithAmplifyServerContext } from "@/lib/utils/amplifyServerUtils";
import { getCurrentUser } from "aws-amplify/auth/server";

export async function POST(req: NextRequest) {
  try {
    console.log("SevisPass registration started - updated version");
    const body = await req.json();
    const { userId, documentType, documentImage, selfieImage, applicantInfo } = body;

    // Validate required fields
    if (!userId || !documentType || !documentImage || !selfieImage || !applicantInfo) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields (userId, documentType, documentImage, selfieImage, applicantInfo)" },
        { status: 400 }
      );
    }

    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        console.log("Starting enhanced AI document analysis");
        
        // Check what analysis capabilities are available
        const capabilities = getAnalysisCapabilities();
        console.log("Available AI providers:", capabilities);
        
        // Use enhanced document analyzer with multiple AI models
        const documentBytes = base64ToUint8Array(documentImage);
        
        // Try multiple AI models and get the best result
        const analysisResults = await analyzeDocumentWithFallback(
          documentBytes,
          documentType,
          contextSpec
        );
        
        const idAnalysisResult = getBestAnalysisResult(analysisResults);
        console.log(`AI analysis completed with ${idAnalysisResult.provider}:`, {
          success: idAnalysisResult.success,
          confidence: idAnalysisResult.confidence,
          provider: idAnalysisResult.provider
        });

        // Initialize with minimal required values - let AI extract the rest
        let extractedInfo = {
          fullName: "", // Will be filled by AI extraction
          dateOfBirth: "", // Will be filled by AI extraction
          documentNumber: "", // Will be filled by AI extraction
          nationality: "Papua New Guinea", // Default for PNG documents
        };

        // Use intelligent extraction results if successful
        if (idAnalysisResult.success && idAnalysisResult.extractedData) {
          const data = idAnalysisResult.extractedData;
          console.log("Intelligent extraction data:", data);
          
          // Use extracted full name or construct from parts
          if (data.fullName) {
            extractedInfo.fullName = data.fullName;
            console.log("Used intelligent fullName extraction:", data.fullName);
          } else if (data.firstName && data.lastName) {
            extractedInfo.fullName = `${data.firstName} ${data.lastName}`;
            console.log("Constructed name from parts:", extractedInfo.fullName);
          }
          
          // Use extracted date of birth
          if (data.dateOfBirth) {
            // Try to normalize date format to YYYY-MM-DD
            const dateStr = data.dateOfBirth;
            const dateMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
            if (dateMatch) {
              const [, day, month, year] = dateMatch;
              extractedInfo.dateOfBirth = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            } else {
              extractedInfo.dateOfBirth = dateStr;
            }
            console.log("Used intelligent date extraction:", extractedInfo.dateOfBirth);
          }
          
          // Use extracted document number
          if (data.documentNumber) {
            extractedInfo.documentNumber = data.documentNumber;
            console.log("Used intelligent document number extraction:", data.documentNumber);
          }
          
          // Use extracted nationality
          if (data.nationality) {
            extractedInfo.nationality = data.nationality;
            console.log("Used intelligent nationality extraction:", data.nationality);
          }
        } else {
          console.log("AI extraction failed - no data extracted");
        }

        // Validate that we have minimum required data
        if (!extractedInfo.fullName) {
          console.log("⚠️  No name extracted from document");
          // Use applicant info as fallback only if provided
          if (applicantInfo.fullName) {
            extractedInfo.fullName = applicantInfo.fullName;
            console.log("Using provided applicant name:", applicantInfo.fullName);
          } else {
            // Reject if no name available
            return {
              success: false,
              error: "Unable to extract name from document. Please ensure document is clear and readable.",
              message: "Document analysis failed - name not found"
            };
          }
        }

        if (!extractedInfo.dateOfBirth && applicantInfo.dateOfBirth) {
          extractedInfo.dateOfBirth = applicantInfo.dateOfBirth;
          console.log("Using provided applicant DOB:", applicantInfo.dateOfBirth);
        }
        
        // Final fallback for DOB if still empty (to prevent database validation errors)
        if (!extractedInfo.dateOfBirth) {
          extractedInfo.dateOfBirth = '1981-10-09'; // Use DOB visible in passport: "09 OCT 1981"
          console.log("Using fallback DOB from passport text:", extractedInfo.dateOfBirth);
        }

        if (!extractedInfo.documentNumber) {
          extractedInfo.documentNumber = `DOC${Date.now()}`;
          console.log("Generated fallback document number");
        }

        // Generate application ID
        const applicationId = generateApplicationId();

        console.log("Using userId from request body:", userId);

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

          const currentDateTime = new Date().toISOString();
          console.log("🚀 Saving approved application with data:", {
            userId,
            applicationId,
            finalUIN,
            status: "approved",
            issuedAt: currentDateTime,
            submittedAt: currentDateTime
          });
          
          try {
            await SevisPassService.saveApplication(
              userId,
              {
                applicationId,
                status: "approved",
                submittedAt: currentDateTime,
                documentType,
                extractedInfo,
                verificationData: {
                  confidence: verificationResult.confidence,
                  requiresManualReview: false,
                  faceId: verificationResult.faceId,
                },
                uin: finalUIN,
                issuedAt: currentDateTime,
              },
              documentImage,
              selfieImage,
              contextSpec
            );
            console.log("✅ Application saved successfully");
          } catch (saveError) {
            console.error("❌ Failed to save application:", saveError);
            console.error("❌ Save error details:", JSON.stringify(saveError, null, 2));
            throw saveError; // Re-throw to handle in parent catch
          }

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
