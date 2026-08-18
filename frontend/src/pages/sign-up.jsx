import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Head from "next/head";
import { EyeOpenIcon, EyeClosedIcon, GoogleIcon, SupportIcon, AppName, userFeatures, recruiterFeatures, fetchregister, recruiterDashboard, userDashboard, fetchGooglev3, logoURL, fetchAuthGoogle, contactUs, mainURL } from '../constants';
import { AuthContext } from "@/context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import RedirectIfAuth from "@/components/RedirectIfAuth";
import styles from '@/styles/login.module.css';

function SignUpPageContent() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const [role, setRole] = useState("user");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const features = role === 'user' ? userFeatures : recruiterFeatures;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const pageUrl = `${mainURL}/register`;

  const handleNext = () => {
    setCurrentFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
  };

  const handlePrev = () => {
    setCurrentFeatureIndex((prevIndex) => (prevIndex - 1 + features.length) % features.length);
  };

  const handleSubmit = async (e)=> {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(fetchregister, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, fullname, email, password, title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to Register');
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
  }

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
              headers: { 'Authorization': `Bearer ${codeResponse.access_token}` }
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
        <title>{`Create Your Account | ${AppName}`}</title>
        <meta name="description" content={`Join ${AppName} today to find and apply for thousands of remote jobs. Create your free account and start your remote career journey now.`} />
        <link rel="canonical" href={pageUrl} />

        <meta property="og:title" content={`Create Your Account on ${AppName}`} />
        <meta property="og:description" content="Find and apply for thousands of remote jobs from top companies worldwide." />
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
            <h2>Sign Up</h2>
            <p className={styles['signup-link']}>
              Already have an account? <Link href="/login">Log In</Link>
            </p>
            <form onSubmit={handleSubmit}>
              <div className={styles['user-type-selection']}>
                <button type="button" className={`${styles['user-type-btn']} ${role === 'user' ? styles['active'] : ''}`} onClick={() => setRole('user')}>User</button>
                <button type="button" className={`${styles['user-type-btn']} ${role === 'recruiter' ? styles['active'] : ''}`} onClick={() => setRole('recruiter')}>Recruiter</button>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="fullname">{role === 'recruiter' ? 'Recruiter Name' : 'Full Name'}</label>
                <input type="text" id="fullname" placeholder="John Doe" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" placeholder="example@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="title">Title</label>
                <input type="text" id="title" placeholder={role === 'user' ? 'Fullstack Developer' : 'Hiring Manager'} value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="password">Password</label>
                <div className={styles['password-wrapper']}>
                  <input type={passwordVisible ? "text" : "password"} id="password" placeholder="@#*%" value={password} minLength={5} onChange={(e) => setPassword(e.target.value)} required />
                  <span onClick={() => setPasswordVisible(!passwordVisible)} className={styles['password-toggle-icon']}>
                    {passwordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </span>
                </div>
              </div>
              <div className={styles['form-group']}>
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className={styles['password-wrapper']}>
                  <input type={confirmPasswordVisible ? "text" : "password"} id="confirm-password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <span onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)} className={styles['password-toggle-icon']}>
                    {confirmPasswordVisible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </span>
                </div>
              </div>
              {error && <p className={styles['error-message']}>{error}</p>}
              <button type="submit" className={styles['login-btn']} disabled={loading}>
                {loading ? 'Registering User...' : 'Create Account'}
              </button>
              {role === 'user' && (
                <>
                  <div className={styles['separator']}>OR</div>
                  <button
                    type="button"
                    className={styles['google-btn']}
                    onClick={googleLogin}
                  >
                    <GoogleIcon /> Continue with Google
                  </button>
                </>
              )}
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

const SignUpPage = () => {
    return (
        <RedirectIfAuth>
            <SignUpPageContent />
        </RedirectIfAuth>
    );
};

export default SignUpPage;