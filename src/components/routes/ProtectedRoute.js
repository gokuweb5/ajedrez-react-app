import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading, error, verifyAuthentication, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsVerifying(true);
        const isValid = await verifyAuthentication();
        
        if (!isValid) {
          setAuthError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [verifyAuthentication]);

  // Componente de Loading
  const LoadingSpinner = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="mt-4 text-gray-600">Verificando autenticación...</p>
    </div>
  );

  // Componente de Error
  const ErrorMessage = ({ message }) => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md" role="alert">
          <div className="flex items-center">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Error de autenticación</p>
              <p className="text-sm">{message}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Ir al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Verificar estados de carga
  if (loading || isVerifying) {
    return <LoadingSpinner />;
  }

  // Verificar errores
  if (error || authError) {
    return <ErrorMessage message={error || authError} />;
  }

  // Verificar autenticación
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Verificar roles si se requieren
  if (requiredRoles.length > 0) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded shadow-md" role="alert">
              <div className="flex">
                <div className="py-1">
                  <svg className="h-6 w-6 text-yellow-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Acceso Denegado</p>
                  <p className="text-sm">No tienes los permisos necesarios para acceder a esta página.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Todo está bien, renderizar la ruta protegida
  return children;
};

export default ProtectedRoute;
