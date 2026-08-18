import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';
import RecruiterDashboardLayout from '@/components/layouts/RecruiterDashboard';
import { AppName, BriefcaseIcon, LocationIcon, DollarSignIcon, fetchNewJobs, fetchCompanies, fetchJobTitles, fetchJobLocations, fetchSkills, currencyOptions, fetchJobs, fetchJobsEdit } from '@/constants';
import { AuthContext } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import styles from '@/styles/newjob.module.css';

const NewJobPostingPage = ({ initialData, error }) => {
    const router = useRouter();
    const { user, loading: userLoading } = useContext(AuthContext);
    const { edit: jobIdToEdit } = router.query;
    const isEditing = !!jobIdToEdit;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // --- State for Dropdown Data (from server) ---
    const [companies, setCompanies] = useState(initialData.companies || []);
    const [jobTitles, setJobTitles] = useState(initialData.jobTitles || []);
    const [jobLocations, setJobLocations] = useState(initialData.jobLocations || []);
    const [allSkills, setAllSkills] = useState(initialData.allSkills || []);

    // --- State for Company Details ---
    const [logoFile, setLogoFile] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companySearchTerm, setCompanySearchTerm] = useState('');
    const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
    
    // --- State for New Company Form ---
    const [newCompanyName, setNewCompanyName] = useState('');
    const [aboutCompany, setAboutCompany] = useState('');
    const [website, setWebsite] = useState('');
    const [linkedin, setLinkedin] = useState('');
    const [isSavingCompany, setIsSavingCompany] = useState(false); 
    
    // --- State for Job Title, Location, and Skills UI ---
    const [selectedJobTitle, setSelectedJobTitle] = useState(null);
    const [titleSearchTerm, setTitleSearchTerm] = useState('');
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locationSearchTerm, setLocationSearchTerm] = useState('');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState([]); 
    const [skillSearchTerm, setSkillSearchTerm] = useState('');
    const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

    // --- State for Job Details Form ---
    const [displayJobTitle, setDisplayJobTitle] = useState('');
    const [jobType, setJobType] = useState('Full-time');
    const [jobPosition, setJobPosition] = useState('Mid-Level');
    const [jobExperience, setJobExperience] = useState('');
    const [visaSponsorship, setVisaSponsorship] = useState(false);
    const [degreeRequired, setDegreeRequired] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [jobRequirements, setJobRequirements] = useState('');
    const [jobBenefits, setJobBenefits] = useState('');
    const [department, setDepartment] = useState('');
    
    const [salaryMin, setSalaryMin] = useState('');
    const [salaryMax, setSalaryMax] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (userLoading) {
            return;
        }

        if (user?.isSubscribed || isEditing) {
            setIsAuthorized(true);
        } else {
            toast.error("You need an active subscription to post a new job.");
            router.push('/dashboard/recruiter/subscription');
        }
    }, [user, userLoading, isEditing, router]);

    useEffect(() => {
        const populateFormForEdit = async () => {
            if (isEditing && jobIdToEdit && allSkills.length > 0 && companies.length > 0) {
                try {
                    const res = await fetch(`${fetchJobsEdit}/${jobIdToEdit}`); 
                    if (!res.ok) throw new Error("Job not found");
                    const jobToEdit = await res.json();
                    
                    setDisplayJobTitle(jobToEdit.title);
                    setJobType(jobToEdit.job_type);
                    setJobPosition(jobToEdit.job_position);
                    setJobExperience(jobToEdit.job_experience);
                    setVisaSponsorship(jobToEdit.visa_sponsorship);
                    setDegreeRequired(jobToEdit.degree_required);
                    setJobDescription(jobToEdit.description);
                    setJobRequirements(jobToEdit.requirements);
                    setJobBenefits(jobToEdit.benefits);
                    setDepartment(jobToEdit.department);
                    setSalaryMin(jobToEdit.salary_min || '');
                    setSalaryMax(jobToEdit.salary_max || '');
                    setCurrency(jobToEdit.currency || 'USD');
    
                    setSelectedCompany(companies.find(c => c.id === jobToEdit.company_id));
                    setSelectedJobTitle(jobTitles.find(t => t.id === jobToEdit.job_title_id));
                    setSelectedLocation(jobLocations.find(l => l.id === jobToEdit.location_id));
    
                    if (jobToEdit.skills) {
                        const skillNames = jobToEdit.skills.split(',').map(s => s.trim());
                        const skillObjects = allSkills.filter(s => skillNames.includes(s.name));
                        setSelectedSkills(skillObjects);
                    }
                } catch (error) {
                    toast.error("Could not load job data for editing.");
                    router.push('/dashboard/recruiter/job-listings');
                }
            }
        };
        populateFormForEdit();
    }, [isEditing, jobIdToEdit, companies, jobTitles, jobLocations, allSkills, router]);


    const handleCompanySelect = (company) => {
        setSelectedCompany(company);
        setIsCompanyDropdownOpen(false);
        setCompanySearchTerm(company === 'new' ? '' : company.name);
    };
    
    const handleTitleSelect = (title) => {
        setSelectedJobTitle(title);
        setTitleSearchTerm(title.name);
        setIsTitleDropdownOpen(false);
    };

    const handleLocationSelect = (location) => {
        setSelectedLocation(location);
        setLocationSearchTerm(location.name);
        setIsLocationDropdownOpen(false);
    };

    const handleSkillSelect = (skillToAdd) => {
        if (!selectedSkills.find(s => s.id === skillToAdd.id)) {
            setSelectedSkills([...selectedSkills, skillToAdd]);
        }
        setSkillSearchTerm('');
        setIsSkillDropdownOpen(false);
    };

    const handleSkillRemove = (skillToRemove) => {
        setSelectedSkills(selectedSkills.filter(s => s.id !== skillToRemove.id));
    };

    const handleSaveNewCompany = async () => {
        if (!newCompanyName.trim()) return toast.error("Please enter a name for the new company.");
        if (!logoFile) return toast.error("Please select a logo for the new company.");
        
        setIsSavingCompany(true);
        const toastId = toast.loading('Saving new company...');
        try {
            const companyFormData = new FormData();
            companyFormData.append('name', newCompanyName);
            companyFormData.append('about', aboutCompany);
            companyFormData.append('website_url', website);
            companyFormData.append('linkedin_url', linkedin);
            companyFormData.append('logo', logoFile);

            const response = await fetch(fetchCompanies, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: companyFormData
            });
            const newCompany = await response.json();
            if (!response.ok) throw new Error(newCompany.message || 'Failed to create company.');
            
            toast.success('Company saved successfully!', { id: toastId });
            setCompanies(prev => [...prev, newCompany]);
            handleCompanySelect(newCompany);

        } catch (error) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setIsSavingCompany(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEditing && !selectedCompany) {
            return toast.error("Please select a company or choose to add a new one.");
        }
        if (!selectedJobTitle || !selectedLocation) {
            return toast.error("Please select a job category and location.");
        }
        
        const toastId = toast.loading(isEditing ? 'Updating job...' : 'Posting job...');
        const cleanedSalaryMin = salaryMin ? parseInt(String(salaryMin).replace(/[^0-9]/g, '')) : null;
        const cleanedSalaryMax = salaryMax ? parseInt(String(salaryMax).replace(/[^0-9]/g, '')) : null;
        
        const jobData = { 
            title: displayJobTitle, 
            jobTitleId: selectedJobTitle.id,
            locationId: selectedLocation.id,
            jobType, jobPosition, jobExperience, visaSponsorship,
            salary_min: cleanedSalaryMin,
            salary_max: cleanedSalaryMax,
            currency, degreeRequired, skills: selectedSkills.map(s => s.id), 
            jobDescription, jobRequirements, jobBenefits, department
        };
        
        const url = isEditing ? `${fetchJobs}/${jobIdToEdit}` : fetchNewJobs;
        const method = isEditing ? 'PATCH' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ job: jobData, company: selectedCompany })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            toast.success(isEditing ? 'Job updated successfully!' : 'Job posted successfully!', { id: toastId });
            router.push('/dashboard/recruiter/job-listings');
        } catch (error) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        }
    };
    
    const filteredCompanies = companies.filter(c => c.name?.toLowerCase().includes(companySearchTerm.toLowerCase()));
    const filteredJobTitles = jobTitles.filter(t => t.name?.toLowerCase().includes(titleSearchTerm.toLowerCase()));
    const filteredJobLocations = jobLocations.filter(l => l.name?.toLowerCase().includes(locationSearchTerm.toLowerCase()));
    const filteredSkillOptions = allSkills.filter(skill => 
        !selectedSkills.find(s => s.id === skill.id) && skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase())
    );

    if (!isAuthorized) {
    return (
        <div className={styles['loading-container']}>
            <p>Verifying access...</p>
        </div>
    );
    }

    return (
        <>
            <Head>
                <title>{`${isEditing ? 'Edit' : 'Post'} Job - ${AppName}`}</title>
            </Head>
            <div className={styles['new-posting-container']}>
                <header className={styles['page-header']}>
                    <h1>{isEditing ? 'Edit Job Posting' : 'Post a New Job'}</h1>
                    <p>{isEditing ? 'Update the details for your job opening below.' : 'Fill out the details below to publish a new job opening.'}</p>
                </header>

                <form className={styles['new-job-form']} onSubmit={handleSubmit}>
                    {!isEditing && (
                        <div className={styles['form-section']}>
                            <h2>Company Details</h2>
                            <div className={styles['form-group']}>
                                <label htmlFor="company-search">Company</label>
                                <div className={styles['searchable-dropdown']}>
                                    <input 
                                        type="text" id="company-search" placeholder="Search for an existing company or add a new one"
                                        value={selectedCompany && selectedCompany !== 'new' ? selectedCompany.name : companySearchTerm}
                                        onChange={(e) => { setCompanySearchTerm(e.target.value); setIsCompanyDropdownOpen(true); setSelectedCompany(null); }}
                                        onFocus={() => setIsCompanyDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsCompanyDropdownOpen(false), 200)}
                                        required
                                    />
                                    {isCompanyDropdownOpen && (
                                        <ul className={styles['dropdown-list']}>
                                            <li className={styles['add-new-option']} onClick={() => handleCompanySelect('new')}>+ Add New Company</li>
                                            {filteredCompanies.map(c => (<li key={c.id} onClick={() => handleCompanySelect(c)}>{c.name}</li>))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            {selectedCompany === 'new' && (
                                <div className={styles['new-company-fields']}>
                                    <div className={styles['form-group']}><label htmlFor="company-name">New Company Name</label><input type="text" id="company-name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="e.g., JobsHive Inc." required/></div>
                                    <div className={styles['form-group']}><label htmlFor="about-company">About Company</label><textarea id="about-company" rows="4" value={aboutCompany} onChange={(e) => setAboutCompany(e.target.value)} placeholder="What does your company do?"></textarea></div>
                                    <div className={styles['form-group']}>
                                        <label htmlFor="logo-upload">Company Logo</label>
                                        <input type="file" id="logo-upload" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files[0])} required/>
                                    </div>
                                    <div className={styles['form-grid']}>
                                        <div className={styles['form-group']}><label htmlFor="website">Website</label><input type="url" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..."/></div>
                                        <div className={styles['form-group']}><label htmlFor="linkedin">LinkedIn</label><input type="url" id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/..."/></div>
                                        <div className={styles['form-actions-inline']}>
                                            <button type="button" className="btn btn-primary" onClick={handleSaveNewCompany} disabled={isSavingCompany}>
                                                {isSavingCompany ? 'Saving...' : 'Save Company'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles['form-section']}>
                        <h2>Job Details</h2>
                        <div className={styles['form-grid']}>
                            <div className={styles['form-group']}>
                                <label htmlFor="job-title"><BriefcaseIcon /> Job Title</label>
                                <div className={styles['input-with-icon']}><input type="text" id="job-title" value={displayJobTitle} onChange={e => setDisplayJobTitle(e.target.value)} placeholder="e.g., Senior Frontend Developer (React)" required/></div>
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="job-title-search">Job Category</label>
                                <div className={styles['searchable-dropdown']}>
                                    <input type="text" id="job-title-search" placeholder="Search for a job category..."
                                        value={selectedJobTitle ? selectedJobTitle.name : titleSearchTerm}
                                        onChange={e => { setTitleSearchTerm(e.target.value); setIsTitleDropdownOpen(true); setSelectedJobTitle(null); }}
                                        onFocus={() => setIsTitleDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsTitleDropdownOpen(false), 200)}
                                        required
                                    />
                                    {isTitleDropdownOpen && (
                                        <ul className={styles['dropdown-list']}>
                                            {filteredJobTitles.map(t => (<li key={t.id} onClick={() => handleTitleSelect(t)}>{t.name}</li>))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className={styles['form-group']}>
                                <label htmlFor="location-search"><LocationIcon /> Location</label>
                                <div className={styles['searchable-dropdown']}>
                                    <input 
                                        type="text" id="location-search" placeholder="Search for a location..."
                                        value={selectedLocation ? selectedLocation.name : locationSearchTerm}
                                        onChange={e => { setLocationSearchTerm(e.target.value); setIsLocationDropdownOpen(true); setSelectedLocation(null); }}
                                        onFocus={() => setIsLocationDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsLocationDropdownOpen(false), 200)}
                                        required
                                    />
                                    {isLocationDropdownOpen && (
                                        <ul className={styles['dropdown-list']}>
                                            {filteredJobLocations.map(l => (<li key={l.id} onClick={() => handleLocationSelect(l)}>{l.name}</li>))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className={styles['form-group']}><label htmlFor="job-type">Job Type</label><select id="job-type" value={jobType} onChange={e => setJobType(e.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
                            <div className={styles['form-group']}><label htmlFor="job-position">Job Position</label><select id="job-position" value={jobPosition} onChange={e => setJobPosition(e.target.value)}><option>Entry-Level</option><option>Mid-Level</option><option>Senior</option><option>Lead</option><option>Manager</option></select></div>
                            <div className={styles['form-group']}><label htmlFor="job-experience">Experience Level</label><input type="text" id="job-experience" value={jobExperience} onChange={e => setJobExperience(e.target.value)} placeholder="e.g., 3-5 years"/></div>
                            <div className={`${styles['form-group']} ${styles.checkboxes}`}><div className={styles['checkbox-item']}><input type="checkbox" id="visa-sponsor" checked={visaSponsorship} onChange={e => setVisaSponsorship(e.target.checked)} /><label htmlFor="visa-sponsor">Visa Sponsorship</label></div><div className={styles['checkbox-item']}><input type="checkbox" id="degree-required" checked={degreeRequired} onChange={e => setDegreeRequired(e.target.checked)} /><label htmlFor="degree-required">Degree Required</label></div></div>
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="salary-min">Yearly Salary Range</label>
                            <div className={styles['salary-inputs']}>
                                <select 
                                    className={styles['currency-select']}
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                >
                                    {currencyOptions.map(opt => (
                                        <option key={opt.code} value={opt.code}>{opt.code}</option>
                                    ))}
                                </select>
                                <input type="text" id="salary-min" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Minimum" />
                                <input type="text" id="salary-max" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Maximum" />
                            </div>
                        </div>
                        <div className={styles['form-group']}>
                            <label htmlFor="skills-search">Skills</label>
                            <div className={styles['multi-select-container']}>
                                <div className={styles['skill-pills-container']}>
                                    {selectedSkills.map(skill => (
                                        <span key={skill.id} className={styles['skill-pill']}>
                                            {skill.name}
                                            <button type="button" onClick={() => handleSkillRemove(skill)}>×</button>
                                        </span>
                                    ))}
                                </div>
                                <div className={styles['searchable-dropdown']}>
                                    <input 
                                        type="text" id="skills-search" placeholder="Search and add skills..."
                                        value={skillSearchTerm}
                                        onChange={e => { setSkillSearchTerm(e.target.value); setIsSkillDropdownOpen(true); }}
                                        onFocus={() => setIsSkillDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsSkillDropdownOpen(false), 200)}
                                    />
                                    {isSkillDropdownOpen && filteredSkillOptions.length > 0 && (
                                        <ul className={styles['dropdown-list']}>
                                            {filteredSkillOptions.map(s => (<li key={s.id} onClick={() => handleSkillSelect(s)}>{s.name}</li>))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles['form-group']}><label htmlFor="job-description">Job Description</label><textarea id="job-description" rows="6" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Describe the daily responsibilities of the role..."></textarea></div>
                        <div className={styles['form-group']}><label htmlFor="job-requirements">Job Requirements</label><textarea id="job-requirements" rows="6" value={jobRequirements} onChange={e => setJobRequirements(e.target.value)} placeholder="List the qualifications and skills required..."></textarea></div>
                        <div className={styles['form-group']}><label htmlFor="job-benefits">Job Benefits</label><textarea id="job-benefits" rows="4" value={jobBenefits} onChange={e => setJobBenefits(e.target.value)} placeholder="List any benefits like health insurance, remote work, etc..."></textarea></div>
                    </div>

                    <div className={styles['form-actions']}>
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Update Job' : 'Post Job Opening'}</button>
                    </div>
                </form>
            </div>
        </>
    );
};

NewJobPostingPage.getLayout = function getLayout(page) {
    return (
        <RecruiterDashboardLayout>
            {page}
        </RecruiterDashboardLayout>
    );
};

export async function getServerSideProps(context) {
    try {
        const { req } = context;
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;

        if (!token) {
            return { redirect: { destination: '/login', permanent: false } };
        }

        const [companiesRes, titlesRes, locationsRes, skillsRes] = await Promise.all([
            fetch(fetchCompanies),
            fetch(fetchJobTitles),
            fetch(fetchJobLocations),
            fetch(fetchSkills) 
        ]);

        if (!companiesRes.ok || !titlesRes.ok || !locationsRes.ok || !skillsRes.ok) {
            throw new Error('Failed to fetch initial form data');
        }

        const initialData = {
            companies: await companiesRes.json(),
            jobTitles: await titlesRes.json(),
            jobLocations: await locationsRes.json(),
            allSkills: await skillsRes.json(),
        };

        
        return {
            props: {
                initialData,
            },
        };
    } catch (error) {
        console.error("New Job Posting SSR Error:", error);
        return { redirect: { destination: '/dashboard/recruiter', permanent: false } };
    }
}

export default NewJobPostingPage;