'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useLanguage, translateJobContent, translateSkillName } from '@/contexts/LanguageContext';
import WorkerBookings from './worker-bookings';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  pay: number;
  worker_type: string;
  created_at: string;
  employer: {
    full_name: string;
    email: string;
  };
}

interface Application {
  id: string;
  job_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  job: Job;
}

interface User {
  id: string;
  role: 'worker' | 'employer';
  email: string;
  full_name?: string;
  age?: number;
  phone_number?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  bio?: string;
}

export default function WorkerDashboard({ user }: { user: User }) {
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingToJob, setApplyingToJob] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'bookings'>('jobs');
  const { t, language } = useLanguage();
  const supabase = createClientComponentClient();

  // Smart job sorting function - Skills first, then location within skill matches
  const smartSortJobs = (jobs: Job[], worker: User): Job[] => {
    const workerLocation = worker.location?.toLowerCase() || '';
    const workerSkills = worker.skills || [];
    
    return jobs.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // PRIORITY 1: SKILL MATCHING (Most Important - 10000+ points)
      const jobTitleA = a.title?.toLowerCase() || '';
      const jobDescA = a.description?.toLowerCase() || '';
      const jobWorkerTypeA = a.worker_type?.toLowerCase() || '';
      
      const jobTitleB = b.title?.toLowerCase() || '';
      const jobDescB = b.description?.toLowerCase() || '';
      const jobWorkerTypeB = b.worker_type?.toLowerCase() || '';
      
      let skillMatchA = false;
      let skillMatchB = false;
      
      workerSkills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        
        // Job A skill matching
        if (jobTitleA.includes(skillLower)) {
          scoreA += 10000; // High base score for skill match
          skillMatchA = true;
        }
        if (jobDescA.includes(skillLower)) {
          scoreA += 8000;
          skillMatchA = true;
        }
        if (jobWorkerTypeA.includes(skillLower)) {
          scoreA += 6000;
          skillMatchA = true;
        }
        
        // Job B skill matching
        if (jobTitleB.includes(skillLower)) {
          scoreB += 10000; // High base score for skill match
          skillMatchB = true;
        }
        if (jobDescB.includes(skillLower)) {
          scoreB += 8000;
          skillMatchB = true;
        }
        if (jobWorkerTypeB.includes(skillLower)) {
          scoreB += 6000;
          skillMatchB = true;
        }
      });
      
      // PRIORITY 2: LOCATION MATCHING (Only matters if skills match - 1000+ points)
      const jobLocationA = a.location?.toLowerCase() || '';
      const jobLocationB = b.location?.toLowerCase() || '';
      
      // Only add location bonus if job has skill match
      if (skillMatchA && workerLocation) {
        // Exact city match gets 1000 bonus points
        if (jobLocationA.includes(workerLocation)) {
          scoreA += 1000;
        } else {
          // Partial location match (same state/region) gets 500 bonus points
          const workerLocationParts = workerLocation.split(',').map(part => part.trim());
          const jobLocationPartsA = jobLocationA.split(',').map(part => part.trim());
          
          workerLocationParts.forEach(part => {
            if (part.length > 2 && jobLocationPartsA.some(jobPart => jobPart.includes(part))) {
              scoreA += 500;
            }
          });
        }
      }
      
      if (skillMatchB && workerLocation) {
        // Exact city match gets 1000 bonus points
        if (jobLocationB.includes(workerLocation)) {
          scoreB += 1000;
        } else {
          // Partial location match (same state/region) gets 500 bonus points
          const workerLocationParts = workerLocation.split(',').map(part => part.trim());
          const jobLocationPartsB = jobLocationB.split(',').map(part => part.trim());
          
          workerLocationParts.forEach(part => {
            if (part.length > 2 && jobLocationPartsB.some(jobPart => jobPart.includes(part))) {
              scoreB += 500;
            }
          });
        }
      }
      
      // PRIORITY 3: RECENCY (Minor factor - max 100 points)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      const daysDiff = (dateB - dateA) / (1000 * 60 * 60 * 24);
      scoreB += Math.min(daysDiff * 10, 100); // Cap at 100 points for recency
      
      return scoreB - scoreA; // Higher score first
    });
  };

  // Function to get match indicators for a job - Skills prioritized
  const getJobMatchInfo = (job: Job) => {
    const matches = [];
    const workerLocation = user.location?.toLowerCase() || '';
    const workerSkills = user.skills || [];
    const jobLocation = job.location?.toLowerCase() || '';
    const jobTitle = job.title?.toLowerCase() || '';
    const jobDesc = job.description?.toLowerCase() || '';
    const jobWorkerType = job.worker_type?.toLowerCase() || '';
    
    // Check for skill matches first (highest priority)
    let hasSkillMatch = false;
    const matchedSkills: string[] = [];
    
    workerSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (jobTitle.includes(skillLower) || jobDesc.includes(skillLower) || jobWorkerType.includes(skillLower)) {
        hasSkillMatch = true;
        // Translate skill name based on current language
        const translatedSkill = translateSkillName(skill, language);
        matchedSkills.push(translatedSkill);
      }
    });
    
    // Add skill match indicators
    if (hasSkillMatch) {
      matches.push({ 
        type: 'skill', 
        text: `🛠️ ${t('worker.skillsMatch')} (${matchedSkills.slice(0, 2).join(', ')})`, 
        priority: 'high' 
      });
    }
    
    // Add location match indicators (only meaningful if skills match)
    if (hasSkillMatch && workerLocation && jobLocation.includes(workerLocation)) {
      matches.push({ type: 'location', text: '📍 Perfect Location', priority: 'high' });
    } else if (hasSkillMatch && workerLocation) {
      const workerParts = workerLocation.split(',').map(p => p.trim());
      const jobParts = jobLocation.split(',').map(p => p.trim());
      const hasPartialMatch = workerParts.some(part => 
        part.length > 2 && jobParts.some(jobPart => jobPart.includes(part))
      );
      if (hasPartialMatch) {
        matches.push({ type: 'location', text: '📍 Near You', priority: 'medium' });
      }
    }

    return matches;
  };  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch available jobs and user's applications in parallel
      const [jobsResult, applicationsResult] = await Promise.allSettled([
        supabase
          .from('jobs')
          .select(`
            *,
            employer:employer_id(
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('applications')
          .select(`
            *,
            job:job_id(
              *,
              employer:employer_id(
                full_name,
                email
              )
            )
          `)
          .eq('worker_id', user.id)
      ]);

      let jobs: any[] = [];
      let applications: any[] = [];

      if (jobsResult.status === 'fulfilled') {
        const { data, error } = jobsResult.value;
        if (error) {
          throw new Error('Error fetching jobs: ' + error.message);
        }
        jobs = data || [];
      } else {
        console.error('Error fetching jobs:', jobsResult.reason);
      }

      if (applicationsResult.status === 'fulfilled') {
        const { data, error } = applicationsResult.value;
        if (error) {
          throw new Error('Error fetching applications: ' + error.message);
        }
        applications = data || [];
      } else {
        console.error('Error fetching applications:', applicationsResult.reason);
      }

      // Filter out jobs that the user has already applied to
      const appliedJobIds = new Set(applications.map(app => app.job_id));
      const availableJobsFiltered = jobs.filter(job => !appliedJobIds.has(job.id));
      
      // Apply smart sorting based on user's location and skills
      const sortedJobs = smartSortJobs(availableJobsFiltered, user);
      setAvailableJobs(sortedJobs);
      
      setMyApplications(applications);
      
    } catch (err) {
      console.error('Error in fetchJobs:', err);
      // Don't show alert here as it's called on component mount
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user.id]);

  const handleApply = async (jobId: string) => {
    // Prevent multiple simultaneous applications
    if (applyingToJob === jobId) return;
    
    if (!window.confirm(t('worker.apply.confirm'))) {
      return;
    }

    setApplyingToJob(jobId);
    console.log(`Applying to job ${jobId}...`);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Job application timeout - forcing state reset');
      setApplyingToJob(null);
      alert('Job application is taking too long. Please try again.');
    }, 10000); // 10 second timeout
    
    try {
      console.log('Sending application to Supabase...');
      const { data: application, error } = await supabase
        .from('applications')
        .insert([
          {
            job_id: jobId,
            worker_id: user.id,
            status: 'pending'
          }
        ])
        .select(`
          *,
          job:job_id(
            *,
            employer:employer_id(
              full_name,
              email
            )
          )
        `)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === '23505') {
          throw new Error(t('worker.apply.already'));
        } else {
          throw new Error(t('worker.apply.error') + error.message);
        }
      }

      console.log(`Application to job ${jobId} successful`);

      // Update state
      setMyApplications(prevApps => [application, ...prevApps]);
      setAvailableJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      
      alert('Application submitted successfully!');
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error applying to job:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      alert(errorMessage);
    } finally {
      // Force state reset regardless of success/failure
      setTimeout(() => setApplyingToJob(null), 100);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'jobs'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Job Applications
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Service Bookings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'jobs' ? (
        <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('worker.myApplications')}</h2>
        {myApplications.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700 transition-colors duration-300">
            {t('worker.noApplications')}
          </div>
        ) : (
          <div className="space-y-4">
            {myApplications.map(application => (
              <div key={application.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6 transition-colors duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{translateJobContent(application.job.title, language)}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('worker.postedBy')} {application.job.employer.full_name || application.job.employer.email}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div>📍 {application.job.location}</div>
                      <div>💰 ₹{application.job.pay}</div>
                      <div>👥 {translateJobContent(application.job.worker_type, language)}</div>
                      <div>📅 {t('worker.appliedOn')} {new Date(application.created_at).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    application.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : application.status === 'accepted'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('worker.availableJobs')}</h2>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : availableJobs.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700 transition-colors duration-300">
            {t('worker.noJobs')}
          </div>
        ) : (
          <div className="space-y-4">
            {availableJobs.map(job => {
              const matchInfo = getJobMatchInfo(job);
              return (
                <div key={job.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 p-6 transition-colors duration-300 ${
                  matchInfo.length > 0 ? 'ring-2 ring-green-200 dark:ring-green-700 border-green-100 dark:border-green-800' : ''
                }`}>
                  {/* Match indicators */}
                  {matchInfo.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {matchInfo.map((match, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            match.priority === 'high'
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                          }`}
                        >
                          {match.text}
                        </span>
                      ))}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
                        ⭐ {t('worker.recommended')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{translateJobContent(job.title, language)}</h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('worker.postedBy')} {job.employer.full_name || job.employer.email}
                      </div>
                      <div className="mt-2 text-gray-600 dark:text-gray-300">{translateJobContent(job.description, language)}</div>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>📍 {job.location}</div>
                        <div>💰 ₹{job.pay}</div>
                        <div>👥 {translateJobContent(job.worker_type, language)}</div>
                        <div>📅 {t('worker.posted')} {new Date(job.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingToJob === job.id}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        applyingToJob === job.id
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {applyingToJob === job.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Applying...
                        </div>
                      ) : (
                        t('worker.apply.short')
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </div>
      ) : (
        <WorkerBookings user={user} />
      )}
    </div>
  );
}