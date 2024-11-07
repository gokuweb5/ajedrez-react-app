import React, { useEffect, useRef, useState } from 'react';
import { sendChatMessage, subscribeToChatMessages } from '../../utils/websocket';

function Chat({ gameId, username }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(gameId, (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
    });

    return () => {
      unsubscribe();
    };
  }, [gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      try {
        await sendChatMessage(gameId, newMessage);
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
        alert('No se pudo enviar el mensaje. Por favor, intenta de nuevo.');
      }
    }
  };

  return (
    <div className="chat p-4 border rounded shadow-md bg-white">
      <h3 className="text-xl font-semibold mb-4">Chat</h3>
      <div className="messages h-64 overflow-y-auto mb-4 p-2 border rounded bg-gray-100">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong className="text-blue-600">{msg.sender}:</strong>
            <span className="ml-2">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-grow p-2 border rounded mr-2"
        />
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Enviar
        </button>
      </form>
    </div>
  );
}

export default Chat;
