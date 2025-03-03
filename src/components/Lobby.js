import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase/config';
import { ref, update, onValue, off, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Lobby.css';

const Lobby = ({ roomId, isHost }) => {
  const [players, setPlayers] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(90);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!roomId) return;

    // Reference to the room in Firebase
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // Listen for room changes
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) {
        navigate('/');
        return;
      }
      
      // Update room settings
      setRoomName(roomData.name || '');
      setMaxPlayers(roomData.maxPlayers || 8);
      setRounds(roomData.rounds || 3);
      setDrawTime(roomData.drawTime || 90);
      
      // Update players list
      if (roomData.players) {
        const playersList = Object.values(roomData.players);
        setPlayers(playersList);
      } else {
        setPlayers([]);
      }
    });

    return () => off(roomRef);
  }, [roomId, navigate]);

  const handleStartGame = () => {
    if (!isHost || players.length < 2) return;
    
    // Update room status to start the game
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, { status: 'choosing' });
  };

  const handleLeaveRoom = () => {
    if (!currentUser || !roomId) return;
    
    // If the host leaves, delete the room
    if (isHost) {
      const roomRef = ref(database, `rooms/${roomId}`);
      remove(roomRef)
        .then(() => {
          navigate('/');
        })
        .catch(error => {
          console.error("Error removing room:", error);
        });
    } else {
      // Just remove the player from the room
      const playerRef = ref(database, `rooms/${roomId}/players/${currentUser.uid}`);
      remove(playerRef)
        .then(() => {
          navigate('/');
        })
        .catch(error => {
          console.error("Error removing player:", error);
        });
    }
  };

  const handleSettingsChange = (setting, value) => {
    if (!isHost) return;
    
    const updates = {};
    updates[setting] = value;
    
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, updates)
      .catch(error => {
        console.error("Error updating room settings:", error);
      });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
      .then(() => {
        alert("Room ID copied to clipboard!");
      })
      .catch(err => {
        console.error("Could not copy room ID:", err);
      });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h2>{roomName || 'Game Lobby'}</h2>
        <div className="room-id">
          <span>Room ID: {roomId}</span>
          <button className="copy-btn" onClick={copyRoomId}>Copy</button>
        </div>
      </div>
      
      <div className="lobby-content">
        <div className="players-section">
          <h3>Players ({players.length}/{maxPlayers})</h3>
          <div className="players-list">
            {players.map(player => (
              <div key={player.id} className="player-item">
                <span className="player-name">{player.name}</span>
                {player.isHost && <span className="host-badge">Host</span>}
              </div>
            ))}
          </div>
        </div>
        
        {isHost && (
          <div className="settings-section">
            <h3>Game Settings</h3>
            <div className="settings-form">
              <div className="setting-group">
                <label>Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => handleSettingsChange('name', e.target.value)}
                  placeholder="Room Name"
                />
              </div>
              
              <div className="setting-group">
                <label>Max Players</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => handleSettingsChange('maxPlayers', Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <div className="setting-group">
                <label>Rounds</label>
                <select
                  value={rounds}
                  onChange={(e) => handleSettingsChange('rounds', Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              <div className="setting-group">
                <label>Drawing Time (seconds)</label>
                <select
                  value={drawTime}
                  onChange={(e) => handleSettingsChange('drawTime', Number(e.target.value))}
                >
                  {[30, 60, 90, 120, 150, 180].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="lobby-footer">
        {isHost && (
          <button 
            className={`start-btn ${players.length < 2 ? 'disabled' : ''}`}
            onClick={handleStartGame}
            disabled={players.length < 2}
          >
            {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
          </button>
        )}
        
        <button className="leave-btn" onClick={handleLeaveRoom}>
          {isHost ? 'Close Room' : 'Leave Room'}
        </button>
      </div>
    </div>
  );
};

export default Lobby;