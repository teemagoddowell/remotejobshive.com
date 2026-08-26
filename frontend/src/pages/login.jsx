import React, { useState, useContext } from "react";
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { EyeOpenIcon, EyeClosedIcon, GoogleIcon, SupportIcon, AppName, userFeatures as features, contactUs, fetchlogin, recruiterDashboard, userDashboard, fetchAuthGoogle, fetchGooglev3, logoURL, forgotPassword, mainURL } from '../constants';
import { AuthContext } from '@/context/AuthContext'; 
import { useGoogleLogin } from "@react-oauth/google";
import RedirectIfAuth from "@/components/RedirectIfAuth";
import styles from '@/styles/login.module.css';

function LoginPageContent() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const pageUrl = `${mainURL}/login`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(fetchlogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to log in');
      }
      
      login(data.user, data.token);

      if (data.user.role === 'recruiter') {
        router.push(recruiterDashboard);
      } else {
        router.push(userDashboard);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrev = () => {
    setCurrentFeatureIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };
  
  const handleBackendAuth = async (googleData) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(fetchAuthGoogle, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleData.email,
          fullName: googleData.name,
          avatarUrl: googleData.picture,
          loginType: 'google',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google Sign-In failed on our server.');

      login(data.user, data.token);

      if (data.user.role === 'recruiter') {
        router.push(recruiterDashboard);
      } else {
        router.push(userDashboard);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch(fetchGooglev3, {
            headers: {
              'Authorization': `Bearer ${codeResponse.access_token}`
            }
          });
          const googleDetails = await response.json();
          handleBackendAuth(googleDetails);
        } catch (error) {
           setError("Failed to fetch Google user info.");
        }
      };
      fetchUserInfo();
    },
    onError: () => {
      setError("Google Login Failed. Please try again.");
    },
  });

  return (
    <>
      <Head>
        <title>{`Log In to Your Account | ${AppName}`}</title>
        <meta name="description" content={`Log in to your ${AppName} account to manage your profile, track applications, and access your saved jobs.`} />
        <link rel="canonical" href={pageUrl} />

        <meta property="og:title" content={`Log In to ${AppName}`} />
        <meta property="og:description" content="Access your dashboard to manage your remote job search." />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={AppName} />
        <meta property="og:image" content={`${mainURL}/logo.png`} />
      </Head>
      <div className={styles['login-page']}>
        <div className={styles['login-form-section']}>
          <header className={styles['login-header']}>
            <a href="/" className={styles['headerLogo']}>
              <img src={logoURL} width="300px" alt="JobsHive Logo" />
            </a>
          </header>
          <main className={styles['form-container']}>
            <h2>Log In</h2>
            <p className={styles['signup-link']}>
              Don't have an account? <Link href="/sign-up">Create now</Link>
            </p>
            <form onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <div className={styles['password-wrapper']}>
                  <input type={passwordVisible ? "text" : "password"} id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                  <span onClick={() => setPasswordVisible(!passwordVisible)} className={styles['password-toggle-icon']}>
                    {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </span>
                </div>
              </div>
              {error && <p className={styles['error-message']}>{error}</p>}
              <div className={styles['form-options']}>
                <div className={styles['remember-me']}>
                  <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <Link href={forgotPassword} className={styles['forgot-password']}>Forgot Password?</Link>
              </div>
              <button type="submit" className={styles['login-btn']} disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div className={styles['separator']}>OR</div>
              <button type="button" className={styles['google-btn']} onClick={() => googleLogin()}>
                <GoogleIcon /> Continue with Google
              </button>
            </form>
          </main>
        </div>
        <div className={styles['info-panel-section']}>
          <header className={styles['info-header']}>
            <Link href={contactUs} className={styles['support-link']}>
              <SupportIcon /> Support
            </Link>
          </header>
          <div className={styles['info-content']}>
            <h2>{features[currentFeatureIndex].title}</h2>
            <p>{features[currentFeatureIndex].description}</p>
            <div className={styles['carousel-nav']}>
              <span className={styles['carousel-arrow']} onClick={handlePrev}>&#x276E;</span>
              <div className={styles['carousel-dots']}>
                {features.map((_, index) => (
                  <span 
                    key={index} 
                    className={`${styles['carousel-dot']} ${currentFeatureIndex === index ? styles['active'] : ''}`} 
                    onClick={() => setCurrentFeatureIndex(index)} 
                  />
                ))}
              </div>
              <span className={styles['carousel-arrow']} onClick={handleNext}>&#x276F;</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const LoginPage = () => {
    return (
        <RedirectIfAuth>
            <LoginPageContent />
        </RedirectIfAuth>
    );
};

export default LoginPage;