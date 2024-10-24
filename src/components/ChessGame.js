// todas las importaciones
import { Chess } from 'chess.js';
import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import { acceptChallenge, declineChallenge, getOnlineUsers, makeMove, sendChallenge } from '../api';
import { useAuth } from '../context/AuthContext';
import { disconnect, initializeWebSocket, subscribeToGameUpdates } from '../utils/websocket';
import Chat from './Chat';
import ChessClock from './ChessClock';
import OnlineUsers from './OnlineUsers';
// fin de las importaciones

// inicio de la función ChessGame
function ChessGame() {
  // estado del juego
  const [game, setGame] = useState(new Chess());
  const [gameId, setGameId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [playerColor, setPlayerColor] = useState('w'); // 'w' for white, 'b' for black
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Assuming white starts
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [gameStarted, setGameStarted] = useState(false);
  const [timeControl, setTimeControl] = useState({ white: 600, black: 600 });
  const [gameStatus, setGameStatus] = useState('');
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [challenges, setChallenges] = useState([]);

  // efecto para obtener los usuarios en línea
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const users = await getOnlineUsers();
        console.log('Usuarios en línea obtenidos:', users);
        setOnlineUsers(users);
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // efecto para suscribirse a las actualizaciones del juego
  useEffect(() => {
    if (gameId) {
      const unsubscribe = subscribeToGameUpdates(gameId, (update) => {
        const newGame = new Chess(update.fen);
        setGame(newGame);
        setIsPlayerTurn(newGame.turn() === playerColor);
      });
      return () => unsubscribe();
    }
  }, [gameId, playerColor]);

  // efecto para suscribirse a los usuarios en línea, inicializa el websocket y maneja desafíos 
  // y actualizaciones de usuarios en línea
  useEffect(() => {
    const onOnlineUsersUpdated = (users) => {
      setOnlineUsers(users);
    };

    initializeWebSocket(handleChallengeReceived, handleChallengeUpdated, onOnlineUsersUpdated);

    return () => {
      disconnect();
    };
  }, [user]);

  // función para manejar los desafíos recibidos
  const handleChallengeReceived = (challenge) => {
    setPendingChallenge(challenge);
    // Aquí puedes mostrar una notificación o un modal para el nuevo desafío recibido
  };

  const handleChallengeUpdated = (challengeUpdate) => {
    setChallenges(prevChallenges => 
      prevChallenges.map(challenge => 
        challenge.id === challengeUpdate.id ? { ...challenge, ...challengeUpdate } : challenge
      )
    );
    // Aquí puedes mostrar una notificación sobre la actualización del desafío
  };

  // función para manejar los movimientos del tablero (maneja una pieza y su destino)
  function onDrop(sourceSquare, targetSquare) {
    if (!isPlayerTurn) {
      return false; // No es el turno del jugador
    }
    
    // Realiza un movimiento y lo envía al servidor
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to a queen for example simplicity
    });

    // illegal move
    if (move === null) return false;
    
    setIsPlayerTurn(false); // Cambiar el turno después de un movimiento exitoso
    return true;
  }

  function checkGameStatus(game) {
    if (game.isCheckmate()) {
      setGameStatus(`Jaque mate. ${game.turn() === 'w' ? 'Negras' : 'Blancas'} ganan.`);
      return true;
    }
    if (game.isDraw()) {
      let reason = 'Tablas';
      if (game.isStalemate()) {
        reason = 'Tablas por ahogado';
      } else if (game.isThreefoldRepetition()) {
        reason = 'Tablas por repetición';
      } else if (game.isInsufficientMaterial()) {
        reason = 'Tablas por material insuficiente';
      }
      setGameStatus(reason);
      return true;
    }
    if (game.isGameOver()) {
      setGameStatus('Fin del juego');
      return true;
    }
    return false;
  }

  async function makeAMove(move) {
    const gameCopy = new Chess(game.fen());
    const result = gameCopy.move(move);
    if (result) {
      try {
        // Envía el movimiento al servidor a través de API REST
        const updatedGame = await makeMove(gameId, move, gameCopy.fen());
        
        // Actualiza el estado local con la respuesta del servidor
        setGame(new Chess(updatedGame.fen));
        setIsPlayerTurn(updatedGame.turn === playerColor);
        checkGameStatus(new Chess(updatedGame.fen));
      } catch (error) {
        console.error('Error making move:', error);
        // Revertir el movimiento local si hay un error
        setGame(game);
      }
    }
    return result;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Envía un desafío a otro usuario
  const handleChallengeUser = async (challengedUser) => {
    try {
      const challenge = await sendChallenge(challengedUser.id);
      console.log('Desafío enviado:', challenge);
      // Aquí podrías actualizar el estado para mostrar que se ha enviado un desafío
    } catch (error) {
      console.error('Error al enviar el desafío:', error);
    }
  };
// acepta un desafío pendiente
  const handleAcceptChallenge = async () => {
    if (pendingChallenge) {
      try {
        const acceptedChallenge = await acceptChallenge(pendingChallenge.id);
        console.log('Desafío aceptado:', acceptedChallenge);
        // Iniciar el juego con la información del desafío aceptado
        startGame(acceptedChallenge.game);
      } catch (error) {
        console.error('Error al aceptar el desafío:', error);
      }
    }
  };
// rechaza un desafío pendiente
  const handleDeclineChallenge = async () => {
    if (pendingChallenge) {
      try {
        await declineChallenge(pendingChallenge.id);
        setPendingChallenge(null);
      } catch (error) {
        console.error('Error al rechazar el desafío:', error);
      }
    }
  };

  const handleTimeChange = (newTimes) => {
    setTimeControl(newTimes);
  };

  const handleGameOver = (winner) => {
    // Lógica para manejar el final del juego por tiempo
    console.log(`Game over. ${winner} wins by time.`);
    setGameStarted(false);
    // Aquí podrías actualizar el estado del juego, mostrar un mensaje, etc.
  };

  const handleResign = () => {
    setGameStatus(`${isPlayerTurn ? 'Blancas' : 'Negras'} se rinden. ${isPlayerTurn ? 'Negras' : 'Blancas'} ganan.`);
    // Aquí podrías enviar una notificación al servidor sobre la rendición
  };

  const startGame = () => {
    setGameStarted(true);
    // Otras lógicas de inicio de juego...
  };

  return (
    <div className="chess-game">
      <h1>Ajedrez en React</h1>
      <p>Bienvenido, {user?.username}!</p>
      <ChessClock 
        onTimeChange={handleTimeChange}
        isPlayerTurn={isPlayerTurn}
        gameStarted={gameStarted}
        onGameOver={handleGameOver}
      />
      <p>{isPlayerTurn ? "Es tu turno" : "Esperando el movimiento del oponente"}</p>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '400px' }}>
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={onDrop}
            boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          />
        </div>
        <div style={{ marginLeft: '20px' }}>
          <OnlineUsers users={onlineUsers} onChallengeUser={handleChallengeUser} />
          {gameId && <Chat gameId={gameId} username={user?.username} />}
          {pendingChallenge && (
            <div>
              <p>Has recibido un nuevo desafío de {pendingChallenge.challenger.username}</p>
              <button onClick={() => handleAcceptChallenge(pendingChallenge.id)}>Aceptar</button>
              <button onClick={() => handleDeclineChallenge(pendingChallenge.id)}>Rechazar</button>
            </div>
          )}
          {challenges.map(challenge => (
            <div key={challenge.id}>
              <p>Desafío de {challenge.challenger.username}: {challenge.status}</p>
            </div>
          ))}
        </div>
      </div>
      {!gameStarted && <button onClick={startGame}>Iniciar Juego</button>}
      <button onClick={handleLogout}>Cerrar sesión</button>
      {gameStatus && <p>{gameStatus}</p>}
      {!gameStatus && <button onClick={handleResign}>Rendirse</button>}
    </div>
  );
}

export default ChessGame;
