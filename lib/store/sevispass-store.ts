// Simple in-memory store for SevisPass applications
// In production, this would be a proper database

interface SevisPassApplication {
  userId: string;
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

// In-memory storage (would be database in production)
const applications = new Map<string, SevisPassApplication>();

export class SevisPassStore {
  
  static saveApplication(userId: string, applicationData: Omit<SevisPassApplication, 'userId'>): void {
    applications.set(userId, {
      userId,
      ...applicationData
    });
    console.log(`Saved application for user ${userId}:`, applicationData.applicationId);
  }

  static getApplication(userId: string): SevisPassApplication | null {
    const application = applications.get(userId);
    return application || null;
  }

  static updateApplicationStatus(
    userId: string, 
    status: SevisPassApplication['status'], 
    additionalData?: Partial<SevisPassApplication>
  ): boolean {
    const existing = applications.get(userId);
    if (!existing) return false;

    const updated = {
      ...existing,
      status,
      ...additionalData
    };

    applications.set(userId, updated);
    console.log(`Updated application ${existing.applicationId} to status: ${status}`);
    return true;
  }

  static getAllPendingApplications(): SevisPassApplication[] {
    return Array.from(applications.values()).filter(app => 
      app.status === 'pending' || app.status === 'under_review'
    );
  }

  static approveApplication(userId: string, uin: string, reviewedBy: string): boolean {
    return this.updateApplicationStatus(userId, 'approved', {
      uin,
      issuedAt: new Date().toISOString(),
      reviewedBy,
      reviewedAt: new Date().toISOString()
    });
  }

  static rejectApplication(userId: string, reason: string, reviewedBy: string): boolean {
    return this.updateApplicationStatus(userId, 'rejected', {
      rejectionReason: reason,
      reviewedBy,
      reviewedAt: new Date().toISOString()
    });
  }

  // Debug function to list all applications
  static getAllApplications(): SevisPassApplication[] {
    return Array.from(applications.values());
  }

  // Function to get user ID from request (simplified for demo)
  static getUserIdFromRequest(request?: any): string {
    // In production, this would extract user ID from JWT token or session
    // For now, return a demo user ID based on timestamp for testing
    return 'demo-user-' + Date.now().toString().slice(-6);
  }
}