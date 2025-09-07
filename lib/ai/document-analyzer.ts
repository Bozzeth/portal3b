import { analyzeIdentityDocument as rekognitionAnalyze } from '../aws/rekognition';

// Types
export interface DocumentAnalysisResult {
  extractedData: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    nationality?: string;
    documentType?: string;
  };
  success: boolean;
  error?: string;
  provider: 'rekognition';
  confidence?: number;
}

export type AnalysisProvider = 'rekognition' | 'auto';

// Configuration
const ANALYSIS_CONFIG = {
  rekognition: {
    enabled: true, // Always available with AWS credentials
  }
};

console.log('📋 Document Analyzer Configuration:');
console.log('  - Using Rekognition only for document analysis');
console.log('  - Rekognition enabled:', ANALYSIS_CONFIG.rekognition.enabled);

// Rekognition wrapper
async function analyzeWithRekognition(imageBytes: Uint8Array, documentType?: string, contextSpec?: any): Promise<DocumentAnalysisResult> {
  try {
    console.log('🔍 Starting Rekognition document analysis...');
    const result = await rekognitionAnalyze(imageBytes, documentType, contextSpec);
    
    return {
      extractedData: result.extractedData,
      success: result.success,
      error: result.error,
      provider: 'rekognition',
      confidence: 0.8 // Standard confidence for Rekognition
    };
  } catch (error) {
    console.error('Rekognition analysis error:', error);
    return {
      extractedData: {},
      success: false,
      error: error instanceof Error ? error.message : 'Rekognition analysis failed',
      provider: 'rekognition'
    };
  }
}

// Main analysis function
export async function analyzeDocument(
  imageBytes: Uint8Array,
  provider: AnalysisProvider = 'auto',
  documentType?: string,
  contextSpec?: any
): Promise<DocumentAnalysisResult> {
  console.log(`Starting document analysis with provider: ${provider}, documentType: ${documentType}`);
  
  // Always use Rekognition (auto defaults to rekognition)
  return analyzeWithRekognition(imageBytes, documentType, contextSpec);
}

// Enhanced analysis with fallback (just calls main function since only one provider)
export async function analyzeDocumentWithFallback(
  imageBytes: Uint8Array,
  documentType?: string,
  contextSpec?: any
): Promise<DocumentAnalysisResult[]> {
  const result = await analyzeDocument(imageBytes, 'rekognition', documentType, contextSpec);
  return [result];
}

// Get best result (just returns the single result)
export function getBestAnalysisResult(results: DocumentAnalysisResult[]): DocumentAnalysisResult {
  return results[0] || {
    extractedData: {},
    success: false,
    error: 'No analysis results available',
    provider: 'rekognition'
  };
}

// Configuration check
export function getAnalysisCapabilities() {
  return {
    rekognition: ANALYSIS_CONFIG.rekognition.enabled,
    recommendedProvider: 'rekognition' as const
  };
}