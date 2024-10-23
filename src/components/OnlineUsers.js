import React from 'react';

function OnlineUsers({ users, onChallengeUser }) {
  console.log('Usuarios recibidos en OnlineUsers:', users);
  return (
    <div className="online-users">
      <h3>Usuarios en línea ({users.length})</h3>
      {users.length === 0 ? (
        <p>No hay usuarios en línea</p>
      ) : (
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.username}
              <button onClick={() => onChallengeUser(user)}>Retar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OnlineUsers;
