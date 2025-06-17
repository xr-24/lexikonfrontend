import { create } from 'zustand';
import type { GameState, Player, Tile, PlacedTile, BoardCell } from '../../types/game';
import type { ChatMessage } from '../../features/chat/types/chat';
import { createEmptyBoard } from '../../features/game-board/constants/board';
import { moveManager, type MoveResult } from '../../features/game-board/services/moveManager';
import { socket, socketService } from '../services/socketService';
import { soundService } from '../services/soundService';

// Room management state
interface RoomState {
  roomCode: string | null;
  playerName: string | null;
  playerId: string | null;
  isHost: boolean;
  roomPlayers: Array<{ id: string; name: string; isHost: boolean; isAI?: boolean }>;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  isSoloMode: boolean;
  intercessionSelectionStarted: boolean;
}

// UI state for multiplayer
interface UIState {
  pendingTiles: PlacedTile[];
  placedTileIds: string[]; // Track tiles placed this turn for persistent highlighting
  currentMoveErrors: string[];
  lastMoveResult: MoveResult | null;
  isMyTurn: boolean;
  uiPhase: 'ROOM_SELECTION' | 'LOBBY' | 'PLAYING' | 'FINISHED';
  animatingWords: PlacedTile[][]; // Track words being animated
}

// Chat state
interface ChatState {
  chatMessages: ChatMessage[];
  playerChatColor: string | null;
  chatUnreadCount: number;
}

// Settings state
interface SettingsState {
  playerTileColor: string | null;
}

interface GameStore extends GameState, RoomState, UIState, ChatState, SettingsState {
  // Room management actions
  createRoom: (playerName: string) => void;
  createSoloRoom: (playerName: string) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  startGame: () => void;
  leaveRoom: () => void;
  addAIPlayer: () => void;
  removeAIPlayer: (aiPlayerId: string) => void;

  // Game actions (emit to socket)
  addPendingTile: (tile: Tile, row: number, col: number) => void;
  removePendingTile: (row: number, col: number) => void;
  clearPendingMove: () => void;
  commitMove: () => void;
  exchangeTiles: (tileIds: string[]) => void;
  passTurn: () => void;
  endGame: () => void;

  // Power-up actions (for compatibility)
  activatePowerUp: (playerId: string, powerUpId: string) => void;
  activatePowerUpTile: (playerId: string, tileId: string) => void;

  // New interactive powerup actions
  executeBurnPowerUp: (targetTileIds: string[]) => void;
  executeTileThiefPowerUp: (targetTileId: string) => void;
  executeMultiplierThiefPowerUp: (row: number, col: number) => void;
  executeDuplicatePowerUp: (sourceTileId: string) => void;
  executeTileFreezePowerUp: (row: number, col: number) => void;
  executeSilencePowerUp: () => void;
  executeExtraTilesPowerUp: () => void;
  executeExtraTurnPowerUp: () => void;

  // Chat actions
  sendChatMessage: (message: string) => void;
  setPlayerChatColor: (color: string) => void;
  markChatAsRead: () => void;

  // Settings actions
  setPlayerTileColor: (color: string) => void;

  // UI helpers
  previewBoard: () => BoardCell[][];
  setMoveErrors: (errors: string[]) => void;
  getCurrentPlayer: () => Player | null;
  isCurrentPlayer: (playerId: string) => boolean;

  // Socket event handlers
  handleGameStateUpdate: (gameState: GameState) => void;
  handleRoomUpdate: (roomData: any) => void;
  handleError: (error: string) => void;
  handlePlayerJoined: (player: any) => void;
  handlePlayerLeft: (playerId: string) => void;
  handleGameStarted: () => void;
}

const initialGameState: GameState = {
  board: createEmptyBoard(),
  players: [],
  currentPlayerIndex: 0,
  tileBag: [],
  gamePhase: 'SETUP',
  turnNumber: 1,
  playersEndedGame: [],
  moveHistory: [],
};

const initialRoomState: RoomState = {
  roomCode: null,
  playerName: null,
  playerId: null,
  isHost: false,
  roomPlayers: [],
  connectionStatus: 'disconnected',
  error: null,
  isSoloMode: false,
  intercessionSelectionStarted: false,
};

const initialUIState: UIState = {
  pendingTiles: [],
  placedTileIds: [],
  currentMoveErrors: [],
  lastMoveResult: null,
  isMyTurn: false,
  uiPhase: 'ROOM_SELECTION',
  animatingWords: [],
};

const initialChatState: ChatState = {
  chatMessages: [],
  playerChatColor: null,
  chatUnreadCount: 0,
};

const initialSettingsState: SettingsState = {
  playerTileColor: null,
};

export const useGameStore = create<GameStore>((set, get) => {
  // Set up socket listeners
  socket.on('connect', () => {
    set({ connectionStatus: 'connected', error: null });
  });

  socket.on('disconnect', () => {
    set({ connectionStatus: 'disconnected' });
  });

  socket.on('error', (error: any) => {
    get().handleError(error.message || 'Connection error');
  });

  socket.on('room-created', (data: any) => {
    if (data.success && data.room) {
      // Find the current player in the room
      const currentPlayer = data.room.players.find((p: any) => p.name === get().playerName);
      set({
        roomCode: data.room.code,
        playerId: currentPlayer?.id || null,
        isHost: true,
        uiPhase: 'LOBBY',
        intercessionSelectionStarted: data.room.intercessionSelectionStarted ?? false,
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost
        })),
      });
    } else {
      get().handleError(data.error || 'Failed to create room');
    }
  });

  socket.on('room-joined', (data: any) => {
    if (data.success && data.room) {
      // Find the current player in the room
      const currentPlayer = data.room.players.find((p: any) => p.name === get().playerName);
      set({
        roomCode: data.room.code,
        playerId: currentPlayer?.id || null,
        isHost: false,
        uiPhase: 'LOBBY',
        intercessionSelectionStarted: data.room.intercessionSelectionStarted ?? false,
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost
        })),
      });
    } else {
      get().handleError(data.error || 'Failed to join room');
    }
  });

  socket.on('room-updated', (room: any) => {
    set({
      intercessionSelectionStarted: room.intercessionSelectionStarted ?? false,
      roomPlayers: room.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        isAI: p.isAI
      })),
    });
  });

  socket.on('player-joined', (data: any) => {
    if (data.room) {
      set({
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAI: p.isAI
        })),
      });
    }
  });

  socket.on('player-left', (data: any) => {
    if (data.room) {
      set({
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAI: p.isAI
        })),
      });
    }
  });

  socket.on('game-started', (data: any) => {
    if (data.success && data.gameState) {
      get().handleGameStateUpdate(data.gameState);
      set({ uiPhase: 'PLAYING' });
      // Play game start sound
      soundService.playGameStart();
    } else {
      get().handleError(data.error || 'Failed to start game');
    }
  });

  socket.on('game-state-update', (gameState: GameState) => {
    get().handleGameStateUpdate(gameState);
  });

  socket.on('commit-move-response', (result: any) => {
    if (result.success) {
      set({ 
        pendingTiles: [], 
        placedTileIds: [], // Clear placed tiles on successful commit
        currentMoveErrors: [], 
        lastMoveResult: result.moveResult 
      });
    } else {
      set({ 
        currentMoveErrors: result.errors || ['Move failed'],
        lastMoveResult: result.moveResult 
      });
    }
  });

  socket.on('game-state-updated', (data: any) => {
    if (data.gameState) {
      get().handleGameStateUpdate(data.gameState);
      // Update pending tiles if provided
      if (data.pendingTiles !== undefined) {
        set({ pendingTiles: data.pendingTiles });
      }
    }
  });

  socket.on('room-error', (data: any) => {
    get().handleError(data.message);
  });

  // Power-up response handlers
  socket.on('activate-powerup-response', (result: any) => {
    if (result.success) {
      set({ currentMoveErrors: [] });
    } else {
      set({ currentMoveErrors: result.errors || ['Failed to activate power-up'] });
    }
  });

  socket.on('activate-powerup-tile-response', (result: any) => {
    if (result.success) {
      set({ currentMoveErrors: [] });
    } else {
      set({ currentMoveErrors: result.errors || ['Failed to activate power-up tile'] });
    }
  });

  // Power-up notification handlers
  socket.on('powerup-activated', (data: any) => {
    // Play power-up sound when someone uses a power-up
    soundService.playPowerUp();
    console.log(`${data.playerName} activated a power-up`);
  });

  socket.on('powerup-tile-activated', (data: any) => {
    // Play power-up sound when someone uses a power-up tile
    soundService.playPowerUp();
    console.log(`${data.playerName} activated a power-up tile`);
  });

  // New powerup execution response handlers
  socket.on('execute-powerup-response', (result: any) => {
    if (result.success) {
      set({ currentMoveErrors: [] });
      // Play power-up sound on successful execution
      soundService.playPowerUp();
    } else {
      set({ currentMoveErrors: result.errors || ['Failed to execute power-up'] });
    }
  });

  socket.on('powerup-executed', (data: any) => {
    // Play power-up sound when someone executes a power-up
    soundService.playPowerUp();
    console.log(`${data.playerName} executed ${data.powerUpType} power-up`);
  });

  // Chat message listener
  socket.on('chat-message', (data: any) => {
    const { chatMessages, playerId } = get();
    const chatMessage: ChatMessage = {
      id: data.id || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
      playerId: data.playerId,
      playerName: data.playerName,
      playerColor: data.playerColor || '#DC143C',
      message: data.message,
      timestamp: new Date(data.timestamp),
    };

    // Add to chat messages
    set({ chatMessages: [...chatMessages, chatMessage] });

    // Increment unread count if message is from another player
    if (data.playerId !== playerId) {
      const { chatUnreadCount } = get();
      set({ chatUnreadCount: chatUnreadCount + 1 });
    }
  });

  // AI player management listeners
  socket.on('ai-player-added', (data: any) => {
    if (data.success && data.room) {
      set({
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAI: p.isAI
        })),
      });
    } else {
      get().handleError(data.error || 'Failed to add AI player');
    }
  });

  socket.on('ai-player-removed', (data: any) => {
    if (data.success && data.room) {
      set({
        roomPlayers: data.room.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          isAI: p.isAI
        })),
      });
    } else {
      get().handleError(data.error || 'Failed to remove AI player');
    }
  });

  return {
    ...initialGameState,
    ...initialRoomState,
    ...initialUIState,
    ...initialChatState,
    ...initialSettingsState,

    // Room management actions
    createRoom: (playerName: string) => {
      set({ 
        playerName, 
        connectionStatus: 'connecting',
        error: null,
        isSoloMode: false
      });
      socketService.createRoom(playerName);
    },

    createSoloRoom: (playerName: string) => {
      set({ 
        playerName, 
        connectionStatus: 'connecting',
        error: null,
        isSoloMode: true
      });
      socketService.createRoom(playerName);
    },

    joinRoom: (roomCode: string, playerName: string) => {
      set({ 
        playerName, 
        connectionStatus: 'connecting',
        error: null 
      });
      socketService.joinRoom(roomCode, playerName);
    },

    startGame: () => {
      if (get().isHost) {
        socketService.startGame();
      }
    },

    leaveRoom: () => {
      socket.disconnect();
      set({
        ...initialRoomState,
        ...initialUIState,
        uiPhase: 'ROOM_SELECTION',
      });
    },

    addAIPlayer: () => {
      if (get().isHost) {
        socketService.addAIPlayer();
      }
    },

    removeAIPlayer: (aiPlayerId: string) => {
      if (get().isHost) {
        socketService.removeAIPlayer(aiPlayerId);
      }
    },

    // Game actions (emit to socket)
    addPendingTile: (tile: Tile, row: number, col: number) => {
      const { board, pendingTiles, placedTileIds, isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      const { success, newPendingTiles } = moveManager.addTile(tile, row, col, board, pendingTiles);
      if (success) {
        // Add tile ID to placed tiles for persistent highlighting
        const newPlacedTileIds = [...placedTileIds];
        if (!newPlacedTileIds.includes(tile.id)) {
          newPlacedTileIds.push(tile.id);
        }
        
        set({ 
          pendingTiles: newPendingTiles, 
          placedTileIds: newPlacedTileIds,
          currentMoveErrors: [] 
        });
        socketService.placeTile(tile, row, col);
      }
    },

    removePendingTile: (row: number, col: number) => {
      const { pendingTiles, placedTileIds, isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      // Find the tile being removed to update placedTileIds
      const removedTile = pendingTiles.find(pt => pt.row === row && pt.col === col);
      const { newPendingTiles } = moveManager.removeTile(row, col, pendingTiles);
      
      // Remove tile ID from placed tiles
      const newPlacedTileIds = removedTile 
        ? placedTileIds.filter(id => id !== removedTile.tile.id)
        : placedTileIds;
      
      set({ 
        pendingTiles: newPendingTiles, 
        placedTileIds: newPlacedTileIds,
        currentMoveErrors: [] 
      });
      socketService.removeTile(row, col);
    },

    clearPendingMove: () => {
      set({ 
        pendingTiles: [], 
        placedTileIds: [], 
        currentMoveErrors: [], 
        lastMoveResult: null 
      });
      socketService.clearPendingMove();
    },

    commitMove: () => {
      const { isMyTurn, pendingTiles } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      if (pendingTiles.length === 0) {
        set({ currentMoveErrors: ['No tiles placed'] });
        return;
      }

      socketService.commitMove();
    },

    exchangeTiles: (tileIds: string[]) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      if (tileIds.length === 0) {
        set({ currentMoveErrors: ['No tiles selected for exchange'] });
        return;
      }

      socketService.exchangeTiles(tileIds);
      set({ pendingTiles: [], currentMoveErrors: [], lastMoveResult: null });
    },

    passTurn: () => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.passTurn();
      set({ pendingTiles: [], currentMoveErrors: [], lastMoveResult: null });
    },

    endGame: () => {
      socketService.endGame();
    },

    // Power-up actions
    activatePowerUp: (playerId: string, powerUpId: string) => {
      const { isMyTurn, playerId: currentPlayerId } = get();
      
      if (!isMyTurn || playerId !== currentPlayerId) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.activatePowerUp(powerUpId);
    },

    activatePowerUpTile: (playerId: string, tileId: string) => {
      const { isMyTurn, playerId: currentPlayerId } = get();
      
      if (!isMyTurn || playerId !== currentPlayerId) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.activatePowerUpTile(tileId);
    },

    // New interactive powerup execution methods
    executeBurnPowerUp: (targetTileIds: string[]) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('BURN', { targetTileIds });
    },

    executeTileThiefPowerUp: (targetTileId: string) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('TILE_THIEF', { targetTileId });
    },

    executeMultiplierThiefPowerUp: (row: number, col: number) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('MULTIPLIER_THIEF', { row, col });
    },

    executeDuplicatePowerUp: (sourceTileId: string) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('DUPLICATE', { sourceTileId });
    },

    executeTileFreezePowerUp: (row: number, col: number) => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('TILE_FREEZE', { row, col });
    },

    executeSilencePowerUp: () => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('SILENCE', {});
    },

    executeExtraTilesPowerUp: () => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('EXTRA_TILES', {});
    },

    executeExtraTurnPowerUp: () => {
      const { isMyTurn } = get();
      
      if (!isMyTurn) {
        set({ currentMoveErrors: ['Not your turn'] });
        return;
      }

      socketService.executePowerUp('EXTRA_TURN', {});
    },

    // Chat actions
    sendChatMessage: (message: string) => {
      const { playerName, playerId, playerChatColor } = get();
      
      if (!playerName || !playerId) {
        return;
      }

      // Send to server via socket
      socketService.sendChatMessage(message, playerChatColor || '#DC143C');
    },

    setPlayerChatColor: (color: string) => {
      set({ playerChatColor: color });
    },

    markChatAsRead: () => {
      set({ chatUnreadCount: 0 });
    },

    // Settings actions
    setPlayerTileColor: (color: string) => {
      set({ playerTileColor: color });
      // Sync color with server for multiplayer
      socketService.updatePlayerColor(color);
    },

    // UI helpers
    previewBoard: () => {
      const { board, pendingTiles } = get();
      return moveManager.previewMove(board, pendingTiles);
    },

    setMoveErrors: (errors: string[]) => {
      set({ currentMoveErrors: errors });
    },

    getCurrentPlayer: () => {
      const { players, playerId } = get();
      return players.find(p => p.id === playerId) || null;
    },

    isCurrentPlayer: (playerId: string) => {
      return get().playerId === playerId;
    },

    // Socket event handlers
    handleGameStateUpdate: (gameState: GameState) => {
      const { playerId, currentPlayerIndex, pendingTiles, placedTileIds, turnNumber, roomPlayers } = get();
      const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === playerId;
      const wasMyTurn = gameState.players[currentPlayerIndex]?.id === playerId;
      
      // Check if turn has changed (someone completed their move)
      const turnChanged = gameState.turnNumber > turnNumber;
      
      // If it's no longer my turn, clear pending tiles and errors
      const shouldClearPending = wasMyTurn && !isMyTurn;
      
      // Play sounds based on game state changes
      if (turnChanged) {
        // Check if the player who just completed their turn was an AI
        // We need to look at the previous turn's player, which would be at the previous currentPlayerIndex
        let previousPlayerIndex = gameState.currentPlayerIndex - 1;
        if (previousPlayerIndex < 0) {
          previousPlayerIndex = gameState.players.length - 1;
        }
        
        const previousPlayer = gameState.players[previousPlayerIndex];
        const previousRoomPlayer = roomPlayers.find(rp => rp.id === previousPlayer?.id);
        
        if (previousRoomPlayer?.isAI) {
          // Play AI sound when AI completes a move
          soundService.playAIPlay();
        } else {
          // Play word form sound when human player completes a move
          soundService.playWordForm();
        }
      }
      
      // Play "your turn" sound when it becomes the player's turn
      if (!wasMyTurn && isMyTurn) {
        soundService.playYourTurn();
      }
      
      set({
        ...gameState,
        isMyTurn,
        pendingTiles: shouldClearPending ? [] : pendingTiles,
        placedTileIds: shouldClearPending ? [] : placedTileIds, // Clear placed tile IDs when turn changes
        currentMoveErrors: shouldClearPending ? [] : get().currentMoveErrors,
        uiPhase: gameState.gamePhase === 'PLAYING' ? 'PLAYING' : 
                gameState.gamePhase === 'FINISHED' ? 'FINISHED' : get().uiPhase,
      });
    },

    handleRoomUpdate: (roomData: any) => {
      set({
        roomPlayers: roomData.players,
      });
    },

    handleError: (error: string) => {
      set({ 
        error, 
        connectionStatus: 'error',
        currentMoveErrors: [error] 
      });
    },

    handlePlayerJoined: (player: any) => {
      const { roomPlayers } = get();
      set({
        roomPlayers: [...roomPlayers, player],
      });
    },

    handlePlayerLeft: (playerId: string) => {
      const { roomPlayers } = get();
      set({
        roomPlayers: roomPlayers.filter(p => p.id !== playerId),
      });
    },

    handleGameStarted: () => {
      set({
        uiPhase: 'PLAYING',
      });
    },
  };
});
