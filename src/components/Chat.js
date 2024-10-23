import React, { useEffect, useState } from 'react';
import { sendChatMessage, subscribeToChatMessages } from '../utils/websocket';

function Chat({ gameId, username }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Aquí implementaremos la lógica para recibir mensajes en tiempo real
    // usando WebSockets
    subscribeToChatMessages(gameId, (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });
  }, [gameId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      try {
        await sendChatMessage(gameId, newMessage);
        setMessages([...messages, { sender: username, content: newMessage }]);
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <div className="chat">
      <h3>Chat</h3>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default Chat;