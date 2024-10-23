import { Client } from '@stomp/stompjs';

let client;
let chatSubscription;
let gameSubscription;
let challengeSubscription;
let challengeUpdateSubscription;

export const initializeWebSocket = (onChallengeReceived, onChallengeUpdated, onOnlineUsersUpdated) => {
  client = new Client({
    brokerURL: 'ws://localhost:8081/ws',
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('Conectado al WebSocket');
      subscribeToChallenges(onChallengeReceived, onChallengeUpdated);
      subscribeToOnlineUsers(onOnlineUsersUpdated);
    },
    onStompError: (frame) => {
      console.error('Error de Stomp:', frame.headers['message']);
    },
    onWebSocketError: (event) => {
      console.error('Error de WebSocket:', event);
    },
  });

  client.activate();
};

export const sendChatMessage = (gameId, message) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  client.publish({
    destination: '/app/chat.sendMessage',
    body: JSON.stringify({ gameId, content: message })
  });
};

export const subscribeToChatMessages = (gameId, callback) => {
  if (!client || !client.connected) {
    console.error('WebSocket no está conectado');
    return;
  }

  if (chatSubscription) {
    chatSubscription.unsubscribe();
  }

  chatSubscription = client.subscribe(`/topic/chat.${gameId}`, (message) => {
    const chatMessage = JSON.parse(message.body);
    callback(chatMessage);
  });
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

export const disconnect = () => {
  if (client) {
    if (chatSubscription) chatSubscription.unsubscribe();
    if (gameSubscription) gameSubscription.unsubscribe();
    if (challengeSubscription) challengeSubscription.unsubscribe();
    if (challengeUpdateSubscription) challengeUpdateSubscription.unsubscribe();
    // Desuscribir de otras suscripciones si las hay
    client.deactivate();
  }
};

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
