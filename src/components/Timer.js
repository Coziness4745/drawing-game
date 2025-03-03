import React from 'react';
import '../styles/Timer.css';

const Timer = ({ seconds }) => {
  // Calculate minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  // Format the time
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (seconds <= 10) {
      return 'timer-critical';
    } else if (seconds <= 30) {
      return 'timer-warning';
    }
    return 'timer-normal';
  };

  return (
    <div className={`timer ${getTimerColor()}`}>
      <div className="timer-display">{formattedTime}</div>
    </div>
  );
};

export default Timer;