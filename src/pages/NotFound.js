import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <div className="not-found-drawing">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="50" fill="none" stroke="#4c84ff" strokeWidth="4" />
            <circle cx="80" cy="80" r="8" fill="#4c84ff" />
            <circle cx="120" cy="80" r="8" fill="#4c84ff" />
            <path d="M70 120 Q100 140 130 120" fill="none" stroke="#4c84ff" strokeWidth="4" />
          </svg>
        </div>
        <Link to="/" className="back-home-btn">
          Go Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;