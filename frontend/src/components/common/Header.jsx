import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import UserLayout from '../layouts/UserLayout';
import RecruiterLayout from '../layouts/RecruiterLayout';
import DefaultHeader from '../layouts/DefaultHeader';

const Header = () => {
  const { user } = useContext(AuthContext);
  
  if (user) {
    if (user.role === "user") {
      return <UserLayout />;
    } else if (user.role === "recruiter") {
      return <RecruiterLayout />;
    }
  }

  return <DefaultHeader />;
};

export default Header;