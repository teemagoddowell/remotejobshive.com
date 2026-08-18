import React, { useState, useEffect, useContext } from 'react';
import styles from '@/styles/jobAlert.module.css'; 
import { fetchJobTitles, fetchJobLocations, fetchJobAlerts, CloseIcon } from '@/constants';
import toast from 'react-hot-toast';
import { AuthContext } from '@/context/AuthContext';

const JobAlertModal = ({ user, onClose }) => {
    const { login } = useContext(AuthContext);
    const [preferences, setPreferences] = useState({
        job_title_id: '',
        location_id: '1',
        job_position: ''
    });
    
    const [jobTitles, setJobTitles] = useState([]);
    const [jobLocations, setJobLocations] = useState([]);
    const [currentAlert, setCurrentAlert] = useState(null); 
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [titlesRes, locationsRes, alertsRes] = await Promise.all([
                    fetch(fetchJobTitles),
                    fetch(fetchJobLocations),
                    fetch(fetchJobAlerts, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                const titles = await titlesRes.json();
                const locations = await locationsRes.json();
                const alertData = await alertsRes.json();

                setJobTitles(titles);
                setJobLocations(locations);
                
                if (alertData) {
                    setCurrentAlert(alertData);
                    setPreferences({
                        job_title_id: alertData.job_title_id || '',
                        location_id: alertData.location_id || '1',
                        job_position: alertData.job_position || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.error("Could not load your alert settings.");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [token]);

    const handleChange = (e) => {
        setPreferences({ ...preferences, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Saving your preferences...');
        try {
            const response = await fetch(fetchJobAlerts, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(preferences)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success(data.message, { id: toastId });
            onClose();
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    const handleDelete = async () => {
        const toastId = toast.loading('Deleting your alert...');
        try {
            const response = await fetch(fetchJobAlerts, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success(data.message, { id: toastId });
            setCurrentAlert(null);
            setPreferences({ job_title_id: '', location_id: '1', job_position: ''});
        } catch (error) {
            toast.error(error.message, { id: toastId });
        }
    };

    if (loading) {
        return (
            <div className={styles['modal-overlay']}>
                <div className={styles['modal-content']}>
                    <p>Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <button className={styles['close-button']} onClick={onClose}><CloseIcon /></button>
                <h2>Create Job Alert</h2>
                <p>Get notified about new jobs that match your interests.</p>

                <div className={styles['alert-controls']}>
                    <div className={styles['alert-status']}>
                        Status: 
                        {currentAlert && currentAlert.is_active ? (
                            <span className={styles['status-active']}>
                                <span className={`${styles.dot} ${styles['active-dot']}`}></span> Active
                            </span>
                        ) : (
                            <span className={styles['status-inactive']}>
                                <span className={`${styles.dot} ${styles['inactive-dot']}`}></span> Inactive
                            </span>
                        )}
                    </div>
                    {currentAlert && (
                        <button type="button" onClick={handleDelete} className={styles['btn-delete-alert']}>Delete Alert</button>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles['form-group']}>
                        <label htmlFor="job_title_id">Job Title</label>
                        <select name="job_title_id" value={preferences.job_title_id} onChange={handleChange}>
                            <option value="">All Job Titles</option>
                            {jobTitles.map(title => <option key={title.id} value={title.id}>{title.name}</option>)}
                        </select>
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="location_id">Location</label>
                        <select name="location_id" value={preferences.location_id} onChange={handleChange}>
                            <option value="1">All Locations</option>
                            {jobLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    </div>
                    <div className={styles['form-group']}>
                        <label htmlFor="job_position">Experience Level</label>
                        <select name="job_position" value={preferences.job_position} onChange={handleChange}>
                            <option value="">All Levels</option>
                            <option value="Entry-Level">Entry-Level</option>
                            <option value="Junior">Junior</option>
                            <option value="Senior">Senior</option>
                        </select>
                    </div>
                    <div className={styles['form-actions']}>
                        <button type="submit" className={styles['btn-save-alert']}>Save Alert</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobAlertModal;