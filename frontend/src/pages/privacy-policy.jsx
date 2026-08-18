import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '@/styles/legal.module.css';
import Head from 'next/head'; 
import { AppName, mainURL } from '@/constants';

const PrivacyPolicyPage = () => {
  return (
    <>
        <Head>
          <title>{`Privacy Policy | ${AppName}`}</title>
          <meta name="description" content={`Read the official Privacy Policy for ${AppName}. Understand how we collect, use, and protect your personal data.`} />
          <link rel="canonical" href={`${mainURL}/privacy-policy`} />

          <meta property="og:title" content={`Privacy Policy | ${AppName}`} />
          <meta property="og:description" content={`Understand how ${AppName} collects, uses, and protects your personal data.`} />
          <meta property="og:url" content={`${mainURL}/privacy-policy`} />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={AppName} />
          <meta property="og:image" content={`${mainURL}/logo.png`} />
        </Head>
      <Header />
      <div className={styles['legal-container']}>
        <h1>Privacy Policy for RemoteJobsHive</h1>
        <p><strong>Last Updated:</strong> September 30, 2025</p>

        <h2>1. Introduction</h2>
        <p>Welcome to RemoteJobsHive ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, remotejobshive.co.</p>

        <h2>2. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
        <ul>
          <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and professional title, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</li>
          <li><strong>User-Generated Content:</strong> Information you provide when you post jobs, upload a resume, or apply for a position, including your resume, work history, and other professional details.</li>
          <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, and the pages you have viewed.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
        <ul>
          <li>Create and manage your account.</li>
          <li>Facilitate job applications by sharing your resume and profile with potential employers.</li>
          <li>Email you regarding your account or job applications.</li>
          <li>Process payments and manage your subscriptions.</li>
          <li>Monitor and analyze usage and trends to improve your experience with the Site.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to review, change, or terminate your account at any time. You can do this by logging into your account settings or by contacting us using the contact information provided below.</p>

        <h2>6. Contact Us</h2>
        <p>If you have questions or comments about this Privacy Policy, please contact us at: <a className='mail' href="mailto:support@remotejobshive.co">support@remotejobshive.co</a></p>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicyPage;