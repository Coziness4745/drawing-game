import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Home from './pages/Home';
import Game from './pages/Game';
import NotFound from './pages/NotFound';
import './styles/index.css';

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <AuthProvider>
        <GameProvider>
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/game/:roomId" element={<Game />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </GameProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;