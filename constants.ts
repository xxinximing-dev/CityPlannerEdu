import { Role, Building, Phase, GameState } from './types';

export const GRID_SIZE = 14;

export const BUILDINGS: Record<string, Building> = {
  ROAD: {
    id: 'ROAD', name: '道路', emoji: '🛣️', role: Role.PLANNER, cost: 0,
    goldEffect: -1, powerEffect: 0, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '基础交通设施',
    costLevel: 1, impactLevel: 1, crossRoleEffect: false
  },
  RESIDENCE: {
    id: 'RESIDENCE', name: '生态住宅', emoji: '🏘️', role: Role.PLANNER, cost: 500,
    goldEffect: 5, powerEffect: -10, popEffect: 50, pollutionEffect: 5, happinessEffect: 5,
    description: '为市民提供住所',
    costLevel: 1, impactLevel: 1, crossRoleEffect: false
  },
  MALL: {
    id: 'MALL', name: '社区商场', emoji: '🛍️', role: Role.ECONOMIST, cost: 1200,
    goldEffect: 50, powerEffect: -20, popEffect: 50, pollutionEffect: 10, happinessEffect: 15,
    description: '创造经济价值',
    costLevel: 2, impactLevel: 2, crossRoleEffect: true
  },
  OFFICE: {
    id: 'OFFICE', name: '绿色办公楼', emoji: '🏢', role: Role.ECONOMIST, cost: 1500,
    goldEffect: 80, powerEffect: -15, popEffect: 40, pollutionEffect: 5, happinessEffect: 5,
    description: '高端工作空间',
    costLevel: 2, impactLevel: 2, crossRoleEffect: true
  },
  FIRE_STATION: {
    id: 'FIRE_STATION', name: '消防站', emoji: '👩‍🚒', role: Role.PLANNER, cost: 800,
    goldEffect: -10, powerEffect: -5, popEffect: 10, pollutionEffect: 0, happinessEffect: 10,
    description: '保障城市安全',
    costLevel: 1, impactLevel: 2, crossRoleEffect: true
  },
  WIND_POWER: {
    id: 'WIND_POWER', name: '风力发电机', emoji: '🌬️', role: Role.ENERGY, cost: 2000,
    goldEffect: -5, powerEffect: 100, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '清洁可再生能源',
    costLevel: 3, impactLevel: 3, crossRoleEffect: true
  },
  SOLAR: {
    id: 'SOLAR', name: '太阳能电站', emoji: '☀️', role: Role.ENERGY, cost: 1800,
    goldEffect: -3, powerEffect: 70, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '利用阳光发电',
    costLevel: 2, impactLevel: 2, crossRoleEffect: true
  },
  PROTECT_ZONE: {
    id: 'PROTECT_ZONE', name: '自然保护区', emoji: '⛰️', role: Role.ENVIRONMENT, cost: 3000,
    goldEffect: -20, powerEffect: 0, popEffect: 0, pollutionEffect: -30, happinessEffect: 20,
    description: '核心生态屏障',
    costLevel: 3, impactLevel: 3, crossRoleEffect: true
  },
  PARK: {
    id: 'PARK', name: '社区公园', emoji: '🌳', role: Role.ENVIRONMENT, cost: 400,
    goldEffect: -5, powerEffect: 0, popEffect: 0, pollutionEffect: -5, happinessEffect: 15,
    description: '提升市民幸福感',
    costLevel: 1, impactLevel: 1, crossRoleEffect: true
  },
  FARM: {
    id: 'FARM', name: '有机农场', emoji: '🥦', role: Role.ENVIRONMENT, cost: 600,
    goldEffect: 15, powerEffect: -5, popEffect: 5, pollutionEffect: -2, happinessEffect: 5,
    description: '提供健康食品',
    costLevel: 1, impactLevel: 1, crossRoleEffect: false
  },
  RECYCLE: {
    id: 'RECYCLE', name: '资源回收中心', emoji: '♻️', role: Role.ENVIRONMENT, cost: 1000,
    goldEffect: -5, powerEffect: -15, popEffect: 0, pollutionEffect: -15, happinessEffect: 5,
    description: '处理城市垃圾',
    costLevel: 2, impactLevel: 2, crossRoleEffect: true
  },
  SCHOOL: {
    id: 'SCHOOL', name: '学校', emoji: '🏫', role: Role.PLANNER, cost: 1200,
    goldEffect: -15, powerEffect: -10, popEffect: 30, pollutionEffect: 0, happinessEffect: 25,
    description: '教育成就未来',
    costLevel: 2, impactLevel: 2, crossRoleEffect: true
  }
};

export const INITIAL_STATE: GameState = {
  gold: 10000,
  goldDelta: 0,
  population: 0,
  maxPopulation: 500,
  power: 0,
  powerCapacity: 0,
  pollution: 20,
  happiness: 0,
  day: 1,
  phase: Phase.BUILD,
  timer: 120,
  currentRole: Role.ENVIRONMENT,
  map: Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      x, y, buildingId: null, isRoad: false, status: 'normal', ownerId: null, confirmed: false
    }))
  ),
  logs: [],
  startTime: Date.now(),
  sessionId: `Session_${Math.floor(Math.random() * 9000) + 1000}`,
  groupId: '',
  customPlayerId: '',
  currentVote: null
};

export const ROLE_INFO = {
  [Role.ENVIRONMENT]: { name: '环境专家', color: 'bg-green-500', theme: 'green', icon: '🌿' },
  [Role.PLANNER]: { name: '城市规划师', color: 'bg-blue-500', theme: 'blue', icon: '📐' },
  [Role.ENERGY]: { name: '能源专家', color: 'bg-yellow-500', theme: 'yellow', icon: '⚡' },
  [Role.ECONOMIST]: { name: '经济学家', color: 'bg-purple-500', theme: 'purple', icon: '💰' }
};