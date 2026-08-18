'use client'; 

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const AdComponent = ({ adSlot, type = 'in-article' }) => {
    const adRef = useRef(null);
    const pathname = usePathname();

    useEffect(() => {
        if (adRef.current && !adRef.current.hasChildNodes()) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (err) {
                console.error(`AdSense error for slot ${adSlot}:`, err);
            }
        }
    }, [pathname, adSlot]);

    // --- Banner ---
    if (type === 'banner') {
        return (
            <ins
                ref={adRef}
                className="adsbygoogle" 
                style={{ display: 'block' }}
                data-ad-client="ca-pub-9061384821013983"
                data-ad-slot={adSlot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            ></ins>
        );
    }

    // --- Multiplex Ad ---
    if (type === 'multiplex') {
        return (
            <ins
                ref={adRef}
                className="adsbygoogle" 
                style={{ display: 'block' }}
                data-ad-format="autorelaxed"
                data-ad-client="ca-pub-9061384821013983"
                data-ad-slot={adSlot}
            ></ins>
        );
    }

    // --- In-Article Ad (Default) ---
    return (
        <ins
            ref={adRef}
            className="adsbygoogle" 
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-9061384821013983"
            data-ad-slot={adSlot}
        ></ins>
    );
};

export default AdComponent;