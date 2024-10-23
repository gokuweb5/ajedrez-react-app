
import React from 'react';

function MoveHistory({ moves }) {
  return (
    <div className="move-history">
      <h3>Historial de movimientos</h3>
      <ul>
        {moves.map((move, index) => (
          <li key={index}>{move}</li>
        ))}
      </ul>
    </div>
  );
}

export default MoveHistory;