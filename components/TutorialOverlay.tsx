
import React, { useState } from 'react';

interface TutorialStep {
  title: string;
  content: string;
  icon: string;
  color: string;
}

const steps: TutorialStep[] = [
  {
    title: "欢迎来到 EcoCity!",
    content: "这是一个协作建设绿色城市的教育游戏。你将扮演不同专家角色，与他人共同打造理想城市！",
    icon: "🏙️",
    color: "bg-indigo-600"
  },
  {
    title: "选择你的角色",
    content: "点击中间的图标可以切换角色。每个角色（环境、规划、能源、经济）拥有专属的建筑工具包。",
    icon: "📐",
    color: "bg-blue-500"
  },
  {
    title: "开始建设",
    content: "在左侧菜单选择建筑，然后在地图上点击空地放置。记得先修路，大部分建筑需要连接道路才能运作哦！",
    icon: "🛣️",
    color: "bg-emerald-500"
  },
  {
    title: "监控城市指标",
    content: "顶部面板显示金币、人口、电力和污染。当电力不足时指标会闪烁变红，记得及时增加发电设施！",
    icon: "⚡",
    color: "bg-yellow-500"
  },
  {
    title: "协作与决策",
    content: "遇到意见分歧？点击底部的“投票”按钮发起决策。右侧的“日志”可以导出你的所有行为数据。",
    icon: "🗳️",
    color: "bg-purple-600"
  }
];

interface TutorialOverlayProps {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col border-8 border-white">
        <div className={`${step.color} h-40 flex items-center justify-center text-8xl transition-all duration-500`}>
          <span className="animate-bounce">{step.icon}</span>
        </div>
        
        <div className="p-8 text-center flex-1">
          <h2 className="text-3xl font-black text-gray-800 mb-4">{step.title}</h2>
          <p className="text-gray-600 leading-relaxed text-lg font-medium">
            {step.content}
          </p>
        </div>

        <div className="px-8 pb-8 flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 ' + step.color : 'w-2 bg-gray-200'}`}
              />
            ))}
          </div>
          
          <div className="flex gap-4">
            {currentStep > 0 && (
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="flex-1 py-4 rounded-2xl font-black text-gray-400 border-2 border-gray-100 hover:bg-gray-50 transition-all"
              >
                上一步
              </button>
            )}
            <button 
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  onClose();
                }
              }}
              className={`flex-1 py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${step.color} hover:brightness-110`}
            >
              {currentStep === steps.length - 1 ? "开始游戏!" : "下一步"}
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="text-[10px] font-bold text-gray-300 uppercase hover:text-gray-500 transition-colors"
          >
            跳过教程
          </button>
        </div>
      </div>
    </div>
  );
};
