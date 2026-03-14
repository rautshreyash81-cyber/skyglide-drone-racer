export type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'LEVEL_COMPLETE' | 'SETTINGS' | 'INSTRUCTIONS';

export type PowerUpType = 'SHIELD' | 'BOOST' | 'MULTIPLIER';

export interface DroneCustomization {
  model: 'RACER' | 'PHANTOM' | 'WASP';
  color: string;
}

export interface GameState {
  status: GameStatus;
  level: number;
  score: number;
  coins: number;
  lives: number;
  progress: number; // 0 to 100
  speed: number;
  activePowerUps: {
    type: PowerUpType;
    endTime: number;
  }[];
  customization: DroneCustomization;
}

export interface DroneControls {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  brake: boolean;
}
