import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChessGame from './components/routes/ChessGame';
import NotFound from './components/routes/NotFound';
import ProtectedRoute from './components/routes/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componente para manejar la redirección inicial
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/chess" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas */}
          <Route
            path="/chess"
            element={
              <ProtectedRoute>
                <ChessGame />
              </ProtectedRoute>
            }
          />

          {/* Ruta raíz */}
          <Route path="/" element={<RootRedirect />} />

          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
