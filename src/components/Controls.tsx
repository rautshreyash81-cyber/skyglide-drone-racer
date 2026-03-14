import React, { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap, Hand } from 'lucide-react';
import { DroneControls } from '../types/game';

interface ControlsProps {
  onControlsChange: (controls: DroneControls) => void;
}

export const Controls: React.FC<ControlsProps> = ({ onControlsChange }) => {
  const [controls, setControls] = useState<DroneControls>({
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    brake: false
  });

  const updateControls = useCallback((newControls: Partial<DroneControls>) => {
    setControls(prev => {
      const updated = { ...prev, ...newControls };
      onControlsChange(updated);
      return updated;
    });
  }, [onControlsChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': updateControls({ up: true }); break;
        case 's': case 'arrowdown': updateControls({ down: true }); break;
        case 'a': case 'arrowleft': updateControls({ left: true }); break;
        case 'd': case 'arrowright': updateControls({ right: true }); break;
        case 'shift': updateControls({ boost: true }); break;
        case ' ': case 'x': updateControls({ brake: true }); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup': updateControls({ up: false }); break;
        case 's': case 'arrowdown': updateControls({ down: false }); break;
        case 'a': case 'arrowleft': updateControls({ left: false }); break;
        case 'd': case 'arrowright': updateControls({ right: false }); break;
        case 'shift': updateControls({ boost: false }); break;
        case ' ': case 'x': updateControls({ brake: false }); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateControls]);

  const handleTouch = (key: keyof DroneControls, active: boolean) => {
    updateControls({ [key]: active });
  };

  const Button = ({ icon: Icon, controlKey, className = "" }: { icon: any, controlKey: keyof DroneControls, className?: string }) => (
    <button
      onMouseDown={() => handleTouch(controlKey, true)}
      onMouseUp={() => handleTouch(controlKey, false)}
      onMouseLeave={() => handleTouch(controlKey, false)}
      onTouchStart={(e) => { e.preventDefault(); handleTouch(controlKey, true); }}
      onTouchEnd={(e) => { e.preventDefault(); handleTouch(controlKey, false); }}
      className={`
        w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 
        active:scale-90 active:bg-emerald-500 active:text-black 
        transition-all duration-100 select-none
        ${controls[controlKey] ? 'bg-emerald-500 text-black scale-90 shadow-[0_0_30px_rgba(16,185,129,0.6)] border-emerald-400' : 'text-white'}
        ${className}
      `}
    >
      <Icon size={32} />
    </button>
  );

  return (
    <div className="absolute bottom-8 left-0 right-0 px-8 flex justify-between items-end pointer-events-none">
      {/* Left Side: Movement D-Pad */}
      <div className="grid grid-cols-3 gap-2 pointer-events-auto">
        <div />
        <Button icon={ChevronUp} controlKey="up" />
        <div />
        <Button icon={ChevronLeft} controlKey="left" />
        <Button icon={ChevronDown} controlKey="down" />
        <Button icon={ChevronRight} controlKey="right" />
      </div>

      {/* Right Side: Boost & Brake Buttons */}
      <div className="pointer-events-auto flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Button 
            icon={Zap} 
            controlKey="boost" 
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all duration-300 ${controls.boost ? 'shadow-[0_0_50px_rgba(16,185,129,0.8)]' : 'border-emerald-500/30'}`} 
          />
          <div className={`text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-300 ${controls.boost ? 'text-emerald-400 opacity-100 scale-110' : 'text-white/30 opacity-50'}`}>
            Boost
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Button 
            icon={Hand} 
            controlKey="brake" 
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all duration-300 ${controls.brake ? 'shadow-[0_0_50px_rgba(239,68,68,0.8)] border-red-500' : 'border-red-500/30'}`} 
          />
          <div className={`text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-300 ${controls.brake ? 'text-red-400 opacity-100 scale-110' : 'text-white/30 opacity-50'}`}>
            Brake
          </div>
        </div>
      </div>
    </div>
  );
};
