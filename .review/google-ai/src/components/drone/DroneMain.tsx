import React, { useState } from 'react';
import { DroneSubsystems } from './DroneSubsystems';
import { DroneRegulations } from './DroneRegulations';
import { BetaflightTuningGuide } from './BetaflightTuningGuide';
import { DroneDiyLab } from './DroneDiyLab';
import { DroneGearRecommender } from './DroneGearRecommender';
import { Send, Scale, Sliders, Wrench, ShoppingBag } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export type DroneSubTab = 'subsystems' | 'regulations' | 'betaflight' | 'diy' | 'gear';

export const DroneMain: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DroneSubTab>('subsystems');
  const { isDark } = useTheme();

  const droneTabs = [
    { id: 'subsystems' as DroneSubTab, label: '1. 硬件子系统拓扑', icon: <Send className="w-4 h-4" /> },
    { id: 'regulations' as DroneSubTab, label: '2. 2024空域与飞行法规', icon: <Scale className="w-4 h-4" /> },
    { id: 'betaflight' as DroneSubTab, label: '3. Betaflight PID调参', icon: <Sliders className="w-4 h-4" /> },
    { id: 'diy' as DroneSubTab, label: '4. FPV穿越机DIY装机', icon: <Wrench className="w-4 h-4" /> },
    { id: 'gear' as DroneSubTab, label: '5. 器材客观选型库', icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Drone 5 Sub-Modules Navigation Bar */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto shadow-xs select-none ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        {droneTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#18181D]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Drone Sub-Module */}
      <div>
        {activeTab === 'subsystems' && <DroneSubsystems />}
        {activeTab === 'regulations' && <DroneRegulations />}
        {activeTab === 'betaflight' && <BetaflightTuningGuide />}
        {activeTab === 'diy' && <DroneDiyLab />}
        {activeTab === 'gear' && <DroneGearRecommender />}
      </div>
    </div>
  );
};
