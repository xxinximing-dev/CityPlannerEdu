
import React from 'react';
import { Building, MapCell } from '../types';
import { BUILDINGS } from '../constants';

interface BuildingInfoOverlayProps {
  cell: MapCell;
  onClose: () => void;
  onDemolish: (x: number, y: number) => void;
}

export const BuildingInfoOverlay: React.FC<BuildingInfoOverlayProps> = ({ cell, onClose, onDemolish }) => {
  const buildingId = cell.buildingId;
  const building = buildingId ? BUILDINGS[buildingId] : (cell.isRoad ? BUILDINGS['ROAD'] : null);

  if (!building) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-80 border-4 border-indigo-400 animate-in zoom-in duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{building.emoji}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{building.name}</h3>
              <p className="text-xs text-gray-400">坐标: ({cell.x}, {cell.y})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{building.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded-lg ${building.goldEffect >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              💰 金币: {building.goldEffect}/天
            </div>
            <div className={`p-2 rounded-lg ${building.powerEffect >= 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
              ⚡ 电力: {building.powerEffect}
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              👥 人口: +{building.popEffect}
            </div>
            <div className={`p-2 rounded-lg ${building.pollutionEffect <= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              🌳 污染: {building.pollutionEffect}%
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onDemolish(cell.x, cell.y)}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-bold py-2 rounded-xl transition-colors"
          >
            拆除建筑
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 rounded-xl transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
