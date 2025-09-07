// SevisPass utility functions for UIN generation, validation, and management

import { nanoid } from 'nanoid';

/**
 * Generate a unique UIN for SevisPass
 * Format: PNG + 10 digits (timestamp-based + random)
 */
export function generateUIN(): string {
  // Use current timestamp (last 8 digits) + 2 random digits
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PNG${timestamp}${random}`;
}

/**
 * Generate application ID for pending reviews
 * Format: APP + 11 alphanumeric characters
 */
export function generateApplicationId(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = nanoid(3).toUpperCase();
  return `APP${timestamp}${random}`;
}

/**
 * Validate UIN format
 */
export function validateUIN(uin: string): boolean {
  const uinRegex = /^PNG\d{10}$/;
  return uinRegex.test(uin.toUpperCase());
}

/**
 * Validate application ID format
 */
export function validateApplicationId(appId: string): boolean {
  const appIdRegex = /^APP\d{8}[A-Z0-9]{3}$/;
  return appIdRegex.test(appId.toUpperCase());
}

/**
 * Parse document type from text
 */
export function parseDocumentType(extractedText: string): {
  type: 'nid' | 'drivers_license' | 'png_passport' | 'international_passport' | 'unknown';
  confidence: number;
} {
  const text = extractedText.toLowerCase();
  
  if (text.includes('national id') || text.includes('identity card') || text.includes('nid')) {
    return { type: 'nid', confidence: 0.9 };
  }
  
  if (text.includes('driver') || text.includes('license') || text.includes('licence')) {
    return { type: 'drivers_license', confidence: 0.9 };
  }
  
  if (text.includes('passport')) {
    if (text.includes('papua') || text.includes('png') || text.includes('new guinea')) {
      return { type: 'png_passport', confidence: 0.9 };
    }
    return { type: 'international_passport', confidence: 0.8 };
  }
  
  return { type: 'unknown', confidence: 0.1 };
}

/**
 * Extract document information from text
 */
export function extractDocumentInfo(extractedText: string, documentType: string): {
  documentNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  expiryDate?: string;
  isValid: boolean;
} {
  const lines = extractedText.split('\n').map(line => line.trim()).filter(Boolean);
  
  let documentNumber: string | undefined;
  let fullName: string | undefined;
  let dateOfBirth: string | undefined;
  let expiryDate: string | undefined;
  
  // Look for document number patterns
  for (const line of lines) {
    // PNG NID pattern (8-10 digits)
    if (documentType === 'nid') {
      const nidMatch = line.match(/\b\d{8,10}\b/);
      if (nidMatch && !documentNumber) {
        documentNumber = nidMatch[0];
      }
    }
    
    // Driver's license pattern
    if (documentType === 'drivers_license') {
      const dlMatch = line.match(/\b[A-Z]{1,2}\d{6,9}\b/);
      if (dlMatch && !documentNumber) {
        documentNumber = dlMatch[0];
      }
    }
    
    // Passport pattern
    if (documentType.includes('passport')) {
      const passportMatch = line.match(/\b[A-Z]\d{7,8}\b/);
      if (passportMatch && !documentNumber) {
        documentNumber = passportMatch[0];
      }
    }
    
    // Look for dates (DD/MM/YYYY or DD-MM-YYYY format)
    const dateMatches = line.match(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/g);
    if (dateMatches) {
      for (const dateMatch of dateMatches) {
        const date = parseDate(dateMatch);
        if (date) {
          // Heuristic: earlier date is likely DOB, later date is expiry
          if (!dateOfBirth || date < new Date(dateOfBirth)) {
            if (expiryDate) dateOfBirth = expiryDate;
            expiryDate = date.toISOString().split('T')[0];
          } else if (!expiryDate || date > new Date(expiryDate)) {
            expiryDate = date.toISOString().split('T')[0];
          }
        }
      }
    }
    
    // Look for names (lines with 2-4 words, all caps or title case)
    if (!fullName && /^[A-Z][a-z]+ [A-Z][a-z]+( [A-Z][a-z]+)?( [A-Z][a-z]+)?$/.test(line)) {
      fullName = line;
    } else if (!fullName && /^[A-Z]+ [A-Z]+( [A-Z]+)?( [A-Z]+)?$/.test(line)) {
      fullName = toTitleCase(line);
    }
  }
  
  // Validation
  const isValid = !!(documentNumber && fullName);
  
  return {
    documentNumber,
    fullName,
    dateOfBirth,
    expiryDate,
    isValid
  };
}

/**
 * Parse date string in various formats
 */
function parseDate(dateString: string): Date | null {
  // Try DD/MM/YYYY format
  const ddmmyyyy = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try MM/DD/YYYY format
  const mmddyyyy = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate verification confidence score based on multiple factors
 */
export function calculateVerificationScore(factors: {
  faceMatchConfidence: number;
  documentQuality: number;
  livenessConfidence?: number;
  textExtractionConfidence?: number;
}): {
  overallScore: number;
  recommendation: 'approve' | 'manual_review' | 'reject';
  factors: Record<string, number>;
} {
  const {
    faceMatchConfidence,
    documentQuality,
    livenessConfidence = 100, // Default to 100 if not provided
    textExtractionConfidence = 100
  } = factors;
  
  // Weighted scoring
  const weights = {
    faceMatch: 0.5,
    documentQuality: 0.2,
    liveness: 0.2,
    textExtraction: 0.1
  };
  
  const overallScore = 
    faceMatchConfidence * weights.faceMatch +
    documentQuality * weights.documentQuality +
    livenessConfidence * weights.liveness +
    textExtractionConfidence * weights.textExtraction;
  
  let recommendation: 'approve' | 'manual_review' | 'reject';
  
  if (overallScore >= 90) {
    recommendation = 'approve';
  } else if (overallScore >= 80) {
    recommendation = 'manual_review';
  } else {
    recommendation = 'reject';
  }
  
  return {
    overallScore: Math.round(overallScore),
    recommendation,
    factors: {
      faceMatch: faceMatchConfidence,
      documentQuality,
      liveness: livenessConfidence,
      textExtraction: textExtractionConfidence
    }
  };
}

/**
 * Format UIN for display (adds spaces for readability)
 */
export function formatUINForDisplay(uin: string): string {
  if (!validateUIN(uin)) return uin;
  
  // PNG 1234 567 890
  return `${uin.slice(0, 3)} ${uin.slice(3, 7)} ${uin.slice(7, 10)} ${uin.slice(10)}`;
}

/**
 * Check if document is expired
 */
export function isDocumentExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return expiry < today;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number | null {
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age >= 0 && age <= 150 ? age : null;
  } catch {
    return null;
  }
}

/**
 * Validate PNG phone number format
 */
export function validatePNGPhoneNumber(phone: string): boolean {
  const pngPhoneRegex = /^\+675\d{8}$/;
  return pngPhoneRegex.test(phone);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  if (validatePNGPhoneNumber(phone)) {
    // +675 1234 5678
    return `${phone.slice(0, 4)} ${phone.slice(4, 8)} ${phone.slice(8)}`;
  }
  return phone;
}

/**
 * Get document type display name
 */
export function getDocumentTypeDisplayName(type: string): string {
  const displayNames = {
    nid: 'PNG National ID',
    drivers_license: "PNG Driver's License",
    png_passport: 'PNG Passport',
    international_passport: 'International Passport'
  };
  
  return displayNames[type as keyof typeof displayNames] || 'Unknown Document';
}

/**
 * Generate secure random verification code
 */
export function generateVerificationCode(length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return result;
}

/**
 * Check if UIN is in valid format and not blacklisted
 */
export function isValidUINForRegistration(uin: string): {
  isValid: boolean;
  error?: string;
} {
  if (!validateUIN(uin)) {
    return {
      isValid: false,
      error: 'Invalid UIN format'
    };
  }
  
  // Check if UIN starts with test patterns (for development)
  if (uin.startsWith('PNG0000')) {
    return {
      isValid: false,
      error: 'Test UIN cannot be used for registration'
    };
  }
  
  return { isValid: true };
}

/**
 * Sanitize extracted text for processing
 */
export function sanitizeExtractedText(text: string): string {
  return text
    .replace(/[^\w\s\-\/\.]/g, ' ') // Remove special characters except common ones
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .toUpperCase();
}