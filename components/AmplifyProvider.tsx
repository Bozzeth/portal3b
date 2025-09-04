'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';
import { useEffect } from 'react';

// Configure Amplify on the client side
Amplify.configure(outputs);

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure Amplify is configured when component mounts
    try {
      const config = Amplify.getConfig();
      if (!config.Auth?.Cognito?.userPoolId) {
        console.log('Re-configuring Amplify in provider');
        Amplify.configure(outputs);
      }
    } catch (error) {
      console.error('Error checking Amplify config:', error);
      Amplify.configure(outputs);
    }
  }, []);

  return <>{children}</>;
}