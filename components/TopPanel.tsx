import React, { useState, useEffect, memo } from 'react';
import { GameState } from '../types';

interface TopPanelProps {
  state: GameState;
  onHomeClick: () => void;
}

// 优化：使用 memo 且只在 value 真正变化时才重新渲染
// 同时动画逻辑改为更轻量的 CSS 处理
const StatItem = memo(({ icon, label, value, delta, color, isWarning }: { icon: string, label: string, value: string | number, delta?: number, color: string, isWarning?: boolean }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 只有当 delta 存在且不为0时，或者没有delta但value变化了，才做动画
    if (delta !== 0 || delta === undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [value, delta]);

  return (
    <div className={`flex flex-col items-center bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border-b-4 transition-transform duration-300
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
});

export const TopPanel: React.FC<TopPanelProps> = ({ state, onHomeClick }) => {
  const isPowerLow = state.power > state.powerCapacity;

  return (
    <div className="w-full h-20 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 flex items-center justify-between px-6 shadow-lg z-50">
      <div className="flex items-center gap-4">
        <button 
          onClick={onHomeClick} 
          className="mr-2 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all active:scale-95 shadow-sm border border-white/20"
          title="返回首页"
        >
          <span className="text-xl">🏠</span>
        </button>
        <StatItem icon="💰" label="金币" value={state.gold.toLocaleString()} delta={state.goldDelta} color="border-yellow-400" />
        <StatItem icon="👥" label="人口" value={`${state.population}/${state.maxPopulation}`} color="border-blue-400" />
        <StatItem 
          icon="⚡" 
          label="能量" 
          value={`${Math.round(state.power)}/${Math.round(state.powerCapacity)}`} 
          color={isPowerLow ? "border-red-500" : "border-yellow-200"} 
          isWarning={isPowerLow}
        />
        <StatItem icon="🌳" label="污染" value={`${state.pollution}%`} color={state.pollution > 50 ? "border-red-500" : "border-green-400"} />
      </div>

      <div className="flex flex-col items-end">
        <div className="text-white font-bold bg-black/30 px-4 py-1 rounded-full">
          第 {state.day} 天
        </div>
      </div>
    </div>
  );
};