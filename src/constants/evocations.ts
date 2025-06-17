import type { Evocation, EvocationType } from '../../types/game';

export const EVOCATION_DEFINITIONS: Record<EvocationType, Evocation> = {
  OROBAS: {
    id: 'evocation-orobas',
    type: 'OROBAS',
    name: 'Invocation of Orobas',
    description: 'Allows unlimited reuse of letters from your rack for one turn.',
    color: '#8B4513' // Brown pentagram
  },
  BUNE: {
    id: 'evocation-bune',
    type: 'BUNE',
    name: 'Invocation of Bune',
    description: 'Discard your current rack and draw a fresh one, guaranteed vowels.',
    color: '#4B0082' // Indigo pentagram
  },
  GREMORY: {
    id: 'evocation-gremory',
    type: 'GREMORY',
    name: 'Invocation of Gremory',
    description: 'Swap racks entirely with your opponent.',
    color: '#DC143C' // Crimson pentagram
  },
  ASTAROTH: {
    id: 'evocation-astaroth',
    type: 'ASTAROTH',
    name: 'Invocation of Astaroth',
    description: 'Adds one temporary wildcard tile (blank) to your rack.',
    color: '#FFD700' // Gold pentagram
  },
  AIM: {
    id: 'evocation-aim',
    type: 'AIM',
    name: 'Invocation of Aim',
    description: 'Force your opponent to discard two tiles from their rack.',
    color: '#FF4500' // Orange-red pentagram
  },
  ANDROMALIUS: {
    id: 'evocation-andromalius',
    type: 'ANDROMALIUS',
    name: 'Invocation of Andromalius',
    description: 'Steal one tile from your opponent\'s rack to use on your turn.',
    color: '#2F4F4F' // Dark slate gray pentagram
  },
  VALEFOR: {
    id: 'evocation-valefor',
    type: 'VALEFOR',
    name: 'Invocation of Valefor',
    description: 'Steal a double or triple word multiplier from the board for your own use.',
    color: '#9932CC' // Dark orchid pentagram
  },
  DANTALION: {
    id: 'evocation-dantalion',
    type: 'DANTALION',
    name: 'Invocation of Dantalion',
    description: 'Duplicate one tile in your rack.',
    color: '#00CED1' // Dark turquoise pentagram
  },
  FURFUR: {
    id: 'evocation-furfur',
    type: 'FURFUR',
    name: 'Invocation of Furfur',
    description: 'Immediately take an additional turn after your current one.',
    color: '#FF1493' // Deep pink pentagram
  },
  FORNEUS: {
    id: 'evocation-forneus',
    type: 'FORNEUS',
    name: 'Invocation of Forneus',
    description: 'Freeze a tile on the board, preventing opponents from building on it next turn.',
    color: '#00BFFF' // Deep sky blue pentagram
  },
  MURMUR: {
    id: 'evocation-murmur',
    type: 'MURMUR',
    name: 'Invocation of Murmur',
    description: 'Lock three random opponent tiles, preventing their use next turn.',
    color: '#8A2BE2' // Blue violet pentagram
  },
  HAAGENTI: {
    id: 'evocation-haagenti',
    type: 'HAAGENTI',
    name: 'Invocation of Haagenti',
    description: 'Temporarily expand your rack to 10 tiles for your current turn.',
    color: '#32CD32' // Lime green pentagram
  }
};

export const EVOCATION_TYPES: EvocationType[] = [
  'OROBAS',
  'BUNE', 
  'GREMORY',
  'ASTAROTH',
  'AIM',
  'ANDROMALIUS',
  'VALEFOR',
  'DANTALION',
  'FURFUR',
  'FORNEUS',
  'MURMUR',
  'HAAGENTI'
];

export function createEvocation(type: EvocationType): Evocation {
  const definition = EVOCATION_DEFINITIONS[type];
  return {
    ...definition,
    id: `${definition.id}-${Date.now()}-${Math.random()}`
  };
}

export function getEvocationByType(type: EvocationType): Evocation {
  return EVOCATION_DEFINITIONS[type];
}

export function getEvocationImagePath(type: EvocationType): string {
  // Map evocation types to their respective image files
  const imageMap: Record<EvocationType, string> = {
    'BUNE': '/Evocation-BuneAndromalius.png',
    'ANDROMALIUS': '/Evocation-BuneAndromalius.png',
    'FORNEUS': '/Evocation-ForneusFurfurHaagenti.png',
    'FURFUR': '/Evocation-ForneusFurfurHaagenti.png',
    'HAAGENTI': '/Evocation-ForneusFurfurHaagenti.png',
    'GREMORY': '/Evocation-GremoryValeforDantalion.png',
    'VALEFOR': '/Evocation-GremoryValeforDantalion.png',
    'DANTALION': '/Evocation-GremoryValeforDantalion.png',
    'MURMUR': '/Evocation-MurmurAim.png',
    'AIM': '/Evocation-MurmurAim.png',
    'OROBAS': '/Evocation-OrobasAsteroth.png',
    'ASTAROTH': '/Evocation-OrobasAsteroth.png'
  };
  
  return imageMap[type] || '/Evocation-OrobasAsteroth.png'; // Default fallback
}
