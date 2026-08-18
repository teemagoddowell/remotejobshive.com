import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { dMenu } from '@/constants';

const DefaultHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

    const handleLogoClick = (e) => {
    if (router.pathname === '/') {
        e.preventDefault(); 
        window.location.reload();
    }
  };

  return (
    <div className="header">
      <div className="header-wrapper">
        <div className="logo-section">
        <a href="/" onClick={handleLogoClick} className="headerLogo">
            <img src="/images/logo.png" width="300px" alt="JobsHive Logo" />
        </a>
      </div>
        <nav className="menu">
          
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} id="navLinks">
            <li className="close-icon" onClick={toggleMenu}>
              <i className="fas fa-times"></i>
            </li>
            {Object.values(dMenu).filter(item => item.class === 'links').map((menuItem) => (
             <li key={menuItem.id}>
                <Link href={menuItem.link} className="nav-link">{menuItem.title}</Link>
              </li>
            ))}

              <li className="mobile-buttons">
              {Object.values(dMenu).filter(item => item.class === 'button').map((menuItem) => (
                <Link key={menuItem.id} href={menuItem.link} className={menuItem.cName}>{menuItem.title}</Link>
              ))}
            </li>

          </ul>

          <div className="buttons">
            {Object.values(dMenu).filter(item => item.class === 'button').map((menuItem) => (
              <Link key={menuItem.id} href={menuItem.link} className={menuItem.cName} style={{ marginRight: 0 }}>
                {menuItem.title}
              </Link>
            ))}
          </div>
          
          <div className="menu-icon" onClick={toggleMenu}>
            <span style={{ transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
            <span style={{ opacity: isMenuOpen ? '0' : '1' }}></span>
            <span style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none' }}></span>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default DefaultHeader;

