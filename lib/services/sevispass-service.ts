// SevisPass Service - Real Amplify Gen 2 DynamoDB integration
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '@/amplify/data/resource';
import { generateUIN, generateApplicationId } from '@/lib/utils/sevispass';

const client = generateClient<Schema>();

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
    selfieImageBase64: string
  ): Promise<void> {
    try {
      // Upload images to S3
      const documentKey = `protected/documents/${userId}/${applicationData.applicationId}/document.jpg`;
      const selfieKey = `protected/faces/${userId}/${applicationData.applicationId}/selfie.jpg`;

      // Convert base64 to blob
      const documentBlob = base64ToBlob(documentImageBase64);
      const selfieBlob = base64ToBlob(selfieImageBase64);

      // Upload to S3
      await Promise.all([
        uploadData({
          key: documentKey,
          data: documentBlob,
          options: {
            contentType: 'image/jpeg',
            accessLevel: 'protected'
          }
        }).result,
        uploadData({
          key: selfieKey,
          data: selfieBlob,
          options: {
            contentType: 'image/jpeg',
            accessLevel: 'protected'
          }
        }).result
      ]);

      // Save to DynamoDB
      await client.models.SevisPassApplication.create({
        userId,
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
      });

      // If approved, also create SevisPassHolder record
      if (applicationData.status === 'approved' && applicationData.uin) {
        await client.models.SevisPassHolder.create({
          userId,
          uin: applicationData.uin,
          fullName: applicationData.extractedInfo.fullName,
          dateOfBirth: applicationData.extractedInfo.dateOfBirth,
          documentNumber: applicationData.extractedInfo.documentNumber,
          nationality: applicationData.extractedInfo.nationality,
          issuedAt: applicationData.issuedAt!,
          expiryDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
          status: 'active',
          faceId: applicationData.verificationData.faceId,
          documentImageKey: documentKey,
          photoImageKey: selfieKey,
        });
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
  static async getApplication(userId: string): Promise<SevisPassApplicationData | null> {
    try {
      const { data: applications } = await client.models.SevisPassApplication.list({
        filter: { userId: { eq: userId } }
      });

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
  static async getSevisPassHolder(userId: string): Promise<any | null> {
    try {
      const { data: holders } = await client.models.SevisPassHolder.list({
        filter: { userId: { eq: userId }, status: { eq: 'active' } }
      });

      if (!holders || holders.length === 0) {
        return null;
      }

      const holder = holders[0];
      
      // Get photo URL from S3
      let photoUrl = undefined;
      if (holder.photoImageKey) {
        try {
          const urlResult = await getUrl({
            key: holder.photoImageKey,
            options: { accessLevel: 'protected' }
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
      const { data: applications } = await client.models.SevisPassApplication.list({
        filter: { userId: { eq: userId } }
      });

      if (!applications || applications.length === 0) {
        return false;
      }

      const application = applications[0];
      
      await client.models.SevisPassApplication.update({
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
      const { data: applications } = await client.models.SevisPassApplication.list({
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