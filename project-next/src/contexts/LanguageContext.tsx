'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translateJobContent: (text: string) => string;
  translateSkillName: (skill: string) => string;
  translateWorkerType: (type: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Landing Page
    'landing.hero.title': 'Find Your Next Opportunity with RozgaarSetu',
    'landing.hero.subtitle': 'Connecting skilled workers with employers across India. Your bridge to better employment.',
    'landing.hero.cta': 'Get Started Today',
    'landing.features.title': 'Why Choose RozgaarSetu?',
    'landing.features.trusted.title': 'Trusted Platform',
    'landing.features.trusted.desc': 'Verified employers and secure job postings',
    'landing.features.easy.title': 'Easy to Use',
    'landing.features.easy.desc': 'Simple interface designed for everyone',
    'landing.features.local.title': 'Local Opportunities',
    'landing.features.local.desc': 'Find jobs in your area and nearby locations',
    'landing.services.title': 'Our Services',
    'landing.services.construction.title': 'Construction Jobs',
    'landing.services.construction.desc': 'Mason, carpenter, electrician, and more construction opportunities',
    'landing.services.domestic.title': 'Domestic Services',
    'landing.services.domestic.desc': 'House cleaning, cooking, gardening, and household work',
    'landing.services.delivery.title': 'Delivery & Transport',
    'landing.services.delivery.desc': 'Delivery jobs, driving, and transportation services',
    
    // Authentication
    'auth.title': 'Welcome to RozgaarSetu',
    'auth.subtitle': 'Your gateway to employment opportunities',
    'auth.email.label': 'Email Address',
    'auth.email.placeholder': 'Enter your email',
    'auth.password.label': 'Password',
    'auth.password.placeholder': 'Enter your password',
    'auth.login': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.toggle.login': 'Already have an account? Sign in',
    'auth.toggle.signup': "Don't have an account? Sign up",
    'auth.loading': 'Please wait...',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to RozgaarSetu Dashboard',
    'dashboard.role.question': 'What would you like to do today?',
    'dashboard.employer.title': 'I want to hire workers',
    'dashboard.employer.desc': 'Post job requirements and find skilled workers',
    'dashboard.worker.title': 'I am looking for work',
    'dashboard.worker.desc': 'Browse available jobs and apply',
    'dashboard.signout': 'Sign Out',
    'dashboard.signout.confirm': '🔐 Are you sure you want to sign out?',
    'dashboard.signout.desc': "You'll need to log in again to access your dashboard",
    
    // Employer Dashboard
    'employer.title': 'Employer Dashboard',
    'employer.post.job': 'Post New Job',
    'employer.job.title': 'Job Title',
    'employer.job.description': 'Job Description',
    'employer.job.location': 'Location',
    'employer.job.salary': 'Salary (₹)',
    'employer.job.post': 'Post Job',
    'employer.jobs.posted': 'Your Posted Jobs',
    
    // Worker Dashboard
    'worker.title': 'Worker Dashboard',
    'worker.jobs.available': 'Available Jobs',
    'worker.apply': 'Apply Now',
    'worker.applied': 'Applied',
    'worker.applications': 'Your Applications',
    'worker.myApplications': 'My Applications',
    'worker.availableJobs': 'Available Jobs',
    'worker.apply.short': 'Apply',
    'worker.apply.confirm': 'Are you sure you want to apply for this job?',
    'worker.apply.already': 'You have already applied to this job.',
    'worker.apply.error': 'Error applying for job: ',
    'worker.noApplications': 'You haven\'t applied to any jobs yet. Browse available jobs below!',
    'worker.noJobs': 'No available jobs at the moment. Check back later!',
    'worker.appliedOn': 'Applied on',
    'worker.postedBy': 'Posted by',
    'worker.posted': 'Posted',
    'worker.recommended': 'Recommended for You',
    'worker.skillsMatch': 'Skills Match',
    
    // Footer and Landing Page Buttons
    'landing.footer.title': 'RozgaarSetu',
    'landing.footer.description': 'India\'s most trusted platform for connecting homeowners with skilled professionals. Safe, reliable, and easy to use - bringing employment opportunities to your doorstep.',
    'landing.footer.customers': 'For Customers',
    'landing.footer.workers': 'For Workers',
    'landing.footer.findWorkers': 'Find Workers',
    'landing.footer.postJobs': 'Post Jobs',
    'landing.footer.reviews': 'Reviews & Ratings',
    'landing.footer.support': 'Support',
    'landing.footer.findWork': 'Find Work',
    'landing.footer.createProfile': 'Create Profile',
    'landing.footer.buildReputation': 'Build Reputation',
    'landing.footer.getPaid': 'Get Paid',
    'landing.footer.copyright': '© 2025 RozgaarSetu. All rights reserved. Made in India 🇮🇳',
    'landing.buttons.lookingForWorkers': 'I\'m Looking for Workers',
    'landing.buttons.lookingForWork': 'I\'m Looking for Work',
    
    // Footer
    'footer.forCustomers': 'For Customers',
    'footer.findWorkers': 'Find Workers',
    'footer.postJobs': 'Post Jobs',
    'footer.howItWorks': 'How It Works',
    'footer.about': 'About',
    'footer.forWorkers': 'For Workers',
    'footer.findWork': 'Find Work',
    'footer.createProfile': 'Create Profile',
    'footer.support': 'Support',
    'footer.contact': 'Contact',
    
    // Employer Dashboard
    'employer.yourJobPostings': 'Your Job Postings',
    'employer.postNewJob': 'Post New Job',
    'employer.cancel': 'Cancel',
    'employer.jobTitle': 'Job Title',
    'employer.description': 'Description',
    'employer.location': 'Location',
    'employer.fullAddressWithCommas': '(Full address with commas allowed)',
    'employer.pay': 'Pay (₹)',
    'employer.workerType': 'Worker Type',
    'employer.selectWorkerType': 'Select worker type...',
    'employer.employmentTypeHelp': 'Choose the employment type that best fits your job requirements',
    'employer.characters': 'characters',
    'employer.postJob': '📝 Post Job',
    'employer.noJobsPosted': 'You haven\'t posted any jobs yet. Click "Post New Job" to get started!',
    'employer.posted': 'Posted',
    'employer.applications': 'Applications',
    'employer.noApplications': 'No applications yet.',
    'employer.experience': 'Experience',
    'employer.years': 'years',
    'employer.skills': 'Skills',
    'employer.bio': 'Bio',
    'employer.accept': 'Accept',
    'employer.reject': 'Reject',
    'employer.accepted': 'Accepted',
    'employer.rejected': 'Rejected',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.success': 'Success!',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.language': 'Language',
  },
  
  hi: {
    // Landing Page
    'landing.hero.title': 'रोजगारसेतु के साथ अपना अगला अवसर खोजें',
    'landing.hero.subtitle': 'भारत भर में कुशल श्रमिकों को नियोक्ताओं से जोड़ना। बेहतर रोजगार का आपका सेतु।',
    'landing.hero.cta': 'आज ही शुरू करें',
    'landing.features.title': 'रोजगारसेतु क्यों चुनें?',
    'landing.features.trusted.title': 'विश्वसनीय प्लेटफॉर्म',
    'landing.features.trusted.desc': 'सत्यापित नियोक्ता और सुरक्षित नौकरी पोस्टिंग',
    'landing.features.easy.title': 'उपयोग में आसान',
    'landing.features.easy.desc': 'सभी के लिए डिज़ाइन किया गया सरल इंटरफेस',
    'landing.features.local.title': 'स्थानीय अवसर',
    'landing.features.local.desc': 'अपने क्षेत्र और आसपास के स्थानों में नौकरी खोजें',
    'landing.services.title': 'हमारी सेवाएं',
    'landing.services.construction.title': 'निर्माण कार्य',
    'landing.services.construction.desc': 'राजमिस्त्री, बढ़ई, इलेक्ट्रीशियन और अन्य निर्माण अवसर',
    'landing.services.domestic.title': 'घरेलू सेवाएं',
    'landing.services.domestic.desc': 'घर की सफाई, खाना पकाना, बागवानी और घरेलू काम',
    'landing.services.delivery.title': 'डिलीवरी और परिवहन',
    'landing.services.delivery.desc': 'डिलीवरी नौकरियां, ड्राइविंग और परिवहन सेवाएं',
    
    // Authentication
    'auth.title': 'रोजगारसेतु में आपका स्वागत है',
    'auth.subtitle': 'रोजगार के अवसरों का आपका द्वार',
    'auth.email.label': 'ईमेल पता',
    'auth.email.placeholder': 'अपना ईमेल दर्ज करें',
    'auth.password.label': 'पासवर्ड',
    'auth.password.placeholder': 'अपना पासवर्ड दर्ज करें',
    'auth.login': 'साइन इन करें',
    'auth.signup': 'साइन अप करें',
    'auth.toggle.login': 'पहले से खाता है? साइन इन करें',
    'auth.toggle.signup': 'खाता नहीं है? साइन अप करें',
    'auth.loading': 'कृपया प्रतीक्षा करें...',
    
    // Dashboard
    'dashboard.welcome': 'रोजगारसेतु डैशबोर्ड में आपका स्वागत है',
    'dashboard.role.question': 'आज आप क्या करना चाहते हैं?',
    'dashboard.employer.title': 'मैं श्रमिक भर्ती करना चाहता हूं',
    'dashboard.employer.desc': 'नौकरी की आवश्यकताएं पोस्ट करें और कुशल श्रमिक खोजें',
    'dashboard.worker.title': 'मैं काम की तलाश में हूं',
    'dashboard.worker.desc': 'उपलब्ध नौकरियां देखें और आवेदन करें',
    'dashboard.signout': 'साइन आउट',
    'dashboard.signout.confirm': '🔐 क्या आप वाकई साइन आउट करना चाहते हैं?',
    'dashboard.signout.desc': 'आपको अपने डैशबोर्ड तक पहुंचने के लिए फिर से लॉग इन करना होगा',
    
    // Employer Dashboard
    'employer.title': 'नियोक्ता डैशबोर्ड',
    'employer.post.job': 'नई नौकरी पोस्ट करें',
    'employer.job.title': 'नौकरी का शीर्षक',
    'employer.job.description': 'नौकरी का विवरण',
    'employer.job.location': 'स्थान',
    'employer.job.salary': 'वेतन (₹)',
    'employer.job.post': 'नौकरी पोस्ट करें',
    'employer.jobs.posted': 'आपकी पोस्ट की गई नौकरियां',
    
    // Worker Dashboard
    'worker.title': 'श्रमिक डैशबोर्ड',
    'worker.jobs.available': 'उपलब्ध नौकरियां',
    'worker.apply': 'अभी आवेदन करें',
    'worker.applied': 'आवेदन किया गया',
    'worker.applications': 'आपके आवेदन',
    'worker.myApplications': 'मेरे आवेदन',
    'worker.availableJobs': 'उपलब्ध नौकरियां',
    'worker.apply.short': 'आवेदन करें',
    'worker.apply.confirm': 'क्या आप वाकई इस नौकरी के लिए आवेदन करना चाहते हैं?',
    'worker.apply.already': 'आपने इस नौकरी के लिए पहले से ही आवेदन किया है।',
    'worker.apply.error': 'नौकरी के लिए आवेदन करने में त्रुटि: ',
    'worker.noApplications': 'आपने अभी तक किसी नौकरी के लिए आवेदन नहीं किया है। नीचे उपलब्ध नौकरियां देखें!',
    'worker.noJobs': 'फिलहाल कोई नौकरी उपलब्ध नहीं है। बाद में वापस आएं!',
    'worker.appliedOn': 'आवेदन किया गया',
    'worker.postedBy': 'द्वारा पोस्ट किया गया',
    'worker.posted': 'पोस्ट किया गया',
    'worker.recommended': 'आपके लिए सुझावित',
    'worker.skillsMatch': 'कौशल मैच',
    
    // Footer and Landing Page Buttons
    'landing.footer.title': 'रोजगारसेतु',
    'landing.footer.description': 'भारत का सबसे भरोसेमंद प्लेटफॉर्म जो घर के मालिकों को कुशल पेशेवरों से जोड़ता है। सुरक्षित, विश्वसनीय और उपयोग में आसान - आपके दरवाजे पर रोजगार के अवसर लाता है।',
    'landing.footer.customers': 'ग्राहकों के लिए',
    'landing.footer.workers': 'श्रमिकों के लिए',
    'landing.footer.findWorkers': 'श्रमिक खोजें',
    'landing.footer.postJobs': 'नौकरी पोस्ट करें',
    'landing.footer.reviews': 'समीक्षा और रेटिंग',
    'landing.footer.support': 'सहायता',
    'landing.footer.findWork': 'काम खोजें',
    'landing.footer.createProfile': 'प्रोफाइल बनाएं',
    'landing.footer.buildReputation': 'प्रतिष्ठा बनाएं',
    'landing.footer.getPaid': 'भुगतान पाएं',
    'landing.footer.copyright': '© 2025 रोजगारसेतु। सभी अधिकार सुरक्षित। भारत में निर्मित 🇮🇳',
    'landing.buttons.lookingForWorkers': 'मैं श्रमिक ढूंढ रहा हूं',
    'landing.buttons.lookingForWork': 'मैं काम ढूंढ रहा हूं',
    
    // Footer
    'footer.forCustomers': 'ग्राहकों के लिए',
    'footer.findWorkers': 'श्रमिक खोजें',
    'footer.postJobs': 'नौकरी पोस्ट करें',
    'footer.howItWorks': 'कैसे काम करता है',
    'footer.about': 'हमारे बारे में',
    'footer.forWorkers': 'श्रमिकों के लिए',
    'footer.findWork': 'काम खोजें',
    'footer.createProfile': 'प्रोफाइल बनाएं',
    'footer.support': 'सहायता',
    'footer.contact': 'संपर्क',
    
    // Employer Dashboard
    'employer.yourJobPostings': 'आपकी नौकरी पोस्टिंग',
    'employer.postNewJob': 'नई नौकरी पोस्ट करें',
    'employer.cancel': 'रद्द करें',
    'employer.jobTitle': 'नौकरी का शीर्षक',
    'employer.description': 'विवरण',
    'employer.location': 'स्थान',
    'employer.fullAddressWithCommas': '(पूरा पता कॉमा के साथ अनुमतित)',
    'employer.pay': 'वेतन (₹)',
    'employer.workerType': 'श्रमिक प्रकार',
    'employer.selectWorkerType': 'श्रमिक प्रकार चुनें...',
    'employer.employmentTypeHelp': 'अपनी नौकरी की आवश्यकताओं के अनुकूल रोजगार प्रकार चुनें',
    'employer.characters': 'अक्षर',
    'employer.postJob': '📝 नौकरी पोस्ट करें',
    'employer.noJobsPosted': 'आपने अभी तक कोई नौकरी पोस्ट नहीं की है। शुरू करने के लिए "नई नौकरी पोस्ट करें" पर क्लिक करें!',
    'employer.posted': 'पोस्ट किया गया',
    'employer.applications': 'आवेदन',
    'employer.noApplications': 'अभी तक कोई आवेदन नहीं।',
    'employer.experience': 'अनुभव',
    'employer.years': 'साल',
    'employer.skills': 'कौशल',
    'employer.bio': 'बायो',
    'employer.accept': 'स्वीकार करें',
    'employer.reject': 'अस्वीकार करें',
    'employer.accepted': 'स्वीकृत',
    'employer.rejected': 'अस्वीकृत',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कुछ गलत हुआ',
    'common.success': 'सफल!',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.back': 'वापस',
    'common.next': 'अगला',
    'common.language': 'भाषा',
  },
  
  mr: {
    // Landing Page
    'landing.hero.title': 'रोजगारसेतूसह तुमची पुढची संधी शोधा',
    'landing.hero.subtitle': 'संपूर्ण भारतात कुशल कामगारांना नियोक्त्यांशी जोडणे. चांगल्या रोजगाराचा तुमचा सेतू.',
    'landing.hero.cta': 'आजच सुरुवात करा',
    'landing.features.title': 'रोजगारसेतू का निवडावा?',
    'landing.features.trusted.title': 'विश्वसनीय प्लॅटफॉर्म',
    'landing.features.trusted.desc': 'पडताळलेले नियोक्ते आणि सुरक्षित नोकरी पोस्टिंग',
    'landing.features.easy.title': 'वापरण्यास सोपे',
    'landing.features.easy.desc': 'सर्वांसाठी डिझाइन केलेले सरळ इंटरफेस',
    'landing.features.local.title': 'स्थानिक संधी',
    'landing.features.local.desc': 'तुमच्या भागात आणि जवळपासच्या ठिकाणी नोकरी शोधा',
    'landing.services.title': 'आमच्या सेवा',
    'landing.services.construction.title': 'बांधकाम नोकऱ्या',
    'landing.services.construction.desc': 'राजमिस्त्री, सुतार, इलेक्ट्रिशियन आणि इतर बांधकाम संधी',
    'landing.services.domestic.title': 'घरगुती सेवा',
    'landing.services.domestic.desc': 'घर साफ करणे, स्वयंपाक, बागकाम आणि घरगुती काम',
    'landing.services.delivery.title': 'डिलिव्हरी आणि वाहतूक',
    'landing.services.delivery.desc': 'डिलिव्हरी नोकऱ्या, ड्रायव्हिंग आणि वाहतूक सेवा',
    
    // Authentication
    'auth.title': 'रोजगारसेतूमध्ये आपले स्वागत आहे',
    'auth.subtitle': 'रोजगाराच्या संधींचे तुमचे दार',
    'auth.email.label': 'ईमेल पत्ता',
    'auth.email.placeholder': 'तुमचा ईमेल टाका',
    'auth.password.label': 'पासवर्ड',
    'auth.password.placeholder': 'तुमचा पासवर्ड टाका',
    'auth.login': 'साइन इन करा',
    'auth.signup': 'साइन अप करा',
    'auth.toggle.login': 'आधीपासून खाते आहे? साइन इन करा',
    'auth.toggle.signup': 'खाते नाही? साइन अप करा',
    'auth.loading': 'कृपया प्रतीक्षा करा...',
    
    // Dashboard
    'dashboard.welcome': 'रोजगारसेतू डॅशबोर्डमध्ये आपले स्वागत आहे',
    'dashboard.role.question': 'आज तुम्हाला काय करायचे आहे?',
    'dashboard.employer.title': 'मला कामगार भरती करायचे आहेत',
    'dashboard.employer.desc': 'नोकरीच्या गरजा पोस्ट करा आणि कुशल कामगार शोधा',
    'dashboard.worker.title': 'मी कामाच्या शोधात आहे',
    'dashboard.worker.desc': 'उपलब्ध नोकऱ्या पहा आणि अर्ज करा',
    'dashboard.signout': 'साइन आउट',
    'dashboard.signout.confirm': '🔐 तुम्हाला खरोखर साइन आउट करायचे आहे का?',
    'dashboard.signout.desc': 'तुम्हाला तुमच्या डॅशबोर्डमध्ये प्रवेश करण्यासाठी पुन्हा लॉग इन करावे लागेल',
    
    // Employer Dashboard
    'employer.title': 'नियोक्ता डॅशबोर्ड',
    'employer.post.job': 'नवीन नोकरी पोस्ट करा',
    'employer.job.title': 'नोकरीचे शीर्षक',
    'employer.job.description': 'नोकरीचे वर्णन',
    'employer.job.location': 'स्थान',
    'employer.job.salary': 'पगार (₹)',
    'employer.job.post': 'नोकरी पोस्ट करा',
    'employer.jobs.posted': 'तुमच्या पोस्ट केलेल्या नोकऱ्या',
    
    // Worker Dashboard
    'worker.title': 'कामगार डॅशबोर्ड',
    'worker.jobs.available': 'उपलब्ध नोकऱ्या',
    'worker.apply': 'आत्ता अर्ज करा',
    'worker.applied': 'अर्ज केला',
    'worker.applications': 'तुमचे अर्ज',
    'worker.myApplications': 'माझे अर्ज',
    'worker.availableJobs': 'उपलब्ध नोकऱ्या',
    'worker.apply.short': 'अर्ज करा',
    'worker.apply.confirm': 'तुम्ही खरोखर या नोकरीसाठी अर्ज करू इच्छिता?',
    'worker.apply.already': 'तुम्ही या नोकरीसाठी आधीच अर्ज केला आहे.',
    'worker.apply.error': 'नोकरीसाठी अर्ज करताना त्रुटी: ',
    'worker.noApplications': 'तुम्ही अजून कोणत्याही नोकरीसाठी अर्ज केलेला नाही. खाली उपलब्ध नोकऱ्या पहा!',
    'worker.noJobs': 'सध्या कोणत्याही नोकऱ्या उपलब्ध नाहीत. नंतर परत या!',
    'worker.appliedOn': 'अर्ज केला',
    'worker.postedBy': 'द्वारे पोस्ट केले',
    'worker.posted': 'पोस्ट केले',
    'worker.recommended': 'तुमच्यासाठी शिफारसीत',
    'worker.skillsMatch': 'कौशल्य जुळते',
    
    // Footer and Landing Page Buttons
    'landing.footer.title': 'रोजगारसेतू',
    'landing.footer.description': 'भारतातील सर्वात विश्वसनीय प्लॅटफॉर्म जो घरमालकांना कुशल व्यावसायिकांशी जोडतो। सुरक्षित, विश्वसनीय आणि वापरण्यास सोपे - तुमच्या दारापर्यंत रोजगाराच्या संधी आणते.',
    'landing.footer.customers': 'ग्राहकांसाठी',
    'landing.footer.workers': 'कामगारांसाठी',
    'landing.footer.findWorkers': 'कामगार शोधा',
    'landing.footer.postJobs': 'नोकरी पोस्ट करा',
    'landing.footer.reviews': 'पुनरावलोकन आणि रेटिंग',
    'landing.footer.support': 'सहाय्य',
    'landing.footer.findWork': 'काम शोधा',
    'landing.footer.createProfile': 'प्रोफाइल तयार करा',
    'landing.footer.buildReputation': 'प्रतिष्ठा निर्माण करा',
    'landing.footer.getPaid': 'पैसे मिळवा',
    'landing.footer.copyright': '© 2025 रोजगारसेतू। सर्व हक्क राखीव। भारतात निर्मित 🇮🇳',
    'landing.buttons.lookingForWorkers': 'मी कामगार शोधत आहे',
    'landing.buttons.lookingForWork': 'मी काम शोधत आहे',
    
    // Footer
    'footer.forCustomers': 'ग्राहकांसाठी',
    'footer.findWorkers': 'कामगार शोधा',
    'footer.postJobs': 'नोकरी पोस्ट करा',
    'footer.howItWorks': 'हे कसे काम करते',
    'footer.about': 'आमच्या बद्दल',
    'footer.forWorkers': 'कामगारांसाठी',
    'footer.findWork': 'काम शोधा',
    'footer.createProfile': 'प्रोफाइल तयार करा',
    'footer.support': 'सहाय्य',
    'footer.contact': 'संपर्क',
    
    // Employer Dashboard
    'employer.yourJobPostings': 'तुमच्या नोकरी पोस्टिंग',
    'employer.postNewJob': 'नवीन नोकरी पोस्ट करा',
    'employer.cancel': 'रद्द करा',
    'employer.jobTitle': 'नोकरीचे शीर्षक',
    'employer.description': 'वर्णन',
    'employer.location': 'स्थान',
    'employer.fullAddressWithCommas': '(पूर्ण पत्ता स्वल्पविरामांसह अनुमतित)',
    'employer.pay': 'पगार (₹)',
    'employer.workerType': 'कामगार प्रकार',
    'employer.selectWorkerType': 'कामगार प्रकार निवडा...',
    'employer.employmentTypeHelp': 'तुमच्या नोकरीच्या आवश्यकतांना अनुकूल रोजगार प्रकार निवडा',
    'employer.characters': 'अक्षरे',
    'employer.postJob': '📝 नोकरी पोस्ट करा',
    'employer.noJobsPosted': 'तुम्ही अजूनपर्यंत कोणतीही नोकरी पोस्ट केलेली नाही। सुरुवात करण्यासाठी "नवीन नोकरी पोस्ट करा" वर क्लिक करा!',
    'employer.posted': 'पोस्ट केले',
    'employer.applications': 'अर्ज',
    'employer.noApplications': 'अजूनपर्यंत कोणतेही अर्ज नाहीत।',
    'employer.experience': 'अनुभव',
    'employer.years': 'वर्षे',
    'employer.skills': 'कौशल्ये',
    'employer.bio': 'बायो',
    'employer.accept': 'स्वीकार करा',
    'employer.reject': 'नाकारा',
    'employer.accepted': 'स्वीकृत',
    'employer.rejected': 'नाकारले',
    
    // Common
    'common.loading': 'लोड होत आहे...',
    'common.error': 'काहीतरी चूक झाली',
    'common.success': 'यशस्वी!',
    'common.cancel': 'रद्द करा',
    'common.confirm': 'पुष्टी करा',
    'common.back': 'मागे',
    'common.next': 'पुढे',
    'common.language': 'भाषा',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('hi'); // Default to Hindi

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('rozgaar-language') as Language;
    if (savedLanguage && ['en', 'hi', 'mr'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('rozgaar-language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    const translation = translations[language] as Record<string, string>;
    return translation[key] || key;
  };

  // Wrapper functions that use current language
  const translateJobContentWrapped = (text: string): string => {
    return translateJobContent(text, language);
  };

  const translateSkillNameWrapped = (skill: string): string => {
    return translateSkillName(skill, language);
  };

  const translateWorkerTypeWrapped = (type: string): string => {
    return translateWorkerType(type, language);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage, 
      t,
      translateJobContent: translateJobContentWrapped,
      translateSkillName: translateSkillNameWrapped,
      translateWorkerType: translateWorkerTypeWrapped
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Job content translation dictionaries
const jobTranslations = {
  // Skills translations
  skills: {
    en: {
      'electrician': 'Electrician',
      'carpenter': 'Carpenter', 
      'plumber': 'Plumber',
      'painter': 'Painter',
      'driver': 'Driver',
      'cook': 'Cook',
      'cleaner': 'Cleaner',
      'security': 'Security Guard',
      'mason': 'Mason',
      'welder': 'Welder',
      'mechanic': 'Mechanic',
      'gardener': 'Gardener',
      'helper': 'Helper',
      'technician': 'Technician',
      'worker': 'Worker',
      'labour': 'Labour',
      'supervisor': 'Supervisor'
    },
    hi: {
      'electrician': 'इलेक्ट्रीशियन',
      'carpenter': 'बढ़ई',
      'plumber': 'प्लंबर',
      'painter': 'पेंटर',
      'driver': 'ड्राइवर',
      'cook': 'रसोइया',
      'cleaner': 'सफाईकर्मी',
      'security': 'सिक्यूरिटी गार्ड',
      'mason': 'राजमिस्त्री',
      'welder': 'वेल्डर',
      'mechanic': 'मैकेनिक',
      'gardener': 'माली',
      'helper': 'सहायक',
      'technician': 'तकनीशियन',
      'worker': 'मजदूर',
      'labour': 'श्रमिक',
      'supervisor': 'पर्यवेक्षक'
    },
    mr: {
      'electrician': 'इलेक्ट्रिशियन',
      'carpenter': 'सुतार',
      'plumber': 'प्लंबर',
      'painter': 'पेंटर',
      'driver': 'ड्रायव्हर',
      'cook': 'स्वयंपाकी',
      'cleaner': 'स्वच्छताकर्मी',
      'security': 'सिक्यूरिटी गार्ड',
      'mason': 'राजमिस्त्री',
      'welder': 'वेल्डर',
      'mechanic': 'मेकॅनिक',
      'gardener': 'माळी',
      'helper': 'सहाय्यक',
      'technician': 'तंत्रज्ञ',
      'worker': 'कामगार',
      'labour': 'मजूर',
      'supervisor': 'पर्यवेक्षक'
    }
  },

  // Worker types translations
  workerTypes: {
    en: {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'daily-wage': 'Daily Wage',
      'hourly': 'Hourly',
      'temporary': 'Temporary'
    },
    hi: {
      'full-time': 'पूर्णकालिक',
      'part-time': 'अंशकालिक',
      'contract': 'संविदा',
      'daily-wage': 'दैनिक मजदूरी',
      'hourly': 'प्रति घंटे',
      'temporary': 'अस्थायी'
    },
    mr: {
      'full-time': 'पूर्णवेळ',
      'part-time': 'अर्धवेळ',
      'contract': 'करार',
      'daily-wage': 'दैनिक मजुरी',
      'hourly': 'तासाभराची',
      'temporary': 'तात्पुरती'
    }
  },

  // Common job-related words
  common: {
    en: {
      'required': 'Required',
      'experienced': 'Experienced',
      'urgent': 'Urgent',
      'hiring': 'Hiring',
      'looking for': 'Looking for',
      'need': 'Need',
      'work': 'Work',
      'job': 'Job',
      'position': 'Position',
      'vacancy': 'Vacancy',
      'apply': 'Apply',
      'experience': 'Experience',
      'salary': 'Salary',
      'immediately': 'Immediately',
      'skilled': 'Skilled',
      'construction': 'Construction',
      'house': 'House',
      'building': 'Building',
      'repair': 'Repair',
      'maintenance': 'Maintenance',
      'office': 'Office',
      'shop': 'Shop',
      'factory': 'Factory',
      'hotel': 'Hotel',
      'restaurant': 'Restaurant',
      'cleaning': 'Cleaning',
      'cooking': 'Cooking',
      'driving': 'Driving',
      'making': 'Making',
      'fixing': 'Fixing',
      'years': 'Years',
      'month': 'Month',
      'day': 'Day',
      'hour': 'Hour',
      'per': 'Per',
      'good': 'Good',
      'best': 'Best',
      'quality': 'Quality'
    },
    hi: {
      'required': 'आवश्यक',
      'experienced': 'अनुभवी',
      'urgent': 'तत्काल',
      'hiring': 'भर्ती',
      'looking for': 'तलाश',
      'need': 'चाहिए',
      'work': 'काम',
      'job': 'नौकरी',
      'position': 'पद',
      'vacancy': 'रिक्ति',
      'apply': 'आवेदन',
      'experience': 'अनुभव',
      'salary': 'वेतन',
      'immediately': 'तुरंत',
      'skilled': 'कुशल',
      'construction': 'निर्माण',
      'house': 'घर',
      'building': 'इमारत',
      'repair': 'मरम्मत',
      'maintenance': 'रखरखाव',
      'office': 'कार्यालय',
      'shop': 'दुकान',
      'factory': 'फैक्टरी',
      'hotel': 'होटल',
      'restaurant': 'रेस्टोरेंट',
      'cleaning': 'सफाई',
      'cooking': 'खाना बनाना',
      'driving': 'गाड़ी चलाना',
      'making': 'बनाना',
      'fixing': 'ठीक करना',
      'years': 'साल',
      'month': 'महीना',
      'day': 'दिन',
      'hour': 'घंटा',
      'per': 'प्रति',
      'good': 'अच्छा',
      'best': 'सबसे अच्छा',
      'quality': 'गुणवत्ता'
    },
    mr: {
      'required': 'आवश्यक',
      'experienced': 'अनुभवी',
      'urgent': 'तातडीची',
      'hiring': 'भरती',
      'looking for': 'शोधत आहे',
      'need': 'हवे',
      'work': 'काम',
      'job': 'नोकरी',
      'position': 'पद',
      'vacancy': 'रिक्त जागा',
      'apply': 'अर्ज',
      'experience': 'अनुभव',
      'salary': 'पगार',
      'immediately': 'तात्काळ',
      'skilled': 'कुशल',
      'construction': 'बांधकाम',
      'house': 'घर',
      'building': 'इमारत',
      'repair': 'दुरुस्ती',
      'maintenance': 'देखभाल',
      'office': 'कार्यालय',
      'shop': 'दुकान',
      'factory': 'कारखाना',
      'hotel': 'हॉटेल',
      'restaurant': 'रेस्टॉरंट',
      'cleaning': 'स्वच्छता',
      'cooking': 'स्वयंपाक',
      'driving': 'वाहन चालवणे',
      'making': 'बनवणे',
      'fixing': 'दुरुस्त करणे',
      'years': 'वर्षे',
      'month': 'महिना',
      'day': 'दिवस',
      'hour': 'तास',
      'per': 'प्रति',
      'good': 'चांगला',
      'best': 'सर्वोत्तम',
      'quality': 'गुणवत्ता'
    }
  }
};

// Function to translate job content automatically
export function translateJobContent(text: string, language: Language): string {
  if (language === 'en' || !text) return text;
  
  let translatedText = text;
  
  // Translate skills
  Object.entries(jobTranslations.skills.en).forEach(([englishSkill, _]) => {
    const translation = (jobTranslations.skills[language] as any)[englishSkill];
    if (translation) {
      const regex = new RegExp(`\\b${englishSkill}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation);
    }
  });
  
  // Translate worker types
  Object.entries(jobTranslations.workerTypes.en).forEach(([englishType, _]) => {
    const translation = (jobTranslations.workerTypes[language] as any)[englishType];
    if (translation) {
      const regex = new RegExp(`\\b${englishType}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation);
    }
  });
  
  // Translate common words
  Object.entries(jobTranslations.common.en).forEach(([englishWord, _]) => {
    const translation = (jobTranslations.common[language] as any)[englishWord];
    if (translation) {
      const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
      translatedText = translatedText.replace(regex, translation);
    }
  });
  
  return translatedText;
}

// Function to translate skill names for match indicators
export function translateSkillName(skill: string, language: Language): string {
  if (language === 'en' || !skill) return skill;
  
  const skillLower = skill.toLowerCase();
  const translation = (jobTranslations.skills[language] as any)[skillLower];
  return translation || skill;
}

// Function to translate worker types
export function translateWorkerType(type: string, language: Language): string {
  if (language === 'en' || !type) return type;
  
  const translation = (jobTranslations.workerTypes[language] as any)[type];
  return translation || type;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}