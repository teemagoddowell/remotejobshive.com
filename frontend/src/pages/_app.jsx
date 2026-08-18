import { AuthContext, AuthProvider } from '../context/AuthContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import { Prompt } from 'next/font/google';
import "@/styles/global.css";
import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router.js';
import { fetchAnalyticsTrack } from '@/constants.jsx';

const prompt = Prompt({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});


function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();

useEffect(() => {
    const handleRouteChange = async (url) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(fetchAnalyticsTrack, {
                method: 'POST',
                headers: headers, 
                body: JSON.stringify({
                    event_type: 'PAGE_VIEW',
                    page_visited: url
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error("Tracking API responded with an error:", responseData.message);
            }

        } catch (err) {
            console.error("Failed to track page view:", err);
        }
    };


    if (router.isReady) {
        handleRouteChange(router.asPath);
    }
    
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
        router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.isReady, router.asPath, router.events]);

  

  const handleScriptReady = () => {
    const paymentIframe = document.getElementById('flwpugpaidid');
    if (paymentIframe && !paymentIframe.title) {
        paymentIframe.title = "Secure Payment Form Frame";
    }
  };

  function AppContent({ Component, pageProps }) {
    const { user, loading } = useContext(AuthContext);
    const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      {!loading && !user?.isSubscribed && (
        <Script 
          id="adsbygoogle-script"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9061384821013983"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      )}

      {getLayout(<Component {...pageProps} />)}
    </>
  );
}


  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <main className={prompt.className}>

        {/* Scripts  */}
        
        <Script 
          src="https://checkout.flutterwave.com/v3.js" 
          strategy="lazyOnload" 
          onReady={handleScriptReady} 
        />

        <Script 
          strategy="afterInteractive" 
          src="https://www.googletagmanager.com/gtag/js?id=AW-17631450628" 
        />

        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Initialize both Analytics and Ads here
            gtag('config', 'G-JKWYS1VZ2F');
            gtag('config', 'AW-17631450628');
          `}
        </Script>

          
          {/* Main Components  */}
        <AppContent Component={Component} pageProps={pageProps} />
        <Toaster position="bottom-right" />
        </main>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;