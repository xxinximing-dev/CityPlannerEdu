import React, { useState } from 'react';
import { Role } from '../types';
import { ROLE_INFO } from '../constants';

interface ReflectionSurveyPageProps {
  currentRole: Role;
  onComplete: (thankYouNote?: string) => void;
  onCancel: () => void;
}

export const ReflectionSurveyPage: React.FC<ReflectionSurveyPageProps> = ({ currentRole, onComplete, onCancel }) => {
  // Question A1: Collaboration Style
  const [collabStyle, setCollabStyle] = useState<string>('');
  // Question A2: Next Goal
  const [nextGoal, setNextGoal] = useState<string>('');
  
  // Section B: Thank You Card
  const [thankWho, setThankWho] = useState<string>('');
  const [thankAction, setThankAction] = useState<string>('');

  const otherRoles = Object.keys(ROLE_INFO).filter(r => r !== currentRole) as Role[];

  const handleSubmit = () => {
    let note = '';
    if (thankWho && thankAction) {
      const whoName = ROLE_INFO[thankWho as Role].name;
      const getActionZh = (action: string) => {
        const map: Record<string, string> = {
          "Proposing a good idea": "提出了一个好主意",
          "Being willing to compromise": "愿意在分歧中做出让步",
          "Helping me explain": "帮助我向大家做出解释",
          "Taking initiative to switch": "主动发起角色切换"
        };
        return map[action] || action;
      };
      note = `发送了一张感谢卡给 ${whoName}，感谢他/她 “${getActionZh(thankAction)}”`;
    }
    onComplete(note);
  };

  const isComplete = collabStyle && nextGoal && thankWho && thankAction;

  return (
    <div className="fixed inset-0 z-[250] bg-indigo-900/40 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col border-8 border-white h-[90vh]">
        <header className="bg-indigo-600 p-6 text-white text-center shrink-0">
          <h2 className="text-3xl font-black">微反思问答 (Micro-Reflection Q&A)</h2>
          <p className="opacity-80 text-sm">停下来想一想我们的团队合作吧。</p>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50">
          
          {/* Section A: 2 Questions */}
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                哪种协作方式最能描述这一轮？
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "我们公平地轮流操作",
                  "一个人主导，其他人跟随",
                  "我们有争论但最终解决了",
                  "我们没怎么协作"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setCollabStyle(opt)}
                    className={`p-4 rounded-xl text-left font-bold transition-all border-2
                      ${collabStyle === opt 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                下一轮我想练习什么？
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "多听取他人的意见",
                  "清晰地解释理由",
                  "提议折中/妥协方案",
                  "给其他人操作的空间"
                ].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setNextGoal(opt)}
                    className={`p-4 rounded-xl text-left font-bold transition-all border-2
                      ${nextGoal === opt 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md' 
                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section B: Thank You Card */}
          <section className="bg-pink-50 p-6 rounded-3xl border-2 border-pink-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">💌</span>
              <div>
                <h3 className="font-black text-pink-800 text-xl">感谢卡 (Thank You Card)</h3>
                <p className="text-pink-600 text-xs font-bold uppercase tracking-wider">向你的队友表达感激之情</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
              <span className="font-bold text-gray-600">我想感谢</span>
              
              <select 
                value={thankWho}
                onChange={(e) => setThankWho(e.target.value)}
                className="flex-1 w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 outline-none focus:border-pink-400 bg-gray-50"
              >
                <option value="">-- 选择角色 --</option>
                {otherRoles.map(r => (
                  <option key={r} value={r}>{ROLE_INFO[r].icon} {ROLE_INFO[r].name}</option>
                ))}
              </select>

              <span className="font-bold text-gray-600">因为他/她</span>

              <select 
                value={thankAction}
                onChange={(e) => setThankAction(e.target.value)}
                className="flex-1 w-full p-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 outline-none focus:border-pink-400 bg-gray-50"
              >
                <option value="">-- 选择行为 --</option>
                <option value="Proposing a good idea">提出了一个好主意</option>
                <option value="Being willing to compromise">愿意在分歧中做出让步</option>
                <option value="Helping me explain">帮助我向大家做出解释</option>
                <option value="Taking initiative to switch">主动发起角色切换</option>
              </select>
            </div>
          </section>

        </main>

        <footer className="p-6 bg-white border-t border-gray-100 flex gap-4 shrink-0">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl font-black text-gray-400 border-2 border-transparent hover:bg-gray-50 hover:text-gray-600 transition-all"
          >
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 py-4 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-2
              ${isComplete 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <span>✨</span> 提交并查看报告
          </button>
        </footer>
      </div>
    </div>
  );
};