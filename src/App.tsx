import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Repairs from './pages/Repairs';
import SelfChecks from './pages/SelfChecks';
import { UserProvider } from './contexts/UserContext';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';

// Placeholder components for routes
const Monitoring = () => <div>Self-Diagnosis Monitoring Page</div>;
const Statistics = () => <div>Statistics Page</div>;

const App: React.FC = () => {
  return (
    <UserProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="selfchecks" element={<SelfChecks />} />
          </Route>
        </Route>
        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
};

export default App;
