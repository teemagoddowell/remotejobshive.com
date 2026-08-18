import React from 'react';
import styles from '@/styles/adminUsers.module.css'; 
import { CalendarIcon, CloseIcon, EmailIcon, RoleIcon, SubIcon } from '@/constants';


const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const CamelCase = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close user details">
          <CloseIcon />
        </button>
        <div className={styles.modalHeader}>
          {console.log(user)}
          <img
            src={user.avatar_url}
            alt={`${user.fullName}'s avatar`}
            className={styles.modalAvatar}
          />
          <h2>{user.fullName}</h2>
          {user.title && 
            <p className={styles.modalTitle}>{user.title}</p>
          }
          
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailItem}>
            <EmailIcon /> <strong>Email:</strong> {user.email}
          </div>
          <div className={styles.detailItem}>
            <CalendarIcon /> <strong>Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'} 
          </div>
          <div className={styles.detailItem}>
            <CalendarIcon /> <strong>Auth Provider:</strong> {CamelCase(user.auth_provider)} 
          </div>
          <div className={styles.detailItem}>
            <RoleIcon /> <strong>Role:</strong>
            <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
              {user.role}
            </span>
          </div>
          <div className={styles.detailItem}>
            <SubIcon /> <strong>Subscription:</strong> {user.subscription_status ? 'PRO+' : 'Inactive'}
          </div>
          {user.subscription_end_date && 
            <div className={styles.detailItem}>
            <SubIcon /> <strong>Expires:</strong> {formatDate(user.subscription_end_date)}
          </div>
          }
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.closeTextButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;