import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../src/store/gameStore';
import { IntercessionsSelector } from '../ui/IntercessionsSelector';
import { socket } from '../../src/services/socketService';
import './Lobby.css';

export const Lobby: React.FC = () => {
  const { 
    roomCode, 
    roomPlayers, 
    isHost, 
    playerName,
    startGame, 
    leaveRoom, 
    addAIPlayer, 
    removeAIPlayer,
    connectionStatus,
    error,
    isSoloMode
  } = useGameStore();

  const [showIntercessionsSelector, setShowIntercessionsSelector] = useState(false);
  const [_hasSelectedIntercessions, _setHasSelectedIntercessions] = useState(false);

  // Auto-add 1 AI player for solo mode
  useEffect(() => {
    if (isSoloMode && isHost && roomPlayers.length === 1) {
      // Add just 1 AI player to start, let user add more if they want
      setTimeout(() => addAIPlayer(), 500);
    }
  }, [isSoloMode, isHost, roomPlayers.length, addAIPlayer]);

  // Listen for intercession selection responses, start events, and ready-to-start events
  useEffect(() => {
    const handleIntercessionsSelected = (data: any) => {
      console.log('Lobby: Intercessions selected response:', data);
      if (data.success) {
        setShowIntercessionsSelector(false);
        // Don't start game immediately - wait for ready-to-start event
      }
    };

    const handleIntercessionSelectionStart = () => {
      setShowIntercessionsSelector(true);
    };

    const handleReadyToStart = () => {
      console.log('Lobby: All players ready to start');
      if (isHost) {
        // All players have selected intercessions, start the game
        startGame();
      }
    };

    socket.on('intercessions-selected', handleIntercessionsSelected);
    socket.on('intercession-selection-start', handleIntercessionSelectionStart);
    socket.on('ready-to-start', handleReadyToStart);

    return () => {
      socket.off('intercessions-selected', handleIntercessionsSelected);
      socket.off('intercession-selection-start', handleIntercessionSelectionStart);
      socket.off('ready-to-start', handleReadyToStart);
    };
  }, [isHost, startGame]);

  const handleStartGame = () => {
    if (isHost && roomPlayers.length >= 2) {
      // Host requests to start the game; server will trigger intercession-selection-start
    }
  };

  const handleIntercessionsClose = () => {
    setShowIntercessionsSelector(false);
  };

  const copyRoomCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        // You could add a toast notification here
        console.log('Room code copied to clipboard');
      } catch (err) {
        console.error('Failed to copy room code:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = roomCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <h1>📜 Lexikon Lobby</h1>
          <button className="leave-btn" onClick={leaveRoom}>
            ← Leave Room
          </button>
        </div>
        
        <div className="lobby-card">
          <div className="room-info">
            <div className="room-code-section">
              <h2>Room Code</h2>
              <div className="room-code-display">
                <span className="room-code">{roomCode}</span>
                <button className="copy-btn" onClick={copyRoomCode} title="Copy room code">
                  📋
                </button>
              </div>
              <p>Share this code with friends to join</p>
            </div>
          </div>
          
          <div className="players-section">
            <div className="players-header">
              <h3>Players ({roomPlayers.length}/4)</h3>
              {isHost && roomPlayers.length < 4 && (
                <button className="add-ai-btn" onClick={addAIPlayer} title="Add Demon Player">
                  ⛧ Add Demon
                </button>
              )}
            </div>
            <div className="players-list">
              {roomPlayers.map((player) => (
                <div key={player.id} className="player-item">
                  <div className="player-info">
                    <span className="player-name">{player.name}</span>
                    {player.isHost && <span className="host-badge">👑 Host</span>}
                    {player.name === playerName && <span className="you-badge">You</span>}
                  </div>
                  <div className="player-status">
                    {player.isAI ? (
                      <div className="ai-controls">
                        <span className="status-indicator ai">⛧</span>
                        {isHost && (
                          <button 
                            className="remove-ai-btn" 
                            onClick={() => removeAIPlayer(player.id)}
                            title="Remove Demon Player"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="status-indicator online">🟢</span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Show empty slots */}
              {Array.from({ length: 4 - roomPlayers.length }).map((_, index) => (
                <div key={`empty-${index}`} className="player-item empty">
                  <div className="player-info">
                    <span className="player-name">Waiting for player...</span>
                  </div>
                  <div className="player-status">
                    <span className="status-indicator empty">⚪</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="lobby-actions">
            {isHost ? (
              <button 
                className="start-game-btn"
                onClick={handleStartGame}
                disabled={roomPlayers.length < 2}
              >
                {roomPlayers.length < 2 
                  ? 'Need at least 2 players to start' 
                  : `Start Game (${roomPlayers.length} players)`
                }
              </button>
            ) : (
              <div className="waiting-message">
                <p>Waiting for host to start the game...</p>
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="connection-status">
          Status: <span className={`status-${connectionStatus}`}>
            {connectionStatus === 'connected' ? '🟢 Connected' :
             connectionStatus === 'connecting' ? '🟡 Connecting...' :
             connectionStatus === 'error' ? '🔴 Error' :
             '⚪ Disconnected'}
          </span>
        </div>
      </div>
      
      {/* Intercessions Selector Modal */}
      <IntercessionsSelector
        isOpen={showIntercessionsSelector}
        onClose={handleIntercessionsClose}
        playerName={playerName || ''}
        roomCode={roomCode || ''}
      />
    </div>
  );
};
