import React from 'react';
import { Role, Building } from '../types';
import { BUILDINGS, ROLE_INFO } from '../constants';

interface SidebarLeftProps {
  currentRole: Role;
  onSelectBuilding: (id: string) => void;
  selectedId: string | null;
  gold: number;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ currentRole, onSelectBuilding, selectedId, gold }) => {
  const roleInfo = ROLE_INFO[currentRole];
  const buildingsForRole = Object.values(BUILDINGS).filter(b => b.role === currentRole);

  const roleDescription = currentRole === Role.ENVIRONMENT ? '生态规划' : 
                          currentRole === Role.PLANNER ? '基础设施' : 
                          currentRole === Role.ENERGY ? '能源供应' : '经济增长';

  return (
    <div className="w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-inner">
      <div className={`${roleInfo.color} p-4 text-white shadow-md`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl bg-white/20 p-2 rounded-full">{roleInfo.icon}</span>
          <div>
            <h2 className="font-bold text-xl">{roleInfo.name}面板</h2>
            <p className="text-xs opacity-90">负责 {roleDescription}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {buildingsForRole.map(building => (
          <div 
            key={building.id}
            onClick={() => onSelectBuilding(building.id)}
            className={`
              p-4 rounded-xl border-2 cursor-pointer transition-all
              ${selectedId === building.id ? `border-${roleInfo.theme}-500 bg-${roleInfo.theme}-50 shadow-lg scale-105` : 'border-gray-100 hover:border-gray-300'}
              ${gold < building.cost ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{building.emoji}</span>
              <div>
                <h3 className="font-bold text-gray-800">{building.name}</h3>
                <span className="text-xs text-gray-400">成本: 💰{building.cost}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-600 bg-white/50 p-2 rounded-lg">
              <div className={building.goldEffect >= 0 ? 'text-green-600' : 'text-red-600'}>金币: {building.goldEffect > 0 ? '+' : ''}{building.goldEffect}</div>
              <div className={building.powerEffect >= 0 ? 'text-yellow-600' : 'text-blue-600'}>能量: {building.powerEffect > 0 ? '+' : ''}{building.powerEffect}</div>
              <div className="text-indigo-600">人口: +{building.popEffect}</div>
              <div className={building.pollutionEffect <= 0 ? 'text-green-600' : 'text-red-600'}>污染: {building.pollutionEffect}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};