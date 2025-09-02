"use client";

import { SevisPassReview } from '@/components/admin/SevisPassReview';
import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
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
      const session = await fetchAuthSession();
      
      console.log('User:', user);
      console.log('Session:', session);
      
      // Get user groups from the session tokens
      let userGroups = [];
      
      // Check access token for groups
      if (session.tokens?.accessToken?.payload) {
        const payload = session.tokens.accessToken.payload;
        console.log('Access token payload:', payload);
        const groups = payload['cognito:groups'];
        userGroups = Array.isArray(groups) ? groups : [];
      }
      
      // Temporary override for testing - check email contains admin
      const tempAdminCheck = user.signInDetails?.loginId?.includes('admin');
      
      console.log('User groups from token:', userGroups);
      console.log('Login ID:', user.signInDetails?.loginId);
      console.log('Email contains admin:', tempAdminCheck);
      
      const isAdminUser = userGroups.includes('ADMIN') || 
                          userGroups.includes('DICT_OFFICER') ||
                          tempAdminCheck; // Temporary fallback
      
      console.log('Final admin decision:', isAdminUser);
      
      if (isAdminUser) {
        setIsAdmin(true);
        console.log('Admin access granted!');
      } else {
        console.log('Access denied. Groups:', userGroups);
        alert(`Debug: Access denied. Email: ${user.signInDetails?.loginId}, Groups: ${userGroups.join(', ')}`);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
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