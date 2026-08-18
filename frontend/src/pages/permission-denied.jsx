import React from 'react';
import Link from 'next/link';
import styles from '@/styles/404.module.css'
import { support } from '@/constants';

const PermissionDenied = () => {
    return (
        <>
        <title>403: Access Denied</title>
        <div className={styles['not-found-container']}>
            <div className={styles['not-found-content']}>
                <h1>403</h1>
                <h2>This Area is Restricted</h2>
                <p>
                    It seems you've wandered off the marked trail. This section is for a different user role.
                    If you believe you should have access, Please <Link href={support}>let us know</Link>.
                </p>
                
                <a href="/" className={styles['btn-primary-404']}>Back to Safety</a>
            </div>
        </div>
        </>

    );
};

export default PermissionDenied;