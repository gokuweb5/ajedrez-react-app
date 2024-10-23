import { Chess } from 'chess.js';
import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

function AppContent() {
  const [game] = useState(new Chess());
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  if (!isLoggedIn) {
    return showRegister ? (
      <Register onRegister={() => setShowRegister(false)} />
    ) : (
      <Login onLogin={() => setIsLoggedIn(true)} onRegisterClick={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="game-container">
      <h1>Ajedrez en React</h1>
      <div style={{ width: '400px', margin: '20px auto' }}>
        <Chessboard position={game.fen()} />
      </div>
    </div>
  );
}

export default AppContent;