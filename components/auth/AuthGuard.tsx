"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        router.push('/auth');
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      fallback || (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'var(--background)',
          color: 'var(--foreground)'
        }}>
          <div>Loading...</div>
        </div>
      )
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return <>{children}</>;
}