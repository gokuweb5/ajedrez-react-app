import React from 'react';

function OnlineUsers({ users, onChallengeUser }) {
  if (!users || users.length === 0) {
    return <div className="p-4">
      <p>No hay usuarios en línea</p>
    </div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Usuarios en línea</h2>
      <ul>
        {users.map(user => (
          <li key={user.id} className="flex justify-between items-center mb-2">
            <span>{user.username}</span>
            <button
              onClick={() => onChallengeUser(user)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
            >
              Desafiar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OnlineUsers;
