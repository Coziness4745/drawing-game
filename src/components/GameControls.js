import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/GameControls.css';

const GameControls = ({ isHost, gameState, playerCount, startGame }) => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    startGame();
  };

  const handleLeaveGame = () => {
    navigate('/');
  };

  return (
    <div className="game-controls">
      {isHost && gameState === 'waiting' && (
        <button 
          className={`start-game-btn ${playerCount < 2 ? 'disabled' : ''}`}
          onClick={handleStartGame}
          disabled={playerCount < 2}
        >
          {playerCount < 2 ? 'Need at least 2 players' : 'Start Game'}
        </button>
      )}
      
      <button className="leave-game-btn" onClick={handleLeaveGame}>
        Leave Game
      </button>
    </div>
  );
};

export default GameControls;