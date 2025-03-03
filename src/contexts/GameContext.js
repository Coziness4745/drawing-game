import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [currentGame, setCurrentGame] = useState(null);

  const value = {
    currentGame,
    setCurrentGame
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}