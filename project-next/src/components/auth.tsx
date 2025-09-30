'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createUserProfile } from '@/lib/user-profile';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const { t } = useLanguage();
  
  // Additional signup fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [skills, setSkills] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bio, setBio] = useState('');
  
  const supabase = createClientComponentClient();

  // Clear any existing session on component mount
  useEffect(() => {
    const clearSession = async () => {
      await supabase.auth.signOut({ scope: 'local' });
    };
    clearSession();
  }, []);

  // Add a function to clear all auth state
  const clearAuthState = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear form state
      setEmail('');
      setPassword('');
      setFullName('');
      setAge('');
      setPhoneNumber('');
      setLocation('');
      setSkills('');
      setExperienceYears('');
      setBio('');
      
      console.log('Auth state cleared successfully');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut({ scope: 'local' });
      
      // Wait a moment for the signout to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if it's a rate limit error
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          alert('Please wait a moment and try again.');
        } else if (error.message.includes('Invalid login credentials')) {
          alert('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          alert('Please check your email and click the confirmation link before signing in.');
        } else {
          alert(error.message);
        }
        throw error;
      }
      
      console.log('Sign in successful:', data);
      // The user will be automatically redirected by the auth state change
    } catch (error: any) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting signup process...');
      
      // Validate required fields
      if (!fullName || !age || !phoneNumber || !location || !role) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate worker-specific required fields
      if (role === 'worker' && (!skills.trim() || !experienceYears.trim())) {
        alert('Skills and Years of Experience are required for workers');
        setLoading(false);
        return;
      }

      // Create the auth user with email confirmation
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        }
      });

      if (error) throw error;
      
      if (data.user) {
        console.log('Auth user created:', data.user.id);
        
        // Create profile data with the user ID
        const profileToSave = {
          id: data.user.id,
          email: email,
          full_name: fullName,
          age: parseInt(age),
          phone_number: phoneNumber,
          location,
          role,
          skills: role === 'worker' ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
          experience_years: role === 'worker' ? parseInt(experienceYears) || 0 : 0,
          bio: bio || '',
        };
        
        // Immediately create the user profile in the database
        try {
          console.log('Creating user profile in database...');

          // Save profile using direct database call (like your working version)
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .upsert([profileToSave], {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select();

          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Still store in localStorage as backup
            localStorage.setItem('pendingUserProfile', JSON.stringify(profileToSave));
            alert('Account created! Profile data saved locally. Please check your email and click the confirmation link to complete your registration.');
          } else {
            console.log('Profile created successfully:', profileData);
            alert('Account created successfully! Please check your email and click the confirmation link to complete your registration.');
          }
        } catch (profileErr) {
          console.error('Error creating profile:', profileErr);
          // Store in localStorage as backup
          localStorage.setItem('pendingUserProfile', JSON.stringify(profileToSave));
          alert('Account created! Please check your email and click the confirmation link to complete your registration.');
        }
        
        // Clear the signup session to prevent rate limiting issues
        await supabase.auth.signOut({ scope: 'local' });
        
        // Clear form
        setEmail('');
        setPassword('');
        setFullName('');
        setAge('');
        setPhoneNumber('');
        setLocation('');
        setSkills('');
        setExperienceYears('');
        setBio('');
        
        // Switch to sign-in view
        setView('sign-in');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      alert(error?.message ?? 'Error signing up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">RozgaarSetu</h1>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          {t('auth.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('auth.subtitle')}
        </p>
      </div>

      <div className={`max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-2xl mx-auto transition-colors duration-300 ${view === 'sign-up' ? 'max-w-lg' : ''}`}>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {view === 'sign-in' ? t('auth.login') : t('auth.signup')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            {view === 'sign-in' ? (
              <>
                {t('auth.toggle.signup')}{' '}
                <button
                  type="button"
                  onClick={() => setView('sign-up')}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  {t('auth.signup')}
                </button>
              </>
            ) : (
              <>
                {t('auth.toggle.login')}{' '}
                <button
                  type="button"
                  onClick={() => setView('sign-in')}
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  {t('auth.login')}
                </button>
              </>
            )}
          </p>
          {view === 'sign-up' && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Important:</strong> After filling out your information, you'll receive an email confirmation. 
                Please click the link in your email to complete registration.
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={view === 'sign-in' ? handleSignIn : handleSignUp}>
          <div className="rounded-md shadow-sm space-y-4">
            {/* Full Name - Only for sign up */}
            {view === 'sign-up' && (
              <div>
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            {/* Age and Phone Number - Only for sign up */}
            {view === 'sign-up' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="sr-only">Age</label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    min="18"
                    max="100"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                    placeholder="Age *"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                    placeholder="Phone Number *"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Location - Only for sign up */}
            {view === 'sign-up' && (
              <div>
                <label htmlFor="location" className="sr-only">Location</label>
                <input
                  id="location"
                  name="location"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                  placeholder="Location (City, State) *"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            {/* Role Selection - Only for sign up */}
            {view === 'sign-up' && (
              <div>
                <label htmlFor="role" className="sr-only">Role</label>
                <select
                  id="role"
                  name="role"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'worker' | 'employer')}
                >
                  <option value="worker">Worker - Looking for Jobs</option>
                  <option value="employer">Employer - Hiring Workers</option>
                </select>
              </div>
            )}

            {/* Skills and Experience - Only for workers during sign up */}
            {view === 'sign-up' && role === 'worker' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="skills" className="sr-only">Skills</label>
                  <input
                    id="skills"
                    name="skills"
                    type="text"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                    placeholder="Skills (comma separated) *"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="experienceYears" className="sr-only">Years of Experience</label>
                  <input
                    id="experienceYears"
                    name="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                    placeholder="Years of Experience *"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Bio - Only for sign up */}
            {view === 'sign-up' && (
              <div>
                <label htmlFor="bio" className="sr-only">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                  placeholder="Brief bio (optional)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="sr-only">{t('auth.email.label')}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                placeholder={t('auth.email.placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">{t('auth.password.label')}</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={view === 'sign-in' ? 'current-password' : 'new-password'}
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition-colors duration-300"
                placeholder={t('auth.password.placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('auth.loading')}</span>
                </div>
              ) : (
                view === 'sign-in' ? t('auth.login') : t('auth.signup')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
