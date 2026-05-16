
import React, { memo } from 'react';
import { MapCell } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';

interface CellProps {
  cell: MapCell;
  isPowered: boolean;
  isFocused: boolean;
  canBuild: boolean;
  onClick: (x: number, y: number) => void;
}

// 核心优化：自定义比对函数
// 只有当格子的关键属性发生变化时，才允许 React 重新渲染这个 DOM
// 这防止了全局状态更新（如金币变化）导致 196 个格子全部重绘
const arePropsEqual = (prev: CellProps, next: CellProps) => {
  // 1. 如果选中状态变了，必须更新
  if (prev.isFocused !== next.isFocused) return false;
  
  // 2. 如果“是否可建造”的状态变了（比如从没选建筑变成选了建筑），且该格子为空，则必须更新以显示/隐藏绿色高亮
  // 如果格子已经有建筑了，canBuild 的变化对它外观没影响，可以不更新
  const hasBuilding = !!prev.cell.buildingId || prev.cell.isRoad;
  if (!hasBuilding && prev.canBuild !== next.canBuild) return false;

  // 3. 如果电力状态变了，且该格子有建筑，需要更新
  if (hasBuilding && prev.isPowered !== next.isPowered) return false;

  // 4. 核心数据比对：如果引用没变，说明地图数据没变
  return prev.cell === next.cell;
};

const Cell = memo(({ cell, isPowered, isFocused, canBuild, onClick }: CellProps) => {
  const building = cell.buildingId ? BUILDINGS[cell.buildingId] : null;
  const isRoad = cell.isRoad;
  
  // 基础样式
  let cellClasses = "grid-cell relative border border-gray-100 flex items-center justify-center cursor-pointer overflow-hidden select-none ";
  
  // 只有在没建筑且处于建造模式时，才添加 hover 效果
  if (canBuild && !cell.buildingId && !cell.isRoad) {
     cellClasses += " hover:bg-green-100/80 ";
  }
  
  // 选中高亮
  if (isFocused) {
    cellClasses += " ring-4 ring-indigo-400 ring-inset z-20 ";
  }

  return (
    <div 
      onClick={() => onClick(cell.x, cell.y)}
      className={cellClasses}
      style={{ backgroundColor: isRoad ? '#94a3b8' : '#ffffff' }}
    >
      {/* 道路虚线 */}
      {isRoad && (
         <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
           <div className="w-full h-2 bg-white/20 absolute top-1/2 -translate-y-1/2"></div>
           <div className="w-2 h-full bg-white/20 absolute left-1/2 -translate-x-1/2"></div>
         </div>
      )}
      
      {/* 建筑图标 */}
      {building && (
        <div className="pointer-events-none flex flex-col items-center z-10">
          <span className="text-3xl building-float drop-shadow-sm">{building.emoji}</span>
          {/* 电力不足警告 */}
          {!isPowered && building.powerEffect < 0 && (
            <div className="absolute top-1 right-1 bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white font-bold animate-pulse">⚡</div>
          )}
        </div>
      )}

      {/* 道路连接警告 */}
      {!isRoad && building && cell.status === 'no-road' && (
         <div className="absolute inset-0 bg-red-500/10 border-2 border-dashed border-red-400 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
}, arePropsEqual);

interface MapProps {
  map: MapCell[][];
  isPowered: boolean;
  onCellClick: (x: number, y: number) => void;
  selectedBuildingId: string | null;
  focusedCell: MapCell | null;
}

export const GameMap = memo(({ map, isPowered, onCellClick, selectedBuildingId, focusedCell }: MapProps) => {
  return (
    <div className="flex-1 h-full flex items-center justify-center bg-blue-50/50 overflow-auto p-12">
      <div 
        className="grid gap-0 bg-white shadow-2xl rounded-2xl overflow-hidden border-8 border-white p-1"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: 'min(85vh, 85vw)',
          aspectRatio: '1/1'
        }}
      >
        {map.map((row, y) => 
          row.map((cell, x) => (
            <Cell 
              key={`${x}-${y}`}
              cell={cell}
              isPowered={isPowered}
              isFocused={focusedCell?.x === x && focusedCell?.y === y}
              canBuild={!!selectedBuildingId}
              onClick={onCellClick}
            />
          ))
        )}
      </div>
    </div>
  );
});
