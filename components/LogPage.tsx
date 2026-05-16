import React, { useState } from 'react';
import { GameState, LogEvent, SessionData } from '../types';

interface LogPageProps {
  state: GameState;
  archivedSessions: SessionData[];
  onBack: () => void;
}

export const LogPage: React.FC<LogPageProps> = ({ state, archivedSessions, onBack }) => {
  // Use state to track which session's logs we are viewing. Default is 'current'
  const [selectedSessionId, setSelectedSessionId] = useState<string>('current');

  // Determine which logs to show
  const getActiveLogs = (): LogEvent[] => {
    if (selectedSessionId === 'current') {
      return state.logs;
    }
    const session = archivedSessions.find(s => s.sessionId === selectedSessionId);
    return session ? session.logs : [];
  };

  const activeLogs = getActiveLogs();
  const currentDisplaySessionId = selectedSessionId === 'current' ? state.sessionId : selectedSessionId;
  const currentDisplayGroupId = selectedSessionId === 'current' ? state.groupId : archivedSessions.find(s => s.sessionId === selectedSessionId)?.groupId || 'N/A';

  const exportJSON = () => {
    const dataStr = JSON.stringify(activeLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${currentDisplaySessionId}_logs.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = () => {
    const headers = [
      'Timestamp',
      'Player ID',
      'Event Type',
      'Building Type',
      'Coordinates',
      'Public Facility',
      'Target Owner ID',
      'Vote Option',
      'Discuss Tag',
      'Problem ID'
    ];

    const rows = activeLogs.map(log => [
      `${log.timestamp}s`,
      log.player_id,
      log.event_type,
      log.building_type || 'N/A',
      Array.isArray(log.coordinates) ? `"${log.coordinates[0]}, ${log.coordinates[1]}"` : (log.coordinates || 'N/A'),
      log.is_public !== undefined ? log.is_public : 'N/A',
      log.target_owner_id || 'N/A',
      log.vote_option_id || 'N/A',
      log.discuss_tag ? `"${log.discuss_tag.replace(/"/g, '""')}"` : 'N/A',
      log.problem_id || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentDisplaySessionId}_logs.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventBadge = (type: LogEvent['event_type']) => {
    const colors: Record<string, string> = {
      propose: 'bg-green-100 text-green-700',
      modify_own: 'bg-blue-100 text-blue-700',
      modify_other: 'bg-red-100 text-red-700 border border-red-200',
      vote: 'bg-purple-100 text-purple-700',
      discuss: 'bg-pink-100 text-pink-700',
      solve: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    };
    return <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${colors[type] || 'bg-gray-100 text-gray-600'}`}>{type}</span>;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Header Information Bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          <button onClick={onBack} className="text-gray-400 hover:text-indigo-600 flex items-center gap-2 font-bold transition-colors">
            <span className="text-xl">←</span> 返回游戏
          </button>
          <div className="h-8 w-px bg-gray-200"></div>
          
          <div className="flex gap-4 items-center">
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">选择小组</span>
                <select 
                  value={selectedSessionId} 
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="font-bold text-gray-800 border-none bg-transparent outline-none cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <option value="current">🔴 活跃会话: {state.sessionId} ({state.groupId})</option>
                  {archivedSessions.map((session) => (
                    <option key={session.sessionId} value={session.sessionId}>
                      📦 历史存档: {session.sessionId} ({session.groupId})
                    </option>
                  ))}
                </select>
             </div>
          </div>

          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">小组 ID (Group ID)</span>
              <span className="font-bold text-gray-800">{currentDisplayGroupId}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
          >
            <span>📄</span> 导出 CSV
          </button>
          <button 
            onClick={exportJSON}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <span>📦</span> 导出 JSON
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col p-8 gap-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">事件总数</span>
            <span className="text-3xl font-black text-gray-800">{activeLogs.length}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <span className="text-gray-400 text-xs font-bold uppercase block mb-1">当前会话</span>
             <span className="text-lg font-bold text-indigo-600 break-all">{currentDisplaySessionId}</span>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <span className="text-gray-400 text-xs font-bold uppercase block mb-1">存档时间</span>
             <span className="text-xl font-black text-gray-800">
               {selectedSessionId === 'current' ? '实时' : new Date(archivedSessions.find(s => s.sessionId === selectedSessionId)?.timestamp || 0).toLocaleString()}
             </span>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">时间戳</th>
                  <th className="px-6 py-4 border-b border-gray-100">玩家名称</th>
                  <th className="px-6 py-4 border-b border-gray-100">事件类型</th>
                  <th className="px-6 py-4 border-b border-gray-100">详情 / 标签</th>
                  <th className="px-6 py-4 border-b border-gray-100">坐标</th>
                  <th className="px-6 py-4 border-b border-gray-100">公共</th>
                  <th className="px-6 py-4 border-b border-gray-100">目标</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {activeLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-gray-400 italic">暂无操作记录...</td>
                  </tr>
                ) : (
                  [...activeLogs].reverse().map((log, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-500">{log.timestamp}s</td>
                      <td className="px-6 py-4 font-bold text-gray-700">{log.player_id}</td>
                      <td className="px-6 py-4">{getEventBadge(log.event_type)}</td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={log.discuss_tag || log.building_type}>
                        {log.discuss_tag || log.building_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono">
                        {Array.isArray(log.coordinates) ? `(${log.coordinates[0]}, ${log.coordinates[1]})` : log.coordinates}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.is_public === true ? 'bg-green-50 text-green-600' : log.is_public === false ? 'bg-gray-50 text-gray-400' : 'text-gray-300'}`}>
                          {log.is_public === true ? '是' : log.is_public === false ? '否' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">{log.target_owner_id || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 px-8 py-4 text-[10px] text-gray-300 font-bold flex justify-between uppercase tracking-widest">
        <span>EcoCity 日志系统 v1.2 - 增强版</span>
        <span>生成于 {new Date().toLocaleString()}</span>
      </footer>
    </div>
  );
};