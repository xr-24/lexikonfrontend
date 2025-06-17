# Scrabble Game Architecture

## State Management
- Game state: Zustand store for board, players, current turn
- Component state: React hooks for UI interactions
- Persistence: localStorage for game saves

## Component Hierarchy
- App > GameContainer > GameBoard + PlayerRack + ScoreBoard
- Feature isolation: Each game aspect in separate folder