import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      localStorage.setItem('jwtToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    try {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing token:', error);
    }
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

const ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    SIGNIN: '/auth/signin',
  },
  GAMES: {
    CREATE: '/games',
    MOVE: (gameId) => `/games/${gameId}/move`,
    END: (gameId) => `/games/${gameId}/end`,
    GET: (gameId) => `/games/${gameId}`,
    PENDING: '/games/pending',
    BY_PLAYER: (playerId) => `/games/player/${playerId}`,
  },
  CHALLENGES: {
    SEND: '/challenges/send',
    ACCEPT: (challengeId) => `/challenges/accept/${challengeId}`,
    DECLINE: (challengeId) => `/challenges/decline/${challengeId}`,
  },
  USERS: {
    ONLINE: '/users/online',
  },
};

export const register = async (username, email, password) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.SIGNUP, { username, email, password });
    return response.data;
  } catch (error) {
    console.error('Error en el registro:', error);
    throw error.response?.data || error;
  }
};

export const login = async (username, password) => {
  try {
    const response = await api.post(ENDPOINTS.AUTH.SIGNIN, { username, password });
    if (response.data.accessToken) {
      localStorage.setItem('user', JSON.stringify(response.data));
      setAuthToken(response.data.accessToken);
    }
    return response.data;
  } catch (error) {
    console.error('Error en el login:', error);
    throw error.response?.data || error;
  }
};

export const logout = () => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('jwtToken');
    delete api.defaults.headers.common['Authorization'];
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const createGame = async (whitePlayerId, blackPlayerId, initialTime) => {
  try {
    const response = await api.post(ENDPOINTS.GAMES.CREATE, { whitePlayerId, blackPlayerId, initialTime });
    return response.data;
  } catch (error) {
    console.error('Error al crear el juego:', error);
    throw error.response.data;
  }
};

export const makeMove = async (gameId, move, fen) => {
  try {
    const response = await api.post(ENDPOINTS.GAMES.MOVE(gameId), { move, fen });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error making move:');
  }
};

export const endGame = async (gameId, finalStatus) => {
  try {
    const response = await api.put(ENDPOINTS.GAMES.END(gameId), { finalStatus });
    return response.data;
  } catch (error) {
    console.error('Error al finalizar el juego:', error);
    throw error.response.data;
  }
};

export const getGame = async (gameId) => {
  try {
    const response = await api.get(ENDPOINTS.GAMES.GET(gameId));
    return response.data;
  } catch (error) {
    console.error('Error al obtener el juego:', error);
    throw error.response.data;
  }
};

export const sendChallenge = async (challengedId) => {
  if (!challengedId) {
    throw new Error('challengedId is required');
  }
  
  try {
    const response = await api.post(ENDPOINTS.CHALLENGES.SEND, { challengedId });
    return response.data;
  } catch (error) {
    handleApiError(error, 'Error sending challenge:');
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
    const response = await api.post(ENDPOINTS.CHALLENGES.ACCEPT(challengeId));
    return response.data;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
};

export const declineChallenge = async (challengeId) => {
  try {
    const response = await api.post(ENDPOINTS.CHALLENGES.DECLINE(challengeId));
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
    const response = await api.get(ENDPOINTS.GAMES.BY_PLAYER(playerId));
    return response.data;
  } catch (error) {
    console.error('Error al obtener los juegos del jugador:', error);
    throw error.response?.data || error;
  }
};

export const getPendingGames = async () => {
  try {
    const response = await api.get(ENDPOINTS.GAMES.PENDING);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los juegos pendientes:', error);
    throw error.response?.data || error;
  }
};

export const getOnlineUsers = async (retryCount = 3) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await api.get(ENDPOINTS.USERS.ONLINE);
      return response.data;
    } catch (error) {
      if (i === retryCount - 1) {
        handleApiError(error, 'Error getting online users:');
      }
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const TOKEN_EXPIRY_MARGIN = 60; // segundos

export const verifyToken = () => {
  const token = localStorage.getItem('jwtToken');
  if (!token) return false;
  
  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return decodedToken.exp > (currentTime + TOKEN_EXPIRY_MARGIN);
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
};

export const refreshOnlineUsers = async () => {
  try {
    const response = await api.get(ENDPOINTS.USERS.ONLINE);
    return response.data;
  } catch (error) {
    console.error('Error refreshing online users:', error);
    if (error.response?.status === 401) {
      // Token expirado o inválido
      logout();
    }
    throw error.response?.data || error;
  }
};

export default api;

// Función de utilidad para manejar errores de manera consistente
const handleApiError = (error, message) => {
  console.error(message, error);
  throw error.response?.data || error;
};
