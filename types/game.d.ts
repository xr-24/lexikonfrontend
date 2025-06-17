export interface Tile {
    letter: string;
    value: number;
    id: string;
    isPowerUp?: boolean;
    powerUpType?: PowerUpType;
    emoji?: string;
    isBlank?: boolean;
    chosenLetter?: string;
    placedByPlayerId?: string;
}
export interface PowerUp {
    id: string;
    type: PowerUpType;
    emoji: string;
    name: string;
    description: string;
}
export type PowerUpType = 'SCROLL' | 'HEADSTONE' | 'WILTED_ROSE' | 'CRESCENT_MOON' | 'BURN' | 'TILE_THIEF' | 'MULTIPLIER_THIEF' | 'DUPLICATE' | 'EXTRA_TURN' | 'TILE_FREEZE' | 'SILENCE' | 'EXTRA_TILES';
export interface Evocation {
    id: string;
    type: EvocationType;
    name: string;
    description: string;
    color: string;
}
export type EvocationType = 'OROBAS' | 'BUNE' | 'GREMORY' | 'ASTAROTH' | 'AIM' | 'ANDROMALIUS' | 'VALEFOR' | 'DANTALION' | 'FURFUR' | 'FORNEUS' | 'MURMUR' | 'HAAGENTI';
export interface Intercession {
    id: string;
    type: IntercessionsType;
    name: string;
    description: string;
    cooldown: number;
    currentCooldown: number;
}
export type IntercessionsType = 'MICHAEL' | 'SAMAEL' | 'RAPHAEL' | 'URIEL' | 'GABRIEL' | 'METATRON';
export interface BoardCell {
    tile: Tile | null;
    multiplier: MultiplierType | null;
    powerUp: PowerUp | null;
}
export type MultiplierType = 'DOUBLE_LETTER' | 'TRIPLE_LETTER' | 'DOUBLE_WORD' | 'TRIPLE_WORD' | 'CENTER';
export interface Player {
    id: string;
    name: string;
    tiles: Tile[];
    score: number;
    hp: number;
    hasEndedGame: boolean;
    activePowerUps: PowerUp[];
    activePowerUpForTurn: PowerUp | null;
    evocations: Evocation[];
    intercessions: Intercession[];
    tileColor?: string;
    isAI?: boolean;
    aiPersonality?: string;
    samaelDoubleDamage?: boolean;
    urielProtection?: boolean;
}
export interface GameState {
    board: BoardCell[][];
    players: Player[];
    currentPlayerIndex: number;
    tileBag: Tile[];
    gamePhase: 'SETUP' | 'PLAYING' | 'FINISHED';
    turnNumber: number;
    playersEndedGame: string[];
    moveHistory: MoveHistoryEntry[];
}
export interface PlacedTile {
    tile: Tile;
    row: number;
    col: number;
}
export interface WordPlacement {
    word: string;
    tiles: PlacedTile[];
    direction: 'HORIZONTAL' | 'VERTICAL';
    startRow: number;
    startCol: number;
}
export interface MoveHistoryEntry {
    playerId: string;
    playerName: string;
    turnNumber: number;
    moveType: 'WORD' | 'EXCHANGE' | 'PASS';
    words?: string[];
    score: number;
    timestamp: Date;
}
//# sourceMappingURL=game.d.ts.map