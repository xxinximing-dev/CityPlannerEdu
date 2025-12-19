
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Phase, Role, Task, Feedback, MapCell, LogEvent, ViewState, VoteData } from './types';
import { INITIAL_STATE, BUILDINGS, GRID_SIZE } from './constants';
import { TopPanel } from './components/TopPanel';
import { GameMap } from './components/Map';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { BuildingInfoOverlay } from './components/BuildingInfoOverlay';
import { LogPage } from './components/LogPage';
import { VotePage } from './components/VotePage';
import { TutorialOverlay } from './components/TutorialOverlay';
import { ChildFeedbackPage } from './components/ChildFeedbackPage';
import { TeacherReportPage } from './components/TeacherReportPage';
import { getAIAdvice, generateFeedback, speakAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [view, setView] = useState<ViewState>('GAME');
  const [showTutorial, setShowTutorial] = useState(true);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<MapCell | null>(null);
  const lastCriticalAlertRef = useRef<number>(0);
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '让所有住宅 4 格内至少有一所学校', completed: false, type: 'daily' },
    { id: '2', title: '城市总人口达到 500人', completed: false, type: 'urgent' },
    { id: '3', title: '污染指数降低至 20% 或以下 🌍', completed: false, type: 'daily' }
  ]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    { id: '1', author: '市民A', text: '这边的电力供应看起来不太稳定', time: '16:04', avatar: 'https://picsum.photos/32/32?random=1' },
    { id: '2', author: '市民B', text: '我们需要更多绿化空间！', time: '16:30', avatar: 'https://picsum.photos/32/32?random=2' }
  ]);
  const [aiAdvice, setAiAdvice] = useState<string>("正在载入人工智能顾问...");

  // Centralized logging function
  const logEvent = useCallback((event: Omit<LogEvent, 'session_id' | 'timestamp'>) => {
    setState(prev => {
      const timestamp = Math.floor((Date.now() - prev.startTime) / 1000);
      const newLog: LogEvent = {
        ...event,
        session_id: prev.sessionId,
        timestamp,
      };
      return { ...prev, logs: [...prev.logs, newLog] };
    });
  }, []);

  // Audio warning sound
  const playWarningSound = useCallback(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // A soft alert sound
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }, []);

  // Game Loop: Timer and Simulation Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        const nextTimer = prev.timer > 0 ? prev.timer - 1 : 120;
        let nextPhase = prev.phase;
        let nextDay = prev.day;

        if (prev.timer === 0) {
          if (prev.phase === Phase.BUILD) nextPhase = Phase.VOTE;
          else if (prev.phase === Phase.VOTE) nextPhase = Phase.DISCUSS;
          else {
            nextPhase = Phase.BUILD;
            nextDay += 1;
          }
        }

        let goldDelta = 0;
        let powerUsed = 0;
        let powerCapacity = 0;
        let totalPollution = 20;
        let pop = 0;
        let targetHappiness = 0;

        prev.map.flat().forEach(cell => {
          if (cell.buildingId || cell.isRoad) {
            const b = cell.buildingId ? BUILDINGS[cell.buildingId] : BUILDINGS['ROAD'];
            goldDelta += b.goldEffect;
            if (b.powerEffect > 0) {
              powerCapacity += b.powerEffect;
            } else {
              powerUsed -= b.powerEffect;
            }
            totalPollution += b.pollutionEffect;
            pop += b.popEffect;
            targetHappiness += b.happinessEffect;
          }
        });

        const currentHappiness = prev.happiness;
        const happinessStep = targetHappiness > currentHappiness ? 1 : -1;
        const newHappiness = (prev.timer % 5 === 0 && currentHappiness !== targetHappiness) 
          ? Math.max(0, Math.min(100, currentHappiness + happinessStep)) 
          : currentHappiness;

        const goldUpdate = prev.timer % 10 === 0 ? goldDelta : 0;

        const isCriticalNow = (powerUsed > powerCapacity) || (totalPollution > 50);
        if (isCriticalNow && Date.now() - lastCriticalAlertRef.current > 30000) {
           playWarningSound();
           lastCriticalAlertRef.current = Date.now();
           speakAdvice(powerUsed > powerCapacity ? "警告：电力供应严重不足，城市部分区域即将停电。" : "警告：空气污染指数过高，居民健康正受到威胁。");
        }

        return {
          ...prev,
          timer: nextTimer,
          phase: nextPhase,
          day: nextDay,
          gold: prev.gold + goldUpdate,
          goldDelta: goldDelta,
          population: pop,
          power: powerUsed,
          powerCapacity: powerCapacity,
          pollution: Math.max(0, Math.min(100, totalPollution)),
          happiness: newHappiness
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playWarningSound]);

  // Update tasks and log "solve" event
  useEffect(() => {
    setTasks(prev => prev.map(t => {
      let isCompleted = t.completed;
      if (t.id === '2' && state.population >= 500) isCompleted = true;
      if (t.id === '3' && state.pollution <= 20) isCompleted = true;
      
      if (isCompleted && !t.completed) {
        logEvent({
          player_id: 'SYSTEM',
          event_type: 'solve',
          problem_id: t.id === '2' ? 'population_goal' : 'pollution_goal',
          coordinates: 'N/A',
          is_public: 'N/A'
        });
      }
      return { ...t, completed: isCompleted };
    }));
  }, [state.population, state.pollution, logEvent]);

  useEffect(() => {
    const fetchAdvice = async () => {
      const advice = await getAIAdvice(state);
      setAiAdvice(advice);
      
      const citizenComment = await generateFeedback(state);
      setFeedbacks(prev => [{
        id: Date.now().toString(),
        author: '系统市民',
        text: citizenComment,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: `https://picsum.photos/32/32?random=${Math.random()}`
      }, ...prev.slice(0, 15)]);
    };

    if (state.day % 2 === 0 || state.day === 1) {
       fetchAdvice();
    }
  }, [state.day]);

  const handleCellClick = (x: number, y: number) => {
    const cell = state.map[y][x];

    if (cell.buildingId || cell.isRoad) {
      setFocusedCell(cell);
      setSelectedBuildingId(null);
      return;
    }

    if (selectedBuildingId && state.phase === Phase.BUILD) {
      const building = BUILDINGS[selectedBuildingId];
      if (state.gold < building.cost) {
        alert("金币不足！");
        return;
      }

      setState(prev => {
        const newMap = [...prev.map];
        newMap[y] = [...newMap[y]];
        const isRoad = selectedBuildingId === 'ROAD';
        newMap[y][x] = {
          ...newMap[y][x],
          buildingId: isRoad ? null : selectedBuildingId,
          isRoad: isRoad,
          status: 'normal',
          ownerId: state.currentRole
        };

        return {
          ...prev,
          gold: prev.gold - building.cost,
          map: newMap
        };
      });

      // LOG PROPOSE
      logEvent({
        player_id: state.currentRole,
        event_type: 'propose',
        building_type: selectedBuildingId,
        coordinates: [x, y],
        is_public: building.role === Role.PLANNER || building.role === Role.ENVIRONMENT,
        target_owner_id: 'N/A'
      });
    }
  };

  const handleDemolish = (x: number, y: number) => {
    const cell = state.map[y][x];
    const buildingType = cell.buildingId || 'ROAD';
    const originalOwner = cell.ownerId;
    const isOwn = originalOwner === state.currentRole;

    setState(prev => {
      const newMap = [...prev.map];
      newMap[y] = [...newMap[y]];
      newMap[y][x] = {
        ...newMap[y][x],
        buildingId: null,
        isRoad: false,
        status: 'normal',
        ownerId: null
      };
      return { ...prev, map: newMap };
    });

    // LOG MODIFY
    logEvent({
      player_id: state.currentRole,
      event_type: isOwn ? 'modify_own' : 'modify_other',
      building_type: buildingType,
      coordinates: [x, y],
      is_public: 'N/A',
      target_owner_id: originalOwner || 'N/A'
    });

    setFocusedCell(null);
  };

  const handleSendFeedback = (text: string) => {
    setFeedbacks(prev => [{
      id: Date.now().toString(),
      author: '市长 (您)',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Mayor`
    }, ...prev.slice(0, 15)]);

    // LOG DISCUSS
    logEvent({
      player_id: state.currentRole,
      event_type: 'discuss',
      discuss_tag: text.length > 20 ? text.substring(0, 20) + '...' : text,
      coordinates: 'N/A',
      is_public: 'N/A'
    });
  };

  const handleInitiateVote = (question: string, description: string) => {
    const newVote: VoteData = {
      id: `VOTE_${Date.now()}`,
      question,
      description,
      options: [
        { id: 'plan_A', label: '赞成该方案' },
        { id: 'plan_B', label: '反对并提出建议' }
      ],
      results: {},
      reasons: {},
      status: 'active',
      initiator: state.currentRole
    };
    
    setState(prev => ({ ...prev, currentVote: newVote }));
    
    logEvent({
      player_id: state.currentRole,
      event_type: 'vote',
      vote_option_id: 'INITIATE',
      discuss_tag: question,
      coordinates: 'N/A'
    });
  };

  const handleSubmitVote = (optionId: string, reason?: string) => {
    if (!state.currentVote) return;
    
    setState(prev => {
      if (!prev.currentVote) return prev;
      return {
        ...prev,
        currentVote: {
          ...prev.currentVote,
          results: { ...prev.currentVote.results, [state.currentRole]: optionId },
          reasons: { ...prev.currentVote.reasons, [state.currentRole]: reason || '' }
        }
      };
    });

    logEvent({
      player_id: state.currentRole,
      event_type: 'vote',
      vote_option_id: optionId,
      modification: reason || '',
      coordinates: 'N/A'
    });
  };

  const switchRole = () => {
    const roles = Object.values(Role);
    const currentIndex = roles.indexOf(state.currentRole);
    const nextIndex = (currentIndex + 1) % roles.length;
    setState(prev => ({ ...prev, currentRole: roles[nextIndex] }));
    setSelectedBuildingId(null);
    setFocusedCell(null);
  };

  const getAppBackground = () => {
    if (state.pollution > 60) return 'bg-stone-500';
    if (state.pollution > 40) return 'bg-stone-300';
    return 'bg-blue-50';
  };

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-2000 select-none ${getAppBackground()}`}>
      <TopPanel state={state} />
      
      <div className={`smog-overlay ${state.pollution > 50 ? 'smog-active' : ''}`}></div>

      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}

      {view === 'LOGS' && (
        <LogPage state={state} onBack={() => setView('GAME')} />
      )}

      {view === 'VOTE' && (
        <VotePage 
          state={state} 
          onBack={() => setView('GAME')} 
          onSubmitVote={handleSubmitVote}
          onInitiateVote={handleInitiateVote}
        />
      )}

      {view === 'CHILD_FEEDBACK' && (
        <ChildFeedbackPage state={state} onBack={() => setView('GAME')} />
      )}

      {view === 'TEACHER_REPORT' && (
        <TeacherReportPage state={state} onBack={() => setView('GAME')} />
      )}

      <main className="flex flex-1 overflow-hidden">
        <SidebarLeft 
          currentRole={state.currentRole} 
          onSelectBuilding={(id) => {
            setSelectedBuildingId(id);
            setFocusedCell(null);
          }}
          selectedId={selectedBuildingId}
          gold={state.gold}
        />
        
        <div className="flex-1 flex flex-col relative">
          <GameMap 
            state={state} 
            onCellClick={handleCellClick}
            selectedBuildingId={selectedBuildingId}
            focusedCell={focusedCell}
          />
          
          {focusedCell && (
            <BuildingInfoOverlay 
              cell={focusedCell} 
              onClose={() => setFocusedCell(null)} 
              onDemolish={handleDemolish}
            />
          )}

          <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/95 p-3 rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
               <span className="text-xl font-bold">#1</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-widest">当前活跃角色</span>
              <button onClick={switchRole} className="font-bold text-gray-800 hover:text-indigo-600 transition-colors flex items-center gap-1">
                 {state.currentRole} <span className="text-xs">🔄</span>
              </button>
            </div>
          </div>

          <div className="h-24 bg-white border-t border-gray-100 flex items-center justify-between px-10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
            <div className="flex gap-4">
              <button 
                onClick={() => setShowTutorial(true)}
                className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-2xl font-black text-xl transition-all"
                title="查看教程"
              >
                ?
              </button>
              <button className={`px-8 py-3 rounded-2xl font-bold transition-all ${!selectedBuildingId && !focusedCell ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                选择模式
              </button>
              <button className={`px-8 py-3 rounded-2xl font-bold transition-all ${selectedBuildingId ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-200 scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                建造模式
              </button>
            </div>
            
            <div className="flex gap-8 items-center">
              <button 
                onClick={() => setView('VOTE')} 
                className={`group flex flex-col items-center gap-1 transition-all ${view === 'VOTE' ? 'scale-110 text-indigo-600' : ''}`}
              >
                 <span className="text-2xl transition-transform group-hover:-translate-y-1">🗳️</span>
                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-widest">投票</span>
              </button>

              <button 
                onClick={() => setView('CHILD_FEEDBACK')}
                className={`group flex flex-col items-center gap-1 transition-all ${view === 'CHILD_FEEDBACK' ? 'scale-110 text-pink-600' : ''}`}
              >
                 <span className="text-2xl transition-transform group-hover:-translate-y-1">👤📝</span>
                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-pink-500 uppercase tracking-widest">我的反馈</span>
              </button>

              <button 
                onClick={() => setView('TEACHER_REPORT')}
                className={`group flex flex-col items-center gap-1 transition-all ${view === 'TEACHER_REPORT' ? 'scale-110 text-slate-800' : ''}`}
              >
                 <span className="text-2xl transition-transform group-hover:-translate-y-1">📊</span>
                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-slate-800 uppercase tracking-widest">小组报告</span>
              </button>

              <button 
                onClick={() => setView('LOGS')}
                className="group flex flex-col items-center gap-1"
              >
                 <span className="text-2xl transition-transform group-hover:-translate-y-1">📝</span>
                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500 uppercase tracking-widest">日志</span>
              </button>
            </div>
          </div>
        </div>

        <SidebarRight 
          tasks={tasks} 
          aiAdvice={aiAdvice} 
          feedbacks={feedbacks}
          onSendFeedback={handleSendFeedback}
          onRewardClick={() => {
            setState(prev => ({ ...prev, gold: prev.gold + 500 }));
            alert("由于优秀的决策，获得了500金币政府奖励！");
          }}
        />
      </main>

      <div className="h-8 bg-white border-t border-gray-50 px-6 flex items-center justify-between text-[10px] font-bold text-gray-400 tracking-wider">
        <div className="flex gap-4">
          <span>PLAYER: ECO_HERO_01</span>
          <span>SESSION: {state.sessionId}</span>
        </div>
        <div className="flex gap-4">
          <span>SERVER: ASIA_01</span>
          <span>LATENCY: 24MS</span>
        </div>
      </div>
    </div>
  );
};

export default App;
