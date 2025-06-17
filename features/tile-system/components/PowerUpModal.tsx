import React, { useState } from 'react';
import type { PowerUpType, Player, BoardCell } from '../../../types/game';
import './PowerUpModal.css';

interface PowerUpModalProps {
  isOpen: boolean;
  powerUpType: PowerUpType;
  onClose: () => void;
  onConfirm: (selection: any) => void;
  player: Player;
  opponent?: Player;
  board?: BoardCell[][];
}

export const PowerUpModal: React.FC<PowerUpModalProps> = ({
  isOpen,
  powerUpType,
  onClose,
  onConfirm,
  player,
  opponent,
  board
}) => {
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<{row: number, col: number} | null>(null);
  const [selectedMultiplier, setSelectedMultiplier] = useState<{row: number, col: number} | null>(null);

  if (!isOpen) return null;

  const handleTileSelection = (tileId: string) => {
    if (powerUpType === 'BURN') {
      // Allow selecting up to 2 tiles
      if (selectedTiles.includes(tileId)) {
        setSelectedTiles(selectedTiles.filter(id => id !== tileId));
      } else if (selectedTiles.length < 2) {
        setSelectedTiles([...selectedTiles, tileId]);
      }
    } else if (powerUpType === 'TILE_THIEF' || powerUpType === 'DUPLICATE') {
      // Allow selecting 1 tile
      setSelectedTiles([tileId]);
    }
  };

  const handleBoardSelection = (row: number, col: number) => {
    if (powerUpType === 'TILE_FREEZE') {
      setSelectedPosition({ row, col });
    } else if (powerUpType === 'MULTIPLIER_THIEF') {
      setSelectedMultiplier({ row, col });
    }
  };

  const handleConfirm = () => {
    let selection;
    
    switch (powerUpType) {
      case 'BURN':
        selection = { targetTileIds: selectedTiles };
        break;
      case 'TILE_THIEF':
        selection = { targetTileId: selectedTiles[0] };
        break;
      case 'DUPLICATE':
        selection = { sourceTileId: selectedTiles[0] };
        break;
      case 'TILE_FREEZE':
        selection = { position: selectedPosition };
        break;
      case 'MULTIPLIER_THIEF':
        selection = { row: selectedMultiplier?.row, col: selectedMultiplier?.col };
        break;
      default:
        selection = {};
    }
    
    onConfirm(selection);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTiles([]);
    setSelectedPosition(null);
    setSelectedMultiplier(null);
    onClose();
  };

  const canConfirm = () => {
    switch (powerUpType) {
      case 'BURN':
        return selectedTiles.length === 2;
      case 'TILE_THIEF':
      case 'DUPLICATE':
        return selectedTiles.length === 1;
      case 'TILE_FREEZE':
        return selectedPosition !== null;
      case 'MULTIPLIER_THIEF':
        return selectedMultiplier !== null;
      default:
        return true;
    }
  };

  const renderContent = () => {
    switch (powerUpType) {
      case 'BURN':
        return (
          <div className="powerup-modal-content">
            <h3>🔥 Burn</h3>
            <p>Choose 2 tiles from your opponent's rack to force them to discard:</p>
            <div className="tile-selection">
              {opponent?.tiles.map((tile) => (
                <div
                  key={tile.id}
                  className={`tile-option ${selectedTiles.includes(tile.id) ? 'selected' : ''}`}
                  onClick={() => handleTileSelection(tile.id)}
                >
                  {tile.letter}
                  <span className="tile-value">{tile.value}</span>
                </div>
              ))}
            </div>
            <p className="selection-count">Selected: {selectedTiles.length}/2</p>
          </div>
        );

      case 'TILE_THIEF':
        return (
          <div className="powerup-modal-content">
            <h3>🗡️ Tile Thief</h3>
            <p>Choose 1 tile to steal from your opponent's rack:</p>
            <div className="tile-selection">
              {opponent?.tiles.map((tile) => (
                <div
                  key={tile.id}
                  className={`tile-option ${selectedTiles.includes(tile.id) ? 'selected' : ''}`}
                  onClick={() => handleTileSelection(tile.id)}
                >
                  {tile.letter}
                  <span className="tile-value">{tile.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'DUPLICATE':
        return (
          <div className="powerup-modal-content">
            <h3>🪞 Duplicate</h3>
            <p>Choose one of your tiles to duplicate:</p>
            <div className="tile-selection">
              {player.tiles.filter(tile => !tile.isPowerUp).map((tile) => (
                <div
                  key={tile.id}
                  className={`tile-option ${selectedTiles.includes(tile.id) ? 'selected' : ''}`}
                  onClick={() => handleTileSelection(tile.id)}
                >
                  {tile.letter}
                  <span className="tile-value">{tile.value}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'TILE_FREEZE':
        return (
          <div className="powerup-modal-content">
            <h3>🧊 Tile Freeze</h3>
            <p>Click on a tile on the board to freeze it:</p>
            <div className="board-selection">
              {board?.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`board-cell ${cell.tile ? 'has-tile' : ''} ${
                        selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex ? 'selected' : ''
                      }`}
                      onClick={() => cell.tile && handleBoardSelection(rowIndex, colIndex)}
                    >
                      {cell.tile && (
                        <div className="board-tile">
                          {cell.tile.letter}
                          <span className="tile-value">{cell.tile.value}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'MULTIPLIER_THIEF':
        return (
          <div className="powerup-modal-content">
            <h3>💎 Multiplier Thief</h3>
            <p>Click on a Double Word or Triple Word multiplier to steal:</p>
            <div className="board-selection">
              {board?.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((cell, colIndex) => {
                    const isStealable = cell.multiplier === 'DOUBLE_WORD' || cell.multiplier === 'TRIPLE_WORD';
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`board-cell ${isStealable ? 'stealable' : ''} ${
                          selectedMultiplier?.row === rowIndex && selectedMultiplier?.col === colIndex ? 'selected' : ''
                        }`}
                        onClick={() => isStealable && handleBoardSelection(rowIndex, colIndex)}
                      >
                        {cell.multiplier && (
                          <div className="multiplier">
                            {cell.multiplier === 'DOUBLE_WORD' ? 'W²' : 
                             cell.multiplier === 'TRIPLE_WORD' ? 'W³' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="powerup-modal-content">
            <h3>Power-up Activated</h3>
            <p>This power-up has been activated!</p>
          </div>
        );
    }
  };

  return (
    <div className="powerup-modal-overlay">
      <div className="powerup-modal">
        {renderContent()}
        <div className="powerup-modal-actions">
          <button onClick={handleClose} className="cancel-button">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className="confirm-button"
            disabled={!canConfirm()}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
