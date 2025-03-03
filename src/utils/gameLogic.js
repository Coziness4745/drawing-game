import { database } from '../firebase/config';
import { ref, update, get, push, set } from 'firebase/database';
import { getRandomWord } from './wordGenerator';

// Start a new game
export const startGame = async (roomId, playerIds) => {
  try {
    // Get a random player to draw first
    const firstDrawerIndex = Math.floor(Math.random() * playerIds.length);
    const firstDrawer = playerIds[firstDrawerIndex];
    
    // Reset all player statuses
    const playerUpdates = {};
    playerIds.forEach(playerId => {
      playerUpdates[`rooms/${roomId}/players/${playerId}/score`] = 0;
      playerUpdates[`rooms/${roomId}/players/${playerId}/hasGuessed`] = false;
    });
    
    // Generate word options for the first drawer
    const wordOptions = [
      getRandomWord(),
      getRandomWord(),
      getRandomWord()
    ];
    
    // Update room state
    const gameUpdates = {
      ...playerUpdates,
      [`rooms/${roomId}/status`]: 'choosing',
      [`rooms/${roomId}/currentDrawer`]: firstDrawer,
      [`rooms/${roomId}/wordOptions`]: wordOptions,
      [`rooms/${roomId}/roundNumber`]: 1,
      [`rooms/${roomId}/currentWord`]: '',
      [`rooms/${roomId}/hints`]: [],
      [`rooms/${roomId}/timer`]: 30,
      [`rooms/${roomId}/guessedPlayers`]: {}
    };
    
    await update(ref(database), gameUpdates);
    return true;
  } catch (error) {
    console.error("Error starting game:", error);
    return false;
  }
};

// Select a word (drawer only)
export const selectWord = async (roomId, word) => {
  try {
    // Generate hints (all underscores initially)
    const hints = generateHints(word);
    
    // Update room state
    const updates = {
      [`rooms/${roomId}/status`]: 'drawing',
      [`rooms/${roomId}/currentWord`]: word,
      [`rooms/${roomId}/hints`]: hints,
      [`rooms/${roomId}/timer`]: 90,
      [`rooms/${roomId}/guessedPlayers`]: {}
    };
    
    await update(ref(database), updates);
    return true;
  } catch (error) {
    console.error("Error selecting word:", error);
    return false;
  }
};

// Generate hints array from a word
export const generateHints = (word) => {
  return word.split('').map(char => (char === ' ' ? ' ' : '_'));
};

// Reveal a hint letter
export const revealHint = async (roomId) => {
  try {
    // Get current word and hints
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    const word = roomData.currentWord;
    const hints = roomData.hints || [];
    
    if (!word || !hints.length) return false;
    
    // Find indices of still hidden letters
    const hiddenIndices = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== ' ' && hints[i] === '_') {
        hiddenIndices.push(i);
      }
    }
    
    // If there are still hidden letters, reveal one randomly
    if (hiddenIndices.length > 0) {
      const randomIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
      const newHints = [...hints];
      newHints[randomIndex] = word[randomIndex];
      
      await update(roomRef, { hints: newHints });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error revealing hint:", error);
    return false;
  }
};

// Handle a guess
export const handleGuess = async (roomId, playerId, playerName, guess) => {
  try {
    // Get room data
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    const currentWord = roomData.currentWord.toLowerCase();
    const currentDrawer = roomData.currentDrawer;
    const guessedPlayers = roomData.guessedPlayers || {};
    
    // Check if player already guessed correctly
    if (guessedPlayers[playerId]) return false;
    
    // Check if it's a correct guess
    if (guess.toLowerCase() === currentWord) {
      // Calculate points based on time left
      const pointsForGuess = calculatePointsForGuess(roomData.timer);
      const pointsForDrawer = calculatePointsForDrawer();
      
      // Update player's score
      await update(ref(database, `rooms/${roomId}/players/${playerId}`), {
        score: (roomData.players[playerId].score || 0) + pointsForGuess,
        hasGuessed: true
      });
      
      // Update drawer's score
      await update(ref(database, `rooms/${roomId}/players/${currentDrawer}`), {
        score: (roomData.players[currentDrawer].score || 0) + pointsForDrawer
      });
      
      // Mark this player as having guessed
      await update(ref(database, `rooms/${roomId}/guessedPlayers`), {
        [playerId]: true
      });
      
      // Add system message
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: `${playerName} guessed the word correctly!`,
        userId: 'system',
        username: 'System',
        timestamp: Date.now(),
        type: 'system'
      });
      
      // Check if everyone has guessed
      const nonDrawingPlayers = Object.values(roomData.players).filter(player => 
        player.id !== currentDrawer
      );
      
      const allGuessed = nonDrawingPlayers.every(player => 
        guessedPlayers[player.id] || (player.id === playerId)
      );
      
      // If all players have guessed, end the round early
      if (allGuessed) {
        await update(roomRef, { timer: 1 });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error handling guess:", error);
    return false;
  }
};

// End the current round
export const endRound = async (roomId) => {
  try {
    // Get room data
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    
    // Add system message with the word
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      text: `The word was: ${roomData.currentWord}`,
      userId: 'system',
      username: 'System',
      timestamp: Date.now(),
      type: 'system'
    });
    
    // Update room state
    await update(roomRef, {
      status: 'roundEnd',
      timer: 10
    });
    
    return true;
  } catch (error) {
    console.error("Error ending round:", error);
    return false;
  }
};

// Start the next round
export const startNextRound = async (roomId) => {
  try {
    // Get room data
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    const playerIds = Object.keys(roomData.players || {});
    
    if (playerIds.length < 2) return false;
    
    // Calculate next round number
    const currentRound = roomData.roundNumber || 1;
    const nextRound = currentRound + 1;
    const totalRounds = roomData.rounds || 3;
    const totalRoundCount = totalRounds * playerIds.length;
    
    // Check if game should end
    if (nextRound > totalRoundCount) {
      await endGame(roomId);
      return true;
    }
    
    // Get next drawer
    const nextDrawerIndex = currentRound % playerIds.length;
    const nextDrawer = playerIds[nextDrawerIndex];
    
    // Generate word options
    const wordOptions = [
      getRandomWord(),
      getRandomWord(),
      getRandomWord()
    ];
    
    // Reset player guessed status
    const playerUpdates = {};
    playerIds.forEach(playerId => {
      playerUpdates[`rooms/${roomId}/players/${playerId}/hasGuessed`] = false;
    });
    
    // Update room state
    const updates = {
      ...playerUpdates,
      [`rooms/${roomId}/status`]: 'choosing',
      [`rooms/${roomId}/currentDrawer`]: nextDrawer,
      [`rooms/${roomId}/wordOptions`]: wordOptions,
      [`rooms/${roomId}/roundNumber`]: nextRound,
      [`rooms/${roomId}/currentWord`]: '',
      [`rooms/${roomId}/hints`]: [],
      [`rooms/${roomId}/timer`]: 30,
      [`rooms/${roomId}/guessedPlayers`]: {}
    };
    
    await update(ref(database), updates);
    
    // Clear the canvas
    await update(ref(database, `rooms/${roomId}/drawing`), {
      action: 'clear',
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error starting next round:", error);
    return false;
  }
};

// End the game
export const endGame = async (roomId) => {
  try {
    // Get room data
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    
    // Find the winner(s)
    const players = Object.values(roomData.players || {});
    const maxScore = Math.max(...players.map(player => player.score || 0));
    const winners = players.filter(player => (player.score || 0) === maxScore);
    
    // Add system message with the winner(s)
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    
    if (winners.length === 1) {
      await push(messagesRef, {
        text: `Game Over! ${winners[0].name} wins with ${maxScore} points!`,
        userId: 'system',
        username: 'System',
        timestamp: Date.now(),
        type: 'system'
      });
    } else {
      const winnerNames = winners.map(w => w.name).join(', ');
      await push(messagesRef, {
        text: `Game Over! It's a tie between ${winnerNames} with ${maxScore} points!`,
        userId: 'system',
        username: 'System',
        timestamp: Date.now(),
        type: 'system'
      });
    }
    
    // Update room state
    await update(roomRef, {
      status: 'gameEnd',
      winners: winners.map(w => ({ id: w.id, name: w.name, score: w.score }))
    });
    
    return true;
  } catch (error) {
    console.error("Error ending game:", error);
    return false;
  }
};

// Reset game back to waiting room
export const resetGame = async (roomId) => {
  try {
    // Get room data for player information
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    
    if (!snapshot.exists()) return false;
    
    const roomData = snapshot.val();
    
    // Keep players but reset their scores
    const playerUpdates = {};
    Object.keys(roomData.players || {}).forEach(playerId => {
      playerUpdates[`rooms/${roomId}/players/${playerId}/score`] = 0;
      playerUpdates[`rooms/${roomId}/players/${playerId}/hasGuessed`] = false;
    });
    
    // Update room state
    const updates = {
      ...playerUpdates,
      [`rooms/${roomId}/status`]: 'waiting',
      [`rooms/${roomId}/currentDrawer`]: null,
      [`rooms/${roomId}/currentWord`]: '',
      [`rooms/${roomId}/hints`]: [],
      [`rooms/${roomId}/timer`]: 0,
      [`rooms/${roomId}/roundNumber`]: 0,
      [`rooms/${roomId}/winners`]: null,
      [`rooms/${roomId}/guessedPlayers`]: null
    };
    
    await update(ref(database), updates);
    
    // Clear the canvas
    await update(ref(database, `rooms/${roomId}/drawing`), {
      action: 'clear',
      timestamp: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error resetting game:", error);
    return false;
  }
};

// Calculate points for correct guess based on timer
export const calculatePointsForGuess = (timeLeft) => {
  // More points for faster guesses
  // Minimum 50 points, maximum 100 points
  return Math.max(50, Math.min(100, timeLeft * 2));
};

// Calculate points for drawer when someone guesses correctly
export const calculatePointsForDrawer = () => {
  // Fixed points for the drawer (25 points per correct guess)
  return 25;
};

// Check if a message might be a correct guess
export const checkIfGuess = (message, currentWord) => {
  if (!message || !currentWord) return false;
  
  const normalizedMessage = message.toLowerCase().trim();
  const normalizedWord = currentWord.toLowerCase().trim();
  
  return normalizedMessage === normalizedWord;
};