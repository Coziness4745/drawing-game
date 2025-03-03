import React, { useState, useEffect, useRef } from 'react';
import { database } from '../firebase/config';
import { ref, push, get, onValue, off, update } from 'firebase/database';
import '../styles/ChatBox.css';

const ChatBox = ({ roomId, currentUser, currentWord, gameState }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // Reference to the messages in Firebase
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    
    // Listen for new messages
    onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const messagesList = Object.entries(messagesData).map(([id, msg]) => ({
          id,
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        
        // Sort by timestamp
        messagesList.sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(messagesRef);
    };
  }, [roomId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // Check if the user guessed the word
    const isCorrectGuess = 
      gameState === 'drawing' && 
      currentUser.uid !== currentDrawer &&
      message.toLowerCase().includes(currentWord.toLowerCase());
    
    if (isCorrectGuess) {
      // Handle correct guess
      handleCorrectGuess();
      // Clear the input
      setMessage('');
      return;
    }
    
    // Add message to Firebase
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const newMessage = {
      text: message,
      userId: currentUser.uid,
      username: currentUser.displayName,
      timestamp: Date.now(),
      type: 'regular'
    };
    
    push(messagesRef, newMessage)
      .then(() => {
        // Clear input after sending
        setMessage('');
      })
      .catch(error => {
        console.error("Error sending message:", error);
      });
  };

  const handleCorrectGuess = () => {
    // Get room and player data
    const roomRef = ref(database, `rooms/${roomId}`);
    get(roomRef).then((snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;
      
      // Add system message about correct guess
      const messagesRef = ref(database, `rooms/${roomId}/messages`);
      const systemMessage = {
        text: `${currentUser.displayName} guessed the word correctly!`,
        userId: 'system',
        username: 'System',
        timestamp: Date.now(),
        type: 'system'
      };
      
      push(messagesRef, systemMessage);
      
      // Update player score
      const pointsEarned = calculatePoints(roomData.timer);
      const playerRef = ref(database, `rooms/${roomId}/players/${currentUser.uid}`);
      update(playerRef, {
        score: (roomData.players[currentUser.uid].score || 0) + pointsEarned
      });
      
      // Check if all players have guessed
      const nonDrawingPlayers = Object.values(roomData.players).filter(player => 
        player.id !== roomData.currentDrawer && !player.hasGuessed
      );
      
      // Mark this player as having guessed
      update(playerRef, { hasGuessed: true });
      
      // If all players guessed, end the round early
      if (nonDrawingPlayers.length <= 1) {
        // End the round (the Game component will handle this on timer end)
        update(roomRef, { timer: 1 });
      }
    });
  };

  const calculatePoints = (timeLeft) => {
    // More points for faster guesses
    return Math.max(50, Math.min(100, timeLeft * 2));
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h3>Chat</h3>
      </div>
      
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`message ${msg.type} ${msg.userId === currentUser.uid ? 'own' : ''}`}
          >
            <span className="username">{msg.username}</span>
            <span className="message-text">{msg.text}</span>
            <span className="timestamp">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={handleMessageSubmit}>
        <input
          type="text"
          placeholder={
            gameState === 'drawing' && currentUser.uid !== currentDrawer
              ? "Type your guess here..."
              : "Type a message..."
          }
          value={message}
          onChange={handleMessageChange}
          disabled={gameState !== 'drawing' && gameState !== 'waiting' && gameState !== 'roundEnd'}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;