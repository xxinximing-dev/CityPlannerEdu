import React from 'react';
import { GameState, SessionData } from '../types';

interface TeacherReportPageProps {
  state: GameState;
  archivedSessions: SessionData[];
  onBack: () => void;
}

export const TeacherReportPage: React.FC<TeacherReportPageProps> = ({ state, archivedSessions, onBack }) => {
  
  // Helper to calculate stats for a single set of logs
  const calculateGroupStats = (logs: any[]) => {
    return {
      propose: logs.filter(l => l.event_type === 'propose').length,
      // Modify count: Counting modify_other as key collaborative metric, but summing both for total activity
      modify: logs.filter(l => l.event_type === 'modify_own' || l.event_type === 'modify_other').length, 
      vote: logs.filter(l => l.event_type === 'vote').length,
      discuss: logs.filter(l => l.event_type === 'discuss').length,
      solve: logs.filter(l => l.event_type === 'solve').length
    };
  };

  const determineGroupType = (stats: any) => {
    if (stats.modify > 5 && stats.vote > 3) return { label: '高度协作', color: 'text-green-600 bg-green-50' };
    if (stats.modify < 2 && stats.propose > 5) return { label: '建设达人', color: 'text-orange-600 bg-orange-50' };
    if (stats.propose < 3) return { label: '参与度较低', color: 'text-gray-600 bg-gray-50' };
    return { label: '表现平衡', color: 'text-indigo-600 bg-indigo-50' };
  };

  // 1. Current Session Data
  const currentStats = calculateGroupStats(state.logs);
  const currentGroupType = determineGroupType(currentStats);
  const currentSessionData = {
    name: `${state.groupId} (当前活动)`,
    sessionId: state.sessionId,
    ...currentStats,
    type: currentGroupType.label,
    typeColor: currentGroupType.color,
    isCurrent: true
  };

  // 2. Archived Sessions Data
  const archivedStats = archivedSessions.map(session => {
    const stats = calculateGroupStats(session.logs);
    const type = determineGroupType(stats);
    return {
      name: `${session.groupId} (历史存档)`,
      sessionId: session.sessionId,
      ...stats,
      type: type.label,
      typeColor: type.color,
      isCurrent: false
    };
  });

  // Combine all data
  const allGroupsData = [currentSessionData, ...archivedStats];

  // Calculate totals for summary cards
  const totalPropose = allGroupsData.reduce((acc, curr) => acc + curr.propose, 0);
  const totalModify = allGroupsData.reduce((acc, curr) => acc + curr.modify, 0);
  const totalVote = allGroupsData.reduce((acc, curr) => acc + curr.vote, 0);
  const totalDiscuss = allGroupsData.reduce((acc, curr) => acc + curr.discuss, 0);
  const totalSolve = allGroupsData.reduce((acc, curr) => acc + curr.solve, 0);

  return (
    <div className="fixed inset-0 z-[250] bg-slate-50 flex flex-col animate-in fade-in duration-500 overflow-y-auto">
      <header className="bg-slate-900 text-white px-10 py-8 flex items-center justify-between shadow-2xl sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">五维公民行为分析报告 (Citizen Behavior Analysis)</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">
             已记录小组总数: {allGroupsData.length}
          </p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black border border-slate-700 transition-all">
          关闭报告
        </button>
      </header>

      <main className="max-w-7xl mx-auto w-full p-10 space-y-10">
        {/* 数据统计概览 (Across ALL sessions) */}
        <section className="grid grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">提案 (总计) PROPOSE</h4>
            <div className="text-4xl font-black text-blue-500">{totalPropose}</div>
            <p className="text-xs text-slate-400 mt-1">总提案数</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">修改 (总计) MODIFY</h4>
            <div className="text-4xl font-black text-amber-500">{totalModify}</div>
            <p className="text-xs text-slate-400 mt-1">总修改数</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">投票 (总计) VOTE</h4>
            <div className="text-4xl font-black text-purple-500">{totalVote}</div>
            <p className="text-xs text-slate-400 mt-1">总投票数</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">讨论 (总计) DISCUSS</h4>
            <div className="text-4xl font-black text-pink-500">{totalDiscuss}</div>
            <p className="text-xs text-slate-400 mt-1">总讨论数</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">解决 (总计) SOLVE</h4>
            <div className="text-4xl font-black text-emerald-500">{totalSolve}</div>
            <p className="text-xs text-slate-400 mt-1">总解决数</p>
          </div>
        </section>

        {/* 核心对比表格 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest w-1/4">小组名称</th>
                <th className="px-4 py-6 text-xs font-black text-blue-400 uppercase tracking-widest text-center">提案</th>
                <th className="px-4 py-6 text-xs font-black text-amber-400 uppercase tracking-widest text-center">修改</th>
                <th className="px-4 py-6 text-xs font-black text-purple-400 uppercase tracking-widest text-center">投票</th>
                <th className="px-4 py-6 text-xs font-black text-pink-400 uppercase tracking-widest text-center">讨论</th>
                <th className="px-4 py-6 text-xs font-black text-emerald-400 uppercase tracking-widest text-center">解决</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">行为模式</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allGroupsData.map((group, i) => (
                <tr key={i} className={`transition-colors ${group.isCurrent ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-800">{group.name}</div>
                    <div className="text-[10px] text-slate-400">{group.sessionId}</div>
                  </td>
                  <td className="px-4 py-6 font-bold text-slate-600 text-center">{group.propose}</td>
                  <td className="px-4 py-6 font-bold text-slate-600 text-center">{group.modify}</td>
                  <td className="px-4 py-6 font-bold text-slate-600 text-center">{group.vote}</td>
                  <td className="px-4 py-6 font-bold text-slate-600 text-center">{group.discuss}</td>
                  <td className="px-4 py-6 font-bold text-slate-600 text-center">{group.solve}</td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${group.typeColor}`}>
                      {group.type}
                    </span>
                  </td>
                </tr>
              ))}
              {allGroupsData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-10 text-center text-slate-400 italic">暂无小组数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* 可视化对比 (Example: Modify vs Solve) */}
        <section className="grid grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8">协作程度 (修改他人) 对比</h3>
            <div className="space-y-6">
              {allGroupsData.map((group, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-xs font-bold text-slate-500 uppercase truncate">{group.name}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${group.isCurrent ? 'bg-amber-500' : 'bg-slate-300'}`} 
                      style={{ width: `${Math.min(100, group.modify * 10)}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-black text-slate-800">{group.modify}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
             <h3 className="text-lg font-black text-slate-800 mb-8">问题解决情况对比 Problem Solving</h3>
            <div className="space-y-6">
              {allGroupsData.map((group, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-32 text-xs font-bold text-slate-500 uppercase truncate">{group.name}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${group.isCurrent ? 'bg-emerald-500' : 'bg-slate-300'}`} 
                      style={{ width: `${Math.min(100, group.solve * 20)}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-black text-slate-800">{group.solve}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};