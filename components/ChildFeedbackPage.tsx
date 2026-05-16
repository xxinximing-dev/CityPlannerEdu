import React, { useMemo } from 'react';
import { GameState, Role } from '../types';
import { ROLE_INFO, GRID_SIZE } from '../constants';

interface ChildFeedbackPageProps {
  state: GameState;
  onBack: () => void;
}

export const ChildFeedbackPage: React.FC<ChildFeedbackPageProps> = ({ state, onBack }) => {
  const { currentRole, logs } = state;
  const roleInfo = ROLE_INFO[currentRole];

  // 1. 核心逻辑：只筛选当前角色的日志 (筛选当前角色的日志)
  // 当你在主界面左上角切换角色时，state.currentRole 变化，这里的数据也会自动刷新
  const roleLogs = useMemo(() => logs.filter(l => l.player_id === currentRole), [logs, currentRole]);

  // 2. 基础数据统计
  const proposeCount = roleLogs.filter(l => l.event_type === 'propose').length;
  const publicProposeCount = roleLogs.filter(l => l.event_type === 'propose' && l.is_public).length;
  const modifyOwnCount = roleLogs.filter(l => l.event_type === 'modify_own').length;
  const modifyOtherCount = roleLogs.filter(l => l.event_type === 'modify_other').length;
  const voteCount = roleLogs.filter(l => l.event_type === 'vote').length;
  const discussCount = roleLogs.filter(l => l.event_type === 'discuss').length;

  // 3. 三大维度指标计算 (指标计算)
  
  // 指标 A: 公共设施关心度 (公共设施关心度)
  // 算法: 公共设施提案数 / 总提案数
  const scorePublic = proposeCount > 0 ? Math.round((publicProposeCount / proposeCount) * 100) : 0;
  
  const getPublicText = () => {
    if (proposeCount === 0) return "你还没有开始建造，去建点什么吧！";
    if (scorePublic > 60) return "你建造了许多公共设施，顾及到了每个人，非常棒！";
    if (scorePublic > 30) return "你满足了一些公共需求，请继续保持城市发展的平衡。";
    return "记得多建造一些大家都能使用的设施（如公园、学校）！";
  };

  // 指标 B: 公平与覆盖度 (公平与覆盖度)
  // 算法: 简单的空间分布分析 (检查建设足迹涉及了多少个象限)
  const touchedQuadrants = new Set<string>();
  roleLogs.filter(l => l.event_type === 'propose' && Array.isArray(l.coordinates)).forEach(l => {
     const [x, y] = l.coordinates as [number, number];
     const qx = x < GRID_SIZE/2 ? 0 : 1;
     const qy = y < GRID_SIZE/2 ? 0 : 1;
     touchedQuadrants.add(`${qx}-${qy}`);
  });
  // 满分代表覆盖了4个象限，最低0
  const scoreCoverage = Math.min(100, (touchedQuadrants.size / 4) * 100);

  const getCoverageText = () => {
     if (scoreCoverage === 100) return "你建造的建筑公平地覆盖了整个城市！";
     if (scoreCoverage >= 50) return "还有一些区域被遗漏了，下次试试把建筑建得更分散一些。";
     // 特殊反馈：环境专家
     if (currentRole === Role.ENVIRONMENT) return "有些住宅离公园太远了，试着让大自然离每个人更近一点。"; 
     return "你的建筑太集中了，记得也要关心偏远地区的居民。";
  };

  // 指标 C: 协同合作程度 (协同合作程度)
  // 算法: 加权计算 (修改他人权重最高)
  const collabScoreRaw = (modifyOtherCount * 20) + (voteCount * 10) + (discussCount * 5);
  const scoreCollab = Math.min(100, collabScoreRaw);

  const getCollabText = () => {
    if (scoreCollab > 80) return "协作大师！你经常为他人优化，并赢得了大家的信任。";
    if (scoreCollab > 40) return "你通过设施帮助了他人，这是非常棒的合作行为。"; 
    if (scoreCollab > 0) return "请多参加投票和讨论，你的意见非常重要！";
    return "试试修改他人的提案，或者在投票中表达你的看法吧！";
  };

  // 通用组件：进度条卡片
  const Bar = ({ label, score, icon, text, color }: { label: string, score: number, icon: string, text: string, color: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <span className="text-4xl bg-gray-50 p-3 rounded-2xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between mb-2">
             <h3 className="font-bold text-gray-700 text-lg">{label}</h3>
             <span className="font-black text-indigo-600 text-xl">{score}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
             <div className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`} style={{ width: `${score}%` }}></div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-600 font-medium leading-relaxed italic border-l-4 border-indigo-200">
        “{text}”
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[250] bg-indigo-50/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 overflow-y-auto">
      {/* 顶部标题区 */}
      <header className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${roleInfo.color} rounded-2xl flex items-center justify-center text-3xl shadow-md text-white`}>
            {roleInfo.icon}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">个人微反思 (Micro-Reflection)</h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">
               角色: <span className="text-indigo-600 font-black text-sm">{roleInfo.name}</span> • 会话: {state.sessionId}
            </p>
          </div>
        </div>
        <button onClick={onBack} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-8 py-3 rounded-2xl font-bold transition-all border-2 border-transparent hover:border-gray-300">
          关闭
        </button>
      </header>

      {/* 核心内容区 */}
      <main className="max-w-4xl mx-auto w-full p-8 space-y-8">
        
        {/* 1. 三大核心指标 (Three Big Bars) */}
        <section className="space-y-6">
           <Bar 
             label="公共关怀" 
             score={scorePublic} 
             icon="🏛️" 
             text={getPublicText()} 
             color="bg-emerald-500"
           />
           <Bar 
             label="公平与覆盖度" 
             score={scoreCoverage} 
             icon="🌍" 
             text={getCoverageText()} 
             color="bg-blue-500"
           />
           <Bar 
             label="协作程度" 
             score={scoreCollab} 
             icon="🤝" 
             text={getCollabText()} 
             color="bg-purple-500"
           />
        </section>

        {/* 2. 详细数据网格 (Detailed Grid) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">我的提案</div>
              <div className="text-3xl font-black text-gray-800">{proposeCount}</div>
           </div>
           
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">修改自己</div>
              <div className="text-3xl font-black text-blue-600">{modifyOwnCount}</div>
           </div>
           
           {/* 重点高亮：协作修改他人 */}
           <div className="bg-purple-50 p-5 rounded-3xl shadow-md border-2 border-purple-100 text-center flex flex-col justify-center transform hover:scale-105 transition-transform">
              <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">修改他人</div>
              <div className="text-3xl font-black text-purple-600">{modifyOtherCount}</div>
           </div>
           
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col justify-center">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">投票与讨论</div>
              <div className="text-3xl font-black text-gray-800">{voteCount + discussCount}</div>
           </div>
        </section>

      </main>
    </div>
  );
};