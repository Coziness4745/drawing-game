import { database } from './config';
import { 
  ref, 
  set, 
  push, 
  get,
  update,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  serverTimestamp
} from 'firebase/database';

// Create a new room
export const createRoom = async (hostId, hostName, roomName) => {
  try {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    
    const roomData = {
      name: roomName || `${hostName}'s Room`,
      host: hostId,
      status: 'waiting',
      maxPlayers: 8,
      rounds: 3,
      drawTime: 90,
      createdAt: serverTimestamp(),
      players: {
        [hostId]: {
          id: hostId,
          name: hostName,
          score: 0,
          isHost: true
        }
      }
    };
    
    await set(newRoomRef, roomData);
    return newRoomRef.key;
  } catch (error) {
    console.error("Error creating room:", error.message);
    throw error;
  }
};

// Join an existing room
export const joinRoom = async (roomId, userId, userName) => {
  try {
    // Get the room to check if it exists and has space
    const roomRef = ref(database, `rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    
    if (!roomSnapshot.exists()) {
      throw new Error("Room does not exist");
    }
    
    const roomData = roomSnapshot.val();
    
    // Check if the room is full
    const playerCount = roomData.players ? Object.keys(roomData.players).length : 0;
    if (playerCount >= roomData.maxPlayers) {
      throw new Error("Room is full");
    }
    
    // Check if the room is in waiting status
    if (roomData.status !== 'waiting') {
      throw new Error("Game has already started");
    }
    
    // Add the player to the room
    const playerRef = ref(database, `rooms/${roomId}/players/${userId}`);
    await set(playerRef, {
      id: userId,
      name: userName,
      score: 0,
      isHost: false
    });
    
    return roomId;
  } catch (error) {
    console.error("Error joining room:", error.message);
    throw error;
  }
};

// Leave a room
export const leaveRoom = async (roomId, userId, isHost) => {
  try {
    if (isHost) {
      // If host leaves, delete the entire room
      const roomRef = ref(database, `rooms/${roomId}`);
      await remove(roomRef);
    } else {
      // Otherwise just remove the player
      const playerRef = ref(database, `rooms/${roomId}/players/${userId}`);
      await remove(playerRef);
    }
    return true;
  } catch (error) {
    console.error("Error leaving room:", error.message);
    throw error;
  }
};

// Update room settings (host only)
export const updateRoomSettings = async (roomId, settings) => {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    await update(roomRef, settings);
    return true;
  } catch (error) {
    console.error("Error updating room settings:", error.message);
    throw error;
  }
};

// Start the game (host only)
export const startGame = async (roomId) => {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    await update(roomRef, { status: 'choosing' });
    return true;
  } catch (error) {
    console.error("Error starting game:", error.message);
    throw error;
  }
};

// Send a chat message
export const sendMessage = async (roomId, userId, userName, messageText, type = 'regular') => {
  try {
    const messagesRef = ref(database, `rooms/${roomId}/messages`);
    const newMessageRef = push(messagesRef);
    
    await set(newMessageRef, {
      text: messageText,
      userId: userId,
      username: userName,
      timestamp: serverTimestamp(),
      type: type
    });
    
    return newMessageRef.key;
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
};

// Update drawing data
export const updateDrawing = async (roomId, drawingData) => {
  try {
    const drawingRef = ref(database, `rooms/${roomId}/drawing`);
    await set(drawingRef, {
      ...drawingData,
      timestamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating drawing:", error.message);
    throw error;
  }
};

// Get active rooms
export const getActiveRooms = async () => {
  try {
    const roomsRef = ref(database, 'rooms');
    const roomsQuery = query(
      roomsRef,
      orderByChild('status'),
      equalTo('waiting')
    );
    
    const snapshot = await get(roomsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const rooms = [];
    snapshot.forEach((child) => {
      rooms.push({
        id: child.key,
        ...child.val()
      });
    });
    
    return rooms;
  } catch (error) {
    console.error("Error getting active rooms:", error.message);
    throw error;
  }
};

// Subscribe to a room
export const subscribeToRoom = (roomId, callback) => {
  const roomRef = ref(database, `rooms/${roomId}`);
  onValue(roomRef, callback);
  
  // Return a function to unsubscribe
  return () => off(roomRef);
};

// Subscribe to messages
export const subscribeToMessages = (roomId, callback) => {
  const messagesRef = ref(database, `rooms/${roomId}/messages`);
  onValue(messagesRef, callback);
  
  // Return a function to unsubscribe
  return () => off(messagesRef);
};

// Subscribe to drawing
export const subscribeToDrawing = (roomId, callback) => {
  const drawingRef = ref(database, `rooms/${roomId}/drawing`);
  onValue(drawingRef, callback);
  
  // Return a function to unsubscribe
  return () => off(drawingRef);
};