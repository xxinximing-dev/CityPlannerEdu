import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, Phase, Role, Task, Feedback, MapCell, LogEvent, ViewState, VoteData, SessionData, GameAction, KeyCommitRecord, SELStats, ActionType, NegotiationCard } from './types';
import { INITIAL_STATE, BUILDINGS, GRID_SIZE, ROLE_INFO } from './constants';
import { io, Socket } from 'socket.io-client';
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
import { HomePage } from './components/HomePage';
import { ReflectionSurveyPage } from './components/ReflectionSurveyPage';
import { getAIAdvice, generateFeedback, speakAdvice } from './services/geminiService';
import { HandoverModal } from './components/HandoverModal';
import { NegotiationModal } from './components/NegotiationModal';
import { VoteSELModal } from './components/VoteSELModal';
import { ReflectionModal } from './components/ReflectionModal';
import * as selService from './services/selService';

const App: React.FC = () => {
  // 核心游戏状态：地图、日志、当前角色、当前阶段
  const [state, setState] = useState<GameState>({ ...INITIAL_STATE, groupId: '', customPlayerId: '' });
  
  // 历史存档：存储所有玩过的小组记录 (Persistence could be added via localStorage)
  const [archivedSessions, setArchivedSessions] = useState<SessionData[]>(() => {
    try {
      const saved = localStorage.getItem('ecoCity_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  });
  
  // 视图状态：默认为首页
  const [view, setView] = useState<ViewState>('HOME');
  const [showTutorial, setShowTutorial] = useState(false);
  
  // 交互状态：选中建筑、选中的单元格
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<MapCell | null>(null);
  
  const selectedBuildingRef = useRef<string | null>(null);
  useEffect(() => { selectedBuildingRef.current = selectedBuildingId; }, [selectedBuildingId]);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const lastCriticalAlertRef = useRef<number>(0);

  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '确保所有住宅都在学校 4 格范围内', completed: false, type: 'daily' },
    { id: '2', title: '城市人口达到 500', completed: false, type: 'urgent' },
    { id: '3', title: '将污染降低到 20% 以下 🌍', completed: false, type: 'daily' }
  ]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([
    { id: '1', author: '市民 A', text: '这里的电力供应看起来不太稳定。', time: '16:04', avatar: 'https://picsum.photos/32/32?random=1' },
    { id: '2', author: '市民 B', text: '我们需要更多的绿地！', time: '16:30', avatar: 'https://picsum.photos/32/32?random=2' }
  ]);
  const [aiAdvice, setAiAdvice] = useState<string>("正在分析城市数据...");

  // --- SEL Mechanisms States ---
  const [selKeyCommitHistory, setSelKeyCommitHistory] = useState<KeyCommitRecord[]>([]);
  const selKeyCommitHistoryRef = useRef<KeyCommitRecord[]>([]);
  
  // --- Sync State ---
  const socketRef = useRef<Socket | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('connecting');
  const [showSyncTest, setShowSyncTest] = useState(false);

  useEffect(() => {
    // 1. 获取 URL 参数
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room') || 'demo';
    const playerRole = (params.get('player') as Role) || Role.PLANNER;

    // 2. 初始化 Socket 连接
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      setSyncStatus('connected');
      socket.emit('join-room', { roomId, playerRole });
    });

    socket.on('disconnect', () => setSyncStatus('disconnected'));

    // 3. 初始同步：当有人已经在房间时，获取最新状态
    socket.on('sync-init', (data) => {
      if (data.map) setState(prev => ({ ...prev, map: data.map }));
      if (data.currentRole) setState(prev => ({ ...prev, currentRole: data.currentRole }));
      if (data.negotiationAction) setSelNegotiationAction(data.negotiationAction);
      if (data.showVote) setSelShowVote(data.showVote);
      if (data.showReflection !== undefined) setSelShowReflection(data.showReflection);
      if (data.stats) setSelStats(data.stats);
    });

    // 4. 监听远程操作 (Remote Actions)
    socket.on('remote-action', (action: GameAction) => {
      console.log("Executing remote action:", action);
      // 根据动作类型执行本地更新，跳过 handleActionIntercept 避免触发本地的限制
      if (action.type === 'place' || action.type === 'replace') {
        setState(prev => {
          const newMap = [...prev.map];
          const { x, y } = action.targetCell;
          newMap[y] = [...newMap[y]];
          newMap[y][x] = {
            ...newMap[y][x],
            buildingId: action.buildingId === 'ROAD' ? null : action.buildingId,
            isRoad: action.buildingId === 'ROAD',
            ownerId: action.actorId,
            confirmed: true
          };
          return { ...prev, map: newMap };
        });
      } else if (action.type === 'delete') {
        setState(prev => {
          const newMap = [...prev.map];
          const { x, y } = action.targetCell;
          newMap[y] = [...newMap[y]];
          newMap[y][x] = { ...newMap[y][x], buildingId: null, isRoad: false, ownerId: null, confirmed: false };
          return { ...prev, map: newMap };
        });
      }
    });

    // 5. 监听远程状态更新 (Remote State Updates)
    socket.on('remote-state-update', ({ stateKey, value }: { stateKey: string, value: any }) => {
      switch (stateKey) {
        case 'currentRole': setState(prev => ({ ...prev, currentRole: value })); break;
        case 'negotiationAction': setSelNegotiationAction(value); break;
        case 'showVote': setSelShowVote(value); break;
        case 'showReflection': setSelShowReflection(value); break;
        case 'stats': setSelStats(value); break;
        case 'map': setState(prev => ({ ...prev, map: value })); break;
      }
    });

    // 如果 URL 里指定了角色，强制切换
    if (params.get('player')) {
      setState(prev => ({ ...prev, currentRole: playerRole }));
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  // 辅助函数：广播操作
  const broadcastAction = (action: GameAction) => {
    const roomId = new URLSearchParams(window.location.search).get('room') || 'demo';
    socketRef.current?.emit('game-action', { roomId, action });
  };

  // 辅助函数：广播状态
  const broadcastState = (key: string, value: any) => {
    const roomId = new URLSearchParams(window.location.search).get('room') || 'demo';
    socketRef.current?.emit('sync-state', { roomId, stateKey: key, value });
  };
  useEffect(() => {
    selKeyCommitHistoryRef.current = selKeyCommitHistory;
  }, [selKeyCommitHistory]);

  const [selRecentModifications, setSelRecentModifications] = useState<{ cell: string, actor: Role, time: number }[]>([]);
  const [selFailedProposals, setSelFailedProposals] = useState<GameAction[]>([]);
  const [selStats, setSelStats] = useState<SELStats>({
    negotiationCount: 0,
    handoverCount: 0,
    unresolvedConflictCount: 0
  });

  // Modal Control
  const [selPendingAction, setSelPendingAction] = useState<{ action: GameAction, callback: () => void } | null>(null);
  const [selHandoverInfo, setSelHandoverInfo] = useState<{ currentActor: Role, nextActor: Role } | null>(null);
  const [selNegotiationAction, setSelNegotiationAction] = useState<GameAction | null>(null);
  const [selShowVote, setSelShowVote] = useState<GameAction | null>(null);
  const [selShowReflection, setSelShowReflection] = useState<boolean>(false);

  // WoZ Trigger
  useEffect(() => {
    (window as any).wizardTriggerNegotiation = () => {
      selService.wizardTriggerNegotiation(state.currentRole);
      setSelNegotiationAction({
        type: 'move', // Dummy type for WoZ
        actorId: state.currentRole,
        buildingId: null,
        targetCell: { x: 0, y: 0 }
      });
      setSelStats(prev => ({ ...prev, negotiationCount: prev.negotiationCount + 1 }));
    };
  }, [state.currentRole]);

  const logSEL = useCallback((name: string, payload: any) => {
    selService.logSELSelectionEvent(name, payload);
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        session_id: prev.sessionId,
        timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
        player_id: prev.currentRole,
        event_type: 'discuss',
        discuss_tag: `[SEL] ${name}: ${JSON.stringify(payload)}`
      }]
    }));
  }, []);

  const handleActionIntercept = useCallback(async (action: GameAction, execute: () => void) => {
    const currentState = stateRef.current;
    
    // 1. Negotiation check first (high priority conflict)
    if (selService.shouldTriggerNegotiation(action, currentState.map, selRecentModifications, selFailedProposals)) {
      logSEL('negotiation_open', action);
      setSelNegotiationAction(action);
      setSelPendingAction({ action, callback: execute });
      setSelStats(prev => ({ ...prev, negotiationCount: prev.negotiationCount + 1 }));
      return;
    }

    // 2. Voting gate for major decisions
    if (selService.shouldTriggerVote(action, currentState.map)) {
      logSEL('vote_open', action);
      setSelShowVote(action);
      setSelPendingAction({ action, callback: execute });
      return;
    }

    // Key commit check for turn-taking
    const isKey = selService.isKeyCommit(action, currentState.map);
    if (isKey) {
      // 3. Turn-taking checkpoint (Specifically for building/place as requested)
      // 使用 Ref 确保拿到最新历史，防止快速点击导致的历史滞后
      if (action.type === 'place' && selService.shouldTriggerTurnTaking(action.actorId, selKeyCommitHistoryRef.current)) {
        const roles = Object.values(Role);
        const currentIdx = roles.indexOf(action.actorId);
        const nextRole = roles[(currentIdx + 1) % roles.length];
        
        selService.openTurnTakingCheckpoint(action.actorId, nextRole);
        setSelHandoverInfo({ currentActor: action.actorId, nextActor: nextRole });
        setSelPendingAction({ action, callback: execute });
        setSelStats(prev => ({ ...prev, handoverCount: prev.handoverCount + 1 }));
        return;
      }

      // Record key commit in history (Move this here to ensure it's tracked BEFORE triggers if not blocked)
      setSelKeyCommitHistory(prev => {
        const newHistory = [{ actorId: action.actorId, timestamp: Date.now(), action }, ...prev];
        selKeyCommitHistoryRef.current = newHistory; // 同时更新 Ref 以备下个立即到来的 click 使用
        return newHistory;
      });
    }

    // Execute if nothing triggered (regular action)
    execute();
    broadcastAction(action);
    broadcastState('map', stateRef.current.map);

    // Track modification for negotiation detection (only for changes to map)
    if (['place', 'delete', 'replace', 'upgrade'].includes(action.type)) {
      setSelRecentModifications(prev => [
        { cell: `${action.targetCell.x},${action.targetCell.y}`, actor: action.actorId, time: Date.now() },
        ...prev.slice(0, 50)
      ]);
    }
  }, [selKeyCommitHistory, selRecentModifications, logSEL]);

  // 1. Start Game: Initialize state from Home Page inputs
  const handleStartGame = (sessionId: string, groupId: string, playerId: string, role: Role) => {
    // 强制重新生成地图，确保不共用引用
    const freshMap = Array.from({ length: GRID_SIZE }, (_, y) =>
      Array.from({ length: GRID_SIZE }, (_, x) => ({
        x, y, buildingId: null, isRoad: false, status: 'normal', ownerId: null, confirmed: false
      } as MapCell))
    );

    setState({
      ...INITIAL_STATE,
      map: freshMap,
      sessionId,
      groupId,
      customPlayerId: playerId,
      currentRole: role,
      startTime: Date.now(),
      logs: []
    });
    setTasks([
      { id: '1', title: '确保所有住宅都在学校 4 格范围内', completed: false, type: 'daily' },
      { id: '2', title: '城市人口达到 500', completed: false, type: 'urgent' },
      { id: '3', title: '将污染降低到 20% 以下 🌍', completed: false, type: 'daily' }
    ]);
    setView('GAME');
    setShowTutorial(true);
  };

  // 2. End/Archive Session: Save current state to history and return to Home
  const handleEndSession = (skipReflection: boolean = false) => {
    // 触发 micro-reflection
    if (!skipReflection && selService.shouldTriggerReflection(true)) {
      selService.openReflection(selStats);
      setSelShowReflection(true);
      return;
    }

    if (!window.confirm("你确定要结束并存档本次会话吗？\n\n这会将当前小组的数据保存到历史记录中，并返回首页供新小组开始。")) return;

    try {
      const sessionData: SessionData = {
        sessionId: state.sessionId,
        groupId: state.groupId,
        logs: state.logs,
        timestamp: Date.now()
      };

      const newArchives = [...archivedSessions, sessionData];
      setArchivedSessions(newArchives);
      localStorage.setItem('ecoCity_sessions', JSON.stringify(newArchives));
      console.log("Session archived successfully", sessionData);
    } catch (e) {
      console.error("Archive failed", e);
      alert("存档失败（本地存储可能已满），但游戏将结束并返回首页。");
    }
    
    // Reset necessary state
    setSelectedBuildingId(null);
    setFocusedCell(null);
    setView('HOME');
  };

  // --- Game Logic ---

  const cityStats = useMemo(() => {
    let goldDelta = 0;
    let powerUsed = 0;
    let powerCapacity = 0;
    let totalPollution = 20;
    let pop = 0;
    let targetHappiness = 0;

    state.map.flat().forEach(cell => {
      if (cell.buildingId || cell.isRoad) {
        const b = cell.buildingId ? BUILDINGS[cell.buildingId] : BUILDINGS['ROAD'];
        goldDelta += b.goldEffect;
        if (b.powerEffect > 0) powerCapacity += b.powerEffect;
        else powerUsed -= b.powerEffect;
        totalPollution += b.pollutionEffect;
        pop += b.popEffect;
        targetHappiness += b.happinessEffect;
      }
    });

    return { goldDelta, powerUsed, powerCapacity, totalPollution, pop, targetHappiness };
  }, [state.map]);

  useEffect(() => {
    // Only run critical alerts in GAME view
    if (view !== 'GAME') return;

    const isCriticalPower = cityStats.powerUsed > cityStats.powerCapacity;
    const isCriticalPollution = cityStats.totalPollution > 50;
    
    if ((isCriticalPower || isCriticalPollution) && Date.now() - lastCriticalAlertRef.current > 45000) {
       lastCriticalAlertRef.current = Date.now();
       const msg = isCriticalPower ? "警告：城市电力不足，部分区域受限。" : "警告：污染过高，请立即增加绿色设施。";
       speakAdvice(msg);
    }
  }, [cityStats, view]);

  useEffect(() => {
    if (view !== 'GAME') return;
    const fetchAdvice = async () => {
      const advice = await getAIAdvice(state);
      setAiAdvice(advice);
    };
    fetchAdvice();
  }, [state.phase, state.day, view]);

  useEffect(() => {
    if (view !== 'GAME') return;

    const timer = setInterval(() => {
      setState(prev => {
        // Increment timer continuously, maybe reset for day progression logic if still desired
        // but no longer switch phases based on it.
        const nextTimer = prev.timer > 0 ? prev.timer - 1 : 120;
        let nextDay = prev.day;

        if (prev.timer === 0) {
          nextDay += 1;
          // Trigger reflection or other end-of-day events if they are still desired
          setSelShowReflection(true);
        }

        const goldUpdate = prev.timer % 10 === 0 ? prev.goldDelta : 0;

        return {
          ...prev,
          timer: nextTimer,
          day: nextDay,
          gold: prev.gold + goldUpdate,
          happiness: Math.min(100, Math.max(0, prev.happiness + (prev.happiness < 50 ? -1 : 1))) 
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [view]); 

  useEffect(() => {
    setState(prev => ({
      ...prev,
      goldDelta: cityStats.goldDelta,
      population: cityStats.pop,
      power: cityStats.powerUsed,
      powerCapacity: cityStats.powerCapacity,
      pollution: Math.max(0, Math.min(100, cityStats.totalPollution)),
    }));
  }, [cityStats]);

  useEffect(() => {
    setTasks(prevTasks => {
      let hasChanges = false;
      const newTasks = prevTasks.map(t => {
        if (t.completed) return t;

        let completed = false;
        if (t.id === '1') {
          const flatMap = state.map.flat();
          const residences = flatMap.filter(c => c.buildingId === 'RESIDENCE');
          const schools = flatMap.filter(c => c.buildingId === 'SCHOOL');
          if (residences.length > 0) {
            completed = residences.every(r => schools.some(s => (Math.abs(r.x - s.x) + Math.abs(r.y - s.y)) <= 4));
          }
        }
        else if (t.id === '2' && state.population >= 500) completed = true;
        else if (t.id === '3' && state.pollution <= 20) completed = true;

        if (completed) {
          hasChanges = true;
          return { ...t, completed: true };
        }
        return t;
      });

      if (hasChanges) {
        const newlyCompleted = newTasks.filter(nt => !prevTasks.find(pt => pt.id === nt.id)?.completed);
        newlyCompleted.forEach(task => {
           setState(current => ({
             ...current,
             logs: [...current.logs, {
               session_id: current.sessionId,
               timestamp: Math.floor((Date.now() - current.startTime) / 1000),
               player_id: current.currentRole, // Use role for logic, but log should theoretically reflect player ID too
               event_type: 'solve',
               problem_id: task.id,
               discuss_tag: `Completed: ${task.title}`
             }]
           }));
        });
      }

      return hasChanges ? newTasks : prevTasks;
    });
  }, [state.population, state.pollution, state.map]);

  const handleCellClick = useCallback((x: number, y: number) => {
    const currentState = stateRef.current;
    const bId = selectedBuildingRef.current;
    const cell = currentState.map[y][x];
    
    // 如果没有选择建筑，或者仅仅是想查看详情
    if (!bId) {
      if (cell.buildingId || cell.isRoad) {
        setFocusedCell(cell);
      }
      return;
    }

    // 如果选择了建筑且点击了已有建筑的格子，视为“替换” (Replace)
    if (bId && (cell.buildingId || cell.isRoad)) {
      const existingId = cell.buildingId || 'ROAD';
      if (bId === existingId) return; // 相同则不操作

      const building = BUILDINGS[bId];
      if (currentState.gold < building.cost) {
        alert("金币不足！");
        return;
      }

      const action: GameAction = {
        type: 'replace',
        actorId: currentState.currentRole,
        buildingId: bId,
        targetCell: { x, y },
        previousBuildingId: existingId,
        prevOwnerId: cell.ownerId
      };

      const executeReplace = () => {
        setState(prev => {
          const newMap = [...prev.map];
          newMap[y] = [...newMap[y]];
          newMap[y][x] = {
            ...newMap[y][x],
            buildingId: bId === 'ROAD' ? null : bId,
            isRoad: bId === 'ROAD',
            ownerId: prev.currentRole,
            confirmed: true
          };

          const newLog: LogEvent = {
            session_id: prev.sessionId,
            timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
            player_id: prev.currentRole,
            event_type: 'modify_other',
            building_type: bId,
            coordinates: [x, y],
            target_owner_id: cell.ownerId || 'SYSTEM',
            modification: `将 ${existingId === 'ROAD' ? '道路' : BUILDINGS[existingId].name} 替换为 ${building.name}`
          };

          return {
            ...prev,
            gold: prev.gold - building.cost,
            map: newMap,
            logs: [...prev.logs, newLog]
          };
        });
        
        if (selService.isKeyCommit(action, stateRef.current.map)) {
          // No history update here, intercepted by handleActionIntercept
        }
      };

      handleActionIntercept(action, executeReplace);
      return;
    }

    // 常规“放置” (Place)
    if (bId && !cell.buildingId && !cell.isRoad) {
      const building = BUILDINGS[bId];
      if (currentState.gold < building.cost) {
        alert("金币不足！");
        return;
      }

      const action: GameAction = {
        type: 'place',
        actorId: currentState.currentRole,
        buildingId: bId,
        targetCell: { x, y }
      };

      const executePlacement = () => {
        setState(prev => {
          const newMap = [...prev.map];
          newMap[y] = [...newMap[y]];
          newMap[y][x] = {
            ...newMap[y][x],
            buildingId: bId === 'ROAD' ? null : bId,
            isRoad: bId === 'ROAD',
            ownerId: prev.currentRole,
            confirmed: selService.isMajorDecision(action, prev.map)
          };

          const newLog: LogEvent = {
            session_id: prev.sessionId,
            timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
            player_id: prev.currentRole,
            event_type: 'propose',
            building_type: bId,
            coordinates: [x, y],
            is_public: building.role === Role.PLANNER || building.role === Role.ENVIRONMENT,
          };

          return {
            ...prev,
            gold: prev.gold - building.cost,
            map: newMap,
            logs: [...prev.logs, newLog]
          };
        });
        
        if (selService.isKeyCommit(action, stateRef.current.map)) {
          // No history update here, intercepted by handleActionIntercept
        }
      };

      handleActionIntercept(action, executePlacement);
    }
  }, [handleActionIntercept]);

  const handleDemolish = useCallback((x: number, y: number) => {
    const currentState = stateRef.current;
    const cell = currentState.map[y][x];
    const buildingId = cell.buildingId || (cell.isRoad ? 'ROAD' : null);

    const action: GameAction = {
      type: 'delete',
      actorId: currentState.currentRole,
      buildingId: buildingId,
      targetCell: { x, y },
      prevOwnerId: cell.ownerId
    };

    const executeDemolish = () => {
      setState(prev => {
        const newMap = [...prev.map];
        newMap[y] = [...newMap[y]];
        newMap[y][x] = { ...newMap[y][x], buildingId: null, isRoad: false, ownerId: null, confirmed: false };

        const isOwnBuilding = cell.ownerId === prev.currentRole;
        const eventType = isOwnBuilding ? 'modify_own' : 'modify_other';
        const buildingName = cell.buildingId ? BUILDINGS[cell.buildingId]?.name : '道路';

        const newLog: LogEvent = {
          session_id: prev.sessionId,
          timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
          player_id: prev.currentRole,
          event_type: eventType,
          building_type: cell.buildingId || 'ROAD',
          coordinates: [x, y],
          target_owner_id: cell.ownerId || 'SYSTEM',
          modification: `拆除了 ${buildingName}`
        };
        
        return { ...prev, map: newMap, logs: [...prev.logs, newLog] };
      });
      setFocusedCell(null);

      // No history update here, intercepted by handleActionIntercept
    };

    handleActionIntercept(action, executeDemolish);
  }, [handleActionIntercept]);

  const handleRestart = () => {
    if (!window.confirm("你确定要重新开始当前小组的游戏吗？\n\n注：这将重置地图，但不会影响已存档的会话。")) return;

    setState(prev => {
      const restartLog: LogEvent = {
        session_id: prev.sessionId,
        timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
        player_id: prev.currentRole,
        event_type: 'propose',
        building_type: '重置游戏',
        coordinates: '全局',
        is_public: true,
      };

      const newMap = Array.from({ length: GRID_SIZE }, (_, y) =>
        Array.from({ length: GRID_SIZE }, (_, x) => ({
          x, y, buildingId: null, isRoad: false, status: 'normal', ownerId: null, confirmed: false
        } as MapCell))
      );

      return {
        ...INITIAL_STATE,
        sessionId: prev.sessionId,
        groupId: prev.groupId,
        customPlayerId: prev.customPlayerId,
        startTime: prev.startTime,
        logs: [...prev.logs, restartLog],
        currentRole: prev.currentRole,
        map: newMap
      };
    });
    
    setSelectedBuildingId(null);
    setFocusedCell(null);
  };

  const handleInitiateVote = (question: string, description: string) => {
    setState(prev => {
      const newVote: VoteData = {
        id: Date.now().toString(),
        question,
        description,
        options: [
          { id: 'plan_A', label: '是' },
          { id: 'plan_B', label: '否' }
        ],
        results: {},
        reasons: {},
        status: 'active',
        initiator: prev.currentRole
      };

      const newLog: LogEvent = {
        session_id: prev.sessionId,
        timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
        player_id: prev.currentRole,
        event_type: 'vote',
        discuss_tag: question,
        vote_option_id: 'INITIATED'
      };

      return {
        ...prev,
        currentVote: newVote,
        logs: [...prev.logs, newLog]
      };
    });
  };

  const handleSubmitVote = (optionId: string, reason?: string) => {
    setState(prev => {
      if (!prev.currentVote) return prev;

      const updatedResults = { ...prev.currentVote.results, [prev.currentRole]: optionId };
      const updatedReasons = reason ? { ...prev.currentVote.reasons, [prev.currentRole]: reason } : prev.currentVote.reasons;

      // 检查是否所有4个角色都投完票了 (Assume 4 roles total)
      const allRolesVoted = Object.keys(updatedResults).length >= 4;
      
      const newLog: LogEvent = {
        session_id: prev.sessionId,
        timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
        player_id: prev.currentRole,
        event_type: 'vote',
        vote_option_id: optionId
      };

      return {
        ...prev,
        currentVote: {
          ...prev.currentVote,
          results: updatedResults,
          reasons: updatedReasons,
          // 如果所有人都投了，标记为已完成
          status: allRolesVoted ? 'completed' : prev.currentVote.status
        },
        logs: [...prev.logs, newLog]
      };
    });
  };

  // 新增：清空当前投票，允许发起新一轮
  const handleClearVote = () => {
    setState(prev => ({
       ...prev,
       currentVote: null
    }));
  };

  const handleSendFeedback = (text: string) => {
    const roleInfo = ROLE_INFO[state.currentRole];
    setFeedbacks(prev => [{
      id: Date.now().toString(), 
      author: roleInfo.name, 
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.currentRole}`
    }, ...prev.slice(0, 15)]);

    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        session_id: prev.sessionId,
        timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
        player_id: prev.currentRole,
        event_type: 'discuss',
        discuss_tag: text
      }]
    }));
  };

  const switchRole = () => {
    setState(prev => {
      const roles = Object.values(Role);
      const nextIndex = (roles.indexOf(prev.currentRole) + 1) % roles.length;
      return { ...prev, currentRole: roles[nextIndex] };
    });
    setSelectedBuildingId(null);
    setFocusedCell(null);
  };

  const getAppBackground = () => {
    if (state.pollution > 60) return 'bg-stone-500';
    if (state.pollution > 40) return 'bg-stone-300';
    return 'bg-blue-50';
  };
  
  const memoizedSidebarLeft = useMemo(() => (
    <SidebarLeft 
      currentRole={state.currentRole} 
      onSelectBuilding={setSelectedBuildingId}
      selectedId={selectedBuildingId}
      gold={state.gold}
    />
  ), [state.currentRole, selectedBuildingId, state.gold]);

  const memoizedSidebarRight = useMemo(() => (
    <SidebarRight 
      tasks={tasks} aiAdvice={aiAdvice} feedbacks={feedbacks}
      currentRole={state.currentRole}
      onSendFeedback={handleSendFeedback}
      onRewardClick={() => { setState(prev => ({ ...prev, gold: prev.gold + 500 })); alert("政府拨款已收到！"); }}
    />
  ), [tasks, aiAdvice, feedbacks, state.currentRole]);

  // Handle survey completion: Log if there's a note, then go to Feedback report
  const handleSurveyComplete = (thankYouNote?: string) => {
    if (thankYouNote) {
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, {
          session_id: prev.sessionId,
          timestamp: Math.floor((Date.now() - prev.startTime) / 1000),
          player_id: prev.currentRole,
          event_type: 'discuss',
          discuss_tag: thankYouNote
        }]
      }));
    }
    setView('CHILD_FEEDBACK');
  };

  if (view === 'HOME') {
    return <HomePage onStartGame={handleStartGame} archivedCount={archivedSessions.length} />;
  }

  return (
    <div className={`flex flex-col h-screen w-full transition-colors duration-[3000ms] select-none ${getAppBackground()}`}>
      <TopPanel state={state} onHomeClick={handleEndSession} />
      
      <div className={`smog-overlay ${state.pollution > 50 ? 'smog-active' : ''}`} style={{ opacity: state.pollution > 50 ? (state.pollution - 50) / 50 : 0 }}></div>

      {selHandoverInfo && (
        <HandoverModal 
          currentActor={selHandoverInfo.currentActor}
          nextActor={selHandoverInfo.nextActor}
          onConfirm={() => {
            logSEL('handover_accept', selHandoverInfo);
            
            // Switch role to the next person as part of the handover
            const nextRole = selHandoverInfo.nextActor;
            setState(prev => ({ ...prev, currentRole: nextRole }));
            broadcastState('currentRole', nextRole);
            setSelectedBuildingId(null);
            setFocusedCell(null);

            setSelHandoverInfo(null);
            
            if (selPendingAction) {
              // Now that role has switched, the action being executed will be attributed to the nextRole in the log/state
              selPendingAction.callback();
              
              // Record the key commit *after* it's done, attributed to the NEW actor who performed the handover task
              setSelKeyCommitHistory(prev => {
                const h = [{ 
                  actorId: nextRole, 
                  timestamp: Date.now(), 
                  action: { ...selPendingAction.action, actorId: nextRole } 
                }, ...prev];
                selKeyCommitHistoryRef.current = h;
                return h;
              });
              
              setSelPendingAction(null);
              logSEL('handover_done', { role: nextRole });
            }
          }}
        />
      )}

      {selNegotiationAction && (
        <NegotiationModal 
          action={selNegotiationAction}
          onCancel={() => {
            logSEL('negotiation_cancel', selNegotiationAction);
            setSelNegotiationAction(null);
            setSelPendingAction(null);
          }}
          onConfirm={(data) => {
            logSEL('negotiation_reason', { reason: data.reason });
            logSEL('negotiation_concern', { concern: data.concern });
            logSEL('negotiation_compromise', { compromise: data.compromise });
            logSEL('negotiation_done', data);
            
            // Clear from failed proposals if this was a retry of a failed one
            if (selNegotiationAction) {
              setSelFailedProposals(prev => prev.filter(p => !(p.targetCell.x === selNegotiationAction.targetCell.x && p.targetCell.y === selNegotiationAction.targetCell.y && p.buildingId === selNegotiationAction.buildingId)));
            }

            setSelNegotiationAction(null);
            if (selPendingAction) {
              selPendingAction.callback();
              
              // Record history after successful negotiation commit
              if (selService.isKeyCommit(selPendingAction.action, stateRef.current.map)) {
                setSelKeyCommitHistory(prev => {
                  const h = [{ actorId: selPendingAction.action.actorId, timestamp: Date.now(), action: selPendingAction.action }, ...prev];
                  selKeyCommitHistoryRef.current = h;
                  return h;
                });
              }

              setSelPendingAction(null);
            }
          }}
        />
      )}

      {selShowVote && (
        <VoteSELModal 
          action={selShowVote}
          currentRole={state.currentRole}
          onClose={(passed) => {
            logSEL('vote_result', { passed, action: selShowVote });
            setSelShowVote(null);
            if (passed && selPendingAction) {
              logSEL('vote_commit', selShowVote);
              // Remove from failed proposals if it passed now
              setSelFailedProposals(prev => prev.filter(p => !(p.targetCell.x === selShowVote.targetCell.x && p.targetCell.y === selShowVote.targetCell.y && p.buildingId === selShowVote.buildingId)));
              selPendingAction.callback();

              // Record history after successful vote commit
              if (selService.isKeyCommit(selPendingAction.action, stateRef.current.map)) {
                setSelKeyCommitHistory(prev => {
                  const h = [{ actorId: selPendingAction.action.actorId, timestamp: Date.now(), action: selPendingAction.action }, ...prev];
                  selKeyCommitHistoryRef.current = h;
                  return h;
                });
              }

              setSelPendingAction(null);
            } else {
              setSelPendingAction(null);
              // Track as failed proposal to trigger negotiation if someone persists
              setSelFailedProposals(prev => [...prev.slice(-9), selShowVote]);
              setSelStats(prev => ({ ...prev, unresolvedConflictCount: prev.unresolvedConflictCount + 1 }));
            }
          }}
        />
      )}

      {selShowReflection && (
        <ReflectionModal 
          stats={selStats}
          onClose={() => {
            logSEL('reflection_submit', selStats);
            setSelShowReflection(false);
            // 结束后继续存档流程
            handleEndSession(true);
          }}
        />
      )}

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      
             {view === 'LOGS' && (
        <LogPage 
          state={state} 
          archivedSessions={archivedSessions}
          onBack={() => setView('GAME')} 
        />
      )}

      {/* 同步测试面板 (Sync Test Panel) */}
      <div className="fixed bottom-24 right-6 z-[200]">
        <button 
          onClick={() => setShowSyncTest(!showSyncTest)}
          className="bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-all"
        >
          {showSyncTest ? '关闭同步测试' : '⚙️ 同步测试'}
        </button>
        
        {showSyncTest && (
          <div className="absolute bottom-12 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 border border-purple-100 flex flex-col gap-2">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-2">同步测试 (Room: demo)</h3>
            <div className="text-[10px] text-gray-400 mb-2">状态: <span className={syncStatus === 'connected' ? 'text-green-500' : 'text-red-500'}>{syncStatus}</span></div>
            
            <button 
              onClick={() => {
                const action: GameAction = { type: 'place', actorId: state.currentRole, buildingId: 'PARK', targetCell: { x: 5, y: 5 } };
                handleCellClick(5, 5); // 触发本地逻辑并广播
              }}
              className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100"
            >
              在 (5,5) 添加测试公园
            </button>
            
            <button 
              onClick={() => {
                const dummyAction: GameAction = { type: 'place', actorId: state.currentRole, buildingId: 'SCHOOL', targetCell: { x: 0, y: 0 } };
                setSelShowVote(dummyAction);
                broadcastState('showVote', dummyAction);
              }}
              className="w-full py-2 bg-yellow-50 text-yellow-600 rounded-lg text-sm font-bold hover:bg-yellow-100"
            >
              打开远程投票
            </button>

            <button 
              onClick={() => {
                const dummyAction: GameAction = { type: 'delete', actorId: state.currentRole, targetCell: { x: 0, y: 0 } };
                setSelNegotiationAction(dummyAction);
                broadcastState('negotiationAction', dummyAction);
              }}
              className="w-full py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100"
            >
              打开远程协商
            </button>

            <button 
              onClick={() => {
                setSelShowReflection(true);
                broadcastState('showReflection', true);
              }}
              className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-bold hover:bg-emerald-100"
            >
              打开远程反思
            </button>

            <button 
              onClick={switchRole}
              className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200"
            >
              切换下一个玩家
            </button>
          </div>
        )}
      </div>
      
      {view === 'VOTE' && (
        <VotePage 
          state={state} 
          onBack={() => setView('GAME')} 
          onSubmitVote={handleSubmitVote} 
          onInitiateVote={handleInitiateVote} 
          onCloseVote={handleClearVote}
        />
      )}
      
      {/* 2-Step Feedback Flow: Survey -> Feedback Report */}
      {view === 'REFLECTION_SURVEY' && (
        <ReflectionSurveyPage 
          currentRole={state.currentRole}
          onComplete={handleSurveyComplete}
          onCancel={() => setView('GAME')}
        />
      )}
      
      {view === 'CHILD_FEEDBACK' && <ChildFeedbackPage state={state} onBack={() => setView('GAME')} />}
      
      {view === 'TEACHER_REPORT' && (
        <TeacherReportPage 
          state={state} 
          archivedSessions={archivedSessions}
          onBack={() => setView('GAME')} 
        />
      )}

      <main className="flex flex-1 overflow-hidden">
        {memoizedSidebarLeft}
        
        <div className="flex-1 flex flex-col relative">
          <GameMap 
            map={state.map}
            isPowered={state.power <= state.powerCapacity}
            onCellClick={handleCellClick}
            selectedBuildingId={selectedBuildingId}
            focusedCell={focusedCell}
          />
          
          {focusedCell && (
            <BuildingInfoOverlay 
              cell={focusedCell} onClose={() => setFocusedCell(null)} onDemolish={handleDemolish}
            />
          )}

          <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/95 p-3 rounded-2xl shadow-xl border border-gray-100 backdrop-blur-sm">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
               <span className="text-xl font-bold">#1</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-widest">
                当前角色 ID: {state.customPlayerId}
              </span>
              <button onClick={switchRole} className="font-bold text-gray-800 hover:text-indigo-600 transition-colors flex items-center gap-1">
                 {ROLE_INFO[state.currentRole]?.name || state.currentRole} <span className="text-xs">🔄</span>
              </button>
            </div>
          </div>

          {/* 修复关键点：提高 z-index 到 170，确保高于 smog-overlay (z-160) */}
          <div className="h-24 bg-white border-t border-gray-100 flex items-center justify-between px-10 shadow-2xl z-[170] relative">
            <div className="flex gap-4">
              <button onClick={() => setShowTutorial(true)} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-2xl font-black text-xl transition-all">?</button>
              <button onClick={() => setSelectedBuildingId(null)} className={`px-8 py-3 rounded-2xl font-bold transition-all ${!selectedBuildingId && !focusedCell ? 'bg-indigo-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>选择模式</button>
              <button onClick={handleRestart} className="px-8 py-3 rounded-2xl font-bold transition-all bg-rose-100 text-rose-500 hover:bg-rose-200 shadow-sm" title="重置当前地图">重新开始</button>
              <button onClick={handleEndSession} className="px-8 py-3 rounded-2xl font-bold transition-all bg-slate-800 text-white hover:bg-slate-900 shadow-sm" title="存档并返回首页">结束并存档</button>
              <button className={`px-8 py-3 rounded-2xl font-bold transition-all ${selectedBuildingId ? 'bg-yellow-400 text-yellow-900 shadow-lg' : 'bg-gray-50 text-gray-400'}`}>建造模式</button>
            </div>
            
            <div className="flex gap-8 items-center">
              <button onClick={() => setView('VOTE')} className="group flex flex-col items-center gap-1">
                 <span className="text-2xl">🗳️</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">投票 Vote</span>
              </button>
              {/* Updated: Button now navigates to REFLECTION_SURVEY first */}
              <button onClick={() => setView('REFLECTION_SURVEY')} className="group flex flex-col items-center gap-1">
                 <span className="text-2xl">👤📝</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">反思反馈</span>
              </button>
              <button onClick={() => setView('TEACHER_REPORT')} className="group flex flex-col items-center gap-1">
                 <span className="text-2xl">📊</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">报告 Report</span>
              </button>
              <button onClick={() => setView('LOGS')} className="group flex flex-col items-center gap-1">
                 <span className="text-2xl">📝</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase">日志 Logs</span>
              </button>
            </div>
          </div>
        </div>

        {memoizedSidebarRight}
      </main>
    </div>
  );
};

export default App;