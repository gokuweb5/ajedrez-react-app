import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('jwtToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('jwtToken');
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const register = async (username, email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, { username, email, password });
  return response.data;
};

export const login = async (username, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signin`, { username, password });
  if (response.data.accessToken) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const createGame = async (whitePlayerId, blackPlayerId, initialTime) => {
  try {
    const response = await api.post('/games', { whitePlayerId, blackPlayerId, initialTime });
    return response.data;
  } catch (error) {
    console.error('Error al crear el juego:', error);
    throw error.response.data;
  }
};

export const makeMove = async (gameId, move, newPosition) => {
  try {
    const response = await api.post(`/games/${gameId}/move`, { move, newPosition });
    return response.data;
  } catch (error) {
    console.error('Error al realizar el movimiento:', error);
    throw error.response.data;
  }
};

export const endGame = async (gameId, finalStatus) => {
  try {
    const response = await api.put(`/games/${gameId}/end`, { finalStatus });
    return response.data;
  } catch (error) {
    console.error('Error al finalizar el juego:', error);
    throw error.response.data;
  }
};

export const getGame = async (gameId) => {
  try {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el juego:', error);
    throw error.response.data;
  }
};

export const sendChallenge = async (challengedId) => {
  try {
    const response = await api.post('/challenges/send', null, { params: { challengedId } });
    return response.data;
  } catch (error) {
    console.error('Error sending challenge:', error);
    throw error;
  }
};

export const sendChatMessage = async (gameId, message) => {
  try {
    const response = await api.post('/messages', { gameId, content: message });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error.response.data;
  }
};

export const acceptChallenge = async (challengeId) => {
  try {
    const response = await api.post(`/challenges/accept/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
};

export const declineChallenge = async (challengeId) => {
  try {
    const response = await api.post(`/challenges/decline/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error declining challenge:', error);
    throw error;
  }
};

export const challengeUser = async (username) => {
  try {
    const response = await api.post('/game/challenge', { challengedUsername: username });
    return response.data;
  } catch (error) {
    console.error('Error al desafiar al usuario:', error);
    throw error.response.data;
  }
};

export const getGamesByPlayer = async (playerId) => {
  try {
    const response = await api.get(`/games/player/${playerId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los juegos del jugador:', error);
    throw error.response?.data || error;
  }
};

export const getPendingGames = async () => {
  try {
    const response = await api.get('/games/pending');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los juegos pendientes:', error);
    throw error.response?.data || error;
  }
};

export const getOnlineUsers = async () => {
  try {
    const token = localStorage.getItem('jwtToken');
    const response = await api.get('/users/online', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Respuesta de getOnlineUsers:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error en getOnlineUsers:', error.response || error);
    throw error;
  }
};

export default api;
