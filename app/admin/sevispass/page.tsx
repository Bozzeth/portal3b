"use client";

import { SevisPassReview } from '@/components/admin/SevisPassReview';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

export default function SevisPassAdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await getCurrentUser();
      
      // Check if user has admin privileges using AWS Cognito user groups
      const userGroups = user.signInUserSession?.accessToken?.payload['cognito:groups'] || [];
      const isAdminUser = userGroups.includes('ADMIN') || userGroups.includes('DICT_OFFICER');
      
      console.log('User groups:', userGroups);
      console.log('Is admin user:', isAdminUser);
      
      if (isAdminUser) {
        setIsAdmin(true);
      } else {
        console.log('User does not have admin privileges. User groups:', userGroups);
        // Redirect non-admin users
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      // User not authenticated
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--muted)',
          borderTop: '3px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <SevisPassReview isAdmin={isAdmin} />;
}