
export enum Role {
  ENVIRONMENT = 'ENVIRONMENT',
  PLANNER = 'PLANNER',
  ENERGY = 'ENERGY',
  ECONOMIST = 'ECONOMIST'
}

export enum Phase {
  BUILD = 'BUILD',
  VOTE = 'VOTE',
  DISCUSS = 'DISCUSS'
}

export type ViewState = 'GAME' | 'LOGS' | 'VOTE' | 'CHILD_FEEDBACK' | 'TEACHER_REPORT';

export interface VoteData {
  id: string;
  question: string;
  description: string;
  options: { id: string, label: string }[];
  results: Record<string, string>; // player_id -> option_id
  reasons: Record<string, string>; // player_id -> text
  status: 'active' | 'completed';
  initiator: Role;
}

export interface LogEvent {
  session_id: string;
  timestamp: number; // seconds from start
  player_id: string; // current role
  event_type: 'propose' | 'modify_own' | 'modify_other' | 'vote' | 'discuss' | 'solve';
  building_type?: string;
  coordinates?: [number, number] | string;
  is_public?: boolean | string;
  target_owner_id?: string;
  vote_option_id?: string;
  discuss_tag?: string;
  problem_id?: string;
  modification?: string;
}

export interface Building {
  id: string;
  name: string;
  emoji: string;
  role: Role;
  cost: number;
  goldEffect: number;
  powerEffect: number;
  popEffect: number;
  pollutionEffect: number;
  happinessEffect: number;
  description: string;
}

export interface MapCell {
  x: number;
  y: number;
  buildingId: string | null;
  isRoad: boolean;
  status: 'normal' | 'no-power' | 'no-road';
  ownerId: Role | null;
}

export interface GameState {
  gold: number;
  goldDelta: number;
  population: number;
  maxPopulation: number;
  power: number;
  powerCapacity: number;
  pollution: number;
  happiness: number;
  day: number;
  phase: Phase;
  timer: number;
  currentRole: Role;
  map: MapCell[][];
  logs: LogEvent[];
  startTime: number;
  sessionId: string;
  currentVote: VoteData | null;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'urgent' | 'daily';
  deadline?: number;
}

export interface Feedback {
  id: string;
  author: string;
  text: string;
  time: string;
  avatar: string;
}
