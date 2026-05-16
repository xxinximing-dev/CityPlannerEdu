import React from 'react';
import { SELStats } from '../types';

interface ReflectionModalProps {
  stats: SELStats;
  onClose: () => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ stats, onClose }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-2xl border-4 border-teal-500 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">✨ 本轮团队合作反思</h2>
        <p className="text-gray-500 mb-10">让我们看看刚才大家是怎么协作的吧。</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
            <div className="text-3xl mb-2">🕊️</div>
            <div className="text-4xl font-black text-orange-600">{stats.negotiationCount}</div>
            <div className="text-sm font-bold text-orange-400 uppercase tracking-wider">协商次数</div>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
            <div className="text-3xl mb-2">🤝</div>
            <div className="text-4xl font-black text-blue-600">{stats.handoverCount}</div>
            <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">交接次数</div>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
            <div className="text-3xl mb-2">⚓</div>
            <div className="text-4xl font-black text-red-600">{stats.unresolvedConflictCount}</div>
            <div className="text-sm font-bold text-red-400 uppercase tracking-wider">冲突次数</div>
          </div>
        </div>

        <div className="bg-teal-50 p-8 rounded-2xl mb-10 text-left">
            <h3 className="font-bold text-teal-800 mb-4 text-xl">团队讨论话题：</h3>
            <ul className="space-y-4 text-teal-700">
                <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-200 flex items-center justify-center text-xs">1</span>
                    <span>这一轮我们共同做出的最难的决定是什么？</span>
                </li>
                <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-200 flex items-center justify-center text-xs">2</span>
                    <span>在修改别人的作品前，大家觉得自己的意见被倾听了吗？</span>
                </li>
            </ul>
        </div>

        <button 
            onClick={onClose}
            className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
            进入下一轮
        </button>
      </div>
    </div>
  );
};
