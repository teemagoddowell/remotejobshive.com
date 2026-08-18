import React, { useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { useRouter } from "next/router";
import toast from 'react-hot-toast';
import styles from '@/styles/contact.module.css'
import { AppName, fetchContact, mainURL } from '@/constants';
import Head from 'next/head'; 

const ContactPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Support',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending your message...');

    try {
        const response = await fetch(fetchContact, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to send message.');
        }

        toast.success(data.message, { id: toastId });
        setFormData({ name: '', email: '', subject: 'Support', message: '' });

    } catch (error) {
        toast.error(error.message, { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`Contact Us | ${AppName}`}</title>
        <meta name="description" content={`Have a question or need support? Get in touch with the ${AppName} team. We're here to help you with your remote job search.`} />
        <link rel="canonical" href={`${mainURL}/contact`} />

        <meta property="og:title" content={`Contact Us | ${AppName}`} />
        <meta property="og:description" content={`Get in touch with the ${AppName} team.`} />
        <meta property="og:url" content={`${mainURL}/contact`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <Header />
      <div className={styles['contact-container']}>
        <h1>Get in Touch</h1>
        <p className={styles['lead']}>Have a question or feedback? We'd love to hear from you.</p>

        <div className={styles['contact-info-grid']}>
          <div className={styles['contact-card']}>
            <h3>Support</h3>
            <p>For technical issues or help using the site.</p>
            <a href="mailto:support@remotejobshive.co">support@remotejobshive.co</a>
          </div>
          <div className={styles['contact-card']}>
            <h3>Feedback</h3>
            <p>Share your ideas, suggestions, or feedback.</p>
            <a href="mailto:hello@remotejobshive.co">hello@remotejobshive.co</a>
          </div>
          <div className={styles['contact-card']}>
            <h3>Business</h3>
            <p>For partnerships and other business inquiries.</p>
            <a href="mailto:teema@remotejobshive.co">teema@remotejobshive.co</a>
          </div>
          <div className={styles['contact-card']}>
            <h3>Phone Support</h3>
            <p>For urgent inquiries, you can reach us by phone.</p>
            <a href="tel:+2349055594603">+234 905 559-4603</a>
          </div>
        </div>
        
        <p className={styles['form-lead']}>Or send us a message directly:</p>

        <form className={styles['contact-form']} onSubmit={handleSubmit}>
          <div className={styles['form-grid']}>
            <div className={styles['form-group']}>
              <label htmlFor="name">Your Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className={styles['form-group']}>
              <label htmlFor="email">Your Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="subject">Reason for Contact</label>
            <select id="subject" name="subject" value={formData.subject} onChange={handleChange}>
              <option value="Support">General Support</option>
              <option value="Feedback">Website Feedback</option>
              <option value="Business">Business & Partnerships</option>
            </select>
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="message">Your Message</label>
            <textarea id="message" name="message" rows="6" value={formData.message} onChange={handleChange} required></textarea>
          </div>
          <div className={styles['form-actions']}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
          <br /><br />
          <div className={styles['contact-card']}>
            <h3>Company Address</h3>
            <p>Road 12, Royal Havana Estate, Sars Road, Port Harcourt</p>
          </div>

        </form>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;