import React from 'react';
import '../styles/ColorPicker.css';

const ColorPicker = ({ selectedColor, setSelectedColor }) => {
  // Predefined color palette
  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FFA500', // Orange
    '#800080', // Purple
    '#FFC0CB', // Pink
    '#A52A2A', // Brown
    '#808080', // Gray
    '#00FFFF', // Cyan
  ];

  return (
    <div className="color-picker">
      <div className="color-grid">
        {colors.map((color) => (
          <div
            key={color}
            className={`color-item ${color === selectedColor ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => setSelectedColor(color)}
          >
            {color === '#FFFFFF' && (
              <div className="white-color-border"></div>
            )}
          </div>
        ))}
      </div>
      
      <div className="custom-color">
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => setSelectedColor(e.target.value)}
        />
        <span>Custom</span>
      </div>
    </div>
  );
};

export default ColorPicker;