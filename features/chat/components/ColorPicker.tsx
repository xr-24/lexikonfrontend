import React, { useState } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PRESET_COLORS = [
  '#DC143C', // Default red
  '#FF6B6B', // Light red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#FFA07A', // Light salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Light yellow
  '#BB8FCE', // Light purple
  '#85C1E9', // Light blue
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onColorChange,
  isOpen,
  onToggle,
}) => {
  const [customColor, setCustomColor] = useState(currentColor);

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  const handlePresetColorClick = (color: string) => {
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <div className="color-picker">
      <button 
        className="color-picker-trigger"
        onClick={onToggle}
        style={{ backgroundColor: currentColor }}
        title="Change name color"
      >
        <span className="color-preview" style={{ color: currentColor }}>●</span>
      </button>
      
      {isOpen && (
        <div className="color-picker-dropdown">
          <div className="color-picker-header">
            <h4>choose name color</h4>
          </div>
          
          <div className="preset-colors">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`preset-color ${currentColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetColorClick(color)}
                title={color}
              />
            ))}
          </div>
          
          <div className="custom-color-section">
            <label htmlFor="custom-color">custom hex:</label>
            <input
              id="custom-color"
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#DC143C"
              maxLength={7}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      )}
    </div>
  );
};
