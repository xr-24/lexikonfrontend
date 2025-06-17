import React, { useState, useEffect } from 'react';
import type { Player } from '../../types/game';
import { soundService } from '../../src/services/soundService';
import './HPDisplay.css';

interface HPDisplayProps {
  players: Player[];
  currentPlayerIndex: number;
  damageEvents?: DamageEvent[];
  onDamageComplete?: (eventId: string) => void;
}

interface DamageEvent {
  id: string;
  playerId: string;
  damage: number;
  isAI: boolean;
}

export const HPDisplay: React.FC<HPDisplayProps> = ({ 
  players, 
  currentPlayerIndex, 
  damageEvents = [], 
  onDamageComplete 
}) => {
  const [damageAnimations, setDamageAnimations] = useState<Map<string, boolean>>(new Map());

  const getHPPercentage = (hp: number): number => {
    return Math.max(0, Math.min(100, (hp / 300) * 100));
  };

  const getHPColor = (hp: number): string => {
    const percentage = getHPPercentage(hp);
    if (percentage > 60) return '#4CAF50'; // Green
    if (percentage > 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  // Handle damage events
  useEffect(() => {
    damageEvents.forEach(event => {
      if (!damageAnimations.has(event.id)) {
        // Start damage animation
        setDamageAnimations(prev => new Map(prev).set(event.id, true));
        
        // Play damage sound based on who is taking damage
        const damagedPlayer = players.find(p => p.id === event.playerId);
        if (damagedPlayer?.isAI) {
          soundService.playAIDamage();
        } else {
          soundService.playPlayerDamage();
        }

        // End animation after duration (increased for better timing)
        setTimeout(() => {
          setDamageAnimations(prev => {
            const newMap = new Map(prev);
            newMap.delete(event.id);
            return newMap;
          });
          onDamageComplete?.(event.id);
        }, 2000); // Increased animation duration to prevent sound overlap
      }
    });
  }, [damageEvents, damageAnimations, onDamageComplete]);

  return (
    <div className="hp-display-container">
      {players.map((player, index) => {
        const isCurrentPlayer = index === currentPlayerIndex;
        const hpPercentage = getHPPercentage(player.hp);
        const hpColor = getHPColor(player.hp);
        
        // Check if this player is taking damage
        const damageEvent = damageEvents.find(event => event.playerId === player.id);
        const isBeingDamaged = damageEvent && damageAnimations.has(damageEvent.id);

        return (
          <div 
            key={player.id} 
            className={`hp-player-container ${isCurrentPlayer ? 'current-player' : ''} ${player.isAI ? 'ai-player' : ''} ${isBeingDamaged ? (player.isAI ? 'damage-ai' : 'damage-player') : ''}`}
          >
            <div className="hp-player-info">
              <div className="hp-player-name">
                {player.name}
                {player.isAI && <span className="ai-pentagram">⛧</span>}
              </div>
              <div className="hp-score">Score: {player.score}</div>
            </div>

            <div className="hp-display-main">
              <div className="hp-number">
                {player.hp}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface DamageIndicatorProps {
  damage: number;
  playerName: string;
  onComplete: () => void;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({ 
  damage, 
  playerName, 
  onComplete 
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="damage-indicator">
      <div className="damage-text">
        -{damage} HP
      </div>
      <div className="damage-target">
        {playerName}
      </div>
    </div>
  );
};

interface HealIndicatorProps {
  healing: number;
  playerName: string;
  onComplete: () => void;
}

export const HealIndicator: React.FC<HealIndicatorProps> = ({ 
  healing, 
  playerName, 
  onComplete 
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="heal-indicator">
      <div className="heal-text">
        +{healing} HP
      </div>
      <div className="heal-target">
        {playerName}
      </div>
    </div>
  );
};
