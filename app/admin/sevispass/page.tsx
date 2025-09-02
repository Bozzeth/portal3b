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
      
      // Check if user has admin privileges
      // In a real implementation, this would check user groups or attributes
      const userGroups = user.signInDetails?.loginId?.includes('admin') || 
                        user.username?.includes('admin');
      
      if (userGroups) {
        setIsAdmin(true);
      } else {
        // Redirect non-admin users
        router.push('/dashboard');
      }
    } catch (error) {
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