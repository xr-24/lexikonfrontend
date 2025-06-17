import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../src/store/gameStore';
import { soundService } from '../../../src/services/soundService';
import './ScoreBoard.css';

interface DamageEvent {
  id: string;
  playerId: string;
  damage: number;
  isAI: boolean;
}

interface ScoreBoardProps {
  damageEvents?: DamageEvent[];
  onDamageComplete?: (eventId: string) => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ 
  damageEvents = [], 
  onDamageComplete 
}) => {
  const [damageAnimations, setDamageAnimations] = useState<Map<string, boolean>>(new Map());
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const turnNumber = useGameStore((state) => state.turnNumber);
  const tileBag = useGameStore((state) => state.tileBag);

  // Handle damage events
  useEffect(() => {
    damageEvents.forEach(event => {
      if (!damageAnimations.has(event.id)) {
        // Start damage animation
        setDamageAnimations(prev => new Map(prev).set(event.id, true));
        
        // Play damage sound
        if (event.isAI) {
          soundService.playAIDamage();
        } else {
          soundService.playPlayerDamage();
        }

        // End animation after duration
        setTimeout(() => {
          setDamageAnimations(prev => {
            const newMap = new Map(prev);
            newMap.delete(event.id);
            return newMap;
          });
          onDamageComplete?.(event.id);
        }, 1500); // Animation duration
      }
    });
  }, [damageEvents, damageAnimations, onDamageComplete]);

  const getHPPercentage = (hp: number): number => {
    return Math.max(0, Math.min(100, (hp / 300) * 100));
  };

  const getHPColor = (hp: number): string => {
    const percentage = getHPPercentage(hp);
    if (percentage > 60) return '#4CAF50'; // Green
    if (percentage > 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <div className="score-board">
      <div className="game-info">
        <h2>lexikon</h2>
        <div className="game-stats">
          <span>Turn: {turnNumber}</span>
          <span>Tiles Left: {tileBag.length}</span>
        </div>
      </div>
      
      <div className="players-scores">
        <h3>Players</h3>
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
              className={`player-score ${isCurrentPlayer ? 'current-player' : ''} ${player.isAI ? 'ai-player' : ''} ${isBeingDamaged ? (player.isAI ? 'damage-ai' : 'damage-player') : ''}`}
            >
              <div className="player-info">
                <div className="player-name-section">
                  <span className="player-name">{player.name}</span>
                  {player.isAI && <span className="ai-pentagram">⛧</span>}
                </div>
              </div>

              <div className="hp-bar-container">
                <div className="hp-bar-background">
                  <div 
                    className="hp-bar-fill"
                    style={{
                      width: `${hpPercentage}%`,
                      backgroundColor: hpColor,
                      transition: 'width 0.5s ease, background-color 0.3s ease'
                    }}
                  />
                  <div className="hp-bar-glow" style={{ backgroundColor: hpColor }} />
                </div>
                
                <div className="hp-text">
                  <span className="hp-current">{player.hp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
