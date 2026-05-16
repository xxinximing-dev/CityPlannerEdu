import React, { useState } from 'react';
import { Role } from '../types';
import { ROLE_INFO } from '../constants';

interface HomePageProps {
  onStartGame: (sessionId: string, groupId: string, playerId: string, role: Role) => void;
  archivedCount?: number;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartGame, archivedCount = 0 }) => {
  const [sessionId, setSessionId] = useState(`2025-01-Class1-G${Math.floor(Math.random() * 100)}`);
  const [groupId, setGroupId] = useState('Group A');
  const [playerId, setPlayerId] = useState('P1');
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ENVIRONMENT);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId && groupId && playerId) {
      onStartGame(sessionId, groupId, playerId, selectedRole);
    } else {
      // Fallback alert if browser validation fails (unlikely with 'required')
      alert("Please fill in all information");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border-8 border-white">
        <header className="bg-indigo-600 p-8 text-center">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">EcoCity 登录</h1>
          <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs">绿色未来协作平台</p>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">会话 ID (Session ID)</label>
              <input 
                type="text" 
                required
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 transition-colors invalid:border-red-200"
                placeholder="例如：2025-01-Class1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">小组 ID (Group ID)</label>
              <input 
                type="text" 
                required
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 transition-colors invalid:border-red-200"
                placeholder="例如：第一小组"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">玩家名称 (Player ID)</label>
              <input 
                type="text" 
                required
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-indigo-500 transition-colors invalid:border-red-200"
                placeholder="例如：小明"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">选择角色</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(ROLE_INFO).map(([role, info]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role as Role)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2
                      ${selectedRole === role 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md ring-1 ring-indigo-500' 
                        : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className={`text-xs font-bold ${selectedRole === role ? 'text-indigo-700' : 'text-gray-500'}`}>{info.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🚀</span> 开始新游戏
          </button>
        </form>
        
        <div className="bg-gray-50 p-6 border-t border-gray-100">
           <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 系统在线</span>
              <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">📚 已存档小组: {archivedCount}</span>
           </div>
        </div>
      </div>
    </div>
  );
};