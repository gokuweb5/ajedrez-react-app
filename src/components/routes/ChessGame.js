import { Chess } from 'chess.js';
import React, { useEffect, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import {
    getOnlineUsers,
    makeMove,
    sendChallenge
} from '../../api';
import { useAuth } from '../../context/AuthContext';
import { disconnect, getConnectionStatus, initializeWebSocket } from '../../utils/websocket';
import OnlineUsers from '../OnlineUsers';

// Constantes
const API_BASE_URL = 'http://localhost:8081/api';

function ChessGame() {
    // Estados básicos del juego
    const [game, setGame] = useState(new Chess());
    const [gameId, setGameId] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState('w');
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    
    // Estados de usuarios y desafíos
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [pendingChallenge, setPendingChallenge] = useState(null);
    const [challenges, setChallenges] = useState([]);
    
    // Estados de UI
    const [isSearching, setIsSearching] = useState(false);
    const [gameStatus, setGameStatus] = useState('');
    const [timeControl, setTimeControl] = useState({ white: 600, black: 600 });
    
    // Auth y navegación
    const { user } = useAuth();
    const navigate = useNavigate();

    // Estado de carga
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // ... otros estados ...
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isConnected, setIsConnected] = useState(false);

    // Definir los manejadores fuera del useEffect
    const handleChallengeReceived = React.useCallback((challenge) => {
        console.log('Desafío recibido:', challenge);
        setPendingChallenge(challenge);
    }, []);

    const handleChallengeUpdated = React.useCallback((update) => {
        console.log('Desafío actualizado:', update);
        setChallenges(prevChallenges => 
            prevChallenges.map(challenge => 
                challenge.id === update.id ? { ...challenge, ...update } : challenge
            )
        );
    }, []);

    const handleOnlineUsersUpdated = React.useCallback((users) => {
        console.log('Usuarios en línea actualizados:', users);
        setOnlineUsers(users);
    }, []);

    // Definir handlePlayClick
    const handlePlayClick = async () => {
        if (!user) return;
        
        try {
            setIsSearching(true);
            // Aquí iría la lógica para buscar partida
            // Por ejemplo, conectar con el servidor para buscar oponente
            console.log('Buscando partida...');
        } catch (error) {
            console.error('Error al buscar partida:', error);
            setError('Error al buscar partida: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    };

    // Efecto para WebSocket
    useEffect(() => {
        if (!user) return;

        const wsConnection = initializeWebSocket({
            onChallengeReceived: handleChallengeReceived,
            onChallengeUpdated: handleChallengeUpdated,
            onOnlineUsersUpdated: handleOnlineUsersUpdated
        });

        // Verificar conexión periódicamente
        const checkConnection = () => {
            const status = getConnectionStatus();
            setIsConnected(status);
        };

        const intervalId = setInterval(checkConnection, 5000);
        checkConnection(); // Verificar estado inicial

        return () => {
            clearInterval(intervalId);
            disconnect();
        };
    }, [user, handleChallengeReceived, handleChallengeUpdated, handleOnlineUsersUpdated]);

    // Puedes usar connectionStatus para mostrar el estado de la conexión en la UI
    const renderConnectionStatus = () => {
        switch (connectionStatus) {
            case 'connected':
                return <span className="text-green-500">Conectado</span>;
            case 'disconnected':
                return <span className="text-red-500">Desconectado</span>;
            case 'error':
                return <span className="text-yellow-500">Error de conexión</span>;
            default:
                return null;
        }
    };

    async function makeAMove(move) {
        const gameCopy = new Chess(game.fen());
        const result = gameCopy.move(move);
        
        if (result) {
            try {
                const updatedGame = await makeMove(gameId, move, gameCopy.fen());
                updateGameState(updatedGame);
            } catch (error) {
                console.error('Error making move:', error);
                setGame(game); // Revertir al estado anterior
            }
        }
        return result;
    }

    function updateGameState(updatedGame) {
        const newGame = new Chess(updatedGame.fen);
        setGame(newGame);
        setIsPlayerTurn(updatedGame.turn !== playerColor);
        checkGameStatus(newGame);
    }

    function checkGameStatus(game) {
        if (game.isCheckmate()) {
            const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
            setGameStatus(`Jaque mate. ${winner} ganan.`);
            // Deshabilitar interacciones
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
            // Deshabilitar interacciones
            return true;
        }
        return false; // El juego continúa
    }

    const handleResign = async () => {
        if (!gameStarted) return;
        
        try {
            setGameStatus(`${isPlayerTurn ? 'Blancas' : 'Negras'} se rinden. ${isPlayerTurn ? 'Negras' : 'Blancas'} ganan.`);
            await notifyResignation(gameId, playerColor);
            setGameStarted(false);
        } catch (error) {
            console.error('Error al notificar rendición:', error);
        }
    };

    const notifyResignation = async (gameId, playerColor) => {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(`http://localhost:8081/api/games/${gameId}/resign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ playerColor }),
        });

        if (!response.ok) {
            throw new Error('Error al notificar la rendición');
        }
    };

    function onDrop(sourceSquare, targetSquare) {
        if (!isPlayerTurn || !gameStarted) {
            return false;
        }
        
        const move = {
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q'
        };

        // Intenta hacer el movimiento
        const result = makeAMove(move);
        return result !== null;
    }

    useEffect(() => {
        if (!user) return;

        const onOnlineUsersUpdated = (users) => {
            setOnlineUsers(users);
        };

        const wsConnection = initializeWebSocket(
            handleChallengeReceived, 
            handleChallengeUpdated, 
            onOnlineUsersUpdated
        );

        return () => {
            if (wsConnection) {
                disconnect();
            }
        };
    }, [user]);

    const handleChallengeUser = async (challengedUser) => {
        if (!user || !challengedUser) return;

        try {
            setIsSearching(true);
            const challenge = await sendChallenge(challengedUser.id);
            console.log('Desafío enviado:', challenge);
            // Mostrar notificación de desafío enviado
        } catch (error) {
            console.error('Error al enviar el desafío:', error);
            alert('Error al enviar el desafío: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    };

    // Efecto para la carga inicial
    useEffect(() => {
        const initializeGame = async () => {
            try {
                setIsLoading(true);
                const users = await getOnlineUsers();
                setOnlineUsers(users);
                setIsLoading(false);
            } catch (error) {
                console.error('Error initializing game:', error);
                setError('Error al cargar el juego');
                setIsLoading(false);
            }
        };

        initializeGame();
    }, []);

    // Modificar el return para manejar estados de carga y error
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <p>Cargando...</p>
        </div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen">
            <p className="text-red-500">{error}</p>
        </div>;
    }

    // Función para obtener usuarios en línea
    const fetchOnlineUsers = async () => {
        try {
            const response = await fetch('http://localhost:8081/api/users/online', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });
            const data = await response.json();
            // Filtrar el usuario actual de la lista
            const otherUsers = data.filter(u => u.id !== user.id);
            setOnlineUsers(otherUsers);
        } catch (error) {
            console.error('Error fetching online users:', error);
        }
    };

    // Configurar WebSocket para actualizaciones
    const wsConnection = initializeWebSocket({
        onChallengeReceived: handleChallengeReceived,
        onChallengeUpdated: handleChallengeUpdated,
        onOnlineUsersUpdated: (users) => {
            const otherUsers = users.filter(u => u.id !== user.id);
            setOnlineUsers(otherUsers);
        }
    });

    // Actualizar cada 30 segundos
    const intervalId = setInterval(fetchOnlineUsers, 30000);

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">Ajedrez en React</h1>
            {user ? (
                <>
                    <div className="mb-4">
                        <p>Estado de conexión: {isConnected ? 
                            <span className="text-green-500">Conectado</span> : 
                            <span className="text-red-500">Desconectado</span>
                        }</p>
                    </div>
                    <p className="mb-4">Bienvenido, {user.username}!</p>
                    
                    {!gameStarted && (
                        <div>
                            <button 
                                onClick={handlePlayClick}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
                                disabled={!isConnected}
                            >
                                Buscar Partida
                            </button>
                            {isSearching && <p className="text-blue-600">Buscando oponente...</p>}
                        </div>
                    )}

                    <div className="flex">
                        <div>
                            <Chessboard 
                                position={game.fen()} 
                                onPieceDrop={onDrop}
                                boardOrientation={playerColor === 'w' ? 'white' : 'black'}
                                draggablePieces={gameStarted && isPlayerTurn}
                            />
                        </div>
                        <div className="ml-4">
                            <OnlineUsers users={onlineUsers} onChallengeUser={handleChallengeUser} />
                        </div>
                    </div>
                </>
            ) : (
                <p>Por favor, inicia sesión para jugar.</p>
            )}
        </div>
    );
}

export default ChessGame;
