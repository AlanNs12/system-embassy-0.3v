import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import SuperAdminTenants from './pages/superadmin/Tenants';

// Rota protegida por perfil
function RotaProtegida({ children, perfis }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(user.perfil)) return <Navigate to="/login" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

      {/* Super Admin */}
      <Route path="/superadmin/tenants" element={
        <RotaProtegida perfis={['super_admin']}>
          <SuperAdminTenants />
        </RotaProtegida>
      } />

      {/* Redireciona "/" de acordo com o perfil */}
      <Route path="/" element={
        <RotaProtegida>
          {user?.perfil === 'super_admin' && <Navigate to="/superadmin/tenants" replace />}
          {user?.perfil === 'admin'       && <Navigate to="/admin/dashboard" replace />}
          {user?.perfil === 'porteiro'    && <Navigate to="/portaria/dashboard" replace />}
        </RotaProtegida>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
