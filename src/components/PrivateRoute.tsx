import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { verifyToken } from '../services/auth';

const PrivateRoute: React.FC = () => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const verify = async () => {
      const isValid = await verifyToken();
      setIsVerified(isValid);
    };
    verify();
  }, []);

  if (isVerified === null) {
    // Show loading state while verifying
    return <div>Loading...</div>;
  }

  return isVerified ? 
    <Outlet /> : 
    <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute; 