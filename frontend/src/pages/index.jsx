import React, { useContext, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";
import SubscriptionPlan from "@/components/common/Subscriptions";
import JobCard from "@/components/common/JobCard";
import { AuthContext } from "@/context/AuthContext";
import Head from 'next/head'; 
import RecruiterSubscriptionPage from "./dashboard/recruiter/subscription";
import JobAlertModal from "@/components/common/JobAlertModal";
import { fetchJobs, fetchJobTitles, fetchJobLocations, fetchSkills, AppName, mainURL } from '@/constants';

function HomePage({ initialJobsData, initialFilterOptions, initialCountryData, disableHead = false }) {
    const { user } = useContext(AuthContext);
    const router = useRouter();
    const [showJobAlertModal, setShowJobAlertModal] = useState(false);

    const handleEnableAlerts = () => {
        if (!user) {
            router.push('/login'); 
            return;
        }
        setShowJobAlertModal(true);
    };

const totalCount = initialJobsData?.totalCount || 0;
let roundedCount;

switch (true) {
    case totalCount >= 1000:
        roundedCount = Math.floor(totalCount / 1000) * 1000;
        break;
    case totalCount >= 100:
        roundedCount = Math.floor(totalCount / 100) * 100;
        break;
    case totalCount >= 10:
        roundedCount = Math.floor(totalCount / 10) * 10;
        break;
    default:
        roundedCount = totalCount;
}

    const formattedCount = roundedCount.toLocaleString();

    return (
        <>
          {!disableHead && (
          <Head>
            <title>{`${AppName} | Find Your Next Remote Job`}</title>
            <meta name="description" content={`Discover thousands of remote jobs from top companies worldwide. ${AppName} helps you find the best work-from-home opportunities in tech, marketing, support, and more.`} />
            <link rel="canonical" href={mainURL} />

            {/* Open Graph */}
            <meta property="og:title" content={`${AppName} | Find Your Next Remote Job`} />
            <meta property="og:description" content={`Your go-to platform for finding remote job opportunities worldwide. We connect talented professionals with companies embracing remote work culture.`} />
            <meta property="og:url" content={mainURL} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content={AppName} />
            <meta property="og:image" content={`${mainURL}/favicon.png`} />

            {/* WebSite Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": AppName,
                    "url": mainURL,
                }) }}
            />
          </Head>
          )}
            <Header />
            <JobCard 
                initialJobsData={initialJobsData}
                initialFilterOptions={initialFilterOptions}
                initialLocationId={initialCountryData?.countryId} 
                formattedJobCount={formattedCount}
                initialLocationName={initialCountryData?.countryName} 
                onEnableAlerts={handleEnableAlerts}
            />
            
            
            {user && !user.isSubscribed && (
                user.role === 'user' 
                    ? <SubscriptionPlan />
                    : user.role === 'recruiter'
                        ? <RecruiterSubscriptionPage />
                        : null
            )}
            {showJobAlertModal && user?.role === "user" && <JobAlertModal user={user} onClose={() => setShowJobAlertModal(false)} />}
            <Footer />
        </>
    );
}

export async function getServerSideProps(context) {
  try {
    const { country } = context.params || {};

    const [jobsRes, titlesRes, locationsRes, skillsRes] = await Promise.all([
      fetch(fetchJobs),
      fetch(fetchJobTitles),
      fetch(fetchJobLocations),
      fetch(fetchSkills)
    ]);

    if (!jobsRes.ok || !titlesRes.ok || !locationsRes.ok || !skillsRes.ok) {
      throw new Error('Failed to fetch initial data for homepage');
    }

    const initialJobsData = await jobsRes.json();
    const initialTitles = await titlesRes.json();
    const initialLocations = await locationsRes.json();
    const initialSkills = await skillsRes.json();

    const initialFilterOptions = {
        titles: initialTitles,
        locations: initialLocations,
        skills: initialSkills,
    };
    
    let initialCountryData = null;
    if (country) {
        const countrySlug = country.toLowerCase();
        const searchName = countrySlug.replace(/-/g, ' ');
        const currentCountry = initialLocations.find(loc => 
            loc.name.replace(' – Remote', '').toLowerCase() === searchName
        );
        if (currentCountry) {
            initialCountryData = {
                countryId: currentCountry.id,
                countryName: currentCountry.name.replace(' – Remote', '')
            };
        } else {
             return { notFound: true }; 
        }
    }

    return {
      props: {
        initialJobsData,
        initialFilterOptions,
        initialCountryData,
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps for homepage:", error);
    return { props: { initialJobsData: {}, initialFilterOptions: {}, initialCountryData: null } };
  }
}

export default HomePage;