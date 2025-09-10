import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runWithAmplifyServerContext } from "@/lib/utils/amplifyServerUtils";

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

    const result = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const { generateClient } = require("aws-amplify/data/server");
        const client = generateClient({ 
          config: contextSpec,
          authMode: 'userPool'
        });

        // Generate application ID
        const applicationId = `CP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const currentDateTime = new Date().toISOString();

        // Check for existing application
        const existingResult = await client.models.CityPassApplication.list({
          filter: { userId: { eq: userId } }
        });

        const existingApp = existingResult.data && existingResult.data.length > 0 ? existingResult.data[0] : null;
        
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

        let result;
        
        if (existingApp) {
          // Update existing application
          result = await client.models.CityPassApplication.update({
            ...applicationData
          });
        } else {
          // Create new application
          result = await client.models.CityPassApplication.create(applicationData);
        }

        if (result.errors) {
          console.error('Database errors:', result.errors);
          throw new Error('Failed to save application');
        }

        return {
          success: true,
          applicationId: applicationData.applicationId,
          status: 'pending',
          message: 'CityPass application submitted successfully',
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("CityPass application error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process application request",
      },
      { status: 500 }
    );
  }
}