import React from 'react';
import { Role } from '../types';
import { ROLE_INFO } from '../constants';

interface HandoverModalProps {
  currentActor: Role;
  nextActor: Role;
  onConfirm: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({ currentActor, nextActor, onConfirm }) => {
  const current = ROLE_INFO[currentActor];
  const next = ROLE_INFO[nextActor];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[32px] bg-[#333333] p-10 shadow-2xl text-center border border-white/10">
        {/* Circular Icon with Arrows (simplified representation of the image) */}
        <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-purple-400 border-r-purple-400 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="text-4xl">🔄</div>
        </div>

        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">轮换检查点！</h2>
        <p className="text-gray-300 mb-8 font-medium">你已连续提交多次。</p>
        
        <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
          <p className="text-gray-200 mb-6 text-sm">现在，请将提交控制权交给下一位同学。</p>
          
          <div className="flex justify-center items-center gap-6">
            <div className="flex flex-col items-center">
              <div className={`w-16 h-16 rounded-full ${current.color} flex items-center justify-center text-3xl shadow-lg ring-4 ring-white/10`}>
                {current.icon}
              </div>
              <span className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">{current.name}</span>
            </div>
            
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            </div>

            <div className="flex flex-col items-center opacity-100">
               <div className={`w-16 h-16 rounded-full ${next.color} flex items-center justify-center text-3xl shadow-lg ring-4 ring-purple-500/50`}>
                {next.icon}
              </div>
              <span className="mt-2 text-xs font-bold text-purple-400 uppercase tracking-tighter">{next.name}</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
              <span className="text-xl">...</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onConfirm}
          className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-lg rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
        >
          <span>确认交接</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};
