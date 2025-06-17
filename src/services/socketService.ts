import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://lexikonbeta-backend.onrender.com';
export const socket = io(BACKEND_URL);

// Client-side validation helpers
const validatePlayerName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Player name is required' };
  }
  if (name.length < 1 || name.length > 20) {
    return { isValid: false, error: 'Player name must be between 1 and 20 characters' };
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return { isValid: false, error: 'Player name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed' };
  }
  return { isValid: true };
};

const validateRoomCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Room code is required' };
  }
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return { isValid: false, error: 'Room code must be 6 alphanumeric characters' };
  }
  return { isValid: true };
};

const validateChatMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || typeof message !== 'string') {
    return { isValid: false, error: 'Message is required' };
  }
  if (message.length > 500) {
    return { isValid: false, error: 'Message cannot exceed 500 characters' };
  }
  return { isValid: true };
};

const validateTileData = (tile: any): { isValid: boolean; error?: string } => {
  if (!tile || typeof tile !== 'object') {
    return { isValid: false, error: 'Invalid tile data' };
  }
  if (!tile.id || typeof tile.id !== 'string') {
    return { isValid: false, error: 'Invalid tile ID' };
  }
  if (!tile.letter || typeof tile.letter !== 'string' || tile.letter.length !== 1) {
    return { isValid: false, error: 'Invalid tile letter' };
  }
  // For blank tiles, validate chosenLetter if present
  if (tile.isBlank && tile.chosenLetter) {
    if (typeof tile.chosenLetter !== 'string' || tile.chosenLetter.length !== 1) {
      return { isValid: false, error: 'Invalid chosen letter for blank tile' };
    }
    if (!/^[A-Z]$/i.test(tile.chosenLetter)) {
      return { isValid: false, error: 'Chosen letter must be a valid letter A-Z' };
    }
  }
  if (typeof tile.value !== 'number' || tile.value < 0 || tile.value > 10) {
    return { isValid: false, error: 'Invalid tile value' };
  }
  return { isValid: true };
};

const validateBoardPosition = (row: number, col: number): { isValid: boolean; error?: string } => {
  if (!Number.isInteger(row) || row < 0 || row >= 15) {
    return { isValid: false, error: 'Invalid row position' };
  }
  if (!Number.isInteger(col) || col < 0 || col >= 15) {
    return { isValid: false, error: 'Invalid column position' };
  }
  return { isValid: true };
};

export const socketService = {
  // Room management
  createRoom: (playerName: string) => {
    const validation = validatePlayerName(playerName);
    if (!validation.isValid) {
      console.error('Client validation failed for createRoom:', validation.error);
      return false;
    }
    socket.emit('create-room', { playerName: playerName.trim() });
    return true;
  },
  
  joinRoom: (roomCode: string, playerName: string) => {
    const nameValidation = validatePlayerName(playerName);
    if (!nameValidation.isValid) {
      console.error('Client validation failed for joinRoom (name):', nameValidation.error);
      return false;
    }
    
    const codeValidation = validateRoomCode(roomCode);
    if (!codeValidation.isValid) {
      console.error('Client validation failed for joinRoom (code):', codeValidation.error);
      return false;
    }
    
    socket.emit('join-room', { 
      roomCode: roomCode.trim().toUpperCase(), 
      playerName: playerName.trim() 
    });
    return true;
  },
  
  startGame: () => socket.emit('start-game'),
  
  // Game actions
  placeTile: (tile: any, row: number, col: number) => {
    const tileValidation = validateTileData(tile);
    if (!tileValidation.isValid) {
      console.error('Client validation failed for placeTile (tile):', tileValidation.error);
      return false;
    }
    
    const positionValidation = validateBoardPosition(row, col);
    if (!positionValidation.isValid) {
      console.error('Client validation failed for placeTile (position):', positionValidation.error);
      return false;
    }
    
    socket.emit('place-tile', { tile, row, col });
    return true;
  },
  
  removeTile: (row: number, col: number) => {
    const positionValidation = validateBoardPosition(row, col);
    if (!positionValidation.isValid) {
      console.error('Client validation failed for removeTile:', positionValidation.error);
      return false;
    }
    
    socket.emit('remove-tile', { row, col });
    return true;
  },
  
  commitMove: () => socket.emit('commit-move'),
  
  clearPendingMove: () => socket.emit('clear-pending-move'),
  
  exchangeTiles: (tileIds: string[]) => {
    if (!Array.isArray(tileIds)) {
      console.error('Client validation failed for exchangeTiles: tileIds must be an array');
      return false;
    }
    
    if (tileIds.length === 0 || tileIds.length > 7) {
      console.error('Client validation failed for exchangeTiles: invalid number of tiles');
      return false;
    }
    
    if (!tileIds.every(id => typeof id === 'string' && id.length > 0)) {
      console.error('Client validation failed for exchangeTiles: invalid tile ID format');
      return false;
    }
    
    socket.emit('exchange-tiles', { tileIds });
    return true;
  },
  
  passTurn: () => socket.emit('pass-turn'),
  
  endGame: () => socket.emit('end-game'),
  
  // Power-up actions
  activatePowerUp: (powerUpId: string) => {
    if (!powerUpId || typeof powerUpId !== 'string') {
      console.error('Client validation failed for activatePowerUp: invalid power-up ID');
      return false;
    }
    
    socket.emit('activate-powerup', { powerUpId });
    return true;
  },
  
  activatePowerUpTile: (tileId: string) => {
    if (!tileId || typeof tileId !== 'string') {
      console.error('Client validation failed for activatePowerUpTile: invalid tile ID');
      return false;
    }
    
    socket.emit('activate-powerup-tile', { tileId });
    return true;
  },

  // New powerup execution method
  executePowerUp: (powerUpType: string, params: any) => {
    if (!powerUpType || typeof powerUpType !== 'string') {
      console.error('Client validation failed for executePowerUp: invalid powerup type');
      return false;
    }

    if (!params || typeof params !== 'object') {
      console.error('Client validation failed for executePowerUp: invalid parameters');
      return false;
    }

    socket.emit('execute-powerup', { powerUpType, params });
    return true;
  },
  
  // Chat actions
  sendChatMessage: (message: string, playerColor: string) => {
    const messageValidation = validateChatMessage(message);
    if (!messageValidation.isValid) {
      console.error('Client validation failed for sendChatMessage:', messageValidation.error);
      return false;
    }
    
    // Basic color validation
    const validColor = typeof playerColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(playerColor) 
      ? playerColor 
      : '#DC143C';
    
    socket.emit('send-chat-message', { 
      message: message.trim(), 
      playerColor: validColor 
    });
    return true;
  },

  // Player color management
  updatePlayerColor: (color: string) => {
    // Basic color validation
    const validColor = typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color) 
      ? color 
      : '#DC143C';
    
    socket.emit('update-player-color', { color: validColor });
    return true;
  },

  // AI player management
  addAIPlayer: () => {
    socket.emit('add-ai-player');
    return true;
  },

  removeAIPlayer: (aiPlayerId: string) => {
    if (!aiPlayerId || typeof aiPlayerId !== 'string') {
      console.error('Client validation failed for removeAIPlayer: invalid AI player ID');
      return false;
    }
    
    socket.emit('remove-ai-player', { aiPlayerId });
    return true;
  },

  // Intercession selection
  selectIntercessions: (intercessionTypes: string[]) => {
    if (!Array.isArray(intercessionTypes)) {
      console.error('Client validation failed for selectIntercessions: intercessionTypes must be an array');
      return false;
    }
    
    if (intercessionTypes.length !== 2) {
      console.error('Client validation failed for selectIntercessions: must select exactly 2 intercessions');
      return false;
    }
    
    if (!intercessionTypes.every(type => typeof type === 'string' && type.length > 0)) {
      console.error('Client validation failed for selectIntercessions: invalid intercession type format');
      return false;
    }
    
    socket.emit('select-intercessions', { intercessionTypes });
    return true;
  },

  // Evocation activation
  activateEvocation: (evocationId: string) => {
    if (!evocationId || typeof evocationId !== 'string') {
      console.error('Client validation failed for activateEvocation: invalid evocation ID');
      return false;
    }
    
    socket.emit('activate-evocation', { evocationId });
    return true;
  },

  // Intercession activation
  activateIntercession: (intercessionId: string) => {
    if (!intercessionId || typeof intercessionId !== 'string') {
      console.error('Client validation failed for activateIntercession: invalid intercession ID');
      return false;
    }
    
    socket.emit('activate-intercession', { intercessionId });
    return true;
  },

  // Utility methods
  leaveRoom: () => socket.emit('leave-room'),
  
  getRoomInfo: () => socket.emit('get-room-info'),
  
  getGameState: () => socket.emit('get-game-state'),

  // Event listener setup
  setupEventListeners: (gameStore: any) => {
    // HP and damage events
    socket.on('playerDamaged', (data) => {
      console.log('Player damaged:', data);
      gameStore.updatePlayerHP(data.playerId, data.newHP);
      gameStore.showDamageIndicator(data.damage, data.playerName);
    });

    socket.on('playerHealed', (data) => {
      console.log('Player healed:', data);
      gameStore.updatePlayerHP(data.playerId, data.newHP);
      gameStore.showHealIndicator(data.healing, data.playerName);
    });

    // Evocation events
    socket.on('evocationActivated', (data) => {
      console.log('Evocation activated:', data);
      gameStore.removePlayerEvocation(data.playerId, data.evocationId);
      gameStore.addChatMessage({
        id: Date.now().toString(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: `activated evocation: ${data.evocationName}`,
        timestamp: Date.now(),
        playerColor: '#8a2be2'
      });
    });

    // Intercession events
    socket.on('intercession-activated', (data) => {
      console.log('Intercession activated:', data);
      gameStore.addChatMessage({
        id: Date.now().toString(),
        playerId: data.playerId,
        playerName: data.playerName,
        message: `activated intercession: ${data.intercessionName}`,
        timestamp: Date.now(),
        playerColor: '#4caf50'
      });
    });

    // Intercession selection events
    socket.on('intercessionsSelected', (data) => {
      console.log('Intercessions selected:', data);
      gameStore.setPlayerIntercessions(data.playerId, data.intercessions);
    });

    socket.on('allIntercessionsSelected', () => {
      console.log('All players have selected intercessions');
      // Game will start automatically
    });

    // Game state events that include HP updates
    socket.on('gameStateUpdate', (gameState) => {
      console.log('Game state updated with HP:', gameState);
      gameStore.updateGameState(gameState);
    });
  }
};
