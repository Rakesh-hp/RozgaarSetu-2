'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EmployerDashboard from '@/components/employer-dashboard';
import WorkerDashboard from '@/components/worker-dashboard';
import { createUserProfile } from '@/lib/user-profile';
import { useLanguage } from '@/contexts/LanguageContext';
// import { DebugPanel } from '@/components/DebugPanel';
import Navbar from '@/components/Navbar';

interface UserProfile extends User {
  role?: 'worker' | 'employer';
  full_name?: string;
  age?: number;
  phone_number?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  bio?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const initDashboard = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error || !user) {
          console.log('No user found, redirecting to auth');
          router.push('/auth');
          return;
        }

        // Try to get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!mounted) return;

        if (profile) {
          setUser({ ...user, ...profile });
        } else {
          // No profile found, use basic user data
          setUser({ 
            ...user, 
            role: undefined,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
          } as UserProfile);
        }
        
      } catch (error) {
        console.error('Dashboard init error:', error);
        // Still set basic user data on error
        const { data: { user } } = await supabase.auth.getUser();
        if (user && mounted) {
          setUser({ 
            ...user, 
            role: undefined,
            full_name: user.user_metadata?.full_name || 'User'
          } as UserProfile);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Dashboard loading timeout');
        setLoading(false);
      }
    }, 10000);

    initDashboard();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [supabase, router]);

  // Show loading state with navbar
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar activePage="dashboard" />
        
        {/* Loading Screen */}
        <main className="pt-20 px-4">
          <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="glass rounded-3xl shadow-xl p-12 text-center max-w-md mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-white mx-auto mb-6"></div>
                <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Loading Dashboard</h2>
                <p className="text-white/80 drop-shadow-md">Please wait while we load your dashboard...</p>
                <div className="mt-6 flex justify-center space-x-1">
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                  <div className="h-2 w-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show message if no user (shouldn't happen due to redirect, but just in case)
  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar activePage="dashboard" />
        
        {/* Authentication Required Screen */}
        <main className="pt-20 px-4">
          <div className="max-w-6xl mx-auto py-8">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="glass rounded-3xl shadow-xl p-8 text-center max-w-md mx-auto">
                <div className="text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">Authentication Required</h2>
                <p className="text-white/80 mb-6 drop-shadow-md">Please sign in to access your dashboard.</p>
                <Link
                  href="/auth"
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar activePage="dashboard" />

      {/* Main Content */}
      <main className="pt-20 px-4">
        <div className="max-w-6xl mx-auto py-8">
          {user.role === 'employer' ? (
            <EmployerDashboard user={user as any} />
          ) : user.role === 'worker' ? (
            <WorkerDashboard user={user as any} />
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="glass rounded-3xl shadow-xl p-8 text-center max-w-md mx-auto">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-2xl font-bold text-white mb-4">Complete Your Profile</h2>
                <p className="text-white/80 mb-6">
                  Your email has been confirmed, but your profile needs to be completed. 
                  This usually happens automatically, but you may need to sign out and register again.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full btn-gradient text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 transform"
                  >
                    🔄 Try Refreshing Page
                  </button>
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="w-full glass hover:bg-white/10 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    🚪 Sign Out and Register Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}