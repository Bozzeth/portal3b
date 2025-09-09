/**
 * SevisPass Authentication Service
 * Handles integration between SevisPass facial verification and Cognito authentication
 */

import { signIn } from 'aws-amplify/auth';

export interface SevisPassAuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Complete authentication after successful SevisPass facial verification
 * This function attempts to authenticate the user using their Cognito credentials
 */
export async function completeSevisPassAuth(
  cognitoUserId: string,
  uin: string,
  userFullName: string
): Promise<SevisPassAuthResult> {
  try {
    console.log('🔐 Starting SevisPass authentication completion...', {
      cognitoUserId,
      uin,
      userFullName
    });

    // Since we don't have the user's password, we need to use a different approach
    // Option 1: Use a temporary session approach (requires custom implementation)
    // Option 2: Store in sessionStorage and redirect to a completion page
    // Option 3: Use a magic link type flow

    // For now, let's use sessionStorage to pass the verified identity
    // and let the user complete authentication on the next screen
    
    const authData = {
      cognitoUserId,
      uin,
      userFullName,
      verifiedAt: new Date().toISOString(),
      method: 'sevispass_facial'
    };

    // Store temporarily in sessionStorage (more secure than localStorage)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sevispass_auth_pending', JSON.stringify(authData));
    }

    return {
      success: true,
      redirectTo: '/auth?sevispass_verified=true'
    };

  } catch (error) {
    console.error('❌ SevisPass auth completion error:', error);
    return {
      success: false,
      error: 'Failed to complete authentication'
    };
  }
}

/**
 * Check if there's a pending SevisPass authentication
 */
export function getPendingSevisPassAuth(): {
  cognitoUserId: string;
  uin: string;
  userFullName: string;
  verifiedAt: string;
  method: string;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem('sevispass_auth_pending');
    if (!data) return null;

    const authData = JSON.parse(data);
    
    // Check if it's not too old (10 minutes)
    const verifiedAt = new Date(authData.verifiedAt).getTime();
    const now = Date.now();
    if (now - verifiedAt > 10 * 60 * 1000) {
      sessionStorage.removeItem('sevispass_auth_pending');
      return null;
    }

    return authData;
  } catch (error) {
    console.error('Error reading pending SevisPass auth:', error);
    return null;
  }
}

/**
 * Clear pending SevisPass authentication
 */
export function clearPendingSevisPassAuth(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('sevispass_auth_pending');
  }
}

/**
 * Create a temporary session for SevisPass user
 * This bypasses traditional password authentication
 */
export function createSevisPassSession(userData: {
  cognitoUserId: string;
  uin: string;
  userFullName: string;
}): void {
  if (typeof window === 'undefined') return;

  // Create a custom session indicator
  const sessionData = {
    ...userData,
    authMethod: 'sevispass_facial',
    authenticatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
  };

  sessionStorage.setItem('sevispass_session', JSON.stringify(sessionData));
  
  // Also set a flag that our auth guard can check
  sessionStorage.setItem('sevispass_authenticated', 'true');
  
  console.log('✅ SevisPass session created:', {
    uin: userData.uin,
    userFullName: userData.userFullName
  });
}

/**
 * Check if user has a valid SevisPass session
 */
export function hasValidSevisPassSession(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const sessionData = sessionStorage.getItem('sevispass_session');
    if (!sessionData) return false;

    const session = JSON.parse(sessionData);
    const expiresAt = new Date(session.expiresAt).getTime();
    
    if (Date.now() > expiresAt) {
      // Session expired
      clearSevisPassSession();
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current SevisPass session data
 */
export function getSevisPassSession(): {
  cognitoUserId: string;
  uin: string;
  userFullName: string;
  authMethod: string;
  authenticatedAt: string;
} | null {
  if (!hasValidSevisPassSession()) return null;

  try {
    const sessionData = sessionStorage.getItem('sevispass_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Clear SevisPass session
 */
export function clearSevisPassSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('sevispass_session');
    sessionStorage.removeItem('sevispass_authenticated');
  }
}