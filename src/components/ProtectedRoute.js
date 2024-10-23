import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Puedes reemplazar esto con un componente de carga personalizado
    return <div>Cargando...</div>;
  }

  if (!user) {
    // Redirige al login y guarda la ubicación actual para redirigir de vuelta después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
