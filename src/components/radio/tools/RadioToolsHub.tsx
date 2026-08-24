import React, { useState } from 'react';
import { ExamDistrictMap } from '../../ExamDistrictMap';
import { QCodesCheatSheet } from '../../QCodesCheatSheet';
import { PhoneticAlphabet } from '../../PhoneticAlphabet';
import { BandPowerMatrix } from '../../BandPowerMatrix';
import { RadioAntennaDiyCalc } from './RadioAntennaDiyCalc';
import { MapPin, BookOpen, Volume2, Zap, Calculator } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

export type ToolSubTab = 'districts' | 'qcodes' | 'phonetic' | 'bands' | 'antenna_diy';

export const RadioToolsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolSubTab>('districts');
  const { isDark } = useTheme();

  const toolTabs = [
    { id: 'districts' as ToolSubTab, label: '1. 呼号分区中国地图', icon: <MapPin className="w-4 h-4" /> },
    { id: 'qcodes' as ToolSubTab, label: '2. Q简语 / HAM词典', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'phonetic' as ToolSubTab, label: '3. 国际字母解释法', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'bands' as ToolSubTab, label: '4. 频段与功率分配', icon: <Zap className="w-4 h-4" /> },
    { id: 'antenna_diy' as ToolSubTab, label: '5. 天馈与巴伦计算器', icon: <Calculator className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <div
        className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto shadow-xs select-none ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}
      >
        {toolTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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

      <div>
        {activeTab === 'districts' && <ExamDistrictMap />}
        {activeTab === 'qcodes' && <QCodesCheatSheet />}
        {activeTab === 'phonetic' && <PhoneticAlphabet />}
        {activeTab === 'bands' && <BandPowerMatrix />}
        {activeTab === 'antenna_diy' && <RadioAntennaDiyCalc />}
      </div>
    </div>
  );
};
