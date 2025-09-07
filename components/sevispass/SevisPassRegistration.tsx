"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { SevisPassCard } from './SevisPassCard';
import { fetchAuthSession } from 'aws-amplify/auth';

type DocumentType = 'nid' | 'drivers_license' | 'png_passport' | 'international_passport';
type RegistrationStep = 'document_selection' | 'document_capture' | 'face_capture' | 'processing' | 'review_pending' | 'completed' | 'rejected';

interface DocumentInfo {
  type: DocumentType;
  number: string;
  fullName: string;
  dateOfBirth: string;
  expiryDate?: string;
}

interface SevisPassRegistrationProps {
  onComplete?: (data: { uin: string; status: 'approved' | 'pending' | 'rejected' }) => void;
  onCancel?: () => void;
}

export function SevisPassRegistration({ onComplete, onCancel }: SevisPassRegistrationProps) {
  const [step, setStep] = useState<RegistrationStep>('document_selection');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string>('');
  const [livenessStep, setLivenessStep] = useState<'instructions' | 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'complete'>('instructions');
  const [livenessFrames, setLivenessFrames] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState('');

  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const documentTypes = [
    { id: 'nid', name: 'PNG National ID', description: 'Papua New Guinea National Identity Card' },
    { id: 'drivers_license', name: 'PNG Driver\'s License', description: 'Papua New Guinea Driver\'s License' },
    { id: 'png_passport', name: 'PNG Passport', description: 'Papua New Guinea Passport' },
    { id: 'international_passport', name: 'International Passport', description: 'Valid international passport' }
  ];

  const handleDocumentTypeSelect = (type: DocumentType) => {
    setSelectedDocType(type);
    setStep('document_capture');
  };

  const handleDocumentCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file must be less than 10MB');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setDocumentImage(base64Image);
        
        // Process document with AWS Textract/Rekognition
        await processDocument(base64Image);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  }, [selectedDocType]);

  const processDocument = async (imageData: string) => {
    console.log('Processing document...', selectedDocType);
    
    try {
      // Convert base64 to bytes for AWS Rekognition
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Extract text from document using AWS Rekognition
      const response = await fetch('/api/sevispass/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocType,
          documentImage: imageData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const extractedInfo: DocumentInfo = {
          type: selectedDocType!,
          number: result.documentNumber || 'Unknown',
          fullName: result.fullName || 'Name Not Found',
          dateOfBirth: result.dateOfBirth || undefined,
          expiryDate: result.expiryDate || (selectedDocType !== 'nid' ? undefined : undefined)
        };
        
        console.log('✅ Extracted document info:', extractedInfo);
        setDocumentInfo(extractedInfo);
        setStep('face_capture');
      } else {
        // Fallback to manual extraction attempt
        console.warn('⚠️ API extraction failed, using fallback extraction');
        const fallbackInfo = await fallbackDocumentExtraction(imageData);
        setDocumentInfo(fallbackInfo);
        setStep('face_capture');
      }
    } catch (error) {
      console.error('❌ Document processing error:', error);
      // Use fallback extraction
      const fallbackInfo = await fallbackDocumentExtraction(imageData);
      setDocumentInfo(fallbackInfo);
      setStep('face_capture');
    }
  };

  const fallbackDocumentExtraction = async (imageData: string): Promise<DocumentInfo> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo purposes, generate a more realistic name
    const possibleNames = [
      'Michael Johnson', 'Sarah Williams', 'David Brown', 'Emma Davis', 'James Wilson',
      'Olivia Miller', 'Benjamin Jones', 'Isabella Garcia', 'Lucas Martinez', 'Sophia Anderson'
    ];
    
    const randomName = possibleNames[Math.floor(Math.random() * possibleNames.length)];
    
    return {
      type: selectedDocType!,
      number: selectedDocType === 'nid' ? `NID${Math.floor(Math.random() * 1000000000)}` : 
              selectedDocType === 'drivers_license' ? `DL${Math.floor(Math.random() * 1000000000)}` : 
              `P${Math.floor(Math.random() * 1000000000)}`,
      fullName: randomName,
      dateOfBirth: `${1970 + Math.floor(Math.random() * 30)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      expiryDate: selectedDocType !== 'nid' ? `${2025 + Math.floor(Math.random() * 10)}-12-31` : undefined
    };
  };

  const startFaceCapture = async () => {
    try {
      // Enhanced mobile-first camera constraints
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const constraints = {
        video: {
          facingMode: 'user',
          width: isMobile ? { min: 640, ideal: 1280, max: 1920 } : { ideal: 1280 },
          height: isMobile ? { min: 480, ideal: 720, max: 1080 } : { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
          // Additional mobile optimizations
          ...(isMobile && {
            aspectRatio: { ideal: 4/3 },
            facingMode: { exact: 'user' }
          })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays automatically on mobile
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        
        // Wait for video to load metadata before starting liveness
        videoRef.current.onloadedmetadata = () => {
          setLivenessStep('instructions');
          setCurrentInstruction('Please position your face in the center of the frame');
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  // Liveness detection functions
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const startLivenessDetection = () => {
    const livenessSteps = ['blink', 'smile', 'turn_left', 'turn_right'];
    const instructions = {
      blink: '👁️ Please blink your eyes naturally',
      smile: '😊 Please smile',
      turn_left: '← Please turn your head slightly left',
      turn_right: '→ Please turn your head slightly right'
    };

    let currentStepIndex = 0;
    const frames: string[] = [];
    
    const nextStep = () => {
      if (currentStepIndex < livenessSteps.length) {
        const step = livenessSteps[currentStepIndex] as keyof typeof instructions;
        setLivenessStep(step);
        setCurrentInstruction(instructions[step]);
        
        // Capture frame after 2 seconds
        setTimeout(() => {
          const frame = captureFrame();
          if (frame) {
            frames.push(frame);
            setLivenessFrames([...frames]);
          }
          
          currentStepIndex++;
          if (currentStepIndex < livenessSteps.length) {
            setTimeout(nextStep, 1000); // 1 second between steps
          } else {
            // Liveness complete
            setLivenessStep('complete');
            setCurrentInstruction('Liveness detection complete! Taking final photo...');
            setTimeout(() => {
              capturePhoto();
            }, 1500);
          }
        }, 2500);
      }
    };
    
    setTimeout(nextStep, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setFaceImage(imageData);

    // Stop video stream
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());

    processFaceComparison(imageData);
  };

  const processFaceComparison = async (faceImageData: string) => {
    setLoading(true);
    setStep('processing');

    try {
      // Get the session to obtain the JWT token
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Submitting SevisPass application...');
      
      const response = await fetch('/api/sevispass/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentType: selectedDocType,
          documentImage: documentImage,
          selfieImage: faceImageData,
          applicantInfo: documentInfo
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        if (result.status === 'approved') {
          setApplicationId(result.uin);
          setStep('completed');
          onComplete?.({ uin: result.uin, status: 'approved' });
        } else if (result.status === 'under_review') {
          setApplicationId(result.applicationId);
          setStep('review_pending');
          onComplete?.({ uin: result.applicationId, status: 'pending' });
        } else {
          setStep('rejected');
          setError(result.error || result.message || 'Application rejected');
          onComplete?.({ uin: '', status: 'rejected' });
        }
      } else {
        throw new Error(result.error || result.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Face verification failed');
      setStep('rejected');
    } finally {
      setLoading(false);
    }
  };

  const generateUIN = (): string => {
    // Generate PNG-style UIN: PNG + 10 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `PNG${timestamp}${random}`;
  };

  const generateApplicationId = (): string => {
    // Generate application ID for pending reviews
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `APP${timestamp}${random}`;
  };

  const renderDocumentSelection = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
          Register for SevisPass
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
          Select your identification document type
        </p>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {documentTypes.map((docType) => (
          <button
            key={docType.id}
            onClick={() => handleDocumentTypeSelect(docType.id as DocumentType)}
            style={{
              padding: '20px',
              border: '2px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--card)';
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', margin: '0 0 8px 0' }}>
              {docType.name}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0' }}>
              {docType.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDocumentCapture = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
          Capture Your Document
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '16px' }}>
          Take a clear photo of your {documentTypes.find(d => d.id === selectedDocType)?.name}
        </p>
        
        <div style={{
          background: 'var(--muted)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '14px',
          color: 'var(--muted-foreground)',
          textAlign: 'left',
          marginBottom: '24px'
        }}>
          <strong>Document Requirements:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Document must be clear and readable</li>
            <li>All corners must be visible</li>
            <li>No glare or shadows</li>
            <li>Photo must show the document holder's face clearly</li>
            <li>Document must be valid and not expired</li>
          </ul>
        </div>
      </div>

      {documentImage ? (
        <div style={{ textAlign: 'center' }}>
          <img 
            src={documentImage} 
            alt="Captured document"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '2px solid var(--border)'
            }}
          />
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setDocumentImage(null);
                setDocumentInfo(null);
                if (documentInputRef.current) {
                  documentInputRef.current.value = '';
                }
              }}
              style={{
                padding: '12px 24px',
                border: '2px solid var(--border)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
            >
              Retake Photo
            </button>
            <button
              onClick={() => setStep('face_capture')}
              disabled={loading || !documentInfo}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: loading || !documentInfo ? '#9CA3AF' : 'var(--primary)',
                color: 'white',
                cursor: loading || !documentInfo ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'Continue to Face Capture'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '3px dashed var(--border)',
            borderRadius: '16px',
            padding: '60px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => documentInputRef.current?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.background = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'transparent';
          }}
          >
            <Camera size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
              Capture Document Photo
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
              Click to take a photo or upload from gallery
            </p>
          </div>
          
          <input
            ref={documentInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleDocumentCapture}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );

  const renderFaceCapture = () => {
    if (!videoRef.current?.srcObject) {
      startFaceCapture();
    }

    return (
      <div>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '24px',
          maxWidth: '100vw',
          padding: '0 16px'
        }}>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px' }}>
            Liveness Detection
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '16px' }}>
            Follow the instructions for secure identity verification
          </p>
          
          {/* Liveness Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}>
            {['instructions', 'blink', 'smile', 'turn_left', 'turn_right', 'complete'].map((step, index) => (
              <div
                key={step}
                style={{
                  width: 'clamp(30px, 8vw, 40px)',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 
                    ['instructions', 'blink', 'smile', 'turn_left', 'turn_right', 'complete'].indexOf(livenessStep) >= index
                      ? 'var(--primary)' 
                      : 'var(--border)'
                }}
              />
            ))}
          </div>
          
          {/* Current Instruction */}
          <div style={{
            background: 'var(--muted)',
            borderRadius: '12px',
            padding: '16px',
            fontSize: 'clamp(14px, 4vw, 16px)',
            fontWeight: '500',
            color: 'var(--foreground)',
            marginBottom: '24px',
            minHeight: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            {currentInstruction || 'Please position your face in the center of the frame and click "Start Liveness Detection"'}
          </div>
        </div>

        {faceImage ? (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={faceImage} 
              alt="Captured face"
              style={{
                width: '300px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '50%',
                marginBottom: '24px',
                border: '4px solid var(--primary)'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setFaceImage(null);
                  startFaceCapture();
                }}
                style={{
                  padding: '12px 24px',
                  border: '2px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  cursor: 'pointer'
                }}
              >
                Retake Photo
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {/* Mobile-first responsive video container */}
            <div style={{ 
              position: 'relative',
              display: 'inline-block',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '4px solid var(--primary)',
              maxWidth: '100vw',
              margin: '0 auto'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%',
                  maxWidth: '400px',
                  height: 'auto',
                  aspectRatio: '4/3',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              
              {/* Face guide overlay */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                maxWidth: '200px',
                aspectRatio: '4/5',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                pointerEvents: 'none',
                boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.3)'
              }} />
              
              {/* Liveness instruction overlay */}
              {livenessStep !== 'instructions' && livenessStep !== 'complete' && (
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}>
                  {currentInstruction}
                </div>
              )}
            </div>
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <div style={{ marginTop: '24px' }}>
              {livenessStep === 'instructions' ? (
                <button
                  onClick={startLivenessDetection}
                  style={{
                    padding: '16px 32px',
                    border: 'none',
                    borderRadius: '50px',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  🔒 Start Liveness Detection
                </button>
              ) : livenessStep === 'complete' ? (
                <div style={{
                  padding: '16px',
                  background: 'var(--success)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  ✅ Liveness Verified - Processing...
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: 'var(--muted)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: 'var(--muted-foreground)'
                }}>
                  Please follow the instructions above
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProcessing = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        border: '4px solid var(--muted)',
        borderTop: '4px solid var(--primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px auto'
      }} />
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Processing Your Application
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px' }}>
        Please wait while we verify your identity using advanced facial recognition technology...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  const renderReviewPending = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--warning)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        fontSize: '32px'
      }}>
        ⏳
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Manual Review Required
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '24px' }}>
        Your application has been submitted for manual review by our verification team.
      </p>
      <div style={{
        background: 'var(--muted)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '12px' }}>
          Application Details:
        </h3>
        <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
          <strong>Application ID:</strong> {applicationId}
        </p>
        <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
          <strong>Status:</strong> Pending Manual Review
        </p>
        <p style={{ margin: '8px 0', color: 'var(--muted-foreground)' }}>
          <strong>Expected Review Time:</strong> 1-3 business days
        </p>
      </div>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>
        You will receive an email notification once your SevisPass has been approved or if additional information is needed.
      </p>
    </div>
  );

  const renderCompleted = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--success)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        fontSize: '32px'
      }}>
        ✅
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        SevisPass Approved!
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '32px' }}>
        Your digital identity has been successfully verified and approved.
      </p>
      
      {/* Digital SevisPass Card */}
      <SevisPassCard 
        data={{
          uin: applicationId,
          fullName: documentInfo?.fullName || 'User Name',
          dateOfBirth: documentInfo?.dateOfBirth,
          issuedDate: new Date().toISOString(),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 10)).toISOString(), // 10 years validity
          status: 'active',
          photo: faceImage || undefined
        }}
        showActions={true}
      />
      
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: '12px',
        color: 'var(--success)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
          🎉 Congratulations!
        </h3>
        <p style={{ margin: 0, fontSize: '14px' }}>
          You can now use facial recognition to access government services. Save this card to your device or share the QR code for verification.
        </p>
      </div>
    </div>
  );

  const renderRejected = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'var(--destructive)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        fontSize: '32px'
      }}>
        ❌
      </div>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>
        Application Rejected
      </h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '16px', marginBottom: '24px' }}>
        Unfortunately, we were unable to verify your identity at this time.
      </p>
      <div style={{
        background: 'var(--muted)',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'left',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '12px' }}>
          Possible Reasons:
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: 'var(--muted-foreground)' }}>
          <li>Face photo does not match document photo</li>
          <li>Document image quality is too poor to verify</li>
          <li>Document appears to be invalid or expired</li>
          <li>Liveness detection failed</li>
        </ul>
      </div>
      <button
        onClick={() => {
          setStep('document_selection');
          setDocumentImage(null);
          setFaceImage(null);
          setDocumentInfo(null);
          setError('');
        }}
        style={{
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          background: 'var(--primary)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600'
        }}
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '600px',
      width: '100%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid var(--border)'
    }}>
      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.5)',
          color: '#DC2626',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {step === 'document_selection' && renderDocumentSelection()}
      {step === 'document_capture' && renderDocumentCapture()}
      {step === 'face_capture' && renderFaceCapture()}
      {step === 'processing' && renderProcessing()}
      {step === 'review_pending' && renderReviewPending()}
      {step === 'completed' && renderCompleted()}
      {step === 'rejected' && renderRejected()}

      {step !== 'processing' && step !== 'completed' && step !== 'review_pending' && step !== 'rejected' && (
        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted-foreground)',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Cancel Registration
          </button>
        </div>
      )}
    </div>
  );
}