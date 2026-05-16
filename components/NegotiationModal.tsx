import React, { useState } from 'react';
import { GameAction, Role } from '../types';
import { ROLE_INFO } from '../constants';

interface NegotiationModalProps {
  action: GameAction;
  onCancel: () => void;
  onConfirm: (data: { reason: string, concern: string, compromise: string }) => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({ action, onCancel, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  const [concern, setConcern] = useState('');
  const [compromise, setCompromise] = useState('');

  const reasons = ["提高效率", "减少污染", "增加人口", "修正之前的错误"];
  const concerns = ["队友可能会感到参与感降低", "资源消耗过快", "破坏了已有的城市布局"];
  const compromises = ["改到附近的其他位置", "只删除/修改其中一部分", "在周围增加绿色缓冲带"];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onConfirm({ reason, concern, compromise });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border-4 border-orange-400">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">🕊️ 协作协商卡</h2>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">第 {step}/3 步</span>
        </div>

        {step === 1 && (
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">1. 你为什么要进行这项更改？</label>
            <div className="grid grid-cols-1 gap-2">
              {reasons.map(r => (
                <button 
                  key={r} onClick={() => setReason(r)}
                  className={`p-4 text-left border-2 rounded-xl transition-all ${reason === r ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                >
                  {r}
                </button>
              ))}
              <textarea 
                placeholder="其他原因..." value={reason} onChange={(e) => setReason(e.target.value)}
                className="mt-2 p-4 border-2 border-gray-200 rounded-xl w-full h-24"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">2. 你的队友可能会担心什么？</label>
            <div className="grid grid-cols-1 gap-2">
              {concerns.map(c => (
                <button 
                  key={c} onClick={() => setConcern(c)}
                  className={`p-4 text-left border-2 rounded-xl transition-all ${concern === c ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                >
                  {c}
                </button>
              ))}
              <textarea 
                placeholder="其他担忧..." value={concern} onChange={(e) => setConcern(e.target.value)}
                className="mt-2 p-4 border-2 border-gray-200 rounded-xl w-full h-24"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-4">3. 你提议的折中方案（更好的办法）是什么？</label>
            <div className="grid grid-cols-1 gap-2">
              {compromises.map(c => (
                <button 
                  key={c} onClick={() => setCompromise(c)}
                  className={`p-4 text-left border-2 rounded-xl transition-all ${compromise === c ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                >
                  {c}
                </button>
              ))}
              <textarea 
                placeholder="其他方案..." value={compromise} onChange={(e) => setCompromise(e.target.value)}
                className="mt-2 p-4 border-2 border-gray-200 rounded-xl w-full h-24"
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8">
          <button onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50">取消</button>
          <button 
            onClick={handleNext} disabled={(!reason && step === 1) || (!concern && step === 2) || (!compromise && step === 3)}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50"
          >
            {step < 3 ? '下一步' : '发起协商'}
          </button>
        </div>
      </div>
    </div>
  );
};
