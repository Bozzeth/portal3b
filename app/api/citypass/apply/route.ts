import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runWithAmplifyServerContext, publicServerClient } from "@/lib/utils/amplifyServerUtils";

export async function POST(req: NextRequest) {
  try {
    console.log("CityPass application started");
    const body = await req.json();
    const { 
      userId, 
      category, 
      fullName, 
      sevispassUin, 
      phoneNumber, 
      email,
      supportingDocuments,
      employerName,
      schoolName,
      propertyAddress,
      businessName,
      voucherUin,
      relationshipToVoucher
    } = body;

    // Validate required fields
    if (!userId || !category || !fullName || !sevispassUin) {
      return NextResponse.json(
        { error: "Missing required fields (userId, category, fullName, sevispassUin)" },
        { status: 400 }
      );
    }

    // Generate application ID
    const applicationId = `CP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const currentDateTime = new Date().toISOString();
    
    console.log("Using publicServerClient for CityPass application...");

    // Check for existing application using public client (like SevisPass does)
    const existingResult = await publicServerClient.models.CityPassApplication.list({
      filter: { userId: { eq: userId } }
    });

    if (existingResult.errors) {
      console.error('Error checking existing applications:', existingResult.errors);
      throw new Error('Failed to check existing applications');
    }

    const existingApp = existingResult.data && existingResult.data.length > 0 ? existingResult.data[0] : null;
    console.log('Existing application check:', { found: !!existingApp, applicationId: existingApp?.applicationId });
    
    // Prepare application data
    const applicationData = {
      userId,
      applicationId: existingApp?.applicationId || applicationId,
      status: 'pending' as const,
      submittedAt: currentDateTime,
      category,
      fullName,
      sevispassUin,
      phoneNumber,
      email,
      supportingDocumentKeys: supportingDocuments ? JSON.stringify(supportingDocuments) : null,
      employerName,
      schoolName,
      propertyAddress,
      businessName,
      voucherUin,
      relationshipToVoucher,
    };

    console.log('Prepared application data:', { ...applicationData, supportingDocumentKeys: supportingDocuments?.length || 0 });

    let result;
    
    if (existingApp) {
      // Update existing application
      console.log('Updating existing CityPass application...');
      result = await publicServerClient.models.CityPassApplication.update({
        ...applicationData
      });
    } else {
      // Create new application
      console.log('Creating new CityPass application...');
      result = await publicServerClient.models.CityPassApplication.create(applicationData);
    }

    if (result.errors) {
      console.error('Database errors:', result.errors);
      throw new Error(`Failed to save application: ${JSON.stringify(result.errors)}`);
    }

    console.log('✅ CityPass application saved successfully:', result.data?.applicationId);

    const response = {
      success: true,
      applicationId: applicationData.applicationId,
      status: 'pending',
      message: 'CityPass application submitted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("CityPass application error:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    console.error("Error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process application request",
        details: errorMessage, // Include error details for debugging
      },
      { status: 500 }
    );
  }
}