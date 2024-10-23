import React, { useEffect } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChessGame from './components/ChessGame';
import { AuthProvider } from './context/AuthContext';
import { initializeWebSocket } from './utils/websocket';

function App() {
  useEffect(() => {
    initializeWebSocket();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;