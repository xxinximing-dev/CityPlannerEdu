
import React from 'react';
import { GameState } from '../types';

interface TeacherReportPageProps {
  state: GameState;
  onBack: () => void;
}

export const TeacherReportPage: React.FC<TeacherReportPageProps> = ({ state, onBack }) => {
  // Real Data for Current Group (Group A)
  const totalProposes = state.logs.filter(l => l.event_type === 'propose').length;
  const publicProposes = state.logs.filter(l => l.event_type === 'propose' && l.is_public === true).length;
  const publicRatioNum = totalProposes > 0 ? (publicProposes / totalProposes) * 100 : 0;
  
  const collabCount = state.logs.filter(l => l.event_type === 'modify_other').length;
  const voteCount = state.logs.filter(l => l.event_type === 'vote').length;
  const discussCount = state.logs.filter(l => l.event_type === 'discuss').length;

  const getGroupType = () => {
    if (collabCount > 5 && publicRatioNum > 30) return { label: 'Highly Collaborative', color: 'text-green-600 bg-green-50' };
    if (collabCount < 2 && totalProposes > 5) return { label: 'Self-focused', color: 'text-orange-600 bg-orange-50' };
    if (totalProposes < 3) return { label: 'Low Participation', color: 'text-gray-600 bg-gray-50' };
    return { label: 'Active Learners', color: 'text-indigo-600 bg-indigo-50' };
  };

  const groupType = getGroupType();

  const groupsData = [
    { 
      name: `Group A (当前 - ${state.sessionId})`, 
      publicRatio: `${Math.round(publicRatioNum)}%`,
      collabCount: collabCount,
      voteCount: voteCount,
      discussCount: discussCount,
      type: groupType.label,
      typeColor: groupType.color
    },
    { 
      name: 'Group B (参考)', 
      publicRatio: '20%',
      collabCount: 3,
      voteCount: 4,
      discussCount: 2,
      type: 'Balanced',
      typeColor: 'text-blue-600 bg-blue-50'
    },
    { 
      name: 'Group C (参考)', 
      publicRatio: '10%',
      collabCount: 1,
      voteCount: 2,
      discussCount: 1,
      type: 'Individualistic',
      typeColor: 'text-red-600 bg-red-50'
    }
  ];

  return (
    <div className="fixed inset-0 z-[250] bg-slate-50 flex flex-col animate-in fade-in duration-500 overflow-y-auto">
      <header className="bg-slate-900 text-white px-10 py-8 flex items-center justify-between shadow-2xl sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight">小组参与分析报告 Dashboard</h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">
            基于当前会话 {state.sessionId} 的实时数据分析
          </p>
        </div>
        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-black border border-slate-700 transition-all">
          关闭报告
        </button>
      </header>

      <main className="max-w-6xl mx-auto w-full p-10 space-y-10">
        {/* 数据统计概览 */}
        <section className="grid grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">公共设施决策</h4>
            <div className="text-4xl font-black text-slate-800">{publicProposes} <span className="text-lg text-gray-400">/ {totalProposes}</span></div>
            <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500" style={{ width: `${publicRatioNum}%` }}></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">当前活跃度</h4>
            <div className="text-4xl font-black text-emerald-500">{state.logs.length} <span className="text-lg">Events</span></div>
            <p className="text-xs text-slate-400 mt-2 font-bold uppercase">总计记录行为</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">协作修改量</h4>
            <div className="text-4xl font-black text-amber-500">{collabCount} 次</div>
            <p className="text-xs text-slate-400 mt-2 font-bold uppercase">跨角色修改记录</p>
          </div>
        </section>

        {/* 数据表格展示 */}
        <section className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">小组名称</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">公共设施占比</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">协作修改</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">投票</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">讨论</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">参与类型</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupsData.map((group, i) => (
                <tr key={i} className={`transition-colors ${i === 0 ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-8 py-6 font-black text-slate-800">{group.name}</td>
                  <td className="px-8 py-6 font-bold text-indigo-600">{group.publicRatio}</td>
                  <td className="px-8 py-6 font-bold text-slate-600">{group.collabCount}</td>
                  <td className="px-8 py-6 font-bold text-slate-600">{group.voteCount}</td>
                  <td className="px-8 py-6 font-bold text-slate-600">{group.discussCount}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${group.typeColor}`}>
                      {group.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 动态可视化展示 */}
        <section className="grid grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8">投票与讨论实时数据 (Group A)</h3>
            <div className="flex items-end justify-around h-48 gap-8 px-10">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="bg-indigo-500 w-full rounded-t-2xl transition-all duration-1000" style={{ height: `${Math.min(100, voteCount * 10)}%` }}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">投票: {voteCount}</span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="bg-orange-400 w-full rounded-t-2xl transition-all duration-1000" style={{ height: `${Math.min(100, discussCount * 10)}%` }}></div>
                <span className="text-[10px] font-black text-slate-400 uppercase">讨论: {discussCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <h3 className="text-lg font-black text-slate-800 mb-4">Group A 公共意识评分</h3>
            <div className="w-40 h-40 rounded-full border-[12px] border-slate-100 relative flex items-center justify-center">
              <div 
                className="absolute inset-0 rounded-full border-[12px] border-indigo-500 transition-all duration-1000" 
                style={{ clipPath: `conic-gradient(white ${100 - publicRatioNum}%, transparent 0)` }}
              ></div>
              <span className="text-2xl font-black text-slate-800">{Math.round(publicRatioNum)}%</span>
            </div>
            <p className="text-xs text-slate-400 font-bold mt-4 uppercase">公共设施提案占比</p>
          </div>
        </section>

        <div className="flex justify-center gap-6 pb-20">
          <button 
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
          >
            邀请该小组分享决策经验
          </button>
        </div>
      </main>
    </div>
  );
};
