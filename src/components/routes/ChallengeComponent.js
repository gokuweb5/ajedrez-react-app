import React, { useEffect, useState } from 'react';
import { acceptChallenge, declineChallenge, getChallenges, getOnlineUsers, sendChallenge } from '../../api';

function ChallengeComponent({ currentUserId }) {
  const [challenges, setChallenges] = useState([]);
  const [challengeUserId, setChallengeUserId] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedTime, setSelectedTime] = useState('10'); // Tiempo de juego por defecto

  useEffect(() => {
    fetchOnlineUsers();
    fetchChallenges();
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const users = await getOnlineUsers();
      setOnlineUsers(users.filter(user => user.id !== currentUserId));
    } catch (error) {
      console.error('Error al obtener usuarios en línea:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const currentChallenges = await getChallenges(currentUserId);
      setChallenges(currentChallenges);
    } catch (error) {
      console.error('Error al obtener desafíos:', error);
    }
  };

  const handleSendChallenge = async () => {
    if (!challengeUserId) {
      alert('Por favor, selecciona un usuario para desafiar.');
      return;
    }
    try {
      await sendChallenge(currentUserId, challengeUserId, selectedTime);
      alert('Desafío enviado con éxito');
      fetchChallenges();
    } catch (error) {
      console.error('Error al enviar desafío:', error);
      alert('Error al enviar desafío');
    }
  };

  const handleAcceptChallenge = async (challengeId) => {
    try {
      await acceptChallenge(challengeId);
      alert('Desafío aceptado');
      fetchChallenges();
      // Redirigir al juego
      // history.push(`/game/${challengeId}`);
    } catch (error) {
      console.error('Error al aceptar desafío:', error);
      alert('Error al aceptar desafío');
    }
  };

  const handleDeclineChallenge = async (challengeId) => {
    try {
      await declineChallenge(challengeId);
      alert('Desafío rechazado');
      fetchChallenges();
    } catch (error) {
      console.error('Error al rechazar desafío:', error);
      alert('Error al rechazar desafío');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Desafíos</h2>
      <div className="mb-4">
        <select
          className="border rounded p-2 mr-2"
          value={challengeUserId}
          onChange={(e) => setChallengeUserId(e.target.value)}
        >
          <option value="">Selecciona un usuario</option>
          {onlineUsers.map(user => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleSendChallenge}
        >
          Enviar Desafío
        </button>
      </div>

      <h3 className="text-xl font-semibold mb-2">Desafíos Recibidos</h3>
      <ul>
        {challenges.map(challenge => (
          <li key={challenge.id} className="mb-2">
            Desafío de {challenge.challenger.username}
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded ml-2"
              onClick={() => handleAcceptChallenge(challenge.id)}
            >
              Aceptar
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded ml-2"
              onClick={() => handleDeclineChallenge(challenge.id)}
            >
              Rechazar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChallengeComponent;
