import React, { useEffect, useState } from 'react';

const TIME_OPTIONS = {
  'Bullet': {
    '1 minuto': 60,
    '2 minutos': 120
  },
  'Blitz': {
    '3 minutos': 180,
    '5 minutos': 300
  },
  'Rapid': {
    '10 minutos': 600,
    '15 minutos': 900,
    '30 minutos': 1800
  }
};

function ChessClock({ isPlayerTurn, gameStarted, onGameOver }) {
  const [timeCategory, setTimeCategory] = useState('Rapid');
  const [timeOption, setTimeOption] = useState('10 minutos');
  const [whiteTime, setWhiteTime] = useState(TIME_OPTIONS[timeCategory][timeOption]);
  const [blackTime, setBlackTime] = useState(TIME_OPTIONS[timeCategory][timeOption]);

  useEffect(() => {
    let timer;
    if (gameStarted) {
      timer = setInterval(() => {
        if (isPlayerTurn) {
          setWhiteTime(prevTime => {
            if (prevTime <= 0) {
              clearInterval(timer);
              onGameOver('black');
              return 0;
            }
            return prevTime - 1;
          });
        } else {
          setBlackTime(prevTime => {
            if (prevTime <= 0) {
              clearInterval(timer);
              onGameOver('white');
              return 0;
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, isPlayerTurn, onGameOver]);

  const handleTimeCategoryChange = (e) => {
    const newCategory = e.target.value;
    setTimeCategory(newCategory);
    const newOption = Object.keys(TIME_OPTIONS[newCategory])[0];
    setTimeOption(newOption);
    const newTime = TIME_OPTIONS[newCategory][newOption];
    setWhiteTime(newTime);
    setBlackTime(newTime);
  };

  const handleTimeOptionChange = (e) => {
    const newOption = e.target.value;
    setTimeOption(newOption);
    const newTime = TIME_OPTIONS[timeCategory][newOption];
    setWhiteTime(newTime);
    setBlackTime(newTime);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chess-clock">
      {!gameStarted && (
        <div>
          <select value={timeCategory} onChange={handleTimeCategoryChange}>
            {Object.keys(TIME_OPTIONS).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select value={timeOption} onChange={handleTimeOptionChange}>
            {Object.keys(TIME_OPTIONS[timeCategory]).map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      )}
      <div className="clocks">
        <div className={`clock ${!isPlayerTurn && gameStarted ? 'active' : ''}`}>
          Negro: {formatTime(blackTime)}
        </div>
        <div className={`clock ${isPlayerTurn && gameStarted ? 'active' : ''}`}>
          Blanco: {formatTime(whiteTime)}
        </div>
      </div>
    </div>
  );
}

export default ChessClock;