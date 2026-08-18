import React from 'react';
import Head from 'next/head';
import { AppName, mainURL } from '@/constants';

const generateJobPostingSchema = (job) => {
    if (!job) return null;

    const postDate = new Date(job.date_posted);
    const expiryDate = new Date(postDate);
    expiryDate.setDate(postDate.getDate() + 30); 
    const validThroughDate = expiryDate.toISOString();

    const schema = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.title,
        "description": job.excerpts || job.description,
        "datePosted": job.date_posted,
        "validThrough": validThroughDate,
        "employmentType": job.job_type.toUpperCase().replace('-', '_'),
        "hiringOrganization": {
            "@type": "Organization",
            "name": job.company_name,
            "logo": job.company_logo
        },
        "jobLocationType": "TELECOMMUTE",
        "applicantLocationRequirements": {
            "@type": "Country",
            "name": job.job_location.split('–')[0].trim()
        },
        "baseSalary": (job.salary_min && job.salary_max) ? {
            "@type": "MonetaryAmount",
            "currency": job.currency || 'USD',
            "value": {
              "@type": "QuantitativeValue",
              "minValue": job.salary_min,
              "maxValue": job.salary_max,
              "unitText": job.salary === '/hour' ? 'HOUR' : job.salary === '/month' ? 'MONTH' : 'YEAR'
            }
        } : undefined,
    };
    
    return schema;
};

const SEO = ({ title, description, keywords, url, job }) => {
  const fullTitle = `${title} - ${AppName}`;
  const pageUrl = `${mainURL}${url}`;
  const defaultDescription = 'Find thousands of remote jobs from the best companies. Your next remote opportunity is just a click away on Remote JobsHive.';
  const finalDescription = description || defaultDescription;
  const jobPostingSchema = generateJobPostingSchema(job);
  
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": AppName,
    "url": mainURL,
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Remote JobsHive",
        "item": mainURL
      }
    ]
  };

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={pageUrl} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={AppName} />
      {job && <meta property="og:image" content={job.company_logo} />}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}
    </Head>
  );
};

export default SEO;