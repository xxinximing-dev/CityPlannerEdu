
import { Role, Building, Phase, GameState } from './types';

export const GRID_SIZE = 14;

export const BUILDINGS: Record<string, Building> = {
  ROAD: {
    id: 'ROAD', name: '道路', emoji: '🛣️', role: Role.PLANNER, cost: 0,
    goldEffect: -1, powerEffect: 0, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '基础交通设施'
  },
  RESIDENCE: {
    id: 'RESIDENCE', name: '生态住宅区', emoji: '🏘️', role: Role.PLANNER, cost: 500,
    goldEffect: 5, powerEffect: -10, popEffect: 50, pollutionEffect: 5, happinessEffect: 5,
    description: '提供人口居住'
  },
  MALL: {
    id: 'MALL', name: '社区商场', emoji: '🛍️', role: Role.ECONOMIST, cost: 1200,
    goldEffect: 50, powerEffect: -20, popEffect: -10, pollutionEffect: 10, happinessEffect: 15,
    description: '产生经济效益'
  },
  OFFICE: {
    id: 'OFFICE', name: '绿色写字楼', emoji: '🏢', role: Role.ECONOMIST, cost: 1500,
    goldEffect: 80, powerEffect: -15, popEffect: -5, pollutionEffect: 5, happinessEffect: 5,
    description: '高端办公场所'
  },
  FIRE_STATION: {
    id: 'FIRE_STATION', name: '消防站', emoji: '👩‍🚒', role: Role.PLANNER, cost: 800,
    goldEffect: -10, powerEffect: -5, popEffect: 0, pollutionEffect: 0, happinessEffect: 10,
    description: '保障城市安全'
  },
  WIND_POWER: {
    id: 'WIND_POWER', name: '湘江风力发电', emoji: '🌬️', role: Role.ENERGY, cost: 2000,
    goldEffect: -5, powerEffect: 100, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '清洁可再生能源'
  },
  SOLAR: {
    id: 'SOLAR', name: '太阳能农场', emoji: '☀️', role: Role.ENERGY, cost: 1800,
    goldEffect: -3, powerEffect: 70, popEffect: 0, pollutionEffect: 0, happinessEffect: 0,
    description: '利用阳光发电'
  },
  PROTECT_ZONE: {
    id: 'PROTECT_ZONE', name: '岳麓山保护区', emoji: '⛰️', role: Role.ENVIRONMENT, cost: 3000,
    goldEffect: -20, powerEffect: 0, popEffect: 0, pollutionEffect: -30, happinessEffect: 20,
    description: '核心生态屏障'
  },
  PARK: {
    id: 'PARK', name: '社区公园', emoji: '🌳', role: Role.ENVIRONMENT, cost: 400,
    goldEffect: -5, powerEffect: 0, popEffect: 0, pollutionEffect: -5, happinessEffect: 15,
    description: '提升幸福度'
  },
  FARM: {
    id: 'FARM', name: '有机农场', emoji: '🥦', role: Role.ENVIRONMENT, cost: 600,
    goldEffect: 15, powerEffect: -5, popEffect: -5, pollutionEffect: -2, happinessEffect: 5,
    description: '提供健康食物'
  },
  RECYCLE: {
    id: 'RECYCLE', name: '垃圾分类中心', emoji: '♻️', role: Role.ENVIRONMENT, cost: 1000,
    goldEffect: -5, powerEffect: -15, popEffect: 0, pollutionEffect: -15, happinessEffect: 5,
    description: '处理城市废弃物'
  },
  SCHOOL: {
    id: 'SCHOOL', name: '学校', emoji: '🏫', role: Role.PLANNER, cost: 1200,
    goldEffect: -15, powerEffect: -10, popEffect: 0, pollutionEffect: 0, happinessEffect: 25,
    description: '教育是未来的希望'
  }
};

export const INITIAL_STATE: GameState = {
  gold: 10000,
  goldDelta: 50,
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
      x, y, buildingId: null, isRoad: false, status: 'normal', ownerId: null
    }))
  ),
  logs: [],
  startTime: Date.now(),
  sessionId: `Session_${Math.floor(Math.random() * 9000) + 1000}`,
  currentVote: null
};

export const ROLE_INFO = {
  [Role.ENVIRONMENT]: { name: '环境专家', color: 'bg-green-500', theme: 'green', icon: '🌿' },
  [Role.PLANNER]: { name: '城市规划师', color: 'bg-blue-500', theme: 'blue', icon: '📐' },
  [Role.ENERGY]: { name: '能源专家', color: 'bg-yellow-500', theme: 'yellow', icon: '⚡' },
  [Role.ECONOMIST]: { name: '经济规划师', color: 'bg-purple-500', theme: 'purple', icon: '💰' }
};
