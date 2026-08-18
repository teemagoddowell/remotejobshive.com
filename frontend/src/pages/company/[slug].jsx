import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { JobCardDisplay } from '@/components/common/JobCard';
import { AppName, fetchCompanies, mainURL } from '@/constants';
import styles from '@/styles/companyProfile.module.css'
import SEO from '@/components/SeoMetaData';
import AdComponent from '@/components/common/AdComponent';

const CompanyProfilePage = ({ companyData, seoProps }) => {
    const router = useRouter();
    const [jobs, setJobs] = useState(companyData?.jobs || []);
    const [totalJobs, setTotalJobs] = useState(companyData?.totalJobs || 0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const offset = jobs.length;
        
        try {
            const response = await fetch(`${fetchCompanies}/${companyData.slug}?offset=${offset}`);
            const data = await response.json();
            
            setJobs(prevJobs => [...prevJobs, ...data.jobs]);

        } catch (err) {
            setError('Could not load more jobs.');
        } finally {
            setLoadingMore(false);
        }
    };

    if (router.isFallback || !companyData) {
        return <div>Loading company profile...</div>;
    }

    const pageUrl = `${mainURL}${router.asPath}`;

    return (
        <>
            <SEO {...seoProps} />
            
            <Header />
            
            <div className={styles['company-profile-container']}>
                <header className={styles['company-profile-header']}>
                    <img src={companyData.logo_url} alt={`${companyData.name} Logo`} className={styles['company-profile-logo']} />
                    <h1>{companyData.name}</h1>
                    <div className={styles['company-profile-links']}>
                        <a href={companyData.website_url} target="_blank" rel="noopener noreferrer">Website</a>
                        <span className={styles['link-divider']}>|</span>
                        <a href={companyData.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    </div>
                </header>

                <section className={styles['company-about-section']}>
                    <h2>About {companyData.name}</h2>
                    <p className={styles['company-about-text']}>{companyData.about}</p>
                </section>

                {/* <div className={styles['adWrapper']}>
                <AdComponent adSlot="3621886126" type="banner" />
                </div> */}

                <section className={`${styles['company-about-section']} ${styles['openings']}`}>
                    <h2>Current Openings</h2>
                </section>
            </div>

            <section className={styles['company-jobs-section']}>
                {totalJobs > 0 ? (
                    <div className={`${styles['jobs']} ${styles['jobs2']}`}>
                        <p className={styles['job-count']}>{totalJobs} Job {totalJobs > 1 ? 'Openings' : 'Opening'} Found at {companyData.name}</p>
                        {jobs.map((job, index) => (
                            <JobCardDisplay key={job.id} job={job} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className={styles['no-jobs-message']}>
                        <p>There are no active job openings at {companyData.name} at this time.</p>
                    </div>
                )}
                
                {jobs.length < totalJobs && (
                    <div className={styles['load-more-container']}>
                        <button onClick={handleLoadMore} className={`${styles['load-more-btn']}`} disabled={loadingMore}>
                            {loadingMore ? 'Loading...' : 'Load More Jobs'}
                        </button>
                    </div>
                )}
                {error && <p className={styles['error-message']}>{error}</p>}
            </section>
            
                {/* <div className={styles['adWrapper']}>
                    <AdComponent adSlot="3621886126" type="banner" />
                </div> */}
                            
            
            <Footer />
        </>
    );
};


export async function getServerSideProps(context) {
    const { slug } = context.params;
    try {
        const response = await fetch(`${fetchCompanies}/${slug}`);
        if (!response.ok) {
            return { notFound: true };
        }
        const companyData = await response.json();

        const seoProps = {
        title: `Remote Jobs at ${companyData.name}`,
        description: companyData.about,
        image: companyData.logo_url,
        keywords: `${companyData.name}, remote jobs, careers, work from home`,
        url: `/company/${slug}`,
        }; 
        
        return {
            props: {
                companyData, 
                seoProps,
            },
        };
    } catch (error) {
        console.error(`Failed to fetch company profile for slug: ${slug}`, error);
        return { notFound: true };
    }
}

export default CompanyProfilePage;