import React from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import style from '@/styles/about.module.css'
import { AppName, mainURL, Teema } from '@/constants';
import Head from 'next/head'; 

const AboutPage = () => {

  return (
    <>
      <Head>
        <title>{`About Us | ${AppName}`}</title>
        <meta name="description" content={`Learn about ${AppName}'s mission to connect talented professionals with leading remote-first companies. Discover our story and what drives us.`} />
        <link rel="canonical" href={`${mainURL}/about`} />

        <meta property="og:title" content={`About Us | ${AppName}`} />
        <meta property="og:description" content={`Learn about ${AppName}'s mission to connect talented professionals with leading remote-first companies.`} />
        <meta property="og:url" content={`${mainURL}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <Header />
      <div className={style['about-container']}>
        {/* Hero Section */}
        <div className={style['about-hero']}>
          <h1>Our Mission</h1>
          <p className={style['lead']}>To bridge the gap between brilliant talent and innovative companies, regardless of geographical boundaries. We believe the future of work is remote, and we're here to build it.</p>
        </div>

        {/* For Job Seekers & Recruiters */}
        <div className={style['features-grid']}>
          <div className={style['feature-card']}>
            <h3>For Job Seekers</h3>
            <p>We provide a curated, spam-free list of high-quality remote jobs. Our platform is designed to help you find your dream remote career with tools to track applications and get discovered.</p>
          </div>
          <div className={style['feature-card']}>
            <h3>For Recruiters</h3>
            <p>Access a global pool of dedicated, skilled professionals. Our platform makes it simple to post job openings, manage applicants, and find the perfect candidate to grow your team.</p>
          </div>
        </div>

        {/* Founder Section */}
        <div className={style['founder-section']}>
          <img src={Teema} alt="Teema, Founder of RemoteJobsHive" className={style['founder-photo']} />
          <h2>A Note from the Founder</h2>
          <p>As a full-stack developer passionate about the potential of remote work, I built RemoteJobsHive to solve a problem I saw firsthand: the difficulty in finding legitimate, high-quality remote roles. This platform is the result of that vision—a clean, efficient, and trustworthy space for the future of work.</p>
          <p><strong>- Teema Goddowell, Founder</strong></p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;