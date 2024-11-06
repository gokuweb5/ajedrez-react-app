let client;
let chatSubscription;
let gameSubscription;
let challengeSubscription;
let challengeUpdateSubscription;

let connectionStatus = {
  connected: false,
  lastError: null,
  reconnectAttempts: 0
};

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000;

const isConnected = () => {
  return client && client.connected;
};

const ensureConnection = () => {
  if (!isConnected()) {
    throw new Error('WebSocket no está conectado');
  }
};

let socket = null;

export const initializeWebSocket = (handlers) => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('No token found');
      return null;
    }

    // Cerrar conexión existente si hay una
    if (socket) {
      socket.close();
    }

    socket = new WebSocket(`ws://localhost:8081/ws?token=${token}`);

    socket.onopen = () => {
      console.log('WebSocket conectado');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket mensaje recibido:', data);

        switch (data.type) {
          case 'CHALLENGE_RECEIVED':
            handlers.onChallengeReceived?.(data.challenge);
            break;
          case 'CHALLENGE_UPDATED':
            handlers.onChallengeUpdated?.(data.challenge);
            break;
          case 'ONLINE_USERS_UPDATED':
            handlers.onOnlineUsersUpdated?.(data.users);
            break;
          default:
            console.log('Mensaje no manejado:', data);
        }
      } catch (error) {
        console.error('Error procesando mensaje WebSocket:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket desconectado');
    };

    return socket;
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    return null;
  }
};

const handleReconnect = () => {
  if (connectionStatus.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    connectionStatus.reconnectAttempts++;
    console.log(`Intento de reconexión ${connectionStatus.reconnectAttempts} de ${MAX_RECONNECT_ATTEMPTS}`);
    setTimeout(() => {
      if (!connectionStatus.connected) {
        client.activate();
      }
    }, RECONNECT_DELAY * connectionStatus.reconnectAttempts);
  } else {
    console.error('Se alcanzó el número máximo de intentos de reconexión');
  }
};

export const sendChatMessage = (gameId, message) => {
  if (client && client.connected) {
    client.publish({
      destination: '/app/chat',
      body: JSON.stringify({ gameId, message })
    });
  } else {
    console.error('WebSocket no está conectado');
  }
};

const subscriptions = new Map();

const safeUnsubscribe = (subscriptionKey) => {
  const subscription = subscriptions.get(subscriptionKey);
  if (subscription) {
    subscription.unsubscribe();
    subscriptions.delete(subscriptionKey);
  }
};

export const subscribeToChatMessages = (gameId, callback) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  const subscription = client.subscribe(`/topic/chat.${gameId}`, (message) => {
    const data = JSON.parse(message.body);
    callback(data);
  });

  subscriptions.set(`chat-${gameId}`, subscription);

  return () => {
    safeUnsubscribe(`chat-${gameId}`);
  };
};

export const sendChessMove = (gameId, move, newPosition) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  client.publish({
    destination: '/app/chess.move',
    body: JSON.stringify({ gameId, move, newPosition })
  });
};

export const subscribeToGameUpdates = (gameId, callback) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  if (gameSubscription) {
    gameSubscription.unsubscribe();
  }

  gameSubscription = client.subscribe(`/topic/game.${gameId}`, (message) => {
    const gameUpdate = JSON.parse(message.body);
    callback(gameUpdate);
  });
};

export const subscribeToChallenges = (onChallengeReceived, onChallengeUpdated) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  if (challengeSubscription) {
    challengeSubscription.unsubscribe();
  }
  if (challengeUpdateSubscription) {
    challengeUpdateSubscription.unsubscribe();
  }

  challengeSubscription = client.subscribe('/user/queue/challenges', (message) => {
    const challenge = JSON.parse(message.body);
    onChallengeReceived(challenge);
  });

  challengeUpdateSubscription = client.subscribe('/user/queue/challenge-updates', (message) => {
    const challengeUpdate = JSON.parse(message.body);
    onChallengeUpdated(challengeUpdate);
  });
};

export const subscribeToOnlineUsers = (callback) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  return client.subscribe('/topic/online-users', (message) => {
    const onlineUsers = JSON.parse(message.body);
    callback(onlineUsers);
  });
};

export const disconnect = async () => {
    try {
        // Notificar al backend que el usuario se desconecta
        const token = localStorage.getItem('jwtToken');
        if (token) {
            await fetch('http://localhost:8081/api/auth/signout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Error al desconectar:', error);
    } finally {
        if (socket) {
            socket.close();
            socket = null;
        }
    }
};

export function getConnectionStatus() {
  return socket && socket.readyState === WebSocket.OPEN;
}

export const sendChallenge = (challengedUserId) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  client.publish({
    destination: '/app/challenge.send',
    body: JSON.stringify({ challengedUserId })
  });
};

export const acceptChallenge = (challengeId) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  client.publish({
    destination: '/app/challenge.accept',
    body: JSON.stringify({ challengeId })
  });
};

export const declineChallenge = (challengeId) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  client.publish({
    destination: '/app/challenge.decline',
    body: JSON.stringify({ challengeId })
  });
};

// Otras funciones relacionadas con WebSocket...

const handleWebSocketError = (error) => {
  console.error('Error en WebSocket:', error);
  // Intentar reconectar después de un error
  setTimeout(() => {
    if (client) {
      console.log('Intentando reconectar...');
      client.activate();
    }
  }, 5000);
};

export const reconnect = () => {
  if (client) {
    client.deactivate();
    setTimeout(() => {
      client.activate();
    }, 1000);
  }
};

export const manualReconnect = () => {
  if (client) {
    client.deactivate();
    setTimeout(() => {
      client.activate();
    }, 1000);
  }
};
