import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '@/styles/legal.module.css';
import Head from 'next/head'; 
import { AppName, mainURL } from '@/constants';

const TermsOfServicePage = () => {
  return (
    <>
      <Head>
        <title>{`Terms of Service | ${AppName}`}</title>
        <meta name="description" content={`Review the Terms of Service for using ${AppName}. Your use of our platform is subject to these terms and conditions.`} />
        <link rel="canonical" href={`${mainURL}/terms-of-service`} />

        <meta property="og:title" content={`Terms of Service | ${AppName}`} />
        <meta property="og:description" content={`Your use of the ${AppName} platform is subject to these terms and conditions.`} />
        <meta property="og:url" content={`${mainURL}/terms-of-service`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <Header />
      <div className={styles['legal-container']}>
        <h1>Terms of Service for RemoteJobsHive</h1>
        <p><strong>Last Updated:</strong> September 30, 2025</p>

        <h2>1. Agreement to Terms</h2>
        <p>By using our website, remotejobshive.co (the "Site"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not access or use the Site.</p>
        
        <h2>2. User Accounts</h2>
        <p>You are responsible for safeguarding your account information, including your password, and for any activities or actions under your account. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>

        <h2>3. User Content</h2>
        <p>Our Site allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. By posting Content, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.</p>

        <h2>4. Payments and Subscriptions</h2>
        <p>Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis. By submitting payment information, you authorize us to charge all subscription fees incurred through your account to any such payment instruments.</p>

        <h2>5. Prohibited Activities</h2>
        <p>You may not access or use the Site for any purpose other than that for which we make the Site available. Prohibited activity includes, but is not limited to: systematic retrieval of data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</p>
        
        <h2>6. Limitation of Liability</h2>
        <p>In no event shall RemoteJobsHive, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

        <h2>7. Governing Law</h2>
        <p>These Terms shall be governed and construed in accordance with the laws of [Your Country/State], without regard to its conflict of law provisions.</p>

        <h2>8. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us at: <a className='mail' href="mailto:support@remotejobshive.co">support@remotejobshive.co</a></p>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfServicePage;