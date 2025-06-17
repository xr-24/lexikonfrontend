import React from 'react';
import { useGameStore } from '../../../src/store/gameStore';
import './MoveHistory.css';

interface MoveHistoryProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ isOpen, onToggle }) => {
  const moveHistory = useGameStore((state) => state.moveHistory);

  return (
    <div className="move-history">
      <div className="move-history-header" onClick={onToggle}>
        <h3>Move History</h3>
        <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>
      </div>
      
      {isOpen && (
        <div className="move-history-content">
          {moveHistory.length === 0 ? (
            <p className="no-moves">No moves yet</p>
          ) : (
            <div className="moves-list">
              {moveHistory.slice().reverse().map((move, index) => (
                <div key={index} className="move-entry">
                  <div className="move-header">
                    <span className="player-name">{move.playerName}</span>
                    <span className="turn-number">Turn {move.turnNumber}</span>
                  </div>
                  <div className="move-details">
                    {move.moveType === 'WORD' && (
                      <>
                        <span className="words">{move.words?.join(', ')}</span>
                        <span className="damage">{move.score} damage</span>
                        {move.damageDealt && move.damageTarget && (
                          <span className="damage-dealt">
                            -{move.damageDealt} HP to {move.damageTarget}
                          </span>
                        )}
                      </>
                    )}
                    {move.moveType === 'EVOCATION' && (
                      <>
                        <span className="spell-name evocation">⛧ {move.spellName}</span>
                        <span className="spell-effect">{move.spellEffect}</span>
                        {move.damageDealt && move.damageTarget && (
                          <span className="damage-dealt">
                            -{move.damageDealt} HP to {move.damageTarget}
                          </span>
                        )}
                      </>
                    )}
                    {move.moveType === 'INTERCESSION' && (
                      <>
                        <span className="spell-name intercession">✧ {move.spellName}</span>
                        <span className="spell-effect">{move.spellEffect}</span>
                        {move.damageDealt && move.damageTarget && (
                          <span className="damage-dealt">
                            -{move.damageDealt} HP to {move.damageTarget}
                          </span>
                        )}
                      </>
                    )}
                    {move.moveType === 'EXCHANGE' && (
                      <span className="action">Exchanged tiles</span>
                    )}
                    {move.moveType === 'PASS' && (
                      <span className="action">Passed turn</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
