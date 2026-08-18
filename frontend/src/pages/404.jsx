import React from 'react';
import Link from 'next/link';
import Head from 'next/head'; 
import styles from '@/styles/404.module.css';

const NotFoundPage = () => {
    return (
        <>
            <Head>
                <title>404: Page Does Not Exist</title>
            </Head>
            <div className={styles['not-found-container']}>
               <div className={styles['not-found-content']}>
                    <h1>404</h1>
                    <h2>Page Not Found</h2>
                    <p>Oops! The page you are looking for does not exist. It might have been moved or deleted.</p>
                    <a href="/" className={styles['btn-primary-404']}>Go to Homepage</a>
                </div>
            </div>
        </>
    );
};

export default NotFoundPage;