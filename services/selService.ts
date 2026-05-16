import { Role, Building, MapCell, GameAction, KeyCommitRecord, VoteData } from '../types';
import { BUILDINGS } from '../constants';

/**
 * Key commit check
 * 一个 action 满足以下任一条件，就算 key commit：
 * 1. 动作类型是 delete / move / replace / upgrade
 * 2. 对象的 costLevel >= 2
 * 3. 对象的 impactLevel >= 2
 * 4. crossRoleEffect == true
 * 5. 修改的是别人负责区域
 * 6. 修改的是已确认对象（confirmed object）
 */
export const isKeyCommit = (action: GameAction, map: MapCell[][]): boolean => {
  const { type, buildingId, targetCell, actorId } = action;
  const building = buildingId ? BUILDINGS[buildingId] : null;
  const targetMapCell = map[targetCell.y]?.[targetCell.x];

  // 1. 动作类型是 place / delete / move / replace / upgrade
  if (['place', 'delete', 'move', 'replace', 'upgrade'].includes(type)) return true;

  // 2. 对象的 costLevel >= 2
  if (building && building.costLevel >= 2) return true;

  // 3. 对象的 impactLevel >= 2
  if (building && building.impactLevel >= 2) return true;

  // 4. crossRoleEffect == true
  if (building?.crossRoleEffect) return true;

  // 5. 修改的是别人负责区域
  if (targetMapCell && targetMapCell.ownerId && targetMapCell.ownerId !== actorId) return true;

  // 6. 修改的是已确认对象
  if (targetMapCell?.confirmed) return true;

  return false;
};

/**
 * Turn-taking checkpoint check
 * 1. 当同一个孩子连续 3 次 建造建筑（place）时，触发。
 */
export const shouldTriggerTurnTaking = (actorId: Role, history: KeyCommitRecord[]): boolean => {
  // 过滤出建造建筑的任务
  const placementHistory = history.filter(h => h.action.type === 'place');
  
  if (placementHistory.length < 2) return false;

  // 检查前两次是否也是当前玩家（加上本次就是 3 次）
  const last2 = placementHistory.slice(0, 2);
  const count = last2.filter(h => h.actorId === actorId).length;
  
  return count >= 2;
};

/**
 * Helper to trigger turn-taking log/action
 */
export const openTurnTakingCheckpoint = (currentActorId: Role, nextActorId: Role) => {
  logSELSelectionEvent('turn_checkpoint_trigger', { currentActorId, nextActorId });
};

/**
 * Major decision check
 * 1. costLevel == 3
 * 2. impactLevel == 3
 * 3. 修改已确认对象
 * 4. 修改别人负责区域
 */
export const isMajorDecision = (action: GameAction, map: MapCell[][]): boolean => {
  const { buildingId, targetCell, actorId } = action;
  const building = buildingId ? BUILDINGS[buildingId] : null;
  const targetMapCell = map[targetCell.y]?.[targetCell.x];

  // 1 & 2. costLevel == 3 or impactLevel == 3
  if (building && (building.costLevel === 3 || building.impactLevel === 3)) return true;

  // 3. 修改已确认对象
  if (targetMapCell?.confirmed) return true;

  // 4. 修改别人负责区域
  if (targetMapCell && targetMapCell.ownerId && targetMapCell.ownerId !== actorId) return true;

  return false;
};

export const shouldTriggerVote = (action: GameAction, map: MapCell[][]): boolean => {
  return isMajorDecision(action, map);
};

export const votePassed = (votes: Record<string, string>): boolean => {
  // 三人团队至少 2 人同意才通过
  const agreeCount = Object.values(votes).filter(v => v === 'agree').length;
  return agreeCount >= 2;
};

/**
 * Negotiation check
 * 1. 当前动作是 delete / move / replace，并且目标对象：
 *    - 已确认
 *    - 最后提交者不是当前玩家
 *    - impactLevel >= 2
 * 2. 同一区域在 20 秒内被不同孩子修改至少 2 次
 * 3. 某个 major decision 投票失败后，有人继续推动原提案
 */
export const shouldTriggerNegotiation = (
  action: GameAction, 
  map: MapCell[][],
  recentModifications: { cell: string, actor: Role, time: number }[],
  failedProposals: GameAction[] = []
): boolean => {
  const { type, targetCell, actorId, buildingId } = action;
  const targetMapCell = map[targetCell.y]?.[targetCell.x];
  const targetBuilding = targetMapCell?.buildingId ? BUILDINGS[targetMapCell.buildingId] : null;
  const cellKey = `${targetCell.x},${targetCell.y}`;

  // 1. 当前动作是 delete / move / replace，并且目标对象：
  if (['delete', 'move', 'replace'].includes(type) && targetMapCell) {
    if (targetMapCell.confirmed && targetMapCell.ownerId !== actorId && targetBuilding && targetBuilding.impactLevel >= 2) {
      return true;
    }
  }

  // 2. 同一区域在 20 秒内被不同孩子修改至少 2 次
  const now = Date.now();
  const cellMods = recentModifications.filter(m => m.cell === cellKey && (now - m.time < 20000));
  const uniqueActors = new Set(cellMods.map(m => m.actor));
  if (uniqueActors.size >= 2) return true;

  // 3. 某个 major decision 投票失败后，有人继续推动原提案
  // 原提案的定义：相同的坐标 + 相同的建筑类型
  const isRepeatOfFailed = failedProposals.some(failed => 
    failed.targetCell.x === targetCell.x && 
    failed.targetCell.y === targetCell.y && 
    failed.buildingId === buildingId
  );
  if (isRepeatOfFailed) return true;

  return false;
};

/**
 * Wizard-of-Oz Trigger
 */
export const wizardTriggerNegotiation = (currentRole: Role) => {
  logSELSelectionEvent('negotiation_open_woz', { actorId: currentRole });
};

/**
 * Reflection check
 */
export const shouldTriggerReflection = (roundEnded: boolean): boolean => {
  return roundEnded;
};

/**
 * Helper to log reflection opening
 */
export const openReflection = (stats: SELStats) => {
  logSELSelectionEvent('reflection_trigger', stats);
};

/**
 * Unified logger
 */
export const logSELSelectionEvent = (name: string, payload: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[SEL_EVENT][${timestamp}] ${name}:`, payload);
};
