import React from 'react';
import Link from 'next/link';
import { AustraliaJobs, CanadaJobs, FranceJobs, IrelandJobs, UKJobs } from '@/constants';

const Footer = () => {
     const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="main-footer">
        <div className="company-card">
          <h3>Remote JobsHive</h3>
          <p>Your go-to platform for finding remote job opportunities worldwide. We connect talented professionals with companies embracing remote work culture.</p>
          <div className="socials">
            <a href="https://www.facebook.com/remotejobshive" style={{marginRight: 15}} aria-label="Follow us on Facebook"><i className="fa-brands fa-facebook-f"></i></a>
            <a href="https://www.x.com/remotejobshive" style={{marginRight: 15}} aria-label="Follow us on X"><i className="fa-brands fa-x"></i></a>
            <a href="https://www.linkedin.com/company/remote-jobshive/" style={{marginRight: 15}} aria-label="Follow us on LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
            <a href="mailto:teema@remotejobshive.co" style={{marginRight: 15}} aria-label="Send us a mail"><i className="fa fa-envelope"></i></a>
          </div>
        </div>
        <div className="job-search">
          <p>Search by Country</p>
          <ul>
            <li><a href={CanadaJobs}>Remote Jobs in Canada</a></li>
            <li><a href={UKJobs}>Remote Jobs in UK</a></li>
            <li><a href={AustraliaJobs}>Remote Jobs in Australia</a></li>
            <li><a href={IrelandJobs}>Remote Jobs in Ireland</a></li>
            <li><a href={FranceJobs}>Remote Jobs in France</a></li>
          </ul>
        </div>
        <div className="resources">
          <p>Resources</p>
          <ul>
            <li><Link href="/dashboard/recruiter">Post a Job</Link></li>
            <li><a href="/">Job Search</a></li>
            <li><Link href="#">Build Resume</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="extra">
        <div className="pages">
          <Link href="/privacy-policy">Privacy Policy</Link> |
          <Link href="/disclaimer"> Disclaimer</Link> |
          <Link href="/refund-policy"> Refund Policy</Link> |
          <Link href="/terms-of-service"> Terms of Service</Link> |
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer"> Sitemap</a>
        </div>
        <div className="credit">
          <p>Copyright ©{currentYear} Remote JobsHive</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;