import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import styles from '@/styles/legal.module.css';
import Head from 'next/head'; 
import { AppName, mainURL } from '@/constants';
import Link from 'next/link';

const RefundPolicy = () => {
  return (
    <>
      <Head>
        <title>{`Refund Policy | ${AppName}`}</title>
        <meta name="description" content={`Read the Refund Policy for ${AppName}. Learn how refunds, cancellations, and subscription issues are handled on Remote JobsHive.`} />
        <link rel="canonical" href={`${mainURL}/refund-policy`} />

        <meta property="og:title" content={`Refund Policy | ${AppName}`} />
        <meta property="og:description" content={`Learn how refunds are handled for subscriptions and premium services on ${AppName}.`} />
        <meta property="og:url" content={`${mainURL}/refund-policy`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <Header />
      <div className={styles['legal-container']}>
        <h1>Remote JobsHive — Refund Policy</h1>
        <p><strong>Last Updated:</strong> December 2, 2025</p>

        <h2>1. Introduction</h2>
        <p>At Remote JobsHive, we strive to provide accurate job listings and useful services to our users. This Refund Policy explains when refunds may be requested, what qualifies for a refund, and how refund requests are processed. By using our services or purchasing any paid features, you agree to the terms of this policy.</p>
        
        <h2>2. What We Offer / Scope</h2>
        <p>Remote JobsHive offers access to job listings, filtering/search tools, and may provide premium services or subscriptions. This policy covers any paid purchase, subscription plan or premium service on Remote JobsHive.</p>

        <h2>3. Eligibility — When Refunds May Be Granted</h2>
        <p>Refunds (or partial refunds) may be considered under these circumstances:</p>
        <ul>
            <li>You paid for a subscription or premium service, and you cancel within 5 days of purchase.</li>
            <li>The paid service was unavailable or inaccessible due to a confirmed technical issue on our side.</li>
            <li>You request cancellation before substantial use of the service, and notify us within the refund window.</li>
        </ul>

        <h2>4. What Is Not Eligible for Refunds</h2>
        <p>We cannot grant refunds when:</p>
        <ul>
            <li>The user has already consumed or significantly used the service (e.g. used premium listing tools, downloaded data, or used job-search filters extensively).</li>
            <li>The user simply changes their mind after using the service.</li>
            <li>Job listings or job matches from Remote JobsHive do not result in a hire — because Remote JobsHive only aggregates listings and cannot guarantee employment success.</li>
            <li>Any free features or publicly available listings (i.e. no payment required).</li>
            <li>“Substantial use” includes accessing premium filters repeatedly, exporting data, or using any feature that consumes server-side resources.</li>
            <li>Refund requests outside the refund window or without valid justification.</li>
        </ul>

        <h2>5. How to Request a Refund</h2>
        <p>To request a refund:</p>
        <ol>
            <li>Contact us at <Link href='/contact'>Contact Page</Link> with subject “Refund Request”.</li>
            <li>Provide the following details: your username/email associated with purchase, date of purchase, and a brief reason for the request.</li>
            <li>Indicate whether you are requesting a full or partial refund (if partial refund is applicable).</li>
            <li>Submit the request within 5 days of purchase. For malfunction claims, submit as soon as you notice the issue.</li>
        </ol>
        <p>We will review your request and respond within 3 business days.</p>
        
        <h2>6. Refund Processing</h2>
        <ul>
            <li>If approved, refunds will be issued via the same payment method used for the original purchase, or — at our discretion — as account credit on Remote JobsHive.</li>
            <li>Refund processing may take up to 7 business days depending on payment provider.</li>
            <li>Account access (to premium features) may be revoked upon refund.</li>
        </ul>
        

        <h2>7. Subscriptions & Cancellations</h2>
        <ul>
            <li>For subscription plans: if you cancel within 5 days, you may be eligible for a refund (full or prorated depending on usage).</li>
            <li>After the refund window, cancellations will prevent future billing but no refund will be provided for the current period.</li>
            <li>Automatic renewals will occur only if the user has opted in; we commit to sending reminders before renewal.</li>
        </ul>

        <h2>8. Disclaimers & Limitations</h2>
        <ul>
            <li>Remote JobsHive does not guarantee that use of our service will result in securing a job. Refunds are not granted on the basis of “no job obtained.”</li>
            <li>We are not responsible for external factors (employer decisions, market conditions, user actions) that affect job outcomes.</li>
            <li>This Refund Policy does not affect any statutory consumer rights you may have under your applicable jurisdiction.</li>
        </ul>

        <h2>9. Policy Changes</h2>
        <p>We may update this Refund Policy periodically. Updated versions will have a new “Last updated” date. It is your responsibility to check the policy when using our services. Continued use after changes constitutes acceptance of the modified terms.</p>
        
        <h2>10. Contact Information</h2>
        <p>If you have any questions, concerns, or refund requests, contact us at: 
            <Link href='/contact'>Contact Page</Link> <br></br>
        We aim to respond within 2 business days.</p>

      </div>
      <Footer />
    </>
  );
};

export default RefundPolicy;