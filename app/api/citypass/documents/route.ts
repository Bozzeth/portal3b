import { NextRequest, NextResponse } from 'next/server';
import { getUrl } from 'aws-amplify/storage';
import { cookiesClient } from '@/lib/utils/amplifyServerUtils';

export async function GET(request: NextRequest) {
  console.log('🌐 CityPass documents API called');
  
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    
    console.log('📋 Request details:', {
      url: request.url,
      applicationId,
      hasApplicationId: !!applicationId
    });
    
    if (!applicationId) {
      console.log('❌ No applicationId provided');
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }
    
    console.log('🔍 Fetching documents for application:', applicationId);
    
    // Get the application to retrieve document keys
    console.log('🔍 Querying database for application with authenticated client...');
    const result = await (cookiesClient.models as any).CityPassApplication.list({
      filter: { applicationId: { eq: applicationId } }
    });
    
    console.log('📊 Database query result:', {
      hasData: !!result.data,
      dataLength: result.data?.length || 0,
      errors: result.errors,
      firstApp: result.data?.[0] ? {
        applicationId: result.data[0].applicationId,
        userId: result.data[0].userId,
        hasDocumentKeys: !!result.data[0].supportingDocumentKeys
      } : null
    });
    
    if (!result.data || result.data.length === 0) {
      console.log('❌ No application found in database');
      // Let's also try a broader search to see what applications exist
      console.log('🔍 Trying broader search to see what applications exist...');
      const broadResult = await (cookiesClient.models as any).CityPassApplication.list({
        limit: 5
      });
      console.log('📊 Broader search result:', {
        foundApps: broadResult.data?.length || 0,
        applicationIds: broadResult.data?.map((app: any) => app.applicationId) || []
      });
      
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const application = result.data[0];
    
    console.log('📋 Application found:', {
      applicationId: application.applicationId,
      supportingDocumentKeys: application.supportingDocumentKeys,
      hasDocuments: !!application.supportingDocumentKeys
    });
    
    if (!application.supportingDocumentKeys) {
      console.log('❌ No supportingDocumentKeys found in application');
      return NextResponse.json({ 
        documents: [],
        message: 'No supporting documents found'
      });
    }
    
    // Parse document keys
    let documentKeys: string[] = [];
    try {
      documentKeys = JSON.parse(application.supportingDocumentKeys);
    } catch (error) {
      console.error('Error parsing document keys:', error);
      return NextResponse.json({ error: 'Invalid document keys format' }, { status: 500 });
    }
    
    console.log('📄 Found document keys:', documentKeys);
    
    // Generate signed URLs for each document
    const documentPromises = documentKeys.map(async (key, index) => {
      try {
        const urlResult = await getUrl({
          path: key,
          options: {
            expiresIn: 3600, // 1 hour expiration
          }
        });
        
        // Extract filename from key
        const filename = key.split('/').pop() || `document_${index}`;
        
        return {
          key,
          url: urlResult.url.toString(),
          filename,
          index
        };
      } catch (error) {
        console.error(`Error generating URL for document ${key}:`, error);
        return {
          key,
          url: null,
          filename: key.split('/').pop() || `document_${index}`,
          index,
          error: 'Failed to generate URL'
        };
      }
    });
    
    const documents = await Promise.all(documentPromises);
    
    console.log('✅ Generated document URLs:', documents.length);
    
    const responseData = {
      documents,
      applicationId: application.applicationId,
      applicantName: application.fullName,
      submittedAt: application.submittedAt
    };
    
    console.log('📤 Returning response:', responseData);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ Error fetching application documents:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      applicationId
    });
    return NextResponse.json({
      error: 'Failed to fetch application documents',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}