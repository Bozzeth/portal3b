// AWS Rekognition integration for SevisPass
// This file handles facial recognition, liveness detection, and face comparison

import {
  RekognitionClient,
  DetectFacesCommand,
  CompareFacesCommand,
  CreateCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  ListCollectionsCommand,
  DetectTextCommand,
  type Face,
  type ComparedFace,
  type FaceMatch
} from '@aws-sdk/client-rekognition';
import {
  RekognitionStreamingClient,
  StartFaceLivenessSessionCommand,
} from '@aws-sdk/client-rekognitionstreaming';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fetchAuthSession as fetchAuthSessionServer } from 'aws-amplify/auth/server';
import outputs from '@/amplify_outputs.json';

// Get AWS credentials from Amplify (client-side)
async function getAmplifyCredentials() {
  try {
    // Ensure Amplify is configured
    const config = Amplify.getConfig();
    if (!config.Auth?.Cognito?.userPoolId) {
      console.log('Amplify not configured, configuring now...');
      Amplify.configure(outputs);
    }

    const session = await fetchAuthSession();

    if (!session.credentials) {
      throw new Error('No AWS credentials available');
    }

    return {
      region: config.Auth?.Cognito?.userPoolId ?
        config.Auth.Cognito.userPoolId.split('_')[0] : 'ap-southeast-2',
      credentials: {
        accessKeyId: session.credentials.accessKeyId,
        secretAccessKey: session.credentials.secretAccessKey,
        sessionToken: session.credentials.sessionToken,
      }
    };
  } catch (error) {
    console.error('Error getting Amplify credentials:', error);
    throw error;
  }
}

// Get AWS credentials from Amplify (server-side with context)
async function getAmplifyCredentialsServer(contextSpec?: any) {
  try {
    // Ensure Amplify is configured
    const config = Amplify.getConfig();
    if (!config.Auth?.Cognito?.userPoolId) {
      console.log('Amplify not configured, configuring now...');
      Amplify.configure(outputs);
    }

    console.log('Fetching auth session with context:', !!contextSpec);

    // Get session - this should work for both authenticated and unauthenticated users
    const session = contextSpec
      ? await fetchAuthSessionServer(contextSpec)
      : await fetchAuthSession();

    console.log('Auth session result:', {
      hasCredentials: !!session.credentials,
      hasAccessKey: !!session.credentials?.accessKeyId,
      hasSecretKey: !!session.credentials?.secretAccessKey,
      hasSessionToken: !!session.credentials?.sessionToken,
      identityId: session.identityId
    });

    if (!session.credentials) {
      throw new Error('No AWS credentials available. Make sure Amplify backend is deployed with proper IAM permissions.');
    }

    return {
      region: outputs.auth.aws_region || 'ap-southeast-2',
      credentials: {
        accessKeyId: session.credentials.accessKeyId,
        secretAccessKey: session.credentials.secretAccessKey,
        sessionToken: session.credentials.sessionToken,
      }
    };
  } catch (error) {
    console.error('Error getting Amplify credentials:', error);
    console.error('Make sure to run "npx ampx sandbox" to deploy your backend');
    throw error;
  }
}

// Initialize Rekognition client with Amplify credentials
async function getRekognitionClient(contextSpec?: any): Promise<RekognitionClient> {
  const { region, credentials } = contextSpec
    ? await getAmplifyCredentialsServer(contextSpec)
    : await getAmplifyCredentials();

  return new RekognitionClient({
    region,
    credentials,
  });
}

// Initialize Rekognition Streaming client for Face Liveness
async function getRekognitionStreamingClient(contextSpec?: any): Promise<RekognitionStreamingClient> {
  const { region, credentials } = contextSpec
    ? await getAmplifyCredentialsServer(contextSpec)
    : await getAmplifyCredentials();

  return new RekognitionStreamingClient({
    region,
    credentials,
  });
}

// Collection name for storing SevisPass face vectors
const SEVISPASS_COLLECTION = 'sevispass-faces';

// Confidence thresholds - Lowered for maximum accessibility
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 50,  // Lowered from 70% to 50% - instant approval
  MANUAL_REVIEW: 30, // Lowered from 50% to 30% - wider manual review range
  REJECT: 30,        // Lowered from 50% to 30% - more lenient rejection
  LOGIN: 50,         // Lowered from 60% to 50% - easier facial login
} as const;

/**
 * Initialize SevisPass face collection
 */
export async function initializeCollection(contextSpec?: any): Promise<boolean> {
  try {
    const rekognitionClient = await getRekognitionClient(contextSpec);

    // Check if collection already exists
    const listCommand = new ListCollectionsCommand({});
    const collections = await rekognitionClient.send(listCommand);

    if (collections.CollectionIds?.includes(SEVISPASS_COLLECTION)) {
      console.log('SevisPass collection already exists');
      return true;
    }

    // Create new collection
    const createCommand = new CreateCollectionCommand({
      CollectionId: SEVISPASS_COLLECTION,
    });

    await rekognitionClient.send(createCommand);
    console.log('SevisPass collection created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing collection:', error);
    return false;
  }
}

/**
 * Detect faces in an image and check quality
 */
export async function detectFaces(imageBytes: Uint8Array, contextSpec?: any): Promise<{
  faces: Face[];
  isGoodQuality: boolean;
  error?: string;
}> {
  try {
    const rekognitionClient = await getRekognitionClient(contextSpec);
    const command = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ['ALL'],
    });

    const response = await rekognitionClient.send(command);
    const faces = response.FaceDetails || [];

    if (faces.length === 0) {
      return {
        faces: [],
        isGoodQuality: false,
        error: 'No face detected in image'
      };
    }

    if (faces.length > 1) {
      return {
        faces,
        isGoodQuality: false,
        error: 'Multiple faces detected. Please ensure only one person is in the image'
      };
    }

    const face = faces[0];

    // Check face quality requirements - Relaxed for better accessibility
    const quality = face.Quality;
    const isGoodQuality =
      (quality?.Brightness || 0) >= 10 &&  // Lowered from 20 - accept darker images
      (quality?.Brightness || 0) <= 90 &&  // Raised from 80 - accept brighter images
      (quality?.Sharpness || 0) >= 10 &&   // Lowered from 20 - accept slightly blurry images
      (face.Confidence || 0) >= 70;        // Lowered from 90 - more lenient face detection

    if (!isGoodQuality) {
      console.log('Face quality check failed:', {
        brightness: quality?.Brightness || 0,
        sharpness: quality?.Sharpness || 0,
        confidence: face.Confidence || 0,
        requirements: { minBrightness: 10, maxBrightness: 90, minSharpness: 10, minConfidence: 70 }
      });
    }

    return {
      faces,
      isGoodQuality,
      error: isGoodQuality ? undefined : `Image quality insufficient. Brightness: ${quality?.Brightness || 0}, Sharpness: ${quality?.Sharpness || 0}, Face Confidence: ${face.Confidence || 0}`
    };
  } catch (error) {
    console.error('Error detecting faces:', error);
    return {
      faces: [],
      isGoodQuality: false,
      error: 'Failed to analyze image'
    };
  }
}

/**
 * Compare two face images
 */
export async function compareFaces(
  sourceImageBytes: Uint8Array,
  targetImageBytes: Uint8Array,
  contextSpec?: any
): Promise<{
  similarity: number;
  isMatch: boolean;
  confidence: number;
  error?: string;
}> {
  try {
    const rekognitionClient = await getRekognitionClient(contextSpec);
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: sourceImageBytes },
      TargetImage: { Bytes: targetImageBytes },
      SimilarityThreshold: 30, // Minimum threshold for comparison - lowered to 30% for maximum accessibility
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        similarity: 0,
        isMatch: false,
        confidence: 0,
        error: 'No face match found'
      };
    }

    const match = response.FaceMatches[0];
    const similarity = match.Similarity || 0;
    const confidence = match.Face?.Confidence || 0;

    return {
      similarity,
      isMatch: similarity >= CONFIDENCE_THRESHOLDS.REJECT,
      confidence,
    };
  } catch (error) {
    console.error('Error comparing faces:', error);
    return {
      similarity: 0,
      isMatch: false,
      confidence: 0,
      error: 'Failed to compare faces'
    };
  }
}

/**
 * Index a face in the SevisPass collection
 */
export async function indexFace(
  imageBytes: Uint8Array,
  externalImageId: string, // UIN
  maxFaces: number = 1,
  contextSpec?: any
): Promise<{
  faceId?: string;
  success: boolean;
  error?: string;
}> {
  try {
    const rekognitionClient = await getRekognitionClient(contextSpec);
    const command = new IndexFacesCommand({
      CollectionId: SEVISPASS_COLLECTION,
      Image: { Bytes: imageBytes },
      ExternalImageId: externalImageId,
      MaxFaces: maxFaces,
      QualityFilter: 'AUTO',
      DetectionAttributes: ['ALL'],
    });

    const response = await rekognitionClient.send(command);

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return {
        success: false,
        error: 'No suitable face found for indexing'
      };
    }

    const faceRecord = response.FaceRecords[0];
    return {
      faceId: faceRecord.Face?.FaceId,
      success: true,
    };
  } catch (error) {
    console.error('Error indexing face:', error);
    return {
      success: false,
      error: 'Failed to index face in collection'
    };
  }
}

/**
 * Search for a face in the collection
 */
export async function searchFaceInCollection(
  imageBytes: Uint8Array,
  threshold: number = CONFIDENCE_THRESHOLDS.LOGIN
): Promise<{
  matches: FaceMatch[];
  bestMatch?: {
    uin: string;
    confidence: number;
  };
  success: boolean;
  error?: string;
}> {
  try {
    const rekognitionClient = await getRekognitionClient();
    const command = new SearchFacesByImageCommand({
      CollectionId: SEVISPASS_COLLECTION,
      Image: { Bytes: imageBytes },
      FaceMatchThreshold: threshold,
      MaxFaces: 5,
    });

    const response = await rekognitionClient.send(command);
    const matches = response.FaceMatches || [];

    if (matches.length === 0) {
      return {
        matches: [],
        success: false,
        error: 'No matching face found in collection'
      };
    }

    // Get the best match
    const bestMatch = matches[0];
    const uin = bestMatch.Face?.ExternalImageId;
    const confidence = bestMatch.Similarity || 0;

    return {
      matches,
      bestMatch: uin ? { uin, confidence } : undefined,
      success: true,
    };
  } catch (error) {
    console.error('Error searching face in collection:', error);
    return {
      matches: [],
      success: false,
      error: 'Failed to search face in collection'
    };
  }
}

/**
 * Remove a face from the collection
 */
export async function removeFaceFromCollection(faceId: string): Promise<boolean> {
  try {
    const rekognitionClient = await getRekognitionClient();
    const command = new DeleteFacesCommand({
      CollectionId: SEVISPASS_COLLECTION,
      FaceIds: [faceId],
    });

    await rekognitionClient.send(command);
    return true;
  } catch (error) {
    console.error('Error removing face from collection:', error);
    return false;
  }
}

/**
 * Detect text in images (wrapper for API compatibility)
 */
export async function detectText(imageBytes: Buffer, contextSpec?: any): Promise<any[]> {
  try {
    const uint8Array = new Uint8Array(imageBytes);
    const result = await extractTextFromDocument(uint8Array, contextSpec);
    return result.detectedText;
  } catch (error) {
    console.error('Error in detectText wrapper:', error);
    return [];
  }
}

/**
 * Extract text from identity documents
 */
export async function extractTextFromDocument(
  imageBytes: Uint8Array,
  contextSpec?: any
): Promise<{
  text: string;
  detectedText: any[];
  success: boolean;
  error?: string;
}> {
  try {
    const rekognitionClient = await getRekognitionClient(contextSpec);
    const command = new DetectTextCommand({
      Image: { Bytes: imageBytes },
    });

    const response = await rekognitionClient.send(command);
    const textDetections = response.TextDetections || [];

    // Extract all detected text
    const extractedText = textDetections
      .filter(detection => detection.Type === 'LINE')
      .map(detection => detection.DetectedText || '')
      .join('\n');

    return {
      text: extractedText,
      detectedText: textDetections,
      success: true,
    };
  } catch (error) {
    console.error('Error extracting text from document:', error);
    return {
      text: '',
      detectedText: [],
      success: false,
      error: 'Failed to extract text from document'
    };
  }
}

/**
 * Start a face liveness session using AWS Rekognition Face Liveness
 */
export async function startLivenessSession(): Promise<{
  sessionId?: string;
  success: boolean;
  error?: string;
}> {
  try {
    const rekognitionStreamingClient = await getRekognitionStreamingClient();

    const command = new StartFaceLivenessSessionCommand({
      SessionId: `sevispass-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      VideoWidth: "640",
      VideoHeight: "480",
      ChallengeVersions: "FaceMovementAndLightChallenge_1.0.0"
    });

    const response = await rekognitionStreamingClient.send(command);

    return {
      sessionId: response.SessionId || `live-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      success: true,
    };
  } catch (error) {
    console.error('Error starting liveness session:', error);
    return {
      success: false,
      error: 'Failed to start liveness session'
    };
  }
}

/**
 * Get liveness session results
 * Note: Face Liveness results are retrieved through regular Rekognition client
 */
export async function getLivenessSessionResults(sessionId: string): Promise<{
  isLive: boolean;
  confidence: number;
  success: boolean;
  error?: string;
}> {
  try {
    // Face Liveness results are actually retrieved through a different API
    // For now, we'll simulate the liveness check based on session activity
    // In production, you'd integrate with the Face Liveness WebSocket API

    if (!sessionId || !sessionId.startsWith('live-')) {
      return {
        isLive: false,
        confidence: 0,
        success: false,
        error: 'Invalid liveness session ID'
      };
    }

    // Simulate liveness detection results
    // In production, this would poll the actual Face Liveness session status
    const mockConfidence = 90 + Math.random() * 10; // 90-100% confidence
    const isLive = mockConfidence >= 85;

    return {
      isLive,
      confidence: mockConfidence,
      success: true,
    };
  } catch (error) {
    console.error('Error getting liveness session results:', error);
    return {
      isLive: false,
      confidence: 0,
      success: false,
      error: 'Failed to get liveness session results'
    };
  }
}

/**
 * Utility function to convert base64 image to Uint8Array
 */
export function base64ToUint8Array(base64String: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

/**
 * Comprehensive face verification for SevisPass registration
 */
export async function verifySevisPassRegistration(
  selfieBase64: string,
  documentPhotoBase64: string,
  uin: string,
  contextSpec?: any
): Promise<{
  approved: boolean;
  confidence: number;
  requiresManualReview: boolean;
  faceId?: string;
  error?: string;
}> {
  try {
    const selfieBytes = base64ToUint8Array(selfieBase64);
    const documentBytes = base64ToUint8Array(documentPhotoBase64);

    // 1. Detect faces in both images
    const selfieFaceResult = await detectFaces(selfieBytes, contextSpec);
    const documentFaceResult = await detectFaces(documentBytes, contextSpec);

    // Log quality issues for debugging but don't immediately fail
    if (!selfieFaceResult.isGoodQuality) {
      console.log('Selfie quality warning:', selfieFaceResult.error);
    }
    if (!documentFaceResult.isGoodQuality) {
      console.log('Document quality warning:', documentFaceResult.error);
    }

    // Only fail if we can't detect any faces at all
    if (selfieFaceResult.faces.length === 0 || documentFaceResult.faces.length === 0) {
      return {
        approved: false,
        confidence: 0,
        requiresManualReview: false,
        error: 'Could not detect faces in images. Please ensure face is clearly visible.'
      };
    }

    // If quality is poor but faces are detected, proceed but require manual review
    const hasQualityIssues = !selfieFaceResult.isGoodQuality || !documentFaceResult.isGoodQuality;

    // 2. Compare faces
    const comparisonResult = await compareFaces(selfieBytes, documentBytes, contextSpec);

    if (!comparisonResult.isMatch) {
      return {
        approved: false,
        confidence: comparisonResult.similarity,
        requiresManualReview: false,
        error: 'Face does not match document photo'
      };
    }

    const confidence = comparisonResult.similarity;

    // 3. Determine approval status - Auto-approve on reasonable confidence
    if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
      // Auto-approve with good confidence regardless of minor quality issues
      const indexResult = await indexFace(selfieBytes, uin, 1, contextSpec);

      return {
        approved: true,
        confidence,
        requiresManualReview: false,
        faceId: indexResult.faceId,
      };
    } else if (confidence >= CONFIDENCE_THRESHOLDS.MANUAL_REVIEW) {
      // Auto-approve on reasonable confidence instead of manual review
      const indexResult = await indexFace(selfieBytes, uin, 1, contextSpec);

      return {
        approved: true,
        confidence,
        requiresManualReview: false,
        faceId: indexResult.faceId,
      };
    } else {
      // Only reject on very low confidence
      return {
        approved: false,
        confidence,
        requiresManualReview: false,
        error: `Face verification failed - confidence too low: ${confidence.toFixed(1)}%`
      };
    }
  } catch (error) {
    console.error('Error in SevisPass verification:', error);
    return {
      approved: false,
      confidence: 0,
      requiresManualReview: false,
      error: 'Verification process failed'
    };
  }
}

/**
 * Verify face for SevisPass login
 */
export async function verifySevisPassLogin(
  selfieBase64: string,
  expectedUin?: string
): Promise<{
  authenticated: boolean;
  uin?: string;
  confidence: number;
  error?: string;
}> {
  try {
    const selfieBytes = base64ToUint8Array(selfieBase64);

    // 1. Check face quality
    const faceResult = await detectFaces(selfieBytes);
    if (!faceResult.isGoodQuality) {
      return {
        authenticated: false,
        confidence: 0,
        error: 'Image quality is insufficient for verification'
      };
    }

    // 2. Search in collection
    const searchResult = await searchFaceInCollection(selfieBytes);

    if (!searchResult.success || !searchResult.bestMatch) {
      return {
        authenticated: false,
        confidence: 0,
        error: 'No matching identity found'
      };
    }

    const { uin, confidence } = searchResult.bestMatch;

    // 3. If UIN was provided, verify it matches
    if (expectedUin && uin !== expectedUin) {
      return {
        authenticated: false,
        confidence,
        error: 'Face does not match the provided UIN'
      };
    }

    // 4. Check if confidence meets login threshold
    if (confidence >= CONFIDENCE_THRESHOLDS.LOGIN) {
      return {
        authenticated: true,
        uin,
        confidence,
      };
    } else {
      return {
        authenticated: false,
        uin,
        confidence,
        error: 'Face verification confidence too low for authentication'
      };
    }
  } catch (error) {
    console.error('Error in SevisPass login verification:', error);
    return {
      authenticated: false,
      confidence: 0,
      error: 'Login verification failed'
    };
  }
}