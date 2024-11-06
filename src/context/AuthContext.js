import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { verifyToken } from '../api';

const AuthContext = createContext(null);

const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutos
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenExpiryTime, setTokenExpiryTime] = useState(null);

  // Función para decodificar el token JWT
  const decodeToken = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decodificando token:', error);
      return null;
    }
  };

  // Función para verificar si el token está por expirar
  const isTokenExpiringSoon = useCallback(() => {
    if (!tokenExpiryTime) return false;
    const timeUntilExpiry = tokenExpiryTime - Date.now();
    return timeUntilExpiry < 5 * 60 * 1000; // 5 minutos
  }, [tokenExpiryTime]);

  // Función para refrescar el token
  const refreshToken = useCallback(async () => {
    try {
      const currentToken = localStorage.getItem('jwtToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!currentToken || !refreshToken) {
        throw new Error('No hay tokens disponibles');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Error al refrescar el token');
      }

      const data = await response.json();
      localStorage.setItem('jwtToken', data.token);
      
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      const decodedToken = decodeToken(data.token);
      if (decodedToken) {
        setTokenExpiryTime(decodedToken.exp * 1000);
      }

      return data.token;
    } catch (error) {
      console.error('Error en refreshToken:', error);
      await logout();
      throw error;
    }
  }, []);

  // Función para verificar la autenticación
  const verifyAuthentication = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return false;

      const decodedToken = decodeToken(token);
      if (!decodedToken) return false;

      // Actualizar tiempo de expiración
      setTokenExpiryTime(decodedToken.exp * 1000);

      // Si el token está por expirar, intentar refrescarlo
      if (isTokenExpiringSoon()) {
        await refreshToken();
      }

      const isValid = await verifyToken(token);
      return isValid;
    } catch (error) {
      console.error('Error en verifyAuthentication:', error);
      return false;
    }
  }, [isTokenExpiringSoon, refreshToken]);

  // Efecto para inicializar la autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const savedUser = localStorage.getItem('user');
        
        if (savedUser && await verifyAuthentication()) {
          setUser(JSON.parse(savedUser));
        } else {
          await logout();
        }
      } catch (error) {
        console.error('Error en initializeAuth:', error);
        setError(error.message);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [verifyAuthentication]);

  // Efecto para refrescar el token periódicamente
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        if (isTokenExpiringSoon()) {
          await refreshToken();
        }
      } catch (error) {
        console.error('Error al refrescar token automáticamente:', error);
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user, isTokenExpiringSoon, refreshToken]);

  const login = async (userData, token, refreshToken) => {
    try {
      setLoading(true);
      
      // Guardar tokens
      localStorage.setItem('jwtToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Decodificar y verificar el token
      const decodedToken = decodeToken(token);
      if (decodedToken) {
        setTokenExpiryTime(decodedToken.exp * 1000);
      }

      // Guardar datos del usuario
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setError(null);
    } catch (error) {
      setError('Error al iniciar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Llamada al endpoint de logout si existe
      const token = localStorage.getItem('jwtToken');
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error en logout endpoint:', error);
        }
      }

      // Limpiar estado y storage
      setUser(null);
      setTokenExpiryTime(null);
      localStorage.removeItem('user');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('refreshToken');
      setError(null);
    } catch (error) {
      setError('Error al cerrar sesión');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      error,
      isAuthenticated: !!user,
      refreshToken,
      verifyAuthentication
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;
