import React, { useState, useCallback } from 'react';
import { useGameStore } from '../src/store/gameStore';
import { GameBoard } from '../features/game-board/components/GameBoard';
import { PlayerRack } from '../features/tile-system/components/PlayerRack';
import { ScoreBoard } from '../features/scoring/components/ScoreBoard';
import { MoveHistory } from '../features/game-history/components/MoveHistory';
import { ChatPanel } from '../features/chat/components/ChatPanel';
import { SettingsPanel } from './ui/SettingsPanel';
import { BlankTileSelector } from '../features/tile-system/components/BlankTileSelector';
import { soundService } from '../src/services/soundService';
import type { Tile } from '../types/game';
import './GameContainer.css';

export const GameContainer: React.FC = () => {
  const gamePhase = useGameStore((state) => state.gamePhase);
  const players = useGameStore((state) => state.players);
  const currentPlayerIndex = useGameStore((state) => state.currentPlayerIndex);
  const currentMoveErrors = useGameStore((state) => state.currentMoveErrors);
  const isMyTurn = useGameStore((state) => state.isMyTurn);
  const getCurrentPlayer = useGameStore((state) => state.getCurrentPlayer);
  
  const addPendingTile = useGameStore((state) => state.addPendingTile);
  const clearPendingMove = useGameStore((state) => state.clearPendingMove);
  const commitMove = useGameStore((state) => state.commitMove);
  
  // Chat state
  const chatUnreadCount = useGameStore((state) => state.chatUnreadCount);
  const markChatAsRead = useGameStore((state) => state.markChatAsRead);
  
  // Damage events
  const damageEvents = useGameStore((state) => state.damageEvents);
  const removeDamageEvent = useGameStore((state) => state.removeDamageEvent);

  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [showBlankSelector, setShowBlankSelector] = useState(false);
  const [pendingBlankTile, setPendingBlankTile] = useState<{ tile: Tile; row: number; col: number } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMoveHistoryOpen, setIsMoveHistoryOpen] = useState(false); // Default closed
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const myPlayer = getCurrentPlayer();

  const handleTileClick = useCallback((tile: Tile) => {
    if (!isMyTurn) return;
    setSelectedTile(prev => (prev?.id === tile.id ? null : tile));
  }, [isMyTurn]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!isMyTurn || !selectedTile) return;
    
    if (selectedTile.isBlank) {
      // Show blank tile selector for blank tiles
      setPendingBlankTile({ tile: selectedTile, row, col });
      setShowBlankSelector(true);
    } else {
      addPendingTile(selectedTile, row, col);
      setSelectedTile(null);
    }
  }, [addPendingTile, selectedTile, isMyTurn]);

  const handleBlankLetterSelect = useCallback((letter: string) => {
    if (pendingBlankTile) {
      // Create a new tile with the chosen letter
      const blankTileWithLetter: Tile = {
        ...pendingBlankTile.tile,
        chosenLetter: letter,
        // Keep the original letter property as is (should be blank character)
        // The chosenLetter will be used for validation and display
      };
      
      addPendingTile(blankTileWithLetter, pendingBlankTile.row, pendingBlankTile.col);
      setSelectedTile(null);
      setShowBlankSelector(false);
      setPendingBlankTile(null);
    }
  }, [addPendingTile, pendingBlankTile]);

  const handleBlankSelectorCancel = useCallback(() => {
    setShowBlankSelector(false);
    setPendingBlankTile(null);
  }, []);

  const handleCommitMove = useCallback(() => {
    commitMove();
  }, [commitMove]);

  const handleClearMove = useCallback(() => {
    clearPendingMove();
    setSelectedTile(null);
  }, [clearPendingMove]);

  const handleChatToggle = useCallback(() => {
    soundService.playClick();
    setIsChatOpen(prev => {
      if (!prev && chatUnreadCount > 0) {
        markChatAsRead();
      }
      return !prev;
    });
  }, [chatUnreadCount, markChatAsRead]);

  const handleMoveHistoryToggle = useCallback(() => {
    soundService.playClick();
    setIsMoveHistoryOpen(prev => !prev);
  }, []);

  const handleSettingsToggle = useCallback(() => {
    soundService.playClick();
    setIsSettingsOpen(prev => !prev);
  }, []);

  if (gamePhase === 'FINISHED') {
    const winner = players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    return (
      <div className="game-container">
        <div className="game-finished">
          <h1>Game Finished!</h1>
          <h2>Winner: {winner.name}</h2>
          <div className="final-scores">
            <h3>Final Scores:</h3>
            {players
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div key={player.id} className="final-score">
                  <span className="rank">#{index + 1}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="score">{player.score}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="game-main">
        <div className="game-sidebar-left">
          <ScoreBoard 
            damageEvents={damageEvents}
            onDamageComplete={removeDamageEvent}
          />
          {currentPlayer && (
            <div className="current-turn">
              <h4>Current Turn: {currentPlayer.name}</h4>
              {isMyTurn && <p className="your-turn">It's your turn!</p>}
              {!isMyTurn && <p className="waiting-turn">Waiting for your turn...</p>}
            </div>
          )}
        </div>
        
        <div className="game-board-section">
          <GameBoard onCellClick={handleCellClick} />
        </div>
        
        <div className="game-sidebar-right">
          <SettingsPanel
            isOpen={isSettingsOpen}
            onToggle={handleSettingsToggle}
          />
          <MoveHistory 
            isOpen={isMoveHistoryOpen}
            onToggle={handleMoveHistoryToggle}
          />
          <ChatPanel
            isOpen={isChatOpen}
            onToggle={handleChatToggle}
            unreadCount={chatUnreadCount}
          />
          {currentMoveErrors.length > 0 && (
            <div className="move-errors">
              <h4>Move Errors:</h4>
              <ul>
                {currentMoveErrors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="players-section">
        {(() => {
          // Sort players so the current user's rack appears first
          const sortedPlayers = [...players];
          if (myPlayer) {
            // Remove current player from array and add them to the beginning
            const otherPlayers = sortedPlayers.filter(p => p.id !== myPlayer.id);
            const currentPlayerArray = sortedPlayers.filter(p => p.id === myPlayer.id);
            return [...currentPlayerArray, ...otherPlayers];
          }
          return sortedPlayers;
        })().map((player) => (
          <PlayerRack
            key={player.id}
            playerId={player.id}
            onTileClick={player.id === myPlayer?.id ? handleTileClick : undefined}
            selectedTileId={player.id === myPlayer?.id ? selectedTile?.id : undefined}
            isCurrentPlayer={player.id === currentPlayer?.id}
            isMyRack={player.id === myPlayer?.id}
            onCommitMove={player.id === myPlayer?.id ? handleCommitMove : undefined}
            onClearMove={player.id === myPlayer?.id ? handleClearMove : undefined}
            isMyTurn={player.id === myPlayer?.id ? isMyTurn : false}
          />
        ))}
      </div>
      
      <BlankTileSelector
        isOpen={showBlankSelector}
        onSelectLetter={handleBlankLetterSelect}
        onCancel={handleBlankSelectorCancel}
      />
    </div>
  );
};
