import React, { useState, useEffect } from 'react';
import { INTERCESSION_DEFINITIONS, INTERCESSION_TYPES } from '../../src/constants/intercessions';
import { socketService, socket } from '../../src/services/socketService';
import { soundService } from '../../src/services/soundService';
import type { IntercessionsType } from '../../types/game';
import './IntercessionsSelector.css';

interface IntercessionsSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  roomCode: string;
}

export const IntercessionsSelector: React.FC<IntercessionsSelectionProps> = ({
  isOpen,
  onClose,
  playerName: _playerName,
  roomCode: _roomCode
}) => {
  const [selectedIntercessions, setSelectedIntercessions] = useState<IntercessionsType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIntercessions([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Listen for intercession selection response
  useEffect(() => {
    const handleIntercessionsSelected = (data: any) => {
      console.log('Intercessions selected response:', data);
      if (data.success) {
        setIsSubmitting(false);
        onClose(); // Close the modal on success
      } else {
        setError(data.error || 'Failed to select intercessions');
        setIsSubmitting(false);
      }
    };

    const handleRoomError = (data: any) => {
      console.log('Room error:', data);
      setError(data.message || 'An error occurred');
      setIsSubmitting(false);
    };

    if (isOpen) {
      socket.on('intercessions-selected', handleIntercessionsSelected);
      socket.on('room-error', handleRoomError);
    }

    return () => {
      socket.off('intercessions-selected', handleIntercessionsSelected);
      socket.off('room-error', handleRoomError);
    };
  }, [isOpen, onClose]);

  const handleIntercessionToggle = (type: IntercessionsType) => {
    setSelectedIntercessions(prev => {
      if (prev.includes(type)) {
        // Remove if already selected
        return prev.filter(t => t !== type);
      } else if (prev.length < 2) {
        // Add if less than 2 selected
        soundService.playIntercession(type);
        return [...prev, type];
      } else {
        // Don't allow more than 2 - user must deselect first
        setError('You can only select 2 intercessions. Please deselect one first.');
        return prev;
      }
    });
    
    // Clear error when successfully selecting/deselecting
    if (selectedIntercessions.includes(type) || selectedIntercessions.length < 2) {
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedIntercessions.length !== 2) {
      setError('You must select exactly 2 intercessions');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = socketService.selectIntercessions(selectedIntercessions);
      if (!success) {
        setError('Failed to submit intercession selection');
        setIsSubmitting(false);
      }
      // Don't close here - wait for server response
    } catch (err) {
      setError('An error occurred while submitting your selection');
      setIsSubmitting(false);
    }
  };

  const getIntercessionImage = (type: IntercessionsType): string => {
    const imageMap: Record<IntercessionsType, string> = {
      MICHAEL: '/Intercession-Michael.png',
      SAMAEL: '/Intercession-Samael.png',
      RAPHAEL: '/Intercession-Raphael.png',
      URIEL: '/Intercession-Uriel.png',
      GABRIEL: '/Intercession-Gabriel.png',
      METATRON: '/Intercession-Metatron.png'
    };
    return imageMap[type] || '/Intercession-Gabriel.png';
  };

  if (!isOpen) return null;

  return (
    <div className="intercessions-selector-overlay">
      <div className="intercessions-selector-modal">
        <div className="intercessions-selector-header">
          <h2>choose 2 intercessions</h2>
        </div>

        <div className="intercessions-grid">
          {INTERCESSION_TYPES.map(type => {
            const intercession = INTERCESSION_DEFINITIONS[type];
            const isSelected = selectedIntercessions.includes(type);
            const selectionIndex = selectedIntercessions.indexOf(type);

            return (
              <div
                key={type}
                className={`intercession-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleIntercessionToggle(type)}
              >
                {isSelected && (
                  <div className="selection-number">{selectionIndex + 1}</div>
                )}
                
                <img 
                  src={getIntercessionImage(type)} 
                  alt={intercession.name}
                  className="intercession-image"
                />
                
                <div className="intercession-tooltip">
                  <h3 className="intercession-name">{intercession.name}</h3>
                  <p className="intercession-description">{intercession.description}</p>
                  <div className="intercession-cooldown">
                    Cooldown: {intercession.cooldown} turns
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="intercessions-selector-footer">
          <div className="action-buttons">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={selectedIntercessions.length !== 2 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm Selection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
