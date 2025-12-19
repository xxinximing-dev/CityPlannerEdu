
import React from 'react';
import { GameState } from '../types';

interface ChildFeedbackPageProps {
  state: GameState;
  onBack: () => void;
}

export const ChildFeedbackPage: React.FC<ChildFeedbackPageProps> = ({ state, onBack }) => {
  const logs = state.logs;
  
  // Dynamic Calculation based on state.logs
  const proposes = logs.filter(l => l.event_type === 'propose').length;
  const publicFacilities = logs.filter(l => l.event_type === 'propose' && l.is_public === true).length;
  const publicRatio = proposes > 0 ? Math.round((publicFacilities / proposes) * 100) : 0;
  
  const collabModifications = logs.filter(l => l.event_type === 'modify_other').length;
  const voteCount = logs.filter(l => l.event_type === 'vote').length;
  const discussCount = logs.filter(l => l.event_type === 'discuss').length;

  const getFeedbackMessage = () => {
    if (proposes === 0) return "你还没开始建设城市呢，快去尝试提出一些方案吧！";
    if (publicRatio > 40 && collabModifications > 5) return "太棒了！你在提出公共设施方案上非常积极，而且乐于帮助同伴修改设计。你真是一位优秀的城市合伙人！";
    if (publicRatio > 40) return "你非常关注城市的公共福祉，提出了很多公共设施。下次可以尝试多和伙伴们互动协作哦！";
    if (collabModifications > 5) return "你是一位协作达人！你帮助其他玩家优化了很多方案。下次可以多尝试主动发起自己的新提案！";
    if (voteCount < 2 && proposes > 0) return "你积极参与了城市建设，但投票互动稍微有点少。下次可以多利用投票来表达你的观点！";
    return "表现不错！你已经开始参与城市的各项建设和决策了，继续保持探索精神！";
  };

  return (
    <div className="fixed inset-0 z-[250] bg-pink-50 flex flex-col animate-in slide-in-from-bottom-8 duration-500 overflow-y-auto">
      {/* 顶部标题区 */}
      <header className="bg-white px-8 py-6 border-b-4 border-pink-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-black text-pink-600 tracking-tight">反思页 - 公民参与总结</h1>
          <p className="text-pink-400 font-bold mt-1 uppercase text-xs tracking-widest">SESSION: {state.sessionId}</p>
        </div>
        <button onClick={onBack} className="bg-pink-100 hover:bg-pink-200 text-pink-600 px-6 py-2 rounded-2xl font-black transition-all">
          返回游戏
        </button>
      </header>

      {/* 核心内容区 */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8">
        <section className="bg-white rounded-[40px] p-10 shadow-xl border-8 border-white">
          <p className="text-lg text-gray-600 font-bold leading-relaxed mb-10 text-center">
            在本次任务中，你扮演了 <span className="text-indigo-600 font-black">{state.currentRole}</span>。
            以下是基于你实际操作生成的参与报告：
          </p>

          {/* 行为指标展示 */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-blue-50 p-8 rounded-[32px] border-4 border-blue-100 flex items-center gap-6 group">
              <span className="text-6xl">🏢</span>
              <div>
                <span className="text-xs font-black text-blue-400 uppercase tracking-widest block mb-1">我的提案</span>
                <span className="text-4xl font-black text-blue-600">{proposes} 次</span>
                <span className="text-xs font-bold text-blue-400 block mt-1">公共设施占比: {publicRatio}%</span>
              </div>
            </div>

            <div className="bg-green-50 p-8 rounded-[32px] border-4 border-green-100 flex items-center gap-6 group">
              <span className="text-6xl">🤝</span>
              <div>
                <span className="text-xs font-black text-green-400 uppercase tracking-widest block mb-1">协作修改</span>
                <span className="text-4xl font-black text-green-600">{collabModifications} 次</span>
                <span className="text-xs font-bold text-green-400 block mt-1">{collabModifications > 0 ? '积极帮助同伴' : '可以尝试更多协作'}</span>
              </div>
            </div>

            <div className="bg-purple-50 p-8 rounded-[32px] border-4 border-purple-100 flex items-center gap-6 group">
              <span className="text-6xl">🗳️</span>
              <div>
                <span className="text-xs font-black text-purple-400 uppercase tracking-widest block mb-1">参与投票</span>
                <span className="text-4xl font-black text-purple-600">{voteCount} 次</span>
              </div>
            </div>

            <div className="bg-orange-50 p-8 rounded-[32px] border-4 border-orange-100 flex items-center gap-6 group">
              <span className="text-6xl">💬</span>
              <div>
                <span className="text-xs font-black text-orange-400 uppercase tracking-widest block mb-1">讨论发言</span>
                <span className="text-4xl font-black text-orange-600">{discussCount} 次</span>
              </div>
            </div>
          </div>

          {/* 自然语言反馈 */}
          <div className="bg-pink-100/50 p-10 rounded-[40px] border-4 border-dashed border-pink-200 relative">
            <h3 className="text-xl font-black text-pink-600 mb-4 flex items-center gap-2">
              <span>导师寄语</span>
            </h3>
            <p className="text-2xl font-bold text-pink-800 leading-relaxed italic">
              “{getFeedbackMessage()}”
            </p>
          </div>
        </section>

        <div className="flex justify-center gap-6 pb-12">
          <button 
            onClick={onBack}
            className="px-12 py-5 bg-white border-4 border-pink-200 text-pink-600 rounded-3xl font-black text-xl hover:bg-pink-50 transition-all shadow-lg"
          >
            继续建设
          </button>
        </div>
      </main>
    </div>
  );
};
