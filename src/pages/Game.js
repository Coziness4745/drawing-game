import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../firebase/config';
import { ref, onValue, off, update, get } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import Canvas from '../components/Canvas';
import ChatBox from '../components/ChatBox';
import ColorPicker from '../components/ColorPicker';
import PlayerList from '../components/PlayerList';
import Timer from '../components/Timer';
import GameControls from '../components/GameControls';
import Lobby from '../components/Lobby';
import { getRandomWord } from '../utils/wordGenerator';
import '../styles/Game.css';

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { setCurrentGame } = useGame();
  
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState({});
  const [gameState, setGameState] = useState('waiting'); // waiting, choosing, drawing, roundEnd, gameEnd
  const [currentDrawer, setCurrentDrawer] = useState(null);
  const [currentWord, setCurrentWord] = useState('');
  const [hints, setHints] = useState([]);
  const [timer, setTimer] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isHost, setIsHost] = useState(false);
  
  const timerRef = useRef(null);
  const roundsRef = useRef(0);
  const maxRoundsRef = useRef(3);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Reference to the room in Firebase
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // Listen for room changes
    onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) {
        navigate('/');
        return;
      }
      
      setRoom(roomData);
      setPlayers(roomData.players || {});
      setGameState(roomData.status || 'waiting');
      setCurrentDrawer(roomData.currentDrawer || null);
      setCurrentWord(roomData.currentWord || '');
      setHints(roomData.hints || []);
      setTimer(roomData.timer || 0);
      
      // Set isHost status
      setIsHost(roomData.host === currentUser.uid);
      
      // Update context with game info
      setCurrentGame({
        roomId,
        roomData
      });

      // Handle game state logic
      if (roomData.status === 'roundEnd') {
        clearInterval(timerRef.current);
      }
    });

    // Cleanup function
    return () => {
      clearInterval(timerRef.current);
      off(roomRef);
    };
  }, [roomId, currentUser, navigate, setCurrentGame]);

  // Start the game (host only)
  const startGame = () => {
    if (!isHost || gameState !== 'waiting' || Object.keys(players).length < 2) return;
    
    // Reset rounds counter
    roundsRef.current = 0;
    
    // Start first round
    startRound();
  };

  // Start a new round
  const startRound = () => {
    // Increment rounds counter
    roundsRef.current += 1;
    
    // Get next drawer
    const playerIds = Object.keys(players);
    const nextDrawerIndex = roundsRef.current % playerIds.length;
    const nextDrawer = playerIds[nextDrawerIndex];
    
    // Generate 3 random words for the drawer to choose from
    const wordOptions = [
      getRandomWord(),
      getRandomWord(),
      getRandomWord()
    ];
    
    // Update room state
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, {
      status: 'choosing',
      currentDrawer: nextDrawer,
      wordOptions: wordOptions,
      timer: 30, // 30 seconds to choose a word
      roundNumber: roundsRef.current,
      hints: []
    });
    
    // Start timer
    startTimer();
  };

  // Choose a word (drawer only)
  const chooseWord = (word) => {
    if (currentUser.uid !== currentDrawer) return;
    
    // Update room state
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, {
      status: 'drawing',
      currentWord: word,
      timer: 90, // 90 seconds to draw and guess
      hints: generateHints(word)
    });
    
    // Reset timer
    clearInterval(timerRef.current);
    startTimer();
  };

  // Generate hints from the word
  const generateHints = (word) => {
    // Replace all letters with underscores
    return word.split('').map(char => char === ' ' ? ' ' : '_');
  };

  // Start countdown timer
  const startTimer = () => {
    clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      const roomRef = ref(database, `rooms/${roomId}`);
      get(roomRef).then((snapshot) => {
        const roomData = snapshot.val();
        if (!roomData) return;
        
        let newTimer = roomData.timer - 1;
        
        if (newTimer <= 0) {
          clearInterval(timerRef.current);
          
          // Handle end of timer based on game state
          if (roomData.status === 'choosing') {
            // Auto-select first word if drawer didn't choose
            const word = roomData.wordOptions[0];
            update(roomRef, {
              status: 'drawing',
              currentWord: word,
              timer: 90,
              hints: generateHints(word)
            });
            startTimer();
          } else if (roomData.status === 'drawing') {
            // End the round
            endRound();
          }
        } else {
          // Update timer
          update(roomRef, { timer: newTimer });
          
          // Reveal a hint every 20 seconds
          if (roomData.status === 'drawing' && newTimer % 20 === 0) {
            revealHint(roomData.currentWord, roomData.hints);
          }
        }
      });
    }, 1000);
  };

  // Reveal a hint by uncovering a random letter
  const revealHint = (word, currentHints) => {
    if (!word || !currentHints) return;
    
    const wordArray = word.split('');
    const hintArray = [...currentHints];
    
    // Find indices of still hidden letters
    const hiddenIndices = wordArray.reduce((acc, char, idx) => {
      if (char !== ' ' && hintArray[idx] === '_') {
        acc.push(idx);
      }
      return acc;
    }, []);
    
    // If there are still hidden letters, reveal one randomly
    if (hiddenIndices.length > 0) {
      const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      hintArray[randomIndex] = wordArray[randomIndex];
      
      // Update hints in database
      const roomRef = ref(database, `rooms/${roomId}`);
      update(roomRef, { hints: hintArray });
    }
  };

  // End the current round
  const endRound = () => {
    // Update room state
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, {
      status: 'roundEnd',
      timer: 10 // 10 seconds before next round
    });
    
    // Check if game should end
    if (roundsRef.current >= maxRoundsRef.current * Object.keys(players).length) {
      // End game after 10 seconds
      setTimeout(() => {
        update(roomRef, { status: 'gameEnd' });
      }, 10000);
    } else {
      // Start next round after 10 seconds
      setTimeout(() => {
        startRound();
      }, 10000);
    }
  };

  // Render lobby if game state is 'waiting'
  if (gameState === 'waiting') {
    return <Lobby roomId={roomId} isHost={isHost} />;
  }

  // Render main game for other game states
  return (
    <div className="game-container">
      <div className="game-header">
        <h2>Room: {room?.name || 'Loading...'}</h2>
        <Timer seconds={timer} />
      </div>
      
      <div className="game-content">
        <div className="left-panel">
          <PlayerList 
            players={players} 
            currentDrawer={currentDrawer}
          />
          
          <ChatBox 
            roomId={roomId} 
            currentUser={currentUser}
            currentWord={currentWord}
            gameState={gameState}
          />
        </div>
        
        <div className="center-panel">
          <div className="canvas-container">
            {gameState === 'choosing' && currentDrawer === currentUser.uid && (
              <div className="word-selection">
                <h3>Choose a word to draw:</h3>
                <div className="word-options">
                  {room?.wordOptions?.map((word, index) => (
                    <button key={index} onClick={() => chooseWord(word)}>
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {gameState === 'drawing' && (
              <div className="word-display">
                {currentDrawer === currentUser.uid ? (
                  <h3>Draw: {currentWord}</h3>
                ) : (
                  <h3>Word: {hints.join(' ')}</h3>
                )}
              </div>
            )}
            
            <Canvas 
              roomId={roomId}
              isDrawer={currentDrawer === currentUser.uid}
              gameState={gameState}
              brushColor={selectedColor}
              brushSize={brushSize}
            />
            
            {gameState === 'drawing' && currentDrawer === currentUser.uid && (
              <div className="drawing-tools">
                <ColorPicker 
                  selectedColor={selectedColor} 
                  setSelectedColor={setSelectedColor} 
                />
                <div className="brush-size">
                  <label>Brush Size</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="20" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(Number(e.target.value))} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <GameControls 
        isHost={isHost}
        gameState={gameState}
        playerCount={Object.keys(players).length}
        startGame={startGame}
      />
    </div>
  );
};

export default Game;