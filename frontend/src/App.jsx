import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ChatBot from './components/ChatBot';
import Login from './pages/Login';
import Register from './pages/Register';
import VolunteerDashboard from './pages/VolunteerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TaskDetail from './pages/TaskDetail';
import Profile from './pages/Profile';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Leaderboard from './pages/Leaderboard';
import TaskHistory from './pages/TaskHistory';
import Certificates from './pages/Certificates';
import ParticleBackground from './components/ParticleBackground';
import AdminDashboard from './pages/AdminDashboard';
import AllVolunteers from './pages/AllVolunteers';

import { Outlet } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="main-content"><div className="skeleton" style={{ height: 200 }} /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <div className="layout-container">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<AuthenticatedLayout />}>
        <Route path="/dashboard" element={user?.role === 'organizer' ? <AdminDashboard /> : <VolunteerDashboard />} />
        <Route path="/volunteers" element={<AllVolunteers />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/history" element={<TaskHistory />} />
        <Route path="/certificates" element={<Certificates />} />
      </Route>

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ParticleBackground />
        <AppRoutes />
        {/* Global floating chatbot — rendered on all authenticated pages */}
        <AuthGatedChatBot />
      </AuthProvider>
    </BrowserRouter>
  );
}


function AuthGatedChatBot() {
  const { user } = useAuth();
  return user ? <ChatBot /> : null;
}
