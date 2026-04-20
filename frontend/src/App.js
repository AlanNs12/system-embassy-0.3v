import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/Login';
import SuperAdminTenants from './pages/superadmin/Tenants';
import AdminConfiguracoes from './pages/admin/Configuracoes';
import AdminUsuarios from './pages/admin/Usuarios';

// Rota protegida por perfil
function RotaProtegida({ children, perfis }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (perfis && !perfis.includes(user.perfil)) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />

      {/* Super Admin */}
      <Route path="/superadmin/tenants" element={
        <RotaProtegida perfis={['super_admin']}>
          <SuperAdminTenants />
        </RotaProtegida>
      } />

      {/* Admin do Local */}
      <Route path="/admin/configuracoes" element={
        <RotaProtegida perfis={['admin']}>
          <AdminConfiguracoes />
        </RotaProtegida>
      } />
      <Route path="/admin/usuarios" element={
        <RotaProtegida perfis={['admin']}>
          <AdminUsuarios />
        </RotaProtegida>
      } />

      {/* Porteiro — serão adicionados na Etapa 6 */}
      {/* <Route path="/portaria/dashboard" ... /> */}

      {/* Redirect "/" de acordo com o perfil */}
      <Route path="/" element={
        <RotaProtegida>
          {user?.perfil === 'super_admin' && <Navigate to="/superadmin/tenants" replace />}
          {user?.perfil === 'admin'       && <Navigate to="/admin/configuracoes" replace />}
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
