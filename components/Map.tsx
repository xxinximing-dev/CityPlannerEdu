
import React from 'react';
import { GameState, MapCell, Role } from '../types';
import { BUILDINGS, GRID_SIZE } from '../constants';

interface MapProps {
  state: GameState;
  onCellClick: (x: number, y: number) => void;
  selectedBuildingId: string | null;
  focusedCell: MapCell | null;
}

export const GameMap: React.FC<MapProps> = ({ state, onCellClick, selectedBuildingId, focusedCell }) => {
  const renderCell = (cell: MapCell) => {
    const building = cell.buildingId ? BUILDINGS[cell.buildingId] : null;
    const isRoad = cell.isRoad;
    const isFocused = focusedCell?.x === cell.x && focusedCell?.y === cell.y;
    
    let cellClasses = "grid-cell relative border border-gray-100 flex items-center justify-center cursor-pointer overflow-hidden ";
    
    if (selectedBuildingId && !cell.buildingId && !cell.isRoad) {
       cellClasses += " hover:bg-green-100/80 ";
    }
    
    if (isFocused) {
      cellClasses += " ring-4 ring-indigo-400 ring-inset z-20 ";
    }

    const isPowered = state.power <= state.powerCapacity;

    return (
      <div 
        key={`${cell.x}-${cell.y}`}
        onClick={() => onCellClick(cell.x, cell.y)}
        className={cellClasses}
        style={{ backgroundColor: isRoad ? '#94a3b8' : '#ffffff' }}
      >
        {/* Road visuals */}
        {isRoad && (
           <>
             <div className="w-full h-2 bg-white/20 absolute top-1/2 -translate-y-1/2"></div>
             <div className="w-2 h-full bg-white/20 absolute left-1/2 -translate-x-1/2"></div>
           </>
        )}
        
        {building && (
          <div className="flex flex-col items-center z-10">
            <span className="text-3xl building-float select-none drop-shadow-sm">{building.emoji}</span>
            {!isPowered && building.powerEffect < 0 && (
              <div className="absolute top-1 right-1 bg-red-500 text-[10px] w-5 h-5 flex items-center justify-center rounded-full text-white font-bold animate-pulse shadow-sm">⚡</div>
            )}
          </div>
        )}

        {/* Invalid connection feedback */}
        {!isRoad && building && cell.status === 'no-road' && (
           <div className="absolute inset-0 bg-red-500/10 border-2 border-dashed border-red-400 animate-pulse pointer-events-none"></div>
        )}
        
        {/* Coordinates for dev/debug or subtle guide */}
        <span className="absolute bottom-0 right-0 text-[6px] text-gray-200 p-0.5 pointer-events-none select-none">
          {cell.x},{cell.y}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 h-full flex items-center justify-center bg-blue-50/50 overflow-auto p-8">
      <div 
        className="grid gap-0 bg-white shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] rounded-2xl overflow-hidden border-8 border-white p-1"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          width: 'min(88vh, 88vw)',
          aspectRatio: '1/1'
        }}
      >
        {state.map.flat().map(renderCell)}
      </div>
    </div>
  );
};
