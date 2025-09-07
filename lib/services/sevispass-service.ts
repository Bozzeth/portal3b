// SevisPass Service - Real Amplify Gen 2 DynamoDB integration
import { uploadData } from 'aws-amplify/storage';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '@/amplify/data/resource';
import { generateUIN, generateApplicationId } from '@/lib/utils/sevispass';
import { cookiesClient, publicServerClient, runWithAmplifyServerContext } from '@/lib/utils/amplifyServerUtils';

export interface SevisPassApplicationData {
  applicationId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  documentType: string;
  extractedInfo: {
    fullName: string;
    dateOfBirth: string;
    documentNumber: string;
    nationality: string;
  };
  verificationData: {
    confidence: number;
    requiresManualReview: boolean;
    faceId?: string;
  };
  uin?: string;
  issuedAt?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export class SevisPassService {
  
  /**
   * Save application to DynamoDB and upload images to S3
   */
  static async saveApplication(
    userId: string, 
    applicationData: Omit<SevisPassApplicationData, 'userId'>,
    documentImageBase64: string,
    selfieImageBase64: string,
    contextSpec: any
  ): Promise<void> {
    try {
      console.log('Starting saveApplication for userId:', userId);
      
      // Upload images to S3 using public prefix (temporary - TODO: implement proper server-side auth)
      const documentKey = `public/sevispass/documents/${userId}/${applicationData.applicationId}/document.jpg`;
      const selfieKey = `public/sevispass/faces/${userId}/${applicationData.applicationId}/selfie.jpg`;
      console.log('S3 keys generated:', { documentKey, selfieKey });

      // Convert base64 to blob
      const documentBlob = base64ToBlob(documentImageBase64);
      const selfieBlob = base64ToBlob(selfieImageBase64);

      console.log('Starting S3 uploads using direct uploadData');
      // Upload to S3 using direct uploadData (guest access)
      await Promise.all([
        uploadData({
          path: documentKey,
          data: documentBlob,
          options: {
            contentType: 'image/jpeg'
          }
        }).result,
        uploadData({
          path: selfieKey,
          data: selfieBlob,
          options: {
            contentType: 'image/jpeg'
          }
        }).result
      ]);
      console.log('S3 uploads completed');

      console.log('Starting DynamoDB SevisPassApplication create');
      
      // Prepare the application record data
      const applicationRecord = {
        userId, // This is the primary key
        applicationId: applicationData.applicationId,
        status: applicationData.status,
        submittedAt: applicationData.submittedAt,
        documentType: applicationData.documentType,
        documentImageKey: documentKey,
        selfieImageKey: selfieKey,
        fullName: applicationData.extractedInfo.fullName,
        dateOfBirth: applicationData.extractedInfo.dateOfBirth,
        documentNumber: applicationData.extractedInfo.documentNumber,
        nationality: applicationData.extractedInfo.nationality,
        confidence: applicationData.verificationData.confidence,
        requiresManualReview: applicationData.verificationData.requiresManualReview,
        faceId: applicationData.verificationData.faceId,
        uin: applicationData.uin,
        issuedAt: applicationData.issuedAt,
        rejectionReason: applicationData.rejectionReason,
        reviewedBy: applicationData.reviewedBy,
        reviewedAt: applicationData.reviewedAt,
      };

      console.log('📅 Application record issuedAt field:', applicationRecord.issuedAt);
      console.log('📅 Application record submittedAt field:', applicationRecord.submittedAt);
      console.log('Application record data:', JSON.stringify(applicationRecord, null, 2));

      // Try public client first (simpler approach, no server context needed)
      console.log('Attempting create with public client...');
      try {
        const result = await publicServerClient.models.SevisPassApplication.create(applicationRecord);
        console.log('✅ Public client create result:', { success: !!result.data, errors: result.errors });
        if (result.data) {
          console.log('✅ Created application record with ID:', result.data.userId);
        } else if (result.errors && result.errors.length > 0) {
          console.error('❌ Public client create errors:', result.errors);
          throw new Error(`Public client errors: ${JSON.stringify(result.errors)}`);
        } else {
          throw new Error('Public client returned no data and no errors');
        }
      } catch (error) {
        console.error('❌ Public client create failed:', error);
        throw error;
      }
      console.log('DynamoDB SevisPassApplication created successfully');

      // If approved, also create SevisPassHolder record
      if (applicationData.status === 'approved' && applicationData.uin) {
        console.log('Creating SevisPassHolder record');
        
        // Prepare the holder record data
        const holderRecord = {
          uin: applicationData.uin, // This is the primary key for SevisPassHolder
          userId,
          fullName: applicationData.extractedInfo.fullName,
          dateOfBirth: applicationData.extractedInfo.dateOfBirth,
          documentNumber: applicationData.extractedInfo.documentNumber,
          nationality: applicationData.extractedInfo.nationality,
          issuedAt: applicationData.issuedAt!,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          status: 'active' as const, // Explicitly set default status with proper type
          faceId: applicationData.verificationData.faceId,
          documentImageKey: documentKey,
          photoImageKey: selfieKey,
        };

        console.log('📅 Holder record issuedAt field:', holderRecord.issuedAt);
        console.log('📅 Holder record expiryDate field:', holderRecord.expiryDate);
        console.log('Holder record data:', JSON.stringify(holderRecord, null, 2));

        // Try public client for holder creation (no server context needed)
        console.log('Attempting holder create with public client...');
        try {
          const result = await publicServerClient.models.SevisPassHolder.create(holderRecord);
          console.log('✅ Public client holder result:', { success: !!result.data, errors: result.errors });
          if (result.data) {
            console.log('✅ Created holder record with UIN:', result.data.uin);
          } else if (result.errors && result.errors.length > 0) {
            console.error('❌ Public client holder errors:', result.errors);
            throw new Error(`Public holder errors: ${JSON.stringify(result.errors)}`);
          } else {
            throw new Error('Public holder client returned no data and no errors');
          }
        } catch (error) {
          console.error('❌ Public client holder create failed:', error);
          throw error;
        }
        console.log('SevisPassHolder record created successfully');
      }

      console.log(`Saved SevisPass application ${applicationData.applicationId} for user ${userId}`);
    } catch (error) {
      console.error('Error saving SevisPass application:', error);
      throw new Error('Failed to save application');
    }
  }

  /**
   * Get application by user ID
   */
  static async getApplication(userId: string, request?: Request): Promise<SevisPassApplicationData | null> {
    try {
      // Try cookies client first, fallback to public client
      let applications;
      try {
        const result = await cookiesClient.models.SevisPassApplication.list({
          filter: { userId: { eq: userId } }
        });
        applications = result.data;
      } catch (authError) {
        console.log('Cookies client failed for getApplication, using public API key server client');
        const result = await publicServerClient.models.SevisPassApplication.list({
          filter: { userId: { eq: userId } }
        });
        applications = result.data;
      }

      if (!applications || applications.length === 0) {
        return null;
      }

      // Get the most recent application
      const application = applications.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )[0];

      return {
        applicationId: application.applicationId,
        status: application.status as 'pending' | 'under_review' | 'approved' | 'rejected',
        submittedAt: application.submittedAt,
        documentType: application.documentType,
        extractedInfo: {
          fullName: application.fullName || '',
          dateOfBirth: application.dateOfBirth || '',
          documentNumber: application.documentNumber || '',
          nationality: application.nationality || 'Papua New Guinea',
        },
        verificationData: {
          confidence: application.confidence || 0,
          requiresManualReview: application.requiresManualReview || false,
          faceId: application.faceId || undefined,
        },
        uin: application.uin || undefined,
        issuedAt: application.issuedAt || undefined,
        rejectionReason: application.rejectionReason || undefined,
        reviewedBy: application.reviewedBy || undefined,
        reviewedAt: application.reviewedAt || undefined,
      };
    } catch (error) {
      console.error('Error getting application:', error);
      return null;
    }
  }

  /**
   * Get approved SevisPass holder data
   */
  static async getSevisPassHolder(userId: string, request?: Request): Promise<any | null> {
    try {
      console.log('🔍 getSevisPassHolder called for userId:', userId);
      let holders;
      try {
        console.log('🔄 Trying cookiesClient for SevisPassHolder...');
        const result = await cookiesClient.models.SevisPassHolder.list({
          filter: { userId: { eq: userId }, status: { eq: 'active' } }
        });
        holders = result.data;
        console.log('✅ cookiesClient result:', holders?.length || 0, 'holders found');
      } catch (authError) {
        console.log('❌ Cookies client failed for getSevisPassHolder, using public API key server client');
        console.log('Auth error details:', authError.message);
        const result = await publicServerClient.models.SevisPassHolder.list({
          filter: { userId: { eq: userId }, status: { eq: 'active' } }
        });
        holders = result.data;
        console.log('✅ publicServerClient result:', holders?.length || 0, 'holders found');
      }

      console.log('📊 Final holders array:', holders);
      if (!holders || holders.length === 0) {
        console.log('❌ No holders found for userId:', userId);
        return null;
      }

      const holder = holders[0];
      
      // Get photo URL from S3
      let photoUrl = undefined;
      if (holder.photoImageKey && typeof holder.photoImageKey === 'string') {
        try {
          // Use direct getUrl without server context
          const urlResult = await getUrl({
            path: holder.photoImageKey as string
          });
          photoUrl = urlResult.url.toString();
        } catch (error) {
          console.error('Error getting photo URL:', error);
        }
      }

      return {
        uin: holder.uin,
        fullName: holder.fullName,
        dateOfBirth: holder.dateOfBirth,
        documentNumber: holder.documentNumber,
        nationality: holder.nationality,
        issuedDate: holder.issuedAt,
        expiryDate: holder.expiryDate,
        status: holder.status,
        photo: photoUrl,
      };
    } catch (error) {
      console.error('Error getting SevisPass holder:', error);
      return null;
    }
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    userId: string,
    status: 'pending' | 'under_review' | 'approved' | 'rejected',
    additionalData?: Partial<SevisPassApplicationData>
  ): Promise<boolean> {
    try {
      const { data: applications } = await cookiesClient.models.SevisPassApplication.list({
        filter: { userId: { eq: userId } }
      });

      if (!applications || applications.length === 0) {
        return false;
      }

      const application = applications[0];
      
      await cookiesClient.models.SevisPassApplication.update({
        userId: application.userId,
        status,
        ...additionalData && {
          uin: additionalData.uin,
          issuedAt: additionalData.issuedAt,
          rejectionReason: additionalData.rejectionReason,
          reviewedBy: additionalData.reviewedBy,
          reviewedAt: additionalData.reviewedAt,
        }
      });

      console.log(`Updated application ${application.applicationId} to status: ${status}`);

      // If approved, create SevisPassHolder record
      if (status === 'approved' && additionalData?.uin) {
        console.log('Creating SevisPassHolder record for approved application');
        
        const holderRecord = {
          uin: additionalData.uin,
          userId,
          fullName: application.fullName || '',
          dateOfBirth: application.dateOfBirth || '',
          documentNumber: application.documentNumber || '',
          nationality: application.nationality || 'Papua New Guinea',
          issuedAt: additionalData.issuedAt!,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active' as const,
          faceId: application.faceId,
          documentImageKey: application.documentImageKey,
          photoImageKey: application.selfieImageKey,
        };

        console.log('Creating holder record:', JSON.stringify(holderRecord, null, 2));

        try {
          const result = await publicServerClient.models.SevisPassHolder.create(holderRecord);
          if (result.data) {
            console.log('✅ Created SevisPassHolder record with UIN:', result.data.uin);
          } else if (result.errors?.length) {
            console.error('❌ SevisPassHolder creation errors:', result.errors);
          }
        } catch (holderError) {
          console.error('❌ Failed to create SevisPassHolder record:', holderError);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating application status:', error);
      return false;
    }
  }

  /**
   * Get all pending applications for admin review
   */
  static async getAllPendingApplications(): Promise<SevisPassApplicationData[]> {
    try {
      const { data: applications } = await cookiesClient.models.SevisPassApplication.list({
        filter: {
          or: [
            { status: { eq: 'pending' } },
            { status: { eq: 'under_review' } }
          ]
        }
      });

      return applications?.map(app => ({
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
      })) || [];
    } catch (error) {
      console.error('Error getting pending applications:', error);
      return [];
    }
  }

  /**
   * Approve application and generate UIN
   */
  static async approveApplication(userId: string, reviewedBy: string): Promise<boolean> {
    const uin = generateUIN();
    return this.updateApplicationStatus(userId, 'approved', {
      uin,
      issuedAt: new Date().toISOString(),
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  }

  /**
   * Reject application with reason
   */
  static async rejectApplication(userId: string, reason: string, reviewedBy: string): Promise<boolean> {
    return this.updateApplicationStatus(userId, 'rejected', {
      rejectionReason: reason,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  }
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'image/jpeg' });
}