import React, { useState } from 'react';
import { useGameStore } from '../../src/store/gameStore';
import { soundService } from '../../src/services/soundService';
import './RoomJoining.css';

interface RoomJoiningProps {
  onCreateRoom: () => void;
}

export const RoomJoining: React.FC<RoomJoiningProps> = ({ onCreateRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const { joinRoom, connectionStatus, error } = useGameStore();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playMainClick();
    if (roomCode.trim() && playerName.trim()) {
      joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    }
  };

  const handleCreateRoom = () => {
    soundService.playMainClick();
    onCreateRoom();
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setRoomCode(value);
  };

  return (
    <div className="room-joining">
      <div className="room-joining-container">
        <h1>📜 Join Lexikon Game</h1>
        
        <div className="room-joining-card">
          <h2>Join Existing Room</h2>
          
          <form onSubmit={handleJoinRoom}>
            <div className="input-group">
              <label htmlFor="roomCode">Room Code</label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={handleRoomCodeChange}
                placeholder="Enter room code"
                maxLength={6}
                required
              />
              <small>Enter the 6-character room code</small>
            </div>
            
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
            
            <button 
              type="submit" 
              className="join-room-btn"
              disabled={connectionStatus === 'connecting' || !roomCode.trim() || !playerName.trim()}
            >
              {connectionStatus === 'connecting' ? 'Joining...' : 'Join Room'}
            </button>
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
            className="create-room-btn"
            onClick={handleCreateRoom}
          >
            Create New Room
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
