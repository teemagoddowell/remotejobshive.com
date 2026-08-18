import React, { useEffect, useState, useContext } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import { LocationIcon, ClockIcon, BookmarkIcon, AppName, BookmarkIconFilled, fetchSavedJobs, fetchMyApplications, fetchJobs, mainURL, LockIcon, fetchAnalyticsTrack } from '../../constants';
import { AuthContext } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from '@/styles/jobdetails.module.css';
import SEO from '@/components/SeoMetaData';
import AdComponent from '@/components/common/AdComponent';
import SubscriptionPlan from '@/components/common/Subscriptions';

const JobDetailsPage = ({ job, seoProps }) => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !token || !job) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(fetchSavedJobs, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const savedJobs = await response.json();
        const isJobSaved = savedJobs.some(savedJob => savedJob.id === job.id);
        setIsSaved(isJobSaved);
      } catch (error) {
        console.error("Could not verify saved status:", error);
      } finally {
          setIsLoading(false);
      }
    };
    checkIfSaved();
  }, [job, user, token]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast.error('Please log in to save jobs.');
      return;
    }

    const originalSavedState = isSaved;
    setIsSaved(!isSaved); 

    const url = `${fetchSavedJobs}${isSaved ? `/${job.id}` : ''}`;
    const method = isSaved ? 'DELETE' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: isSaved ? null : JSON.stringify({ jobId: job.id })
        });

        isSaved ? toast.error('Job removed from saved jobs.') : toast.success('Job saved for later!');
        if (!response.ok) setIsSaved(originalSavedState);
    } catch (error) {
        console.error("Failed to save job:", error);
        setIsSaved(originalSavedState);
    }
  };

  const handleApplyClick = async () => {
    const isExternal = !!job.apply_url;
    if (!isExternal && user?.role === "recruiter"){
      toast.error("You cannot apply for jobs with a recruiter account.");
      return;
    }
    if (!isExternal && !user) {
        router.push('/login');
        return;
    }
    const status = isExternal ? 'Applied (External)' : 'Applied';

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(fetchAnalyticsTrack, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                event_type: 'APPLY_CLICK',
                page_visited: router.asPath,
                job_id: job.id
            })
        });
    const responseData = await response.json();
    console.log("Analytics Track Response:", responseData);

    } catch (err) {
        console.error("Failed to track apply click:", err);
    }

    try {
        if (user) {
            const response = await fetch(fetchMyApplications, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ jobId: job.id, status: status })
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 409) toast.error(data.message || 'Already applied.');
                else throw new Error(data.message || 'Could not track application.');
            } else if (!isExternal) {
                toast.success(data.message || 'Application submitted!');
            }
        }
    } catch (error) {
        toast.error(`Error: ${error.message}`);
    }
  };

  const formatSalary = (num) => {
    if (typeof num !== 'number') return '';
    const currency = job.currency || '$';
    if (num >= 1000000) return `${currency}${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${currency}${Math.round(num / 1000)}k`;
    return `${currency}${num}`;
  };

  if (router.isFallback || !job) {
    return <div>Loading job details...</div>; 
  }

  return (
    <>
      <SEO {...seoProps} job={job}/>
      <Header />
      <div className={styles['job-details-page-body']}>
        <div className={styles['job-details-container']}>
          <div className={styles['job-main-content']}>
            <header className={styles['job-page-header']}>
              <div className={styles['job-title-section']}>
                <h1>{job.title}</h1>
                <div className={styles['job-meta-info']}>
                  <span><LocationIcon /> {job.job_location}</span>
                  <span><ClockIcon /> {job.job_type}</span>
                  {job.salary_min && <span>{formatSalary(job.salary_min)} - {formatSalary(job.salary_max)} {job.salary}</span>}
                </div>
              </div>
              <div className={styles['job-actions']}>
                {!isLoading &&
                  <button className={styles['save-job-btn']} onClick={handleSaveToggle}>
                    {isSaved ? <BookmarkIconFilled /> : <BookmarkIcon />}
                  </button>
                }
                {job.apply_url ? (
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className={styles['apply-now-btn']} onClick={handleApplyClick}>Apply Now</a>
                ) : (
                  <button onClick={handleApplyClick} className={styles['apply-now-btn']}>Apply Now</button>
                )}
              </div>
            </header>

            <section className={styles['job-description-section']}>
              <h2>Job Description</h2>
              <p className={styles['job-details-text']}>{job.description}</p>

              {/* {!user?.isSubscribed && (
                <div className={styles.adWrapper}>
                  <AdComponent adSlot="7679963908" type="in-article" />
                </div>
              )} */}
              
              <h3>Qualifications</h3>
              <p className={styles['job-details-text']}>{job.requirements}</p>

              {/* {!user?.isSubscribed && (
                <div className={styles.adWrapper}>
                  <AdComponent adSlot="9194842668" type="multiplex" />
                </div>
              )} */}
              
              {job.benefits && 
                <>
                  <h3>Benefits</h3>
                  <p className={styles['job-details-text']}>{job.benefits}</p> 
                </>
              }
              <br />
              {job.apply_url ? (
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className={styles['apply-now-btn']} onClick={handleApplyClick}>Apply Now</a>
              ) : (
                <button onClick={handleApplyClick} className={styles['apply-now-btn']}>Apply Now</button>
              )}
            </section>
          </div>

          <aside className={styles['company-sidebar']}>
            <div className={styles['company-info-card']}>
              <div className={styles['company-header']}>
                <div className={styles['company-logo-details']}>
                  <Link href={`/company/${job.company_slug}`}>
                    <img src={job.company_logo} alt={`${job.company_name} logo`} />
                  </Link>
                </div>
                <Link href={`/company/${job.company_slug}`}>
                  <span className={styles['company-name-details']}>{job.company_name}</span>
                </Link>
              </div>
              <p className={styles['job-details-text']}>{job.company_about}</p>
            </div>
            {job.skills &&
              <div className={styles['skills-card']}>
                <h3>Skills Required</h3>
                <div className={styles['skills-tags']}>
                  {job.skills.split(',').map((skill, index) => (
                    <span key={index} className={styles['skill-tag']}>{skill.trim()}</span>
                  ))}
                </div>
                {/* {!user?.isSubscribed && (
                  <div className={styles['sidebar-ad-container']}>
                    <AdComponent adSlot="6646562762" type="banner" />
                  </div>
                )} */}
              </div>
            }
              {!user && 
                <div className={styles['unlock-jobs-section']}>
                  <LockIcon />
                  <h3>Access All Jobs</h3>
                  <p>Sign up for a free account to unlock all job listings.</p>
                  <Link href="/sign-up" className="load-more-btn">
                      Create Free Account
                  </Link> 
              </div>
              }
          </aside>
        </div>
      </div>
      {!user?.isSubscribed && user?.role === 'user' && <SubscriptionPlan />}
      <Footer />
    </>
  );
};

export async function getServerSideProps(context) {
    const { slug } = context.params;
    try {
        const response = await fetch(`${fetchJobs}/${slug}`);
        if (!response.ok) {
            return { notFound: true };
        }
        const job = await response.json();

        const seoProps = {
        title: `${job.title} at ${job.company_name}`,
        description: job.excerpts || job.description,
        keywords: `${job.title}, ${job.company_name}, remote jobs, ${job.skills || ''}`,
        image: job.company_logo,
        url: `/job/${slug}`,
        };


        return {
            props: {
                job,
                seoProps
            },
        };
    } catch (error) {
        console.error(`Failed to fetch job details for slug: ${slug}`, error);
        return { notFound: true };
    }
}

export default JobDetailsPage;