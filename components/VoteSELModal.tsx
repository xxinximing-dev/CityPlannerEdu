import React, { useState } from 'react';
import { GameAction, Role } from '../types';
import { ROLE_INFO } from '../constants';

interface VoteSELModalProps {
  action: GameAction;
  currentRole: Role;
  onClose: (passed: boolean) => void;
}

export const VoteSELModal: React.FC<VoteSELModalProps> = ({ action, currentRole, onClose }) => {
  const [votes, setVotes] = useState<Record<string, 'agree' | 'disagree'>>({});
  const players = Object.values(Role);

  const castVote = (role: Role, choice: 'agree' | 'disagree') => {
    setVotes(prev => ({ ...prev, [role]: choice }));
  };

  const handleFinish = () => {
    const agreeCount = Object.values(votes).filter(v => v === 'agree').length;
    onClose(agreeCount >= 2);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-10 shadow-2xl border-4 border-purple-500">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">⚖️ 重大决策投票</h2>
        <p className="text-gray-500 mb-8">这项操作对城市很重要，至少需要 2 名队员同意才能通过。</p>

        <div className="bg-purple-50 p-6 rounded-2xl mb-8 border border-purple-100 italic text-purple-800 text-center">
            {ROLE_INFO[action.actorId].icon} {ROLE_INFO[action.actorId].name} 提议在 ({action.targetCell.x}, {action.targetCell.y}) 进行 <span className="font-bold underline">{action.type === 'place' ? '建造' : action.type === 'delete' ? '拆除' : '更改'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {players.slice(0, 3).map(role => (
            <div key={role} className={`p-6 rounded-2xl border-2 transition-all ${votes[role] ? 'bg-white opacity-100' : 'bg-gray-50 opacity-100'} ${votes[role] === 'agree' ? 'border-green-500 shadow-md shadow-green-100' : votes[role] === 'disagree' ? 'border-red-500 shadow-md shadow-red-100' : 'border-gray-200'}`}>
                <div className="flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-3 text-2xl ${ROLE_INFO[role].color}`}>{ROLE_INFO[role].icon}</div>
                    <span className="font-bold text-gray-700 mb-4">{ROLE_INFO[role].name}</span>
                    
                    <div className="flex gap-2 w-full">
                        <button 
                            onClick={() => castVote(role, 'agree')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${votes[role] === 'agree' ? 'bg-green-500 text-white' : 'bg-white border-2 border-green-200 text-green-600 hover:bg-green-50'}`}
                        >
                            同意
                        </button>
                        <button 
                            onClick={() => castVote(role, 'disagree')}
                            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${votes[role] === 'disagree' ? 'bg-red-500 text-white' : 'bg-white border-2 border-red-200 text-red-600 hover:bg-red-50'}`}
                        >
                            反对
                        </button>
                    </div>
                </div>
            </div>
          ))}
        </div>

        <button 
            onClick={handleFinish}
            disabled={Object.keys(votes).length < 2}
            className="w-full py-5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:cursor-not-allowed"
        >
            确认投票结果
        </button>
      </div>
    </div>
  );
};
