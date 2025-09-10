"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import { Amplify } from 'aws-amplify';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LogoInline } from '@/components/ui/Logo';
import { ArrowLeft, Upload, FileText, AlertCircle } from 'lucide-react';
import type { Schema } from '@/amplify/data/resource';
import outputs from '@/amplify_outputs.json';

// Ensure Amplify is configured
Amplify.configure(outputs);

const client = generateClient<Schema>({
  authMode: 'apiKey'
});

interface SevisPassData {
  uin: string;
  fullName: string;
  status: string;
}

const categories = [
  { id: 'employed', label: 'Employed Resident', description: 'Working in Port Moresby' },
  { id: 'student', label: 'Student', description: 'Enrolled in Port Moresby educational institution' },
  { id: 'property_owner', label: 'Property Owner', description: 'Own or rent property in Port Moresby' },
  { id: 'business_owner', label: 'Business Owner', description: 'Own a business in Port Moresby' },
  { id: 'dependent', label: 'Dependent', description: 'Family member of existing CityPass holder' },
  { id: 'vouched', label: 'Vouched Resident', description: 'Vouched by verified Port Moresby resident' }
];

function CityPassApplicationContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sevisPassData, setSevisPassData] = useState<SevisPassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    employerName: '',
    schoolName: '',
    propertyAddress: '',
    businessName: '',
    voucherUin: '',
    relationshipToVoucher: '',
    phoneNumber: '',
    additionalInfo: ''
  });
  const [supportingFiles, setSupportingFiles] = useState<FileList | null>(null);

  useEffect(() => {
    const loadUserAndSevisPass = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Check if user has SevisPass using API route
        console.log('🔍 Looking for SevisPass with userId:', currentUser.userId);
        
        try {
          const response = await fetch(`/api/sevispass/check-user?userId=${currentUser.userId}`);
          const result = await response.json();
          
          console.log('📊 SevisPass check result:', result);
          
          if (!response.ok || !result.hasSevisPass) {
            console.log('❌ No SevisPass found for userId:', currentUser.userId);
            setError('You must have a valid SevisPass before applying for CityPass. Please apply for SevisPass first.');
            setLoading(false);
            return;
          }

          // We have a valid SevisPass
          const sevisPassHolder = result.sevisPassData;
          console.log('✅ Found active SevisPass:', sevisPassHolder.uin);
          
          setSevisPassData({
            uin: sevisPassHolder.uin,
            fullName: sevisPassHolder.fullName,
            status: 'active'
          });
        } catch (apiError) {
          console.error('❌ SevisPass API error:', apiError);
          setError('Unable to verify SevisPass status. Please try again.');
          setLoading(false);
          return;
        }

        // Don't auto-fill phone number with email - let user enter their actual phone number
        setFormData(prev => ({
          ...prev,
          phoneNumber: ''
        }));

      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserAndSevisPass();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setSupportingFiles(files);
    setError('');
  };

  const uploadSupportingDocuments = async (applicationId: string): Promise<string[]> => {
    if (!supportingFiles || supportingFiles.length === 0) return [];

    const uploadPromises = Array.from(supportingFiles).map(async (file, index) => {
      const key = `public/citypass/applications/${applicationId}/document_${index}_${file.name}`;
      await uploadData({
        path: key,
        data: file,
        options: {
          contentType: file.type
        }
      }).result;
      return key;
    });

    return await Promise.all(uploadPromises);
  };

  const validateForm = (): boolean => {
    if (!selectedCategory) {
      setError('Please select a residency category');
      return false;
    }

    switch (selectedCategory) {
      case 'employed':
        if (!formData.employerName.trim()) {
          setError('Employer name is required for employed residents');
          return false;
        }
        break;
      case 'student':
        if (!formData.schoolName.trim()) {
          setError('School/institution name is required for students');
          return false;
        }
        break;
      case 'property_owner':
        if (!formData.propertyAddress.trim()) {
          setError('Property address is required for property owners');
          return false;
        }
        break;
      case 'business_owner':
        if (!formData.businessName.trim()) {
          setError('Business name is required for business owners');
          return false;
        }
        break;
      case 'dependent':
        if (!formData.voucherUin.trim() || !formData.relationshipToVoucher.trim()) {
          setError('Voucher UIN and relationship are required for dependents');
          return false;
        }
        break;
      case 'vouched':
        if (!formData.voucherUin.trim() || !formData.relationshipToVoucher.trim()) {
          setError('Voucher UIN and relationship are required for vouched residents');
          return false;
        }
        break;
    }

    if (!supportingFiles || supportingFiles.length === 0) {
      setError('Please upload at least one supporting document');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !sevisPassData) return;

    setSubmitting(true);
    setError('');

    try {
      // Check if user already has an application FIRST
      console.log('Checking for existing CityPass application...');
      console.log('Client debug:', { 
        client: !!client, 
        models: !!client?.models, 
        availableModels: client?.models ? Object.keys(client.models) : [],
        CityPassApplication: !!(client?.models as any)?.CityPassApplication,
        hasClient: client !== undefined,
        clientType: typeof client
      });
      
      if (!client) {
        throw new Error('Amplify client not initialized');
      }
      
      if (!client.models) {
        throw new Error('Amplify client models not available');
      }
      
      if (!(client.models as any).CityPassApplication) {
        throw new Error('CityPassApplication model not found in schema');
      }
      
      const existingResult = await (client.models as any).CityPassApplication.list({
        filter: { userId: { eq: user.userId } }
      });

      const existingApp = existingResult.data && existingResult.data.length > 0 ? existingResult.data[0] : null;
      
      // Use existing applicationId if resubmitting, otherwise generate new one
      const applicationId = existingApp?.applicationId || `CP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      console.log('📝 Using applicationId:', applicationId, existingApp ? '(reusing existing)' : '(newly generated)');

      // Upload supporting documents
      console.log('Uploading supporting documents...', supportingFiles?.length || 0, 'files');
      const documentKeys = await uploadSupportingDocuments(applicationId);
      console.log('📄 Uploaded document keys:', documentKeys);
      
      // Prepare application data
      const applicationData = {
        userId: user.userId,
        applicationId: applicationId,
        status: 'pending' as const,
        submittedAt: new Date().toISOString(),
        category: selectedCategory as any,
        fullName: sevisPassData.fullName,
        sevispassUin: sevisPassData.uin,
        phoneNumber: formData.phoneNumber,
        email: user.signInDetails?.loginId || '',
        supportingDocumentKeys: JSON.stringify(documentKeys),
        documentType: getCategoryDocumentType(selectedCategory),
        employerName: formData.employerName || undefined,
        schoolName: formData.schoolName || undefined,
        propertyAddress: formData.propertyAddress || undefined,
        businessName: formData.businessName || undefined,
        voucherUin: formData.voucherUin || undefined,
        relationshipToVoucher: formData.relationshipToVoucher || undefined,
      };

      let result;
      
      if (existingApp) {
        // Check if resubmission is allowed
        if (existingApp.status === 'pending' || existingApp.status === 'under_review') {
          throw new Error('You already have a pending CityPass application. Please wait for review to complete before resubmitting.');
        } else if (existingApp.status === 'approved') {
          throw new Error('You already have an approved CityPass application. Multiple applications are not allowed.');
        }
        
        // Update existing rejected application
        console.log('Updating existing rejected CityPass application...');
        console.log('📝 Update data:', {
          userId: user.userId,
          documentKeysToSave: applicationData.supportingDocumentKeys,
          allData: applicationData
        });
        if (!client?.models || !(client.models as any).CityPassApplication) {
          throw new Error('CityPassApplication model not available for update');
        }
        result = await (client.models as any).CityPassApplication.update({
          ...applicationData
        });
      } else {
        // Create new application
        console.log('Creating new CityPass application...');
        console.log('📝 Create data:', {
          documentKeysToSave: applicationData.supportingDocumentKeys,
          allData: applicationData
        });
        if (!client?.models || !(client.models as any).CityPassApplication) {
          throw new Error('CityPassApplication model not available for create');
        }
        result = await (client.models as any).CityPassApplication.create(applicationData);
      }

      if (result.errors && result.errors.length > 0) {
        throw new Error(`Failed to submit application: ${result.errors[0].message}`);
      }

      console.log('✅ CityPass application submitted successfully');
      console.log('💾 Saved application result:', {
        data: result.data,
        savedDocumentKeys: result.data?.supportingDocumentKeys
      });
      
      // Redirect to CityPass landing page which will show the status
      router.push('/citypass?submitted=true');

    } catch (error: any) {
      console.error('❌ CityPass application submission failed:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryDocumentType = (category: string): string => {
    const types: Record<string, string> = {
      employed: 'Employment Letter',
      student: 'Student ID / Enrollment Letter',
      property_owner: 'Property Deed / Lease Agreement',
      business_owner: 'Business License',
      dependent: 'Family Documentation',
      vouched: 'Vouching Letter'
    };
    return types[category] || 'Supporting Documents';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--background)' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error && !sevisPassData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: 'var(--card)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            border: '1px solid var(--border)'
          }}>
            <AlertCircle size={48} style={{ color: 'var(--destructive)', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
              SevisPass Required
            </h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/sevispass/apply')}
              style={{
                background: 'var(--primary)',
                color: 'black',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              Apply for SevisPass
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px solid var(--primary)',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Theme Toggle */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Back Button */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 100 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>

      <div className="container" style={{ padding: '80px 20px 40px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <LogoInline size="large" showText={true} variant="horizontal" solidYellow={true} />
          <h1 style={{ fontSize: '32px', fontWeight: '700', margin: '16px 0 8px' }}>
            Apply for CityPass
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
            Port Moresby resident credentials for city services
          </p>
        </div>

        {/* SevisPass Status */}
        {sevisPassData && (
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              ✅ SevisPass Verified
            </h3>
            <p style={{ color: 'var(--muted-foreground)', margin: '0' }}>
              <strong>{sevisPassData.fullName}</strong> • UIN: {sevisPassData.uin} • Status: {sevisPassData.status}
            </p>
          </div>
        )}

        {/* Application Form */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px'
        }}>
          <form onSubmit={handleSubmit}>
            {/* Category Selection */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '16px' 
              }}>
                Residency Category *
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '16px' 
              }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      border: selectedCategory === category.id 
                        ? '2px solid var(--primary)' 
                        : '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={() => setSelectedCategory(category.id)}
                        style={{ marginTop: '2px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {category.label}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
                          {category.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category-specific fields */}
            {selectedCategory && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                  Additional Information
                </h3>
                
                {selectedCategory === 'employed' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Employer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.employerName}
                      onChange={(e) => handleInputChange('employerName', e.target.value)}
                      placeholder="Enter your employer's name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                )}

                {selectedCategory === 'student' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      School/Institution Name *
                    </label>
                    <input
                      type="text"
                      value={formData.schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      placeholder="Enter your school or institution name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                )}

                {selectedCategory === 'property_owner' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Property Address *
                    </label>
                    <textarea
                      value={formData.propertyAddress}
                      onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                      placeholder="Enter your property address in Port Moresby"
                      required
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {selectedCategory === 'business_owner' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Enter your business name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    />
                  </div>
                )}

                {(selectedCategory === 'dependent' || selectedCategory === 'vouched') && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Voucher UIN *
                      </label>
                      <input
                        type="text"
                        value={formData.voucherUin}
                        onChange={(e) => handleInputChange('voucherUin', e.target.value)}
                        placeholder="PNG1234567890"
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          background: 'var(--input)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Relationship *
                      </label>
                      <input
                        type="text"
                        value={formData.relationshipToVoucher}
                        onChange={(e) => handleInputChange('relationshipToVoucher', e.target.value)}
                        placeholder="e.g., Spouse, Child, Friend"
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '16px',
                          background: 'var(--input)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phone Number */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+675xxxxxxxx"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  background: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </div>

            {/* Supporting Documents */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Supporting Documents * 
                {selectedCategory && (
                  <span style={{ color: 'var(--muted-foreground)', fontWeight: '400' }}>
                    ({getCategoryDocumentType(selectedCategory)})
                  </span>
                )}
              </label>
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload size={32} style={{ color: 'var(--muted-foreground)', marginBottom: '8px' }} />
                <p style={{ marginBottom: '8px' }}>Click to upload supporting documents</p>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Maximum 5 files, PDF, JPG, PNG accepted
                </p>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              {supportingFiles && supportingFiles.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Selected Files:
                  </p>
                  {Array.from(supportingFiles).map((file, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '14px',
                      color: 'var(--muted-foreground)',
                      marginBottom: '4px'
                    }}>
                      <FileText size={16} />
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.5)',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '16px',
                background: submitting ? '#9CA3AF' : 'var(--primary)',
                color: submitting ? 'white' : 'black',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting Application...' : 'Submit CityPass Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CityPassApplicationPage() {
  return (
    <AuthGuard>
      <CityPassApplicationContent />
    </AuthGuard>
  );
}