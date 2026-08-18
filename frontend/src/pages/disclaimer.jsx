import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '@/styles/legal.module.css';
import Head from 'next/head'; 
import { AppName, mainURL } from '@/constants';

const DisclaimerPage = () => {
  return (
    <>
      <Head>
        <title>{`Disclaimer | ${AppName}`}</title>
        <meta name="description" content={`Please read the disclaimer for ${AppName}. This page outlines the limitations of liability regarding the use of our website and services.`} />
        <link rel="canonical" href={`${mainURL}/disclaimer`} />

        <meta property="og:title" content={`Disclaimer | ${AppName}`} />
        <meta property="og:description" content={`This page outlines the limitations of liability regarding the use of the ${AppName} website and services.`} />
        <meta property="og:url" content={`${mainURL}/disclaimer`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <Header />
      <div className={styles['legal-container']}>
        <h1>Disclaimer</h1>
        <p><strong>Last Updated:</strong> September 30, 2025</p>

        <h2>Accuracy of Information</h2>
        <p>The information provided by RemoteJobsHive ("we," "us," or "our") on remotejobshive.co (the "Site") is for general informational purposes only. A significant portion of our job listings is aggregated from various third-party sources. While we strive to keep the information up-to-date and correct, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.</p>

        <h2>No Employment Guarantee</h2>
        <p>RemoteJobsHive is a platform to connect job seekers with potential employers. We do not guarantee employment for any user. The final hiring decision rests solely with the hiring company. We are not a party to any employment agreement and are not responsible for the terms and conditions of any job offer.</p>

        <h2>External Links</h2>
        <p>The Site may contain links to other websites or content belonging to or originating from third parties. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us. We do not warrant, endorse, guarantee, or assume responsibility for the accuracy or reliability of any information offered by third-party websites linked through the site.</p>
      </div>
      <Footer />
    </>
  );
};

export default DisclaimerPage;