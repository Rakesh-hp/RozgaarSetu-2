'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useLanguage } from '@/contexts/LanguageContext';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  pay: number;
  worker_type: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  role: 'worker' | 'employer';
  full_name?: string;
  age?: number;
  phone_number?: string;
  location?: string;
  skills?: string[];
  experience_years?: number;
  bio?: string;
}

interface Application {
  id: string;
  job_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  worker: {
    full_name: string;
    email: string;
    skills: string[];
    experience_years: number;
    bio: string;
  };
}

export default function EmployerDashboard({ user }: { user: User }) {
  const { t, translateJobContent, translateSkillName, translateWorkerType } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [loading, setLoading] = useState(true);
  const [postingJob, setPostingJob] = useState(false);
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    location: '',
    pay: '',
    worker_type: '',
  });
  const supabase = createClientComponentClient();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('employer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Error fetching jobs: ' + error.message);
      }

      setJobs(data || []);

      // Fetch applications for each job
      if (data && data.length > 0) {
        const applicationPromises = data.map(async (job) => {
          try {
            const { data: jobApplications, error: applicationsError } = await supabase
              .from('applications')
              .select(`
                *,
                worker:worker_id(
                  full_name,
                  email,
                  skills,
                  experience_years,
                  bio
                )
              `)
              .eq('job_id', job.id);

            if (!applicationsError && jobApplications) {
              return { jobId: job.id, applications: jobApplications };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching applications for job ${job.id}:`, err);
            return null;
          }
        });

        const applicationResults = await Promise.allSettled(applicationPromises);
        
        const newApplications: Record<string, Application[]> = {};
        applicationResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newApplications[result.value.jobId] = result.value.applications;
          }
        });
        
        setApplications(newApplications);
      }
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

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (postingJob) return;
    
    // Validate and sanitize input data
    const payValue = parseInt(newJob.pay.toString().trim(), 10);
    
    console.log('Pay input value:', newJob.pay);
    console.log('Parsed pay value:', payValue);
    
    const jobData = {
      title: newJob.title.trim(),
      description: newJob.description.trim(),
      location: newJob.location.trim(), // This should handle commas fine
      worker_type: newJob.worker_type.trim(),
      pay: payValue,
      employer_id: user.id
    };

    // Additional validation
    if (!jobData.title || !jobData.description || !jobData.location || !jobData.worker_type) {
      alert('Please fill in all fields');
      return;
    }

    if (isNaN(payValue) || payValue <= 0) {
      alert('Please enter a valid pay amount');
      return;
    }

    if (!window.confirm('Are you sure you want to post this job?')) {
      return;
    }

    console.log('Posting job with data:', jobData); // Debug log
    
    setPostingJob(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Job posting timeout - forcing state reset');
      setPostingJob(false);
      alert('Job posting is taking too long. Please check your connection and try again.');
    }, 15000); // 15 second timeout for job posting

    try {
      console.log('Sending job data to Supabase...');
      const { data, error } = await supabase
        .from('jobs')
        .insert([jobData])
        .select()
        .single();

      clearTimeout(timeoutId);

      if (error) {
        console.error('Database error:', error); // Debug log
        throw new Error('Database error: ' + error.message);
      }

      console.log('Job posted successfully:', data); // Debug log
      
      // Update state with new job
      setJobs(prevJobs => [data, ...prevJobs]);
      setShowPostJob(false);
      setNewJob({
        title: '',
        description: '',
        location: '',
        pay: '',
        worker_type: '',
      });
      alert('Job posted successfully!');
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error posting job:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      alert('Error posting job: ' + errorMessage);
    } finally {
      // Force state reset regardless of success/failure
      setTimeout(() => setPostingJob(false), 100);
    }
  };

  const handleApplicationStatus = async (applicationId: string, jobId: string, status: 'accepted' | 'rejected') => {
    // Prevent multiple simultaneous updates
    if (updatingApplication === applicationId) return;
    
    setUpdatingApplication(applicationId);
    console.log(`Updating application ${applicationId} to ${status}...`);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Application update timeout - forcing state reset');
      setUpdatingApplication(null);
      alert('Application update is taking too long. Please try again.');
    }, 10000); // 10 second timeout
    
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      clearTimeout(timeoutId);

      if (error) {
        throw new Error('Error updating application status: ' + error.message);
      }

      console.log(`Application ${applicationId} updated to ${status} successfully`);

      setApplications(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      }));
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error updating application status:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      alert(errorMessage);
    } finally {
      // Force state reset regardless of success/failure
      setTimeout(() => setUpdatingApplication(null), 100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white drop-shadow-lg">{t('employer.yourJobPostings')}</h2>
        <button
          onClick={() => setShowPostJob(!showPostJob)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
        >
          {showPostJob ? t('employer.cancel') : t('employer.postNewJob')}
        </button>
      </div>

      {showPostJob && (
        <form onSubmit={handlePostJob} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-xl space-y-4 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('employer.jobTitle')}</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 transition-colors duration-300"
              placeholder="e.g., Experienced Carpenter, House Cleaner, Driver"
              value={newJob.title}
              onChange={e => setNewJob(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('employer.description')}</label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 resize-none transition-colors duration-300"
              rows={4}
              placeholder="Describe the job requirements, skills needed, working hours, and any specific details..."
              value={newJob.description}
              onChange={e => setNewJob(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                {t('employer.location')} 
                <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">{t('employer.fullAddressWithCommas')}</span>
              </label>
              <textarea
                required
                rows={2}
                className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 resize-none transition-colors duration-300"
                placeholder="e.g., 123 Main Street, Andheri West, Mumbai, Maharashtra, 400058"
                value={newJob.location}
                onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {newJob.location.length}/200 {t('employer.characters')}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('employer.pay')}</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 transition-colors duration-300"
                placeholder="e.g., 12000, 18000, 25000"
                value={newJob.pay}
                onChange={e => {
                  const value = e.target.value;
                  // Only allow numeric input, no decimals
                  if (value === '' || /^\d+$/.test(value)) {
                    setNewJob(prev => ({ ...prev, pay: value }));
                  }
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">{t('employer.workerType')}</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-colors duration-300"
              value={newJob.worker_type}
              onChange={e => setNewJob(prev => ({ ...prev, worker_type: e.target.value }))}
            >
              <option value="">{t('employer.selectWorkerType')}</option>
              <option value="full-time">🕘 {translateWorkerType('full-time')}</option>
              <option value="part-time">⏰ {translateWorkerType('part-time')}</option>
              <option value="contract">📋 {translateWorkerType('contract')}</option>
              <option value="daily-wage">📅 {translateWorkerType('daily-wage')}</option>
              <option value="hourly">⏱️ {translateWorkerType('hourly')}</option>
              <option value="temporary">⚡ {translateWorkerType('temporary')}</option>
            </select>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('employer.employmentTypeHelp')}
            </div>
          </div>
          <button
            type="submit"
            disabled={postingJob}
            className={`w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors font-medium text-lg shadow-md ${
              postingJob 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {postingJob ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Posting...
              </div>
            ) : (
              t('employer.postJob')
            )}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700 transition-colors duration-300">
          {t('employer.noJobsPosted')}
        </div>
      ) : (
        <div className="space-y-6">
          {jobs.map(job => (
            <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 overflow-hidden transition-colors duration-300">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{translateJobContent(job.title)}</h3>
                <div className="mt-2 text-gray-600 dark:text-gray-300">{translateJobContent(job.description)}</div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>📍 {job.location}</div>
                  <div>💰 ₹{job.pay}</div>
                  <div>👥 {translateWorkerType(job.worker_type)}</div>
                  <div>📅 {t('employer.posted')} {new Date(job.created_at).toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700">
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('employer.applications')}</h4>
                  {!applications[job.id] || applications[job.id].length === 0 ? (
                    <div className="text-gray-600 dark:text-gray-400">{t('employer.noApplications')}</div>
                  ) : (
                    <div className="space-y-4">
                      {applications[job.id].map(application => (
                        <div key={application.id} className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-300">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h5 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{application.worker.full_name}</h5>
                              <div className="text-base text-gray-700 dark:text-gray-300 font-medium mb-3">{application.worker.email}</div>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <span className="font-semibold text-gray-900 dark:text-white mr-2">{t('employer.experience')}:</span>
                                  <span className="text-gray-800 dark:text-gray-200 font-medium">{application.worker.experience_years} {t('employer.years')}</span>
                                </div>
                                <div className="flex items-start">
                                  <span className="font-semibold text-gray-900 dark:text-white mr-2">{t('employer.skills')}:</span>
                                  <span className="text-gray-800 dark:text-gray-200 font-medium">{application.worker.skills?.map(skill => translateSkillName(skill)).join(', ')}</span>
                                </div>
                                {application.worker.bio && (
                                  <div className="mt-3">
                                    <span className="font-semibold text-gray-900 dark:text-white block mb-1">{t('employer.bio')}:</span>
                                    <p className="text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 p-3 rounded border dark:border-gray-500">{application.worker.bio}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              {application.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApplicationStatus(application.id, job.id, 'accepted')}
                                    disabled={updatingApplication === application.id}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                      updatingApplication === application.id
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                                  >
                                    {updatingApplication === application.id ? (
                                      <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                        ...
                                      </div>
                                    ) : (
                                      t('employer.accept')
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleApplicationStatus(application.id, job.id, 'rejected')}
                                    disabled={updatingApplication === application.id}
                                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                                      updatingApplication === application.id
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                    }`}
                                  >
                                    {updatingApplication === application.id ? (
                                      <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                                        ...
                                      </div>
                                    ) : (
                                      t('employer.reject')
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-4 py-2 rounded-md font-semibold ${
                                  application.status === 'accepted' 
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-600' 
                                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'
                                }`}>
                                  {t(`employer.${application.status}`)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}