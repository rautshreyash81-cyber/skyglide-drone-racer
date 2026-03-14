/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import { HUD } from './components/HUD';
import { Controls } from './components/Controls';
import { GameState, DroneControls, GameStatus, DroneCustomization } from './types/game';

const DEFAULT_CUSTOMIZATION: DroneCustomization = {
  model: 'RACER',
  color: '#ffffff'
};

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    level: 1,
    score: 0,
    lives: 3,
    progress: 0,
    speed: 0,
    activePowerUps: [],
    customization: DEFAULT_CUSTOMIZATION
  });

  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(
        containerRef.current, 
        (state) => setGameState(state),
        DEFAULT_CUSTOMIZATION
      );
    }
  }, []);

  const handleControlsChange = (controls: DroneControls) => {
    engineRef.current?.setControls(controls);
  };

  const handleCustomizationChange = (customization: DroneCustomization) => {
    setGameState(prev => ({ ...prev, customization }));
    engineRef.current?.updateCustomization(customization);
  };

  const handleStatusChange = (status: GameStatus) => {
    setGameState(prev => ({ ...prev, status }));
  };

  const handleStart = () => engineRef.current?.start();
  const handlePause = () => engineRef.current?.pause();
  const handleResume = () => engineRef.current?.resume();
  const handleRestart = () => engineRef.current?.restart();

  return (
    <div className="relative w-full h-screen bg-sky-400 overflow-hidden select-none touch-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* UI Layer */}
      <HUD 
        state={gameState}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRestart={handleRestart}
        onStatusChange={handleStatusChange}
        onCustomizationChange={handleCustomizationChange}
      />

      {/* Controls Layer */}
      {gameState.status === 'PLAYING' && (
        <Controls onControlsChange={handleControlsChange} />
      )}

      {/* Vignette Effect */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.4)]" />
    </div>
  );
}

