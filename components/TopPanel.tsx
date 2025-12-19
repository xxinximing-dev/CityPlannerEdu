
import React, { useState, useEffect } from 'react';
import { GameState, Phase } from '../types';

interface TopPanelProps {
  state: GameState;
}

const StatItem: React.FC<{ icon: string, label: string, value: string | number, delta?: number, color: string, isWarning?: boolean }> = ({ icon, label, value, delta, color, isWarning }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`flex flex-col items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border-b-4 transition-all 
      ${color} 
      ${isWarning ? 'animate-pulse border-red-500 bg-red-500/30' : ''} 
      ${isAnimating ? 'scale-110' : 'scale-100'}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className={`text-white font-bold text-lg ${isWarning ? 'text-red-100' : ''}`}>{value}</span>
      </div>
      <div className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
        {label} {delta !== undefined && (
          <span className={delta >= 0 ? 'text-green-300' : 'text-red-300'}>
            ({delta > 0 ? '+' : ''}{delta})
          </span>
        )}
      </div>
    </div>
  );
};

export const TopPanel: React.FC<TopPanelProps> = ({ state }) => {
  const phaseNames = {
    [Phase.BUILD]: '建造阶段',
    [Phase.VOTE]: '投票阶段',
    [Phase.DISCUSS]: '讨论阶段'
  };

  const minutes = Math.floor(state.timer / 60);
  const seconds = state.timer % 60;

  const isPowerLow = state.power > state.powerCapacity;

  return (
    <div className="w-full h-20 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 flex items-center justify-between px-6 shadow-lg z-50">
      <div className="flex items-center gap-4">
        <StatItem icon="💰" label="金币" value={state.gold.toLocaleString()} delta={state.goldDelta} color="border-yellow-400" />
        <StatItem icon="👥" label="人口" value={`${state.population}/${state.maxPopulation}`} color="border-blue-400" />
        <StatItem 
          icon="⚡" 
          label="电力" 
          value={`${Math.round(state.power)}/${Math.round(state.powerCapacity)}`} 
          color={isPowerLow ? "border-red-500" : "border-yellow-200"} 
          isWarning={isPowerLow}
        />
        <StatItem icon="🌳" label="污染" value={`${state.pollution}%`} color={state.pollution > 50 ? "border-red-500" : "border-green-400"} />
        <StatItem icon="😊" label="幸福度" value={`${state.happiness}%`} color="border-pink-300" />
      </div>

      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2 bg-black/30 px-4 py-1 rounded-full text-white">
          <span className="animate-pulse text-yellow-300">●</span>
          <span className="font-bold">{phaseNames[state.phase]}</span>
          <span className="border-l border-white/30 pl-2 ml-2">倒计时 {minutes}:{seconds.toString().padStart(2, '0')}</span>
        </div>
        <div className="text-white/70 text-sm mt-1">游戏内第 {state.day} 天</div>
      </div>
    </div>
  );
};
