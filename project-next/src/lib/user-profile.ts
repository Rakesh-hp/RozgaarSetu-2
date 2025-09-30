'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function createUserProfile(userData: {
  id: string;
  email: string;
  full_name: string;
  age: number;
  phone_number: string | null;
  location: string;
  role: 'worker' | 'employer';
  skills: string[] | null;
  experience_years: number | null;
  bio: string | null;
}) {
  const supabase = createClientComponentClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert([userData], {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Profile creation error:', error);
      throw error;
    }

    console.log('Profile created/updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
}