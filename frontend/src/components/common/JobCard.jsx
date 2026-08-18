import React, { useEffect, useState, useContext, useCallback, useRef } from 'react';
import Link from 'next/link';
import { BellIcon, fetchJobSearch, LockIcon, salaryRanges, SearchIcon, UnlockIcon } from '@/constants';
import { AuthContext } from '@/context/AuthContext';
import ClientOnlyTimestamp from './ClientOnlyTimestamp';
// import AdComponent from './AdComponent';


export const HeroSection = ({ currentLocationName, isSubscribed, onEnableAlerts, formattedJobCount }) => {
  return (
    <div className="hero-section">
      <div className="intro">
        <h2><span id="r1">Remote</span>JobsHive</h2>
        <img src="/images/logo-icon.png" alt="JobsHive Logo" />
        {currentLocationName ? (
          <>
            <h3>Find Remote Jobs in {currentLocationName}</h3>
            <p>Find remote jobs that best fit your schedule.</p>
          </>
        ) : (
          <>
            <h3>Build Your Resume, Find Remote Jobs.</h3>
            <p>Find over {formattedJobCount} remote jobs that best fits your schedule.</p>
          </>
        )}
      </div>

      <div className="www">
        <div className="active-user-img">
          <div className="www-img">
            <img src="/images/avatar1.jpg" alt="User Avatar 1" />
            <img src="/images/avatar2.png" alt="User Avatar 2" />
          </div>
          <div className="www-text">
            <p style={{ margin: 0 }}>⭐️⭐️⭐️⭐️⭐️</p>
            <p className="users-info">with over 2,000 users</p>
          </div>
        </div>

        <div className="newsletter">
          {isSubscribed ? (
            <>
              <button type="button" className="mybtn btn btn-outline-secondary" onClick={onEnableAlerts}>
                <BellIcon /> Enable Job Newsletter
              </button>
              <Link href="/dashboard/user/subscription" className="bbtn btn btn-primary">
                <UnlockIcon /> Active
              </Link>
            </>
          ) : (
            <>
              <button type="button" className="mybtn btn btn-outline-secondary" onClick={onEnableAlerts}>
                <BellIcon /> Job Newsletter
              </button>
              <Link href="/dashboard/user/subscription" className="bbtn btn btn-primary">
                <LockIcon /> Join Premium
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const JobFilters = ({
  filters, handleFilterChange,
  titleSearchTerm, setTitleSearchTerm,
  locationSearchTerm, setLocationSearchTerm,
  skillSearchTerm, setSkillSearchTerm,
  isTitleDropdownOpen, setIsTitleDropdownOpen,
  isLocationDropdownOpen, setIsLocationDropdownOpen,
  isSkillDropdownOpen, setIsSkillDropdownOpen,
  filteredTitleOptions, filteredLocationOptions, filteredSkillOptions,
  handleTitleSelect, handleLocationSelect, handleSkillSelect,
  experienceLevels, employmentTypes,
  searchInput, setSearchInput, handleSearch
}) => (
  <>
    {/* <div className="adWrapper">
      <AdComponent adSlot="3621886126" type="banner" />
    </div> */}
    
    <div className="search-box">
      <input
        onChange={(e) => setSearchInput(e.target.value)}
        value={searchInput}
        onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        className="search-button"
        type="text"
        placeholder="Search for jobs"
      />
      <button onClick={handleSearch} type="button" aria-label="search jobs" className="bbtn btn btn-primary">
        <SearchIcon />
      </button>
    </div>

    <div className="filter">
      <div className="select-wrapper">
        <div className="searchable-dropdown">
          <input type="text" className="filter-jobs" placeholder="Job Title" value={titleSearchTerm}
            onChange={(e) => { setTitleSearchTerm(e.target.value); setIsTitleDropdownOpen(true); if (filters.titleId) handleTitleSelect(null); }}
            onFocus={() => setIsTitleDropdownOpen(true)} onBlur={() => setTimeout(() => setIsTitleDropdownOpen(false), 200)} />
          <i className="fa-solid fa-chevron-down"></i>
          {isTitleDropdownOpen && (
            <ul className="dropdown-list">
              <li onClick={() => handleTitleSelect(null)}>All Job Titles</li>
              {filteredTitleOptions.map(t => (<li key={t.id} onClick={() => handleTitleSelect(t)}>{t.name}</li>))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="select-wrapper">
        <div className="searchable-dropdown">
          <input type="text" className="filter-jobs" placeholder="Location" value={locationSearchTerm}
            onChange={(e) => { setLocationSearchTerm(e.target.value); setIsLocationDropdownOpen(true); if (filters.locationId) handleLocationSelect(null); }}
            onFocus={() => setIsLocationDropdownOpen(true)} onBlur={() => setTimeout(() => setIsLocationDropdownOpen(false), 200)} />
          <i className="fa-solid fa-chevron-down"></i>
          {isLocationDropdownOpen && (
            <ul className="dropdown-list">
              <li onClick={() => handleLocationSelect(null)}>All Locations</li>
              {filteredLocationOptions.map(l => (<li key={l.id} onClick={() => handleLocationSelect(l)}>{l.name}</li>))}
            </ul>
          )}
        </div>
      </div>
      <div className="select-wrapper">
        <select name="salaryMin" value={filters.salaryMin} onChange={handleFilterChange} className="filter-jobs">
          {salaryRanges.map(range => (<option key={range.label} value={range.min}>{range.label}</option>))}
        </select>
        <i className="fa-solid fa-chevron-down"></i>
      </div>
      <div className="select-wrapper">
        <select name="experience" value={filters.experience} onChange={handleFilterChange} className="filter-jobs">
          <option value="">Experience</option>
          {experienceLevels.map(level => <option key={level} value={level}>{level}</option>)}
        </select><i className="fa-solid fa-chevron-down"></i>
      </div>
      <div className="select-wrapper">
        <select name="jobType" value={filters.jobType} onChange={handleFilterChange} className="filter-jobs">
          <option value="">Employment Type</option>
          {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select><i className="fa-solid fa-chevron-down"></i>
      </div>
      <div className="select-wrapper">
        <select name="visaSponsorship" value={filters.visaSponsorship} onChange={handleFilterChange} className="filter-jobs">
          <option value="any">Sponsorship</option>
          <option value="true">Visa Sponsorship</option>
          <option value="false">No Visa Sponsorship</option>
        </select><i className="fa-solid fa-chevron-down"></i>
      </div>
      <div className="select-wrapper">
        <div className="searchable-dropdown">
          <input type="text" className="filter-jobs" placeholder="Tech Stack" value={skillSearchTerm}
            onChange={(e) => { setSkillSearchTerm(e.target.value); setIsSkillDropdownOpen(true); if (filters.skillId) handleSkillSelect(null); }}
            onFocus={() => setIsSkillDropdownOpen(true)} onBlur={() => setTimeout(() => setIsSkillDropdownOpen(false), 200)} />
          <i className="fa-solid fa-chevron-down"></i>
          {isSkillDropdownOpen && (
            <ul className="dropdown-list">
              <li onClick={() => handleSkillSelect(null)}>All Tech Stacks</li>
              {filteredSkillOptions.map(s => (<li key={s.id} onClick={() => handleSkillSelect(s)}>{s.name}</li>))}
            </ul>
          )}
        </div>
      </div>
      <div className="select-wrapper">
        <select name="degreeRequired" value={filters.degreeRequired} onChange={handleFilterChange} className="filter-jobs">
          <option value="any">Qualification</option>
          <option value="true">Degree Required</option>
          <option value="false">No Degree Required</option>
        </select><i className="fa-solid fa-chevron-down"></i>
      </div>
    </div>
  </>
);

export const JobCardDisplay = ({ job, index }) => {
    const formatSalary = (num) => {
        if (!num) return '';
        const currencySymbol = job.currency || '$';
        if (num >= 1000000) {
            const millions = Math.floor((num / 1000000) * 10) / 10;
            return `${currencySymbol}${millions}M`;
        } else if (num >= 1000) {
            return `${currencySymbol}${Math.round(num / 1000)}k`;
        }
        return `${currencySymbol}${num}`;
    };

    const animationDelay = `${(index % 15) * 0.05}s`;
    const handleActionClick = (e) => { e.stopPropagation(); };

    return (
        <div className="job-card" style={{ animationDelay }}>
            <div className="company-logo">
                <img src={job.company_logo || 'https://placehold.co/50x50/3B4A5C/FFF?text=JH'} alt={`${job.company_name} logo`} />
            </div>
                <div className="job-content">
                  <Link href={`/job/${job.slug}`} target="_blank" rel="noopener noreferrer" className="job-content-link">
                    <div className="mobile-jobs">
                        <div className="mobile-logo">
                            <img src={job.company_logo || 'https://placehold.co/50x50/3B4A5C/FFF?text=JH'} alt={`${job.company_name} logo`} />
                        </div>
                        <div className="mobile-title">
                            <h3>{job.title}</h3>
                        </div>
                    </div>
                  </Link>
                    <Link href={`/job/${job.slug}`} target="_blank" rel="noopener noreferrer" className="job-content-link">
                    <div className="job-title">
                        <h3>{job.title}</h3>
                        <ClientOnlyTimestamp date={job.date_posted} />
                        {/* <p>{formatDistanceToNow(new Date(job.date_posted), { addSuffix: true })}</p> */}
                    </div>
                    </Link>
                    <div className="company-name">
                        <p>{job.company_name}</p>
                        <div className="job-tech">
                            <button type="button" className="jbtn btn btn-secondary">{job.department}</button>
                            <button type="button" className="jbtn btn btn-secondary">{job.job_type}</button>
                            <button type="button" className="jbtn btn btn-secondary">{job.job_position}</button>
                            <button type="button" className="jbtn btn btn-secondary">{job.job_experience}</button>
                        </div>
                    </div>
                    <div className="company-links">
                        <u><a href={job.company_url} target="_blank" rel="noopener noreferrer" onClick={handleActionClick}>Website</a></u>
                        <u><a href={job.company_linkedin} target="_blank" rel="noopener noreferrer" onClick={handleActionClick}>LinkedIn</a></u>
                        <Link href={`/company/${job.company_slug}`} onClick={handleActionClick}>
                            <u>Job Openings</u>
                        </Link>
                    </div>
                    <p>{job.excerpts ? job.excerpts : job.description}</p>
                    <div className="job-detail">
                        <button type="button" className="jbtn btn btn-secondary">{job.job_location}</button>
                        {job.salary_min && <button type="button" className="jbtn btn btn-secondary">{formatSalary(job.salary_min)} - {formatSalary(job.salary_max)} {job.salary}</button>}
                    </div>
                    <div className="job-detail">
                        {job.skills && job.skills.split(',').map((skill, index) => (
                            <button key={index} type="button" className="jbtn btn btn-secondary">
                                {skill.trim()}
                            </button>
                        ))}
                    </div>
                </div>
        </div>
    );
};

function JobCard({ initialJobsData, initialFilterOptions, initialLocationId, initialLocationName, onEnableAlerts, formattedJobCount }) {
    const { user } = useContext(AuthContext);
    const isSubscribed = user?.isSubscribed || false;
    const isInitialMount = useRef(true);

    const [jobs, setJobs] = useState(initialJobsData?.jobs || []);
    const [totalJobs, setTotalJobs] = useState(initialJobsData?.totalCount || 0);
    const [jobTitles, setJobTitles] = useState(initialFilterOptions?.titles || []);
    const [jobLocations, setJobLocations] = useState(initialFilterOptions?.locations || []);
    const [skills, setSkills] = useState(initialFilterOptions?.skills || []);
    const [loading, setLoading] = useState(false); 
    const [filters, setFilters] = useState({
        titleId: '',
        locationId: initialLocationId || '',
        experience: '',
        jobType: '',
        visaSponsorship: 'any',
        degreeRequired: 'any',
        skillId: '',
        salaryMin: ''
    });
const [titleSearchTerm, setTitleSearchTerm] = useState('');
    const [locationSearchTerm, setLocationSearchTerm] = useState(initialLocationName || '');
    const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const [skillSearchTerm, setSkillSearchTerm] = useState('');
    const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");
    const [hasMore, setHasMore] = useState((jobs.length) < (totalJobs));
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const JOBS_PER_PAGE = 15;
    const experienceLevels = ['Entry-Level', 'Junior', 'Senior', 'Lead'];
    const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    
    useEffect(() => {
        const jobsArray = Array.isArray(initialJobsData) ? initialJobsData : initialJobsData?.jobs || [];
        const jobsTotal = Array.isArray(initialJobsData) ? initialJobsData.length : initialJobsData?.totalCount || 0;

        setJobs(jobsArray);
        setTotalJobs(jobsTotal);
        setHasMore(jobsArray.length < jobsTotal);

        const newLocationId = initialLocationId || '';
        const newLocationName = initialLocationName || '';

        setFilters(prevFilters => {
            if (prevFilters.locationId === newLocationId) {
                return prevFilters;
            }
            return { ...prevFilters, locationId: newLocationId };
        });
        
        setLocationSearchTerm(newLocationName);
        setLoading(false);
    }, [initialJobsData, initialLocationId, initialLocationName]);

    const fetchJobsData = useCallback(async (currentFilters, searchTerm, offset = 0) => {
        const isFirstPage = offset === 0;
        if (isFirstPage) setLoading(true); else setLoadingMore(true);
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        try {
            const response = await fetch(fetchJobSearch, {
                method: 'POST',
                headers,
                body: JSON.stringify({ searchTerm, filters: currentFilters, offset, limit: JOBS_PER_PAGE })
            });
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            
            setJobs(isFirstPage ? data.jobs : prev => [...prev, ...data.jobs]);
            setTotalJobs(data.totalCount);
            setHasMore((isFirstPage ? data.jobs.length : jobs.length + data.jobs.length) < data.totalCount);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const handler = setTimeout(() => {
            fetchJobsData(filters, activeSearchTerm, 0);
        }, 500);
        return () => clearTimeout(handler); 
    }, [filters, activeSearchTerm, fetchJobsData]);

    const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleTitleSelect = (title) => {
        setFilters(prev => ({ ...prev, titleId: title?.id || '' }));
        setTitleSearchTerm(title?.name || '');
        setIsTitleDropdownOpen(false);
    };
    const handleLocationSelect = (location) => {
        setFilters(prev => ({ ...prev, locationId: location?.id || '' }));
        setLocationSearchTerm(location?.name || '');
        setIsLocationDropdownOpen(false);
    };
    const handleSkillSelect = (skill) => {
        setFilters(prev => ({ ...prev, skillId: skill?.id || '' }));
        setSkillSearchTerm(skill?.name || '');
        setIsSkillDropdownOpen(false);
    };
    const handleSearch = () => setActiveSearchTerm(searchInput);
    const handleLoadMore = () => fetchJobsData(filters, activeSearchTerm, jobs.length);

    const filteredTitleOptions = jobTitles.filter(t => t.name?.toLowerCase().includes(titleSearchTerm.toLowerCase()));
    const filteredLocationOptions = jobLocations.filter(l => l.name?.toLowerCase().includes(locationSearchTerm.toLowerCase()));
    const filteredSkillOptions = skills.filter(s => s.name?.toLowerCase().includes(skillSearchTerm.toLowerCase()));

    return (
        <div className="main-container">
            <HeroSection 
                currentLocationName={initialLocationName} 
                isSubscribed={isSubscribed} 
                onEnableAlerts={onEnableAlerts}
                formattedJobCount={formattedJobCount}
            />
            <JobFilters
                filters={filters} handleFilterChange={handleFilterChange}
                titleSearchTerm={titleSearchTerm} setTitleSearchTerm={setTitleSearchTerm}
                locationSearchTerm={locationSearchTerm} setLocationSearchTerm={setLocationSearchTerm}
                skillSearchTerm={skillSearchTerm} setSkillSearchTerm={setSkillSearchTerm}
                isTitleDropdownOpen={isTitleDropdownOpen} setIsTitleDropdownOpen={setIsTitleDropdownOpen}
                isLocationDropdownOpen={isLocationDropdownOpen} setIsLocationDropdownOpen={setIsLocationDropdownOpen}
                isSkillDropdownOpen={isSkillDropdownOpen} setIsSkillDropdownOpen={setIsSkillDropdownOpen}
                filteredTitleOptions={filteredTitleOptions}
                filteredLocationOptions={filteredLocationOptions}
                filteredSkillOptions={filteredSkillOptions}
                handleTitleSelect={handleTitleSelect}
                handleLocationSelect={handleLocationSelect}
                handleSkillSelect={handleSkillSelect}
                experienceLevels={experienceLevels}
                employmentTypes={employmentTypes}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                handleSearch={handleSearch}
            />
            <div className="job-count">
                <p>{loading ? 'Fetching jobs...' : `${totalJobs.toLocaleString()} Jobs Found`}</p>
            </div>
            <div className="jobs has-more">
                {error && <p>Error: {error}</p>}
                {loading && <p>Loading...</p>}
                {!loading && jobs.length === 0 && <p>No jobs found.</p>}
                
                {!loading && jobs.map((job, index) => (
                    <JobCardDisplay key={`${job.id}-${index}`} job={job} index={index} />
                ))}
            </div>
            <div className="load-more-container">
                {user?.isSubscribed && hasMore && !loading && (
                    <button onClick={handleLoadMore} className="load-more-btn" disabled={loadingMore}>
                        {loadingMore ? 'Loading...' : 'Load More Jobs'}
                    </button>
                )}

                {user && user.role === 'user' && !user.isSubscribed && (
                  <div className="unlock-jobs-section">
                      <div className="fade-overlay"></div>
                      <LockIcon />
                      <h3>Unlock All Features</h3>
                      {console.log(formattedJobCount)}
                      <p>Upgrade to HIVE-PRO to view over {formattedJobCount} job listings.</p>
                      <Link href="/dashboard/user/subscription" className="load-more-btn">
                          Upgrade to PRO
                      </Link>
                  </div>
                )}

                {!user && hasMore && !loading && (
                  <div className="unlock-jobs-section">
                      <div className="fade-overlay"></div>
                      <LockIcon />
                      <h3>See All {totalJobs.toLocaleString()} Jobs</h3>
                      <p>Sign up for a free account to unlock all job listings.</p>
                      <Link href="/sign-up" className="load-more-btn">
                          Create Free Account
                      </Link> 
                  </div>
                )}

                {user && user.role === 'recruiter' && !user.isSubscribed && (
                  <div className="unlock-jobs-section">
                      <div className="fade-overlay"></div>
                      <LockIcon />
                      <h3>Unlock All Features</h3>
                      <p>Upgrade to a PRO account to view and post jobs.</p>
                      <Link href="/dashboard/recruiter/subscription" className="load-more-btn">
                          Upgrade to PRO
                      </Link>
                  </div>
                )}
              {/* <div className="adWrapper">
                <AdComponent adSlot="3621886126" type="banner" />
              </div> */}
            </div>
        </div>
    );
}

export default JobCard;