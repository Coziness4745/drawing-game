import React from 'react';
import '../styles/PlayerList.css';

const PlayerList = ({ players, currentDrawer }) => {
  // Convert players object to array and sort by score
  const playersList = Object.values(players || {}).sort((a, b) => b.score - a.score);

  return (
    <div className="player-list">
      <div className="player-list-header">
        <h3>Players</h3>
      </div>
      
      <div className="players-container">
        {playersList.map((player) => (
          <div 
            key={player.id} 
            className={`player-item ${player.id === currentDrawer ? 'current-drawer' : ''}`}
          >
            <div className="player-info">
              <div className="player-name">
                {player.name}
                {player.isHost && <span className="host-badge">Host</span>}
                {player.id === currentDrawer && <span className="drawer-badge">Drawing</span>}
              </div>
              <div className="player-score">{player.score || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;