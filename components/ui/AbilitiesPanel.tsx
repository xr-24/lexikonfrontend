import React, { useState } from 'react';
import { socketService } from '../../src/services/socketService';
import { soundService } from '../../src/services/soundService';
import type { Player, Evocation, Intercession } from '../../types/game';
import './AbilitiesPanel.css';

interface AbilitiesPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
  isPlayerTurn: boolean;
}

export const AbilitiesPanel: React.FC<AbilitiesPanelProps> = ({
  player,
  isCurrentPlayer,
  isPlayerTurn
}) => {
  const [activeTab, setActiveTab] = useState<'evocations' | 'intercessions'>('evocations');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEvocationActivate = (evocation: Evocation) => {
    if (!isCurrentPlayer || !isPlayerTurn) {
      return;
    }

    // Play evocation sound
    soundService.playEvocation(evocation.type);

    const success = socketService.activateEvocation(evocation.id);
    if (!success) {
      console.error('Failed to activate evocation');
    }
  };

  const handleIntercessionActivate = (intercession: Intercession) => {
    if (!isCurrentPlayer) {
      return;
    }

    if (intercession.currentCooldown > 0) {
      return;
    }

    // Play intercession sound
    soundService.playIntercession(intercession.type);

    const success = socketService.activateIntercession(intercession.id);
    if (!success) {
      console.error('Failed to activate intercession');
    }
  };

  const getEvocationImage = (evocation: Evocation): string => {
    const imageMap: Record<string, string> = {
      OROBAS: '/Evocation-OrobasAsteroth.png',
      ASTAROTH: '/Evocation-OrobasAsteroth.png',
      BUNE: '/Evocation-BuneAndromalius.png',
      ANDROMALIUS: '/Evocation-BuneAndromalius.png',
      GREMORY: '/Evocation-GremoryValeforDantalion.png',
      VALEFOR: '/Evocation-GremoryValeforDantalion.png',
      DANTALION: '/Evocation-GremoryValeforDantalion.png',
      MURMUR: '/Evocation-MurmurAim.png',
      AIM: '/Evocation-MurmurAim.png',
      FURFUR: '/Evocation-ForneusFurfurHaagenti.png',
      FORNEUS: '/Evocation-ForneusFurfurHaagenti.png',
      HAAGENTI: '/Evocation-ForneusFurfurHaagenti.png'
    };
    return imageMap[evocation.type] || '/Evocation-OrobasAsteroth.png';
  };

  const getIntercessionImage = (intercession: Intercession): string => {
    const imageMap: Record<string, string> = {
      MICHAEL: '/Intercession-Michael.png',
      SAMAEL: '/Intercession-Samael.png',
      RAPHAEL: '/Intercession-Raphael.png',
      URIEL: '/Intercession-Uriel.png',
      GABRIEL: '/Intercession-Gabriel.png',
      METATRON: '/Intercession-Metatron.png'
    };
    return imageMap[intercession.type] || '/Intercession-Gabriel.png';
  };

  if (!isCurrentPlayer) {
    return null;
  }

  return (
    <div className={`abilities-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="abilities-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="abilities-title">
          <span className="abilities-icon">🔮</span>
          Abilities
        </div>
        <div className="abilities-counts">
          <span className="evocation-count">⭐{player.evocations.length}</span>
          <span className="intercession-count">🙏{player.intercessions.filter(i => i.currentCooldown === 0).length}</span>
        </div>
        <div className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▼</div>
      </div>

      {isExpanded && (
        <div className="abilities-content">
          <div className="abilities-tabs">
            <button
              className={`tab-button ${activeTab === 'evocations' ? 'active' : ''}`}
              onClick={() => setActiveTab('evocations')}
            >
              ⭐ Evocations ({player.evocations.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'intercessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('intercessions')}
            >
              🙏 Intercessions ({player.intercessions.length})
            </button>
          </div>

          <div className="abilities-list">
            {activeTab === 'evocations' && (
              <div className="evocations-grid">
                {player.evocations.length === 0 ? (
                  <div className="no-abilities">No evocations available</div>
                ) : (
                  player.evocations.map(evocation => (
                    <div
                      key={evocation.id}
                      className={`ability-card evocation ${!isPlayerTurn ? 'disabled' : ''}`}
                      onClick={() => handleEvocationActivate(evocation)}
                      title={isPlayerTurn ? 'Click to activate' : 'Wait for your turn'}
                    >
                      <div className="ability-icon">
                        <img 
                          src={getEvocationImage(evocation)} 
                          alt={evocation.name}
                          className="ability-image"
                        />
                      </div>
                      <div className="ability-info">
                        <div className="ability-name">{evocation.name}</div>
                        <div className="ability-description">{evocation.description}</div>
                      </div>
                      <div 
                        className="ability-pentagram" 
                        style={{ backgroundColor: evocation.color }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'intercessions' && (
              <div className="intercessions-grid">
                {player.intercessions.length === 0 ? (
                  <div className="no-abilities">No intercessions available</div>
                ) : (
                  player.intercessions.map(intercession => {
                    const isOnCooldown = intercession.currentCooldown > 0;
                    const canActivate = !isOnCooldown;

                    return (
                      <div
                        key={intercession.id}
                        className={`ability-card intercession ${isOnCooldown ? 'on-cooldown' : ''} ${!canActivate ? 'disabled' : ''}`}
                        onClick={() => canActivate && handleIntercessionActivate(intercession)}
                        title={
                          isOnCooldown 
                            ? `On cooldown for ${intercession.currentCooldown} more turns`
                            : 'Click to activate'
                        }
                      >
                        <div className="ability-icon">
                          <img 
                            src={getIntercessionImage(intercession)} 
                            alt={intercession.name}
                            className="ability-image"
                          />
                        </div>
                        <div className="ability-info">
                          <div className="ability-name">{intercession.name}</div>
                          <div className="ability-description">{intercession.description}</div>
                          {isOnCooldown && (
                            <div className="cooldown-indicator">
                              Cooldown: {intercession.currentCooldown} turns
                            </div>
                          )}
                        </div>
                        {isOnCooldown && (
                          <div className="cooldown-overlay">
                            <div className="cooldown-text">{intercession.currentCooldown}</div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {!isPlayerTurn && (
            <div className="turn-warning">
              Wait for your turn to activate abilities
            </div>
          )}
        </div>
      )}
    </div>
  );
};
