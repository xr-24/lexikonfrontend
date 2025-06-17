import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../../src/store/gameStore';
import { getMultiplierDisplay, getMultiplierColor } from '../constants/board';
import { soundService } from '../../../src/services/soundService';
import { getEvocationImagePath } from '../../../src/constants/evocations';
import './GameBoard.css';

interface GameBoardProps {
  onCellClick: (row: number, col: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ onCellClick }) => {
  const board = useGameStore(state => state.board);
  const pendingTiles = useGameStore(state => state.pendingTiles);
  const lastMoveResult = useGameStore(state => state.lastMoveResult);
  const removePendingTile = useGameStore(state => state.removePendingTile);
  const playerTileColor = useGameStore(state => state.playerTileColor);
  const roomPlayers = useGameStore(state => state.roomPlayers);
  
  // Local state for animations
  const [newlyPlacedTiles, setNewlyPlacedTiles] = useState<Set<string>>(new Set());
  const [celebratingTiles, setCelebratingTiles] = useState<Set<string>>(new Set());

  // Track when tiles are placed for drop-in animation
  useEffect(() => {
    if (pendingTiles.length > 0) {
      const newTileKeys = pendingTiles.map(pt => `${pt.row}-${pt.col}`);
      setNewlyPlacedTiles(new Set(newTileKeys));
      
      // Clear the animation after it completes
      const timer = setTimeout(() => {
        setNewlyPlacedTiles(new Set());
      }, 400); // Match the animation duration
      
      return () => clearTimeout(timer);
    }
  }, [pendingTiles]);

  // Track word celebration animations
  useEffect(() => {
    if (lastMoveResult && lastMoveResult.validation && lastMoveResult.validation.words && lastMoveResult.validation.words.length > 0) {
      // Collect all tiles that are part of formed words
      const celebratingTileKeys = new Set<string>();
      lastMoveResult.validation.words.forEach(wordPlacement => {
        wordPlacement.tiles.forEach(placedTile => {
          celebratingTileKeys.add(`${placedTile.row}-${placedTile.col}`);
        });
      });
      
      setCelebratingTiles(celebratingTileKeys);
      
      // Play word formation sound
      soundService.playWordForm();
      
      // Clear the celebration animation after it completes
      const timer = setTimeout(() => {
        setCelebratingTiles(new Set());
      }, 1200); // Match the animation duration
      
      return () => clearTimeout(timer);
    }
  }, [lastMoveResult]);

  const previewBoard = React.useMemo(() => {
    const newBoard = board.map(row => [...row]);
    pendingTiles.forEach(({ tile, row, col }) => {
      newBoard[row][col] = { ...newBoard[row][col], tile };
    });
    return newBoard;
  }, [board, pendingTiles]);

  const handleCellClick = (row: number, col: number) => {
    const isPending = pendingTiles.some(p => p.row === row && p.col === col);
    if (isPending) {
      removePendingTile(row, col);
    } else {
      onCellClick(row, col);
    }
    // Play tile sound for any board cell click
    soundService.playTile();
  };

  // Helper function to get the color for a committed tile
  const getTileColor = (tile: any, rowIndex: number, colIndex: number) => {
    // Check if this tile was placed by an AI - if so, don't apply custom colors
    if (tile && tile.placedByPlayerId) {
      const roomPlayer = roomPlayers.find(rp => rp.id === tile.placedByPlayerId);
      if (roomPlayer?.isAI) {
        return undefined; // Let AI tiles use their demonic styling
      }
    }
    
    // Check if this is a pending tile first
    const isPending = pendingTiles.some(pt => pt.row === rowIndex && pt.col === colIndex);
    if (isPending && playerTileColor) {
      return playerTileColor;
    }
    
    // For committed tiles, only apply custom colors to human players
    if (tile && tile.placedByPlayerId && playerTileColor) {
      const roomPlayer = roomPlayers.find(rp => rp.id === tile.placedByPlayerId);
      if (!roomPlayer?.isAI) {
        return playerTileColor;
      }
    }
    
    // Default color if no player color is found
    return undefined;
  };

  // Helper function to check if a tile was placed by an AI
  const isAITile = (tile: any) => {
    if (!tile || !tile.placedByPlayerId) return false;
    const roomPlayer = roomPlayers.find(rp => rp.id === tile.placedByPlayerId);
    return roomPlayer?.isAI || false;
  };

  return (
    <div className="game-board">
      {previewBoard.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`board-cell ${cell.tile ? 'has-tile' : ''}`}
              style={{ backgroundColor: getMultiplierColor(cell.multiplier) }}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell.tile ? (
                <div 
                  className={`tile ${
                    newlyPlacedTiles.has(`${rowIndex}-${colIndex}`) ? 'newly-placed' : ''
                  } ${
                    celebratingTiles.has(`${rowIndex}-${colIndex}`) ? 'word-celebration' : ''
                  } ${
                    pendingTiles.some(pt => pt.row === rowIndex && pt.col === colIndex) ? 'pending' : ''
                  } ${
                    isAITile(cell.tile) ? 'ai-tile' : ''
                  }`}
                  style={(() => {
                    const tileColor = getTileColor(cell.tile, rowIndex, colIndex);
                    return tileColor ? { '--tile-color': tileColor } as React.CSSProperties : undefined;
                  })()}
                >
                  {isAITile(cell.tile) && (
                    <span className="ai-symbol">⛧</span>
                  )}
                  <span className="tile-letter">
                    {cell.tile.isBlank ? (cell.tile.chosenLetter || cell.tile.letter) : cell.tile.letter}
                  </span>
                  <span className="tile-value">
                    {cell.tile.isBlank && cell.tile.chosenLetter 
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
                          return letterValues[cell.tile.chosenLetter.toUpperCase()] || 0;
                        })()
                      : cell.tile.value
                    }
                  </span>
                </div>
              ) : cell.powerUp ? (
                <div className="tile evocation-tile">
                  <img 
                    src={getEvocationImagePath((cell.powerUp as any).type)}
                    alt={(cell.powerUp as any).name || 'Evocation'}
                    className="evocation-icon"
                    title={(cell.powerUp as any).name || 'Evocation'}
                  />
                </div>
              ) : cell.multiplier ? (
                <span className="multiplier-text">
                  {getMultiplierDisplay(cell.multiplier)}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
