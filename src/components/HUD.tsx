import React from 'react';
import { Play, RotateCcw, Pause, ChevronRight, Settings, Info, Trophy, Shield, Zap, Star, Coins } from 'lucide-react';
import { GameState, GameStatus, DroneCustomization } from '../types/game';

interface HUDProps {
  state: GameState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onStatusChange: (status: GameStatus) => void;
  onCustomizationChange: (customization: DroneCustomization) => void;
}

export const HUD: React.FC<HUDProps> = ({ state, onStart, onPause, onResume, onRestart, onStatusChange, onCustomizationChange }) => {
  const isPlaying = state.status === 'PLAYING';

  const GlassPanel = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl ${className}`}>
      {children}
    </div>
  );

  const Button = ({ onClick, children, variant = "primary", className = "" }: { onClick: () => void, children: React.ReactNode, variant?: "primary" | "secondary" | "danger", className?: string }) => {
    const variants = {
      primary: "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]",
      secondary: "bg-white/10 hover:bg-white/20 text-white",
      danger: "bg-red-500 hover:bg-red-400 text-white"
    };
    return (
      <button 
        onClick={onClick}
        className={`px-8 py-4 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 ${variants[variant]} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col font-sans text-white">
      {/* Top Bar (HUD during play) */}
      {(isPlaying || state.status === 'PAUSED') && (
        <div className="p-6 flex justify-between items-start">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <GlassPanel className="px-4 py-2">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Level</span>
                <div className="text-2xl font-black leading-none">{state.level}</div>
              </GlassPanel>
              <GlassPanel className="px-4 py-2">
                <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Score</span>
                <div className="text-2xl font-black leading-none">{state.score.toLocaleString()}</div>
              </GlassPanel>
              <GlassPanel className="px-4 py-2 flex items-center gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold">Coins</span>
                  <div className="text-2xl font-black leading-none text-yellow-400">{state.coins}</div>
                </div>
                <Coins className="text-yellow-400" size={24} />
              </GlassPanel>
            </div>
            
            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                style={{ width: `${state.progress}%` }}
              />
            </div>

            {/* Active Power-ups */}
            <div className="flex gap-2">
              {state.activePowerUps.map((p, i) => (
                <div key={i} className="bg-emerald-500/20 border border-emerald-500/50 p-2 rounded-lg animate-pulse">
                  {p.type === 'SHIELD' && <Shield size={16} className="text-cyan-400" />}
                  {p.type === 'BOOST' && <Zap size={16} className="text-yellow-400" />}
                  {p.type === 'MULTIPLIER' && <Star size={16} className="text-purple-400" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <GlassPanel className="px-4 py-2 text-right">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Hull Integrity</span>
              <div className="flex gap-1 justify-end mt-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-1.5 rounded-full transition-all ${i < state.lives ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10'}`} 
                  />
                ))}
              </div>
            </GlassPanel>
            <GlassPanel className="px-4 py-2 text-right">
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Velocity</span>
              <div className="text-xl font-mono leading-none">{state.speed} <span className="text-xs">km/h</span></div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Center Menus */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto p-4">
        {state.status === 'START' && (
          <GlassPanel className="p-12 text-center max-w-lg w-full">
            <h1 className="text-7xl font-black mb-2 tracking-tighter italic bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">SKYGLIDE</h1>
            <p className="text-emerald-400 uppercase tracking-[0.4em] text-[10px] font-bold mb-12">Atmospheric Drone Racing</p>
            
            <div className="grid gap-4">
              <Button onClick={onStart}>
                <Play fill="black" size={24} />
                LAUNCH MISSION
              </Button>
              
              <div className="grid grid-cols-3 gap-4">
                <Button onClick={() => onStatusChange('SETTINGS')} variant="secondary" className="px-4">
                  <Settings size={20} />
                </Button>
                <Button onClick={() => onStatusChange('INSTRUCTIONS')} variant="secondary" className="px-4">
                  <Info size={20} />
                </Button>
                <Button onClick={() => {}} variant="secondary" className="px-4 opacity-50 cursor-not-allowed">
                  <Trophy size={20} />
                </Button>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10 flex justify-center gap-8 text-[10px] text-white/40 uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> System Online</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Engine Ready</div>
            </div>
          </GlassPanel>
        )}

        {state.status === 'SETTINGS' && (
          <GlassPanel className="p-12 max-w-2xl w-full">
            <h2 className="text-4xl font-black mb-8 italic">DRONE CUSTOMIZATION</h2>
            
            <div className="space-y-8">
              <div>
                <label className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-4 block">Select Chassis</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['RACER', 'PHANTOM', 'WASP'] as const).map(m => (
                    <button 
                      key={m}
                      onClick={() => onCustomizationChange({ ...state.customization, model: m })}
                      className={`p-4 rounded-2xl border-2 transition-all ${state.customization.model === m ? 'border-emerald-500 bg-emerald-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="text-sm font-black">{m}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-4 block">Hull Color</label>
                <div className="flex gap-4 flex-wrap">
                  {['#ffffff', '#ff3366', '#33ff99', '#3366ff', '#ffff33', '#ff9933'].map(c => (
                    <button 
                      key={c}
                      onClick={() => onCustomizationChange({ ...state.customization, color: c })}
                      className={`w-12 h-12 rounded-full border-4 transition-all ${state.customization.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={() => onStatusChange('START')} variant="secondary" className="w-full">
                SAVE & RETURN
              </Button>
            </div>
          </GlassPanel>
        )}

        {state.status === 'INSTRUCTIONS' && (
          <GlassPanel className="p-12 max-w-2xl w-full">
            <h2 className="text-4xl font-black mb-8 italic">FLIGHT MANUAL</h2>
            <div className="space-y-6 text-sm text-white/70 leading-relaxed">
              <p>Navigate your high-performance drone through atmospheric hurdles. Maintain velocity and avoid structural failure.</p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-emerald-400 font-bold mb-2 uppercase tracking-widest text-xs">Controls</h3>
                  <ul className="space-y-1">
                    <li>WASD / Arrows: Pitch & Roll</li>
                    <li>Shift: Emergency Boost</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-emerald-400 font-bold mb-2 uppercase tracking-widest text-xs">Power-ups</h3>
                  <ul className="space-y-1">
                    <li><span className="text-cyan-400">Shield</span>: Kinetic Barrier</li>
                    <li><span className="text-yellow-400">Boost</span>: Overclocked Drive</li>
                    <li><span className="text-purple-400">Star</span>: Data Multiplier</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button onClick={() => onStatusChange('START')} variant="secondary" className="w-full mt-12">
              UNDERSTOOD
            </Button>
          </GlassPanel>
        )}

        {state.status === 'PAUSED' && (
          <GlassPanel className="p-12 text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-black mb-8 italic">SYSTEMS STANDBY</h2>
            <div className="flex flex-col gap-4">
              <Button onClick={onResume}>
                <Play fill="black" size={20} />
                RESUME
              </Button>
              <Button onClick={onRestart} variant="secondary">
                <RotateCcw size={20} />
                RESTART
              </Button>
            </div>
          </GlassPanel>
        )}

        {state.status === 'GAMEOVER' && (
          <GlassPanel className="p-12 text-center border-red-500/30 animate-in fade-in zoom-in duration-300">
            <h2 className="text-6xl font-black mb-2 italic text-red-500">CRITICAL FAILURE</h2>
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Final Score</p>
                <p className="text-2xl font-black">{state.score.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 uppercase tracking-widest text-[10px] font-bold">Coins Collected</p>
                <p className="text-2xl font-black text-yellow-400">{state.coins}</p>
              </div>
            </div>
            <Button onClick={onRestart} variant="primary" className="bg-red-500 hover:bg-red-400 mx-auto">
              <RotateCcw size={20} />
              REBOOT SYSTEMS
            </Button>
          </GlassPanel>
        )}

        {state.status === 'LEVEL_COMPLETE' && (
          <GlassPanel className="p-12 text-center border-emerald-500/30 animate-in fade-in zoom-in duration-300">
            <h2 className="text-6xl font-black mb-2 italic text-emerald-400">LEVEL CLEAR</h2>
            <p className="text-white/60 mb-8 uppercase tracking-widest text-sm">Proceeding to Sector {state.level}</p>
            <Button onClick={onStart} className="mx-auto">
              NEXT SECTOR
              <ChevronRight size={20} />
            </Button>
          </GlassPanel>
        )}
      </div>

      {/* Pause Button (Top Right) */}
      {isPlaying && (
        <div className="absolute top-6 right-6 pointer-events-auto">
          <button 
            onClick={onPause}
            className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/20 transition-all"
          >
            <Pause size={24} />
          </button>
        </div>
      )}
    </div>
  );
};
