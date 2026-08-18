import { useEffect, useContext } from 'react';
import { useRouter } from "next/router";
import { AuthContext } from '@/context/AuthContext';

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    logout();
    router.push("/");
  }, [logout, router]); 

  return null;
};

export default Logout;