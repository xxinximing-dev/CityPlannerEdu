
import React, { useState } from 'react';
import { Task, Feedback } from '../types';

interface SidebarRightProps {
  tasks: Task[];
  aiAdvice: string;
  feedbacks: Feedback[];
  onRewardClick: () => void;
  onSendFeedback?: (text: string) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({ tasks, aiAdvice, feedbacks, onRewardClick, onSendFeedback }) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendFeedback?.(inputText);
    setInputText('');
  };

  return (
    <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col p-4 gap-4 overflow-hidden">
      {/* Tasks Section */}
      <section className="flex-1 min-h-0 bg-yellow-50 rounded-2xl p-4 border-2 border-yellow-200 flex flex-col overflow-hidden">
        <h3 className="text-yellow-800 font-bold mb-3 flex items-center gap-2 flex-shrink-0">
          <span>📋</span> 公共问题任务栏
        </h3>
        <ul className="space-y-2 text-sm overflow-y-auto pr-1">
          {tasks.map(task => (
            <li key={task.id} className="flex items-start gap-2 bg-white/50 p-2 rounded-lg border border-yellow-100 shadow-sm">
              <input type="checkbox" checked={task.completed} readOnly className="mt-1 accent-yellow-500" />
              <span className={`leading-tight ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'} ${task.type === 'urgent' ? 'text-red-600 font-medium' : ''}`}>
                {task.title}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* AI Advisor Section */}
      <section className="flex-1 min-h-0 bg-blue-50 rounded-2xl p-4 border-2 border-blue-200 flex flex-col overflow-hidden">
        <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2 flex-shrink-0">
          <span>🤖</span> 人工智能顾问分析
        </h3>
        <div className="flex-1 overflow-y-auto pr-1 mb-3">
          <div className="bg-white/80 p-4 rounded-xl italic text-gray-700 text-sm border border-blue-100 shadow-sm leading-relaxed">
            "{aiAdvice}"
          </div>
        </div>
        <button 
          onClick={onRewardClick}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-2 rounded-full transition-all active:scale-95 shadow-md flex-shrink-0"
        >
          获得奖励
        </button>
      </section>

      {/* Citizen Feedback Section */}
      <section className="flex-1 min-h-0 bg-pink-50 rounded-2xl p-4 border-2 border-pink-200 flex flex-col overflow-hidden">
        <h3 className="text-pink-800 font-bold mb-3 flex items-center gap-2 flex-shrink-0">
          <span>💬</span> 观点 (discuss)
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
          {feedbacks.map(f => (
            <div key={f.id} className="flex gap-2 group">
              <img src={f.avatar} alt="avatar" className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] font-bold text-gray-400 uppercase">{f.author}</span>
                  <span className="text-[8px] text-gray-300">{f.time}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs text-gray-700 leading-relaxed border border-pink-100">
                  {f.text}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto flex gap-2 flex-shrink-0">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="发表您的观点..." 
            className="flex-1 text-xs border border-pink-100 rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-pink-300 transition-all shadow-sm" 
          />
          <button 
            onClick={handleSend}
            className="bg-pink-500 hover:bg-pink-600 text-white w-9 h-9 flex items-center justify-center rounded-full text-xs shadow-md transition-all active:scale-90"
          >
            ➤
          </button>
        </div>
      </section>
    </div>
  );
};
