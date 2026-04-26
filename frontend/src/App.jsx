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
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Navbar />
          {user?.role === 'organizer' ? <AdminDashboard /> : <VolunteerDashboard />}
        </ProtectedRoute>
      } />

      <Route path="/volunteers" element={
        <ProtectedRoute><Navbar /><AllVolunteers /></ProtectedRoute>
      } />


      <Route path="/tasks/:id" element={
        <ProtectedRoute><Navbar /><TaskDetail /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><Navbar /><Profile /></ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute><Navbar /><AnalyticsDashboard /></ProtectedRoute>
      } />

      <Route path="/leaderboard" element={
        <ProtectedRoute><Navbar /><Leaderboard /></ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute><Navbar /><TaskHistory /></ProtectedRoute>
      } />

      <Route path="/certificates" element={
        <ProtectedRoute><Navbar /><Certificates /></ProtectedRoute>
      } />

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
