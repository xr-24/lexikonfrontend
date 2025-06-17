import React from 'react';
import { soundService } from '../../../src/services/soundService';
import './BlankTileSelector.css';

interface BlankTileSelectorProps {
  isOpen: boolean;
  onSelectLetter: (letter: string) => void;
  onCancel: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Letter values for display
const LETTER_VALUES: Record<string, number> = {
  'A': 1, 'E': 1, 'I': 1, 'L': 1, 'N': 1, 'O': 1, 'R': 1, 'S': 1, 'T': 1, 'U': 1,
  'D': 2, 'G': 2,
  'B': 3, 'C': 3, 'M': 3, 'P': 3,
  'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
  'K': 5,
  'J': 8, 'X': 8,
  'Q': 10, 'Z': 10
};

export const BlankTileSelector: React.FC<BlankTileSelectorProps> = ({
  isOpen,
  onSelectLetter,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleLetterSelect = (letter: string) => {
    soundService.playTile();
    onSelectLetter(letter);
  };

  const handleCancel = () => {
    soundService.playClick();
    onCancel();
  };

  return (
    <div className="blank-tile-selector-overlay">
      <div className="selector-modal">
        <h3>🎭 Choose Your Letter 🎭</h3>
        <p className="selector-subtitle">Transform your blank tile into any letter</p>
        <div className="letters-grid">
          {ALPHABET.map((letter) => (
            <div
              key={letter}
              className="letter-option"
              onClick={() => handleLetterSelect(letter)}
            >
              <span className="letter-text">{letter}</span>
              <span className="letter-value">{LETTER_VALUES[letter]}</span>
            </div>
          ))}
        </div>
        <div className="selector-actions">
          <button className="cancel-button" onClick={handleCancel}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
