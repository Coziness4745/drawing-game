import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase/config';
import { ref, push, set, onValue, update } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeRooms, setActiveRooms] = useState([]);
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch active rooms
    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const rooms = snapshot.val();
      if (rooms) {
        const roomsList = Object.entries(rooms)
          .filter(([_, room]) => room.status === 'waiting')
          .map(([id, room]) => ({
            id,
            name: room.name,
            players: Object.keys(room.players || {}).length,
            maxPlayers: room.maxPlayers
          }));
        setActiveRooms(roomsList);
      } else {
        setActiveRooms([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login(username);
    }
  };

  const createRoom = () => {
    if (!currentUser) return;

    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomData = {
      name: `${currentUser.displayName}'s Room`,
      host: currentUser.uid,
      status: 'waiting',
      maxPlayers: 8,
      createdAt: Date.now(),
      players: {
        [currentUser.uid]: {
          id: currentUser.uid,
          name: currentUser.displayName,
          score: 0,
          isHost: true
        }
      }
    };

    set(newRoomRef, roomData)
      .then(() => {
        navigate(`/game/${newRoomRef.key}`);
      })
      .catch((error) => {
        console.error("Error creating room:", error);
      });
  };

  const joinRoom = (id) => {
    if (!currentUser) return;

    const roomPlayersRef = ref(database, `rooms/${id}/players/${currentUser.uid}`);
    const playerData = {
      id: currentUser.uid,
      name: currentUser.displayName,
      score: 0,
      isHost: false
    };

    set(roomPlayersRef, playerData)
      .then(() => {
        navigate(`/game/${id}`);
      })
      .catch((error) => {
        console.error("Error joining room:", error);
      });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomId.trim() && currentUser) {
      joinRoom(roomId);
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Scribble Clone</h1>
        
        {!currentUser ? (
          <div className="username-form">
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <button type="submit">Start Playing</button>
            </form>
          </div>
        ) : (
          <div className="room-options">
            <h2>Welcome, {currentUser.displayName}!</h2>
            
            <div className="create-room">
              <button onClick={createRoom}>Create New Room</button>
            </div>
            
            <div className="join-room">
              <form onSubmit={handleJoinRoom}>
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <button type="submit">Join Room</button>
              </form>
            </div>
            
            <div className="active-rooms">
              <h3>Active Rooms</h3>
              {activeRooms.length > 0 ? (
                <ul className="rooms-list">
                  {activeRooms.map((room) => (
                    <li key={room.id} className="room-item">
                      <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        <span className="player-count">
                          {room.players}/{room.maxPlayers} players
                        </span>
                      </div>
                      <button onClick={() => joinRoom(room.id)}>Join</button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active rooms available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;