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
      
      // Debug: Log the entire user object to see structure
      console.log('Full user object:', JSON.stringify(user, null, 2));
      
      // Try multiple ways to access user groups
      let userGroups = [];
      
      // Method 1: Check signInUserSession
      if (user.signInUserSession?.accessToken?.payload) {
        const payload = user.signInUserSession.accessToken.payload;
        console.log('Access token payload:', payload);
        userGroups = payload['cognito:groups'] || [];
      }
      
      // Method 2: Check if groups are in a different location
      if (userGroups.length === 0 && user.attributes) {
        console.log('User attributes:', user.attributes);
      }
      
      // Method 3: Temporary override for testing - check username/email
      const tempAdminCheck = user.username?.includes('admin') || 
                           user.signInDetails?.loginId?.includes('admin') ||
                           (user.attributes && user.attributes.email?.includes('admin'));
      
      console.log('User groups found:', userGroups);
      console.log('Username:', user.username);
      console.log('Login ID:', user.signInDetails?.loginId);
      console.log('Email:', user.attributes?.email);
      console.log('Temp admin check:', tempAdminCheck);
      
      const isAdminUser = userGroups.includes('ADMIN') || 
                          userGroups.includes('DICT_OFFICER') ||
                          tempAdminCheck; // Temporary fallback
      
      console.log('Final admin decision:', isAdminUser);
      
      if (isAdminUser) {
        setIsAdmin(true);
      } else {
        console.log('Access denied. User groups:', userGroups);
        alert('Debug: Access denied. Check console for user group details.');
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