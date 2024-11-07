import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rating, setRating] = useState(1000);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register(username, email, password, rating);
      alert('Registro exitoso. Por favor, inicia sesión.');
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Error en el registro. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-md bg-white">
      <h2 className="text-2xl font-bold mb-4">Registrarse</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-2 border rounded"
          aria-label="Nombre de usuario"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
          aria-label="Correo electrónico"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
          aria-label="Contraseña"
        />
        <input
          type="number"
          placeholder="Rating (1000-3200)"
          value={rating}
          onChange={(e) => setRating(Math.min(Math.max(e.target.value, 1000), 3200))}
          required
          className="w-full p-2 border rounded"
          aria-label="Rating"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full p-2 rounded ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold`}
        >
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-4">¿Ya tienes una cuenta? <Link to="/login" className="text-blue-500 hover:underline">Inicia sesión aquí</Link></p>
    </div>
  );
}

export default Register;
