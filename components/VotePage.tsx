import React, { useState } from 'react';
import { GameState, Role, VoteData } from '../types';

interface VotePageProps {
  state: GameState;
  onBack: () => void;
  onSubmitVote: (optionId: string, reason?: string) => void;
  onInitiateVote: (question: string, description: string) => void;
  onCloseVote: () => void; // New prop to clear the vote state
}

export const VotePage: React.FC<VotePageProps> = ({ state, onBack, onSubmitVote, onInitiateVote, onCloseVote }) => {
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showResults, setShowResults] = useState(false);

  // 1. 如果没有当前投票，显示发起界面
  if (!state.currentVote) {
    return (
      <div className="fixed inset-0 z-[200] bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-8 animate-in zoom-in duration-300">
        <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border-8 border-indigo-200">
          <header className="bg-indigo-600 p-6 text-white text-center">
            <h2 className="text-3xl font-black">发起自定义投票</h2>
            <p className="opacity-80 text-sm">一起协作解决分歧！</p>
          </header>
          
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">投票问题</label>
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我们应该在这里建公园吗？" 
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-400 transition-all font-bold text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">详细说明</label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="对分歧进行具体描述，例如：玩家 A 想建公园，玩家 B 想建住宅..." 
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-400 transition-all font-medium"
              ></textarea>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <p className="text-xs text-blue-800 leading-relaxed font-bold">
                投票发起后，系统将自动生成“赞成”和“反对”选项。
                所有在线玩家都可以参与投票。
              </p>
            </div>
          </div>

          <footer className="p-8 bg-gray-50 flex gap-4">
            <button 
              onClick={onBack}
              className="flex-1 bg-white border-2 border-gray-200 text-gray-400 font-black py-4 rounded-2xl hover:bg-gray-100 transition-all"
            >
              取消
            </button>
            <button 
              onClick={() => {
                if(question.trim()) onInitiateVote(question, description);
              }}
              className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              开始投票
            </button>
          </footer>
        </div>
      </div>
    );
  }

  const voteData = state.currentVote;
  const hasVoted = !!voteData.results[state.currentRole];
  const votesCount = Object.values(voteData.results).length;
  // 如果 4 人投完或状态为 completed，强制显示结果
  const isVoteCompleted = voteData.status === 'completed' || votesCount >= 4;
  const shouldShowResults = showResults || isVoteCompleted;

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* 1. 顶部信息栏 (15%) */}
      <header className="h-[15%] bg-indigo-600 text-white flex items-center px-10 relative">
        <div className="flex-1">
          <h1 className="text-3xl font-black flex items-center gap-3">
            <span>🗳️</span> 
            {isVoteCompleted ? "投票已完成" : "正在投票中"}
          </h1>
          <p className="text-sm opacity-80 font-bold uppercase tracking-widest mt-1">
            发起人: {voteData.initiator} • 会话: {state.sessionId}
          </p>
        </div>
        <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-bold border border-white/30">
          退出查看
        </button>
      </header>

      {/* 2. 投票问题描述区 (35%) */}
      <section className="h-[35%] bg-indigo-50 flex flex-col items-center justify-center text-center p-12 border-b-4 border-indigo-100">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-black text-indigo-900 mb-6 leading-tight">
            {voteData.question}
          </h2>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-indigo-200 shadow-sm">
            <p className="text-indigo-700 font-medium leading-relaxed">
              {voteData.description || '暂无详细描述。'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. 投票选项区 (30%) */}
      <section className="h-[30%] flex items-center justify-center p-8 bg-white gap-8">
        {!shouldShowResults ? (
          <div className="w-full max-w-4xl flex flex-col gap-8">
            <div className="flex gap-6">
              {voteData.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex-1 py-10 rounded-3xl border-4 font-black text-2xl transition-all shadow-xl flex flex-col items-center justify-center gap-3
                    ${selectedOption === opt.id 
                      ? 'bg-indigo-600 border-indigo-800 text-white scale-105 rotate-1 shadow-indigo-200' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-indigo-300'}`}
                >
                  <span className="text-4xl">{opt.id === 'plan_A' ? '👍' : '👎'}</span>
                  {opt.id === 'plan_A' ? '赞成' : '反对'}
                </button>
              ))}
            </div>
            
            {selectedOption === 'plan_B' && (
              <div className="animate-in slide-in-from-top-4">
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-4">反对原因（选填）</label>
                 <input 
                  type="text" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="例如：这里交通不便..." 
                  className="w-full px-8 py-4 bg-pink-50 border-2 border-pink-100 rounded-full outline-none focus:ring-4 focus:ring-pink-200 transition-all font-bold"
                 />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-4xl grid grid-cols-2 gap-10">
            {voteData.options.map(opt => {
              const count = Object.values(voteData.results).filter(v => v === opt.id).length;
              const percent = votesCount > 0 ? (count / votesCount) * 100 : 0;
              return (
                <div key={opt.id} className="relative bg-gray-50 rounded-3xl p-8 border-2 border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <span className="font-black text-xl text-gray-800">{opt.id === 'plan_A' ? '赞成' : '反对'}</span>
                    <span className="font-mono font-black text-4xl text-indigo-600">{percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-4 text-xs font-bold text-gray-400">{count} 票</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. 操作区 (20%) */}
      <footer className="h-[20%] bg-gray-50 border-t-2 border-gray-100 flex items-center justify-center gap-6">
        {/* 情景 A: 投票已完成 (4人已投) -> 显示归档/新投票按钮 */}
        {isVoteCompleted ? (
           <div className="flex gap-4">
             <button 
              onClick={onCloseVote}
              className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2"
             >
               <span>✨</span> 存档并开始新投票
             </button>
             <button 
              onClick={onBack}
              className="bg-gray-800 text-white px-8 py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-lg"
             >
               以后再说
             </button>
           </div>
        ) : hasVoted || showResults ? (
          /* 情景 B: 我已投，但还没齐4人 -> 显示等待状态 */
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-400 font-bold animate-pulse">⏳ 等待其他玩家中... ({votesCount}/4)</span>
             <div className="flex gap-4">
                <button 
                  onClick={() => setShowResults(!showResults)}
                  className="bg-white border-4 border-indigo-100 text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-lg"
                >
                  {showResults ? '返回选项' : '查看实时投票'}
                </button>
                <button 
                  onClick={onBack}
                  className="bg-gray-200 text-gray-500 px-8 py-4 rounded-2xl font-black hover:bg-gray-300 transition-all shadow-lg"
                >
                  返回建造
                </button>
             </div>
          </div>
        ) : (
          /* 情景 C: 我还没投 -> 显示提交按钮 */
          <button 
            disabled={!selectedOption}
            onClick={() => selectedOption && onSubmitVote(selectedOption, reason)}
            className={`px-24 py-6 rounded-3xl font-black text-2xl transition-all shadow-2xl
              ${selectedOption 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            提交投票
          </button>
        )}
        
        <div className="absolute bottom-6 right-10 text-[10px] font-bold text-gray-300 uppercase flex gap-4">
           <span>票数: {votesCount}/4</span>
           <span>状态: {isVoteCompleted ? '已结束' : '进行中'}</span>
        </div>
      </footer>
    </div>
  );
};