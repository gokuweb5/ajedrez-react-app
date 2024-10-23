import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import chessboardImage from '../../assets/chessboard.jpg'; // Asegúrate de tener esta imagen en tu proyecto
import { useAuth } from '../../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      // Redirige a la página anterior o a la página principal
      navigate(location.state?.from || '/chess');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Bienvenido a Ajedrez en React</h2>
      <img src={chessboardImage} alt="Tablero de ajedrez" style={{ width: '300px', marginBottom: '20px' }} />
      <h3>Iniciar sesión</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
      <p>
        ¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </div>
  );
}

export default Login;