import React from 'react';
import { useGameStore } from '../../src/store/gameStore';
import { soundService } from '../../src/services/soundService';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const GOTHIC_TILE_COLORS = [
  { name: 'Classic Brown', value: '#8B4513' },
  { name: 'Dark Slate', value: '#2F4F4F' },
  { name: 'Mystic Blue', value: '#483D8B' },
  { name: 'Blood Red', value: '#8B0000' },
  { name: 'Forest Green', value: '#556B2F' },
  { name: 'Royal Indigo', value: '#4B0082' },
  { name: 'Muted Purple', value: '#663366' },
  { name: 'Ancient Gold', value: '#B8860B' },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onToggle,
}) => {
  const playerTileColor = useGameStore((state) => state.playerTileColor);
  const setPlayerTileColor = useGameStore((state) => state.setPlayerTileColor);
  const getCurrentPlayer = useGameStore((state) => state.getCurrentPlayer);
  
  const currentPlayer = getCurrentPlayer();
  const currentTileColor = playerTileColor || currentPlayer?.tileColor || '#8B4513';

  const handleColorSelect = (color: string) => {
    soundService.playClick();
    setPlayerTileColor(color);
  };

  const handleToggle = () => {
    soundService.playClick();
    onToggle();
  };

  return (
    <div className="settings-panel">
      <button 
        className={`settings-toggle ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title="Settings"
      >
        <span className="settings-icon">⚙️</span>
        Settings
      </button>
      
      {isOpen && (
        <div className="settings-dropdown">
          <div className="settings-header">
            <h4>Game Settings</h4>
          </div>
          
          <div className="settings-section">
            <h5>Tile Color</h5>
            <div className="tile-color-preview">
              <div 
                className="preview-tile"
                style={{ 
                  backgroundColor: currentTileColor,
                  color: '#FFFFFF',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}
              >
                <span className="tile-letter">A</span>
                <span className="tile-value">1</span>
              </div>
            </div>
            
            <div className="color-grid">
              {GOTHIC_TILE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  className={`color-option ${currentTileColor === colorOption.value ? 'selected' : ''}`}
                  style={{ backgroundColor: colorOption.value }}
                  onClick={() => handleColorSelect(colorOption.value)}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>
          
          <div className="settings-section">
            <h5>Sound</h5>
            <div className="sound-controls">
              <label className="sound-toggle">
                <input
                  type="checkbox"
                  checked={soundService.isAudioEnabled()}
                  onChange={(e) => {
                    soundService.setEnabled(e.target.checked);
                    if (e.target.checked) {
                      soundService.playClick();
                    }
                  }}
                />
                <span>Enable Sound Effects</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
