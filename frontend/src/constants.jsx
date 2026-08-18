import React from 'react';

export const AppName = "Remote JobsHive";
// export const backend = process.env.NEXT_PUBLIC_API_URL;
export const backend = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL || 'http://remotejobshive-backend:8000')
  : process.env.NEXT_PUBLIC_API_URL;
export const logoURL = "/logo.png";

export const mainURL = process.env.NEXT_PUBLIC_MAIN_URL;
export const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;


// --- SVG Icon Components ---
export const EyeOpenIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>);
export const EyeClosedIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>);
export const GoogleIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.649-3.657-11.303-8.524l-6.571,4.819C9.656,39.663,16.318,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.018,35.258,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>);
export const SupportIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h3"></path><path d="M6 18H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h2"></path><path d="M18 6V4c0-1.1-.9-2-2-2h-2"></path><path d="M6 12H4"></path><path d="M14 6h-2"></path><path d="M14 18h-2"></path><path d="M14 12h-2"></path></svg>);
export const LocationIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>);
export const ClockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>);
export const DollarSignIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>);
export const BookmarkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>);
export const DashboardIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
export const PostingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>;
export const ApplicantsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
export const ProfileIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
export const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
export const BriefcaseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
export const SavedJobsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>;
export const SubscriptionIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v1a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-1h20zM2 10V9a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v1H2z"></path><line x1="7" y1="15" x2="7.01" y2="15"></line><line x1="12" y1="15" x2="12.01" y2="15"></line></svg>;
export const ApplicationsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
export const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
export const CalendarIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
export const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
export const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
export const LockIcon = () =><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
export const BookmarkIconFilled = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>;
export const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ color: 'var(--primary-accent)' }}><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>;
export const UnlockIcon = () =>  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect> <path d="M7 11V7a5 5 0 0 1 8.5-3.5"></path> <path d="M12 17L12 17"></path></svg>
export const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
export const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;  

// Test Plans
// export const plans = [
//     {
//       id: 1,
//       name: 'Weekly',
//       price: 5,
//       period: '/ week',
//       features: ['Weekly Subscription', 'Unlock all jobs', 'Cancel Anytime'],
//       isPopular: false,
//       fw_plan_id: 226335,
//       plan_name: 'HIVE-PRO Weekly',
//     },
//     {   
//       id: 2,
//       name: 'Monthly',
//       price: 15,
//       period: '/ month',
//       features: ['Monthly Subscription', 'Unlock all jobs', 'Cancel Anytime'],
//       isPopular: true,
//       fw_plan_id: 226336,
//       plan_name: 'HIVE-PRO Monthly',
//     },
//     {
//       id: 3,  
//       name: 'Yearly',
//       price: 50,
//       period: '/ year',
//       features: ['Yearly Subscription', 'Unlock all jobs', 'Cancel Anytime'],
//       isPopular: false,
//       fw_plan_id: 226337,
//       plan_name: 'HIVE-PRO Yearly',
//     },
// ];

// Live Plans 
const featuresList = ['Unlock all jobs', 'No Ads', 'Save Jobs', 'Track Applications'];

export const plans = [
    {
      id: 1,
      name: 'Weekly',
      price: 5,
      period: '/ week',
      features: featuresList,
      isPopular: false,
      fw_plan_id: 147983,
      plan_name: 'HIVE-PRO Weekly',
    },
    {   
      id: 2,
      name: 'Monthly',
      price: 15,
      period: '/ month',
      features: featuresList,
      isPopular: true,
      fw_plan_id: 147984,
      plan_name: 'HIVE-PRO Monthly',
    },
    {
      id: 3,  
      name: 'Yearly',
      price: 50,
      period: '/ year',
      features: featuresList,
      isPopular: false,
      fw_plan_id: 147985,
      plan_name: 'HIVE-PRO Yearly',
    },
];

export const recruiterPlans = [
    {
      id: 4,
      name: 'HIVER-PRO',
      price: 100,
      period: 'Lifetime',
      fw_plan_id: 21092000,
      features: ['Post Unlimited Jobs', 'View All Applicant Resumes', 'Company Profile Branding','Priority Job Listings', 'Dedicated Support'],
      plan_name: 'HIVER-PRO Lifetime',
    },
];

// ROUTES
export const recruiterDashboard = "/dashboard/recruiter";
export const userDashboard = "/dashboard/user";
export const login = "/login";
export const register = "/sign-up";
export const logout = "/logout";
export const jobPage = "/jobs";
export const singleJob = "/job"
export const support = "/contact";


// Recruiter Menu 
export const rMenu = {
  item1: {id: 1, class: "links", title: "Job Search", link: "/"},
  item2: {id: 2, class: "links", title: "Terms of Service", link: "/"},
  item3: {id: 3, class: "links", title: "Support", link: "/"},
  item4: {id: 4, class: "button", title: "Dashboard", link: recruiterDashboard},
}

// User Menu 
export const uMenu = {
  item1: {id: 1, class: "links", title: "Find Jobs", link: "/"},
  item2: {id: 2, class: "links", title: "My Applications", link: `${userDashboard}/applications`},
  item3: {id: 3, class: "links", title: "Saved Jobs", link: `${userDashboard}/saved-jobs`},
  item4: {id: 4, class: "button", title: "Dashboard", link: userDashboard},
}

// Default Menu 
export const dMenu = {
  item1: {id: 1, class: "links", title: "Post Job", link: recruiterDashboard},
  item2: {id: 2, class: "links", title: "Build Resume", link: "#"},
  item3: {id: 3, class: "links", title: "Support", link: "/contact"},
  item4: {id: 4, class: "button", title: "Login", link: login, cName:"headbtn btn btn-outline"},
  item5: {id: 5, class: "button", title: "Register", link: register, cName:"headbtn btn btn-primary"},
}


// Signup Features 
export const userFeatures = [
  {
    title: "Discover Your Next Role",
    description: "Access thousands of curated remote jobs from around the world. Our advanced filters help you find the perfect match based on skills, salary, and location.",
  },
  {
    title: "Effortless Application Tracking",
    description: "Save jobs you're interested in and track the status of every application you submit, all from your personal, intuitive dashboard.",
  },
  {
    title: "Showcase Your Talent",
    description: "Build a professional profile and upload your resume. Let top remote-first companies discover your skills and experience.",
  },
];

export const recruiterFeatures = [
  {
    title: "Access a Global Talent Pool",
    description: "Connect with a diverse and skilled pool of professionals from around the world who are actively seeking remote opportunities.",
  },
  {
    title: "Simplified Job Posting",
    description: "Create and publish your job openings in minutes with our intuitive form. Attract the right candidates with detailed, well-presented listings.",
  },
  {
    title: "Centralized Applicant Tracking",
    description: "Review and manage all your candidates in one organized dashboard. Securely view resumes and streamline your hiring process.",
  },
  {
    title: "Build Your Employer Brand",
    description: "Create a dedicated company page with your logo, details, and all your active job listings to attract top talent that aligns with your mission.",
  },
  {
    title: "Data-Driven Hiring",
    description: "Leverage powerful analytics to track your hiring metrics. Understand your applicant pipeline and optimize your strategy with actionable data.",
  },
];


// Backend API 
export const fetchJobs = `${backend}/jobs`;
export const fetchJobsEdit = `${backend}/jobs/edit`;
export const fetchJobsPro = `${backend}/jobs/premium`;
export const fetchregister = `${backend}/register`;
export const fetchlogin = `${backend}/login`;
export const fetchAuthGoogle = `${backend}/auth/google`;
export const fetchGooglev3 = "https://www.googleapis.com/oauth2/v3/userinfo";
export const fetchNewJobs = `${backend}/add-jobs`;
export const fetchPaymentVerify = `${backend}/payments/verify`;
export const fetchManageSubscription = `${backend}/subscriptions/me`;
export const fetchCancelSubscription = `${backend}/subscriptions/cancel`;
export const fetchJobAlerts = `${backend}/job-alerts`;
export const fetchUserStatus = `${backend}/users/me/status`;

// Job Filters 
export const fetchCompanies = `${backend}/companies`;
export const fetchJobTitles = `${backend}/job-titles`;
export const fetchJobLocations = `${backend}/job-locations`;
export const fetchJobSearch =  `${backend}/jobs/search`;
export const fetchSkills = `${backend}/skills`;

// User Dashoboard 
export const fetchUserStats = `${backend}/dashboard/user/stats`;
export const fetchMyApplications = `${backend}/applications`;
export const fetchSavedJobs = `${backend}/saved-jobs`;
export const fetchUserProfile = `${backend}/users/me/profile`;
export const fetchUserMe = `${backend}/users/me`;
export const fetchUserAvatar = `${backend}/users/me/avatar`;
export const fetchResume = `${backend}/users/me/resume`;
export const fetchChangePassword = `${backend}/users/me/change-password`;

// Recruiter Dashboard 
export const fetchAllJobs = `${backend}/recruiter/jobs`;
export const fetchResumeDownload = `${backend}/resumes/download`;
export const fetchViewDownload = `${backend}/resumes/open`;
export const fetchMyApplicants = `${backend}/recruiter/applicants`;
export const fetchMyDashboardStats = `${backend}/recruiter/dashboard/stats`;

// Forgot Password
export const forgotPassword = "/forgot-password";
export const resetPassword = "/reset-password";

// Pages 
export const aboutUs = "/about";
export const contactUs = "/contact";
export const termsOfService = "/terms-of-service";
export const privacyPolicy = "/privacy-policy";
export const disclaimer = "/disclaimer";
export const Teema = "/images/teema.jpeg";

// Password Reset 
export const fetchResetPassword = `${backend}/reset-password`;
export const fetchForgotPassword = `${backend}/forgot-password`;
export const fetchContact = `${backend}/contact`;

// Remote Jobs By Country 
export const CanadaJobs = "/remote-jobs-in/canada";
export const UKJobs = "/remote-jobs-in/united-kingdom";
export const AustraliaJobs = "/remote-jobs-in/australia";
export const IrelandJobs = "/remote-jobs-in/ireland";
export const FranceJobs = "/remote-jobs-in/france";


// Currencies 
export const currencyOptions = [
    { code: 'USD', name: 'United States Dollar ($)' },
    { code: 'NGN', name: 'Nigerian Naira (₦)' },
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' },
];

// Salary Ranges 
export const salaryRanges = [
    { label: 'Salary', min: '' },
    { label: '$30k+/year', min: 30000 },
    { label: '$50k+/year', min: 50000 },
    { label: '$80k+/year', min: 80000 },
    { label: '$100k/year', min: 100000 },
    { label: '$150k+/year', min: 150000 },
    { label: '$200k+/year', min: 200000 },
    { label: '$300k+/year', min: 300000 }
];

export const fetchAnalyticsTrack = `${backend}/analytics/track`;

export const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
