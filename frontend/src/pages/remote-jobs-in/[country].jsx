import HomePage from '@/pages/index';
import { fetchJobSearch, fetchJobTitles, fetchJobLocations, fetchSkills } from '@/constants';
import SEO from '@/components/SeoMetaData';

function CountryPage({ initialJobsData, initialFilterOptions, initialCountryData, seoProps }) {
    return (
        <>
            <SEO {...seoProps} />
            <HomePage
                initialJobsData={initialJobsData}
                initialFilterOptions={initialFilterOptions}
                initialCountryData={initialCountryData}
                disableHead={true} 
            />
        </>
    );
}

export async function getServerSideProps(context) {
    try {
        const { country: countrySlug } = context.params;

        const locationsRes = await fetch(fetchJobLocations);
        if (!locationsRes.ok) throw new Error('Failed to fetch locations');
        const allLocations = await locationsRes.json();
        
        const searchName = countrySlug.replace(/-/g, ' ');
        const currentCountry = allLocations.find(loc =>
            loc.name.replace(' – Remote', '').toLowerCase() === searchName
        );

        if (!currentCountry) {
            return { notFound: true };
        }
        
        const initialCountryData = {
            countryId: currentCountry.id,
            countryName: currentCountry.name.replace(' – Remote', '')
        };

        const searchPayload = {
            searchTerm: "",
            filters: { locationId: currentCountry.id },
            offset: 0,
            limit: 15 
        };

        const [jobsRes, titlesRes, skillsRes] = await Promise.all([
            fetch(fetchJobSearch, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchPayload)
            }),
            fetch(fetchJobTitles),
            fetch(fetchSkills)
        ]);
        
        if (!jobsRes.ok) throw new Error('Failed to fetch jobs for this country.');
        const initialJobsData = await jobsRes.json();
        
        const initialTitles = await titlesRes.json();
        const initialSkills = await skillsRes.json();

        const seoProps = {
            title: `Find Remote Jobs in ${initialCountryData.countryName}`,
            description: `Find and apply for the latest remote jobs available in ${initialCountryData.countryName}. Your next remote career opportunity is here.`,
            keywords: `remote jobs ${initialCountryData.countryName}, work from home ${initialCountryData.countryName}, remote careers in ${initialCountryData.countryName}`,
            url: `/remote-jobs-in/${countrySlug}`,
        };

        return {
            props: {
                initialJobsData, 
                initialFilterOptions: {
                    titles: initialTitles,
                    locations: allLocations, 
                    skills: initialSkills,
                },
                initialCountryData,
                seoProps,
            },
        };

    } catch (error) {
        console.error("Country Page SSR Error:", error);
        return { notFound: true }; 
    }
}

export default CountryPage;