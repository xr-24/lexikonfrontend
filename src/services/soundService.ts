class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private musicEnabled: boolean = true;

  constructor() {
    this.preloadSounds();
    this.setupBackgroundMusic();
  }

  private preloadSounds() {
    const soundFiles = {
      gameStart: '/game_start.wav',
      click: '/click.wav',
      mainClick: '/mainclick.wav',
      tile: '/tile.wav',
      wordForm: '/wordform.wav',
      yourTurn: '/yourturn.wav',
      powerUp: '/powerup.wav',
      aiPlay: '/aiplay.wav',
      // Damage sounds
      damagePlayer: '/damage_player.wav',
      damageAI: '/damage_ai.wav',
      // Evocation sounds
      evocationBuneAndromalius: '/Evocation-BuneAndromalius.wav',
      evocationForneusFurfurHaagenti: '/Evocation-ForneusFurfurHaagenti.wav',
      evocationGremoryValeforDantalion: '/Evocation-GremoryValeforDantelion.wav',
      evocationMurmurAim: '/Evocation-MurmurAim.wav',
      evocationOrobasAstaroth: '/Evocation-OrobasAsteroth.wav',
      // Intercession sounds
      intercessionGabriel: '/Intercession-Gabriel.wav',
      intercessionMetatron: '/Intercession-Metatron.wav',
      intercessionMichael: '/Intercession-Michael.wav',
      intercessionRaphael: '/Intercession-Raphael.wav',
      intercessionSamael: '/Intercession-Samael.wav',
      intercessionUriel: '/Intercession-Uriel.wav'
    };

    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = 0.7; // Set default volume
      this.sounds.set(key, audio);
    });
  }

  private setupBackgroundMusic() {
    this.backgroundMusic = new Audio('/main.wav');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3; // Lower volume for background music
    this.backgroundMusic.preload = 'auto';
  }

  private playSound(soundKey: string) {
    if (!this.isEnabled) {
      console.log(`Sound disabled, not playing ${soundKey}`);
      return;
    }

    const sound = this.sounds.get(soundKey);
    if (sound) {
      console.log(`Playing sound: ${soundKey}`);
      // Reset the audio to the beginning in case it's already playing
      sound.currentTime = 0;
      sound.play().then(() => {
        console.log(`Sound ${soundKey} played successfully`);
      }).catch(error => {
        console.warn(`Failed to play sound ${soundKey}:`, error);
      });
    } else {
      console.warn(`Sound ${soundKey} not found`);
    }
  }

  // Public methods for each sound effect
  playGameStart() {
    this.playSound('gameStart');
  }

  playClick() {
    this.playSound('click');
  }

  playTile() {
    this.playSound('tile');
  }

  playWordForm() {
    this.playSound('wordForm');
  }

  playYourTurn() {
    this.playSound('yourTurn');
  }

  playPowerUp() {
    this.playSound('powerUp');
  }

  playAIPlay() {
    this.playSound('aiPlay');
  }

  playMainClick() {
    this.playSound('mainClick');
  }

  // Damage sounds
  playPlayerDamage() {
    this.playSound('damagePlayer');
  }

  playAIDamage() {
    this.playSound('damageAI');
  }

  // Evocation sounds
  playEvocation(evocationType: string) {
    const soundMap: Record<string, string> = {
      'BUNE': 'evocationBuneAndromalius',
      'ANDROMALIUS': 'evocationBuneAndromalius',
      'FORNEUS': 'evocationForneusFurfurHaagenti',
      'FURFUR': 'evocationForneusFurfurHaagenti',
      'HAAGENTI': 'evocationForneusFurfurHaagenti',
      'GREMORY': 'evocationGremoryValeforDantalion',
      'VALEFOR': 'evocationGremoryValeforDantalion',
      'DANTALION': 'evocationGremoryValeforDantalion',
      'MURMUR': 'evocationMurmurAim',
      'AIM': 'evocationMurmurAim',
      'OROBAS': 'evocationOrobasAstaroth',
      'ASTAROTH': 'evocationOrobasAstaroth'
    };
    
    const soundKey = soundMap[evocationType];
    if (soundKey) {
      this.playSound(soundKey);
    }
  }

  // Intercession sounds
  playIntercession(intercessionType: string) {
    const soundMap: Record<string, string> = {
      'GABRIEL': 'intercessionGabriel',
      'METATRON': 'intercessionMetatron',
      'MICHAEL': 'intercessionMichael',
      'RAPHAEL': 'intercessionRaphael',
      'SAMAEL': 'intercessionSamael',
      'URIEL': 'intercessionUriel'
    };
    
    const soundKey = soundMap[intercessionType];
    if (soundKey) {
      this.playSound(soundKey);
    }
  }

  // Settings
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume = clampedVolume;
    });
  }

  // Background music controls
  startBackgroundMusic() {
    if (!this.musicEnabled || !this.backgroundMusic) {
      console.log('Background music not enabled or not loaded');
      return;
    }
    
    console.log('Attempting to start background music...');
    this.backgroundMusic.play().then(() => {
      console.log('Background music started successfully');
    }).catch(error => {
      console.warn('Failed to start background music:', error);
    });
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  isMusicPlaying(): boolean {
    return this.backgroundMusic ? !this.backgroundMusic.paused : false;
  }

  setMusicVolume(volume: number) {
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Create and export a singleton instance
export const soundService = new SoundService();
