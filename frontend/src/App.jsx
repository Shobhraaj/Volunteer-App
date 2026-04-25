import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import VolunteerDashboard from './pages/VolunteerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import AnalyticsDashboard from './pages/AnalyticsDashboard';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 200 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navbar />
            {user?.role === 'organizer' ? <OrganizerDashboard /> : <VolunteerDashboard />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <Navbar />
            <TaskDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Navbar />
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Navbar />
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
