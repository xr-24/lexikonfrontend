import React, { useState } from 'react';
import { useGameStore } from '../../../src/store/gameStore';
import { soundService } from '../../../src/services/soundService';
import { socketService } from '../../../src/services/socketService';
import { PowerUpModal } from './PowerUpModal';
import type { Tile, PowerUpType, Evocation, Intercession } from '../../../types/game';
import './PlayerRack.css';

interface PlayerRackProps {
  playerId: string;
  onTileClick?: (tile: Tile) => void;
  selectedTileId?: string;
  isCurrentPlayer?: boolean;
  // New props for integrated buttons
  isMyRack?: boolean;
  onCommitMove?: () => void;
  onClearMove?: () => void;
  isMyTurn?: boolean;
}

export const PlayerRack: React.FC<PlayerRackProps> = ({ 
  playerId, 
  onTileClick, 
  selectedTileId,
  isCurrentPlayer = false,
  isMyRack = false,
  onCommitMove,
  onClearMove,
  isMyTurn = false
}) => {
  const [exchangeMode, setExchangeMode] = useState(false);
  const [selectedForExchange, setSelectedForExchange] = useState<Set<string>>(new Set());
  const [powerUpModalOpen, setPowerUpModalOpen] = useState(false);
  const [activatingPowerUpType, setActivatingPowerUpType] = useState<PowerUpType | null>(null);
  const [showSpells, setShowSpells] = useState(false);
  
  const player = useGameStore((state) => state.players.find(p => p.id === playerId));
  const players = useGameStore((state) => state.players);
  const board = useGameStore((state) => state.board);
  const placedTileIds = useGameStore((state) => state.placedTileIds); // Get placed tile IDs for highlighting
  const playerTileColor = useGameStore((state) => state.playerTileColor);
  const roomPlayers = useGameStore((state) => state.roomPlayers);
  const exchangeTiles = useGameStore((state) => state.exchangeTiles);
  const passTurn = useGameStore((state) => state.passTurn);
  const endGame = useGameStore((state) => state.endGame);
  const gamePhase = useGameStore((state) => state.gamePhase);
  const activatePowerUp = useGameStore((state) => state.activatePowerUp);
  const activatePowerUpTile = useGameStore((state) => state.activatePowerUpTile);

  if (!player) {
    return <div className="player-rack">Player not found</div>;
  }

  const handleTileClick = (tile: Tile) => {
    // Play tile sound for tile clicks
    soundService.playTile();
    
    if (exchangeMode && isCurrentPlayer && !player.hasEndedGame) {
      // Don't allow exchanging power-up tiles
      if (tile.isPowerUp) {
        return;
      }
      const newSelected = new Set(selectedForExchange);
      if (newSelected.has(tile.id)) {
        newSelected.delete(tile.id);
      } else {
        newSelected.add(tile.id);
      }
      setSelectedForExchange(newSelected);
    } else if (tile.isPowerUp && isCurrentPlayer && !player.hasEndedGame && canTakeActions) {
      // Handle power-up tile activation
      if (!player.activePowerUpForTurn) {
        // Check if this power-up needs modal interaction
        const needsModal = ['BURN', 'TILE_THIEF', 'MULTIPLIER_THIEF', 'DUPLICATE', 'TILE_FREEZE'].includes(tile.powerUpType!);
        const needsExecution = ['SILENCE', 'EXTRA_TILES', 'EXTRA_TURN'].includes(tile.powerUpType!);
        
        if (needsModal) {
          // First activate the power-up, then open modal
          activatePowerUpTile(playerId, tile.id);
          setActivatingPowerUpType(tile.powerUpType!);
          setPowerUpModalOpen(true);
        } else if (needsExecution) {
          // Activate and immediately execute power-ups that don't need user input
          activatePowerUpTile(playerId, tile.id);
          // Execute after a brief delay to ensure activation completes
          setTimeout(() => {
            switch (tile.powerUpType) {
              case 'SILENCE':
                useGameStore.getState().executeSilencePowerUp();
                break;
              case 'EXTRA_TILES':
                useGameStore.getState().executeExtraTilesPowerUp();
                break;
              case 'EXTRA_TURN':
                useGameStore.getState().executeExtraTurnPowerUp();
                break;
            }
          }, 100);
        } else {
          // For immediate effect power-ups (HEADSTONE, WILTED_ROSE, CRESCENT_MOON, SCROLL), just activate
          activatePowerUpTile(playerId, tile.id);
        }
      }
    } else if (onTileClick && !player.hasEndedGame) {
      onTileClick(tile);
    }
  };

  const handleExchangeConfirm = () => {
    soundService.playClick();
    if (selectedForExchange.size > 0) {
      exchangeTiles(Array.from(selectedForExchange));
      setExchangeMode(false);
      setSelectedForExchange(new Set());
    }
  };

  const handleExchangeCancel = () => {
    soundService.playClick();
    setExchangeMode(false);
    setSelectedForExchange(new Set());
  };

  const handlePassTurn = () => {
    soundService.playClick();
    passTurn();
  };

  const handleEndGame = () => {
    soundService.playClick();
    if (window.confirm('Are you sure you want to end your game? You won\'t be able to make any more moves.')) {
      endGame();
    }
  };

  const handleExchangeMode = () => {
    soundService.playClick();
    setExchangeMode(true);
  };

  const handleCommitMove = () => {
    soundService.playClick();
    if (onCommitMove) {
      onCommitMove();
    }
  };

  const handleClearMove = () => {
    soundService.playClick();
    if (onClearMove) {
      onClearMove();
    }
  };

  const canTakeActions = isCurrentPlayer && !player.hasEndedGame && gamePhase === 'PLAYING';

  const handleSpellsToggle = () => {
    soundService.playClick();
    setShowSpells(prev => !prev);
  };

  const handleEvocationActivate = (evocation: Evocation) => {
    if (!isCurrentPlayer || !isMyTurn) {
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

  const handlePowerUpModalConfirm = (selection: any) => {
    if (activatingPowerUpType) {
      // Execute the power-up with the selected parameters
      switch (activatingPowerUpType) {
        case 'BURN':
          useGameStore.getState().executeBurnPowerUp(selection.targetTileIds);
          break;
        case 'TILE_THIEF':
          useGameStore.getState().executeTileThiefPowerUp(selection.targetTileId);
          break;
        case 'MULTIPLIER_THIEF':
          if (selection.row !== undefined && selection.col !== undefined) {
            useGameStore.getState().executeMultiplierThiefPowerUp(
              selection.row, 
              selection.col
            );
          }
          break;
        case 'DUPLICATE':
          useGameStore.getState().executeDuplicatePowerUp(selection.sourceTileId);
          break;
        case 'TILE_FREEZE':
          if (selection.position) {
            useGameStore.getState().executeTileFreezePowerUp(
              selection.position.row, 
              selection.position.col
            );
          }
          break;
        default:
          console.warn(`Unhandled power-up type: ${activatingPowerUpType}`);
      }
    }
    setPowerUpModalOpen(false);
    setActivatingPowerUpType(null);
  };

  const handlePowerUpModalClose = () => {
    setPowerUpModalOpen(false);
    setActivatingPowerUpType(null);
  };

  const getOpponent = () => {
    return players.find(p => p.id !== playerId);
  };

  const getPowerUpDescription = (tile: Tile): string => {
    if (!tile.isPowerUp || !tile.powerUpType) return '';
    
    switch (tile.powerUpType) {
      case 'SCROLL':
        return 'Place a letter tile any number of times on the board, all letters in your possession can be used multiple times for that turn regardless of how many of that letter you actually have';
      case 'HEADSTONE':
        return 'Swap all 7 of your tiles for a new set, guaranteed to contain at least two vowels. (consumed on use)';
      case 'WILTED_ROSE':
        return 'Swaps you and your opponents\' tiles.';
      case 'CRESCENT_MOON':
        return 'Adds an extra blank tile to your rack.';
      case 'BURN':
        return 'Choose 2 tiles to force your opponent to discard from their rack.';
      case 'TILE_THIEF':
        return 'Steal 1 tile from opponent\'s rack. Your rack expands to 8/7 for this turn.';
      case 'MULTIPLIER_THIEF':
        return 'Steal a Double Word or Triple Word multiplier from the board to use on your next word.';
      case 'DUPLICATE':
        return 'Copy one of your own tiles to create an exact duplicate.';
      case 'EXTRA_TURN':
        return 'Play again immediately after your current turn ends.';
      case 'TILE_FREEZE':
        return 'Freeze a tile on the board - opponents cannot connect new tiles to it on their next turn.';
      case 'SILENCE':
        return 'Lock 3 random tiles on your opponent\'s rack, preventing them from being used on their next turn.';
      case 'EXTRA_TILES':
        return 'Get 3 bonus tiles for this turn only. Your rack expands to 10/7 temporarily.';
      default:
        return 'Unknown power-up';
    }
  };

  // Helper function to check if this player is an AI
  const isAIPlayer = () => {
    const roomPlayer = roomPlayers.find(rp => rp.id === playerId);
    return roomPlayer?.isAI || false;
  };

  return (
    <div className={`player-rack ${isMyRack ? 'my-rack' : ''}`}>
      <div className="rack-header">
        <h3>{player.name}'s {showSpells ? 'Spells' : 'Tiles'}</h3>
        <div className="header-controls">
          <span className="tile-count">{player.tiles.length}/7</span>
          {isMyRack && (player.evocations.length > 0 || player.intercessions.length > 0) && (
            <button 
              className="abilities-toggle"
              onClick={handleSpellsToggle}
              title={showSpells ? 'Show Tiles' : 'Show Spells'}
            >
              <span className={`toggle-arrow ${showSpells ? 'rotated' : ''}`}>▶</span>
            </button>
          )}
          {player.hasEndedGame && <span className="ended-indicator">Game Ended</span>}
        </div>
      </div>
      
      {!showSpells ? (
        <div className="tiles-container">
          {player.tiles.map((tile) => (
            <div
              key={tile.id}
              className={`rack-tile ${
                selectedTileId === tile.id ? 'selected' : ''
              } ${
                selectedForExchange.has(tile.id) ? 'selected-for-exchange' : ''
              } ${
                isMyRack && placedTileIds.includes(tile.id) ? 'placed-this-turn' : ''
              } ${
                player.hasEndedGame ? 'disabled' : ''
              } ${
                tile.isPowerUp ? 'power-up-tile' : ''
              } ${
                tile.isBlank ? 'blank-tile' : ''
              } ${
                isAIPlayer() && !tile.isPowerUp ? 'ai-tile' : ''
              }`}
              style={
                isMyRack && playerTileColor && !isAIPlayer() && !tile.isPowerUp 
                  ? { '--tile-color': playerTileColor } as React.CSSProperties 
                  : undefined
              }
              onClick={() => handleTileClick(tile)}
              title={tile.isPowerUp ? getPowerUpDescription(tile) : undefined}
            >
              {isAIPlayer() && !tile.isPowerUp && (
                <span className="ai-symbol">⛧</span>
              )}
              <span className="tile-letter">
                {tile.isPowerUp ? tile.emoji : (tile.isBlank ? (tile.chosenLetter || '?') : tile.letter)}
              </span>
              {!tile.isPowerUp && (
                <span className="tile-value">
                  {tile.isBlank && tile.chosenLetter 
                    ? (() => {
                        const letterValues: Record<string, number> = {
                          'A': 1, 'E': 1, 'I': 1, 'L': 1, 'N': 1, 'O': 1, 'R': 1, 'S': 1, 'T': 1, 'U': 1,
                          'D': 2, 'G': 2,
                          'B': 3, 'C': 3, 'M': 3, 'P': 3,
                          'F': 4, 'H': 4, 'V': 4, 'W': 4, 'Y': 4,
                          'K': 5,
                          'J': 8, 'X': 8,
                          'Q': 10, 'Z': 10
                        };
                        return letterValues[tile.chosenLetter.toUpperCase()] || 0;
                      })()
                    : tile.value
                  }
                </span>
              )}
            </div>
          ))}
          {/* Fill empty slots */}
          {Array.from({ length: 7 - player.tiles.length }).map((_, index) => (
            <div key={`empty-${index}`} className="rack-tile empty">
              <span className="empty-slot">•</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="spells-container">
          <div className="spells-grid-3x2">
            {/* Create a 3x2 grid with spells and empty slots */}
            {Array.from({ length: 6 }).map((_, index) => {
              const allSpells = [...player.evocations, ...player.intercessions];
              const spell = allSpells[index];
              
              if (!spell) {
                return (
                  <div key={`empty-spell-${index}`} className="spell-tile-medium empty">
                    <span className="empty-slot">•</span>
                  </div>
                );
              }

              // Check if it's an evocation or intercession
              const isEvocation = player.evocations.includes(spell as any);
              const isIntercession = player.intercessions.includes(spell as any);
              
              if (isEvocation) {
                const evocation = spell as any;
                return (
                  <div
                    key={evocation.id}
                    className={`spell-tile-medium evocation ${!isMyTurn ? 'disabled' : ''}`}
                    onClick={() => handleEvocationActivate(evocation)}
                  >
                    <img 
                      src={getEvocationImage(evocation)} 
                      alt={evocation.name}
                      className="spell-image-medium"
                    />
                    <div className="spell-tooltip">
                      <div className="spell-tooltip-name evocation-name">{evocation.name}</div>
                      <div className="spell-tooltip-description">{evocation.description}</div>
                    </div>
                  </div>
                );
              } else if (isIntercession) {
                const intercession = spell as any;
                const isOnCooldown = intercession.currentCooldown > 0;
                const canActivate = !isOnCooldown;

                return (
                  <div
                    key={intercession.id}
                    className={`spell-tile-medium intercession ${isOnCooldown ? 'on-cooldown' : ''} ${!canActivate ? 'disabled' : ''}`}
                    onClick={() => canActivate && handleIntercessionActivate(intercession)}
                  >
                    <img 
                      src={getIntercessionImage(intercession)} 
                      alt={intercession.name}
                      className="spell-image-medium"
                    />
                    <div className="spell-tooltip">
                      <div className="spell-tooltip-name intercession-name">{intercession.name}</div>
                      <div className="spell-tooltip-description">
                        {isOnCooldown 
                          ? `${intercession.description} (Cooldown: ${intercession.currentCooldown} turns)`
                          : intercession.description
                        }
                      </div>
                    </div>
                    {isOnCooldown && (
                      <div className="cooldown-overlay">
                        <div className="cooldown-text-medium">{intercession.currentCooldown}</div>
                      </div>
                    )}
                  </div>
                );
              }
              
              return null;
            })}
          </div>

          {!isMyTurn && (
            <div className="turn-warning">
              Wait for your turn to activate spells
            </div>
          )}
        </div>
      )}

      {/* Power-ups section - now only shows activePowerUps that haven't been converted to tiles */}
      {player.activePowerUps.length > 0 && (
        <div className="power-ups-section">
          <h4>Power-ups</h4>
          <div className="power-ups-container">
            {player.activePowerUps.map((powerUp) => (
              <div
                key={powerUp.id}
                className="power-up-item"
                onClick={() => canTakeActions && !player.activePowerUpForTurn && activatePowerUp(playerId, powerUp.id)}
                title={powerUp.description}
              >
                <span className="power-up-emoji">{powerUp.emoji}</span>
                <span className="power-up-name">{powerUp.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active power-up indicator */}
      {player.activePowerUpForTurn && (
        <div className="active-power-up">
          <span className="active-indicator">Active: {player.activePowerUpForTurn.emoji} {player.activePowerUpForTurn.name}</span>
        </div>
      )}

      {/* Integrated game controls for my rack ONLY - hidden when showing spells */}
      {isMyRack && !showSpells && (
        <div className="integrated-controls">
          {!exchangeMode ? (
            <>
              <div className="primary-actions">
                <button 
                  className="action-button commit-button"
                  onClick={handleCommitMove}
                  disabled={!isMyTurn}
                >
                  Play Word
                </button>
                <button 
                  className="action-button clear-button"
                  onClick={handleClearMove}
                  disabled={!isMyTurn}
                >
                  Clear Selection
                </button>
              </div>
              <div className="secondary-actions">
                <button 
                  className="action-button exchange-button"
                  onClick={handleExchangeMode}
                  disabled={player.tiles.length === 0 || !isMyTurn}
                >
                  Exchange Tiles
                </button>
                <button 
                  className="action-button pass-button"
                  onClick={handlePassTurn}
                  disabled={!isMyTurn}
                >
                  Pass Turn
                </button>
                <button 
                  className="action-button end-game-button"
                  onClick={handleEndGame}
                  disabled={!isMyTurn}
                >
                  End Game
                </button>
              </div>
            </>
          ) : (
            <div className="exchange-controls">
              <p>Select tiles to exchange ({selectedForExchange.size} selected)</p>
              <div className="exchange-buttons">
                <button 
                  className="action-button confirm-button"
                  onClick={handleExchangeConfirm}
                  disabled={selectedForExchange.size === 0}
                >
                  Confirm Exchange
                </button>
                <button 
                  className="action-button cancel-button"
                  onClick={handleExchangeCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PowerUp Modal */}
      <PowerUpModal
        isOpen={powerUpModalOpen}
        powerUpType={activatingPowerUpType!}
        onClose={handlePowerUpModalClose}
        onConfirm={handlePowerUpModalConfirm}
        player={player}
        opponent={getOpponent()}
        board={board}
      />
    </div>
  );
};
