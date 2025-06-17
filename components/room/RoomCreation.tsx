import React, { useState } from 'react';
import { useGameStore } from '../../src/store/gameStore';
import { soundService } from '../../src/services/soundService';
import './RoomCreation.css';

interface RoomCreationProps {
  onJoinRoom: () => void;
}

export const RoomCreation: React.FC<RoomCreationProps> = ({ onJoinRoom }) => {
  const [playerName, setPlayerName] = useState('');
  const { createRoom, createSoloRoom, connectionStatus, error } = useGameStore();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playMainClick();
    if (playerName.trim()) {
      createRoom(playerName.trim());
    }
  };

  const handleSoloPlay = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playMainClick();
    if (playerName.trim()) {
      // Create room for solo play - the lobby will handle adding AI players
      createSoloRoom(playerName.trim());
    }
  };

  const handleJoinRoom = () => {
    soundService.playMainClick();
    onJoinRoom();
  };

  return (
    <div className="room-creation">
      <div className="room-creation-container">
        <h1>📜 Lexikon</h1>
        
        <div className="room-creation-card">
          <h2>Create New Room</h2>
          
          <form onSubmit={handleCreateRoom}>
            <div className="input-group">
              <label htmlFor="playerName">Your Name</label>
              <input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                required
              />
            </div>
            
            <div className="button-group">
              <button 
                type="submit" 
                className="create-room-btn"
                disabled={connectionStatus === 'connecting' || !playerName.trim()}
              >
                {connectionStatus === 'connecting' ? 'Creating...' : 'Create Multiplayer Room'}
              </button>
              
              <button 
                type="button"
                className="solo-play-btn"
                onClick={handleSoloPlay}
                disabled={connectionStatus === 'connecting' || !playerName.trim()}
              >
                ⛧ Solo
              </button>
            </div>
          </form>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <button 
            className="join-room-btn"
            onClick={handleJoinRoom}
          >
            Join Existing Room
          </button>
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
    </div>
  );
};
