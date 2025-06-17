import { useState, useEffect } from 'react';
import { GameContainer } from '../components/GameContainer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { RoomCreation } from '../components/room/RoomCreation';
import { RoomJoining } from '../components/room/RoomJoining';
import { Lobby } from '../components/room/Lobby';
import { useGameStore } from './store/gameStore';
import { soundService } from './services/soundService';
import './App.css';

function App() {
  const [roomMode, setRoomMode] = useState<'create' | 'join'>('create');
  const { uiPhase } = useGameStore();

  const handleSwitchToJoin = () => setRoomMode('join');
  const handleSwitchToCreate = () => setRoomMode('create');

  // Handle first user interaction to enable audio
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Start background music on first user interaction
      soundService.startBackgroundMusic();
      
      // Remove the event listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    // Add event listeners for first user interaction
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Show room management screens
  if (uiPhase === 'ROOM_SELECTION') {
    return (
      <ErrorBoundary>
        {roomMode === 'create' ? (
          <RoomCreation onJoinRoom={handleSwitchToJoin} />
        ) : (
          <RoomJoining onCreateRoom={handleSwitchToCreate} />
        )}
      </ErrorBoundary>
    );
  }

  // Show lobby while waiting for game to start
  if (uiPhase === 'LOBBY') {
    return (
      <ErrorBoundary>
        <Lobby />
      </ErrorBoundary>
    );
  }

  // Show game when playing or finished
  if (uiPhase === 'PLAYING' || uiPhase === 'FINISHED') {
    return (
      <ErrorBoundary>
        <GameContainer />
      </ErrorBoundary>
    );
  }

  // Fallback
  return (
    <ErrorBoundary>
      <RoomCreation onJoinRoom={handleSwitchToJoin} />
    </ErrorBoundary>
  );
}

export default App;
