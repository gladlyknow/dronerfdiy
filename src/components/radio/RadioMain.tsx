import React, { useState } from 'react';
import { KnowledgeNode } from '../../types';
import { RadioExamHub } from './exam/RadioExamHub';
import { RadioToolsHub } from './tools/RadioToolsHub';
import { Award, Wrench } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export type RadioSection = 'exam' | 'tools';

interface RadioMainProps {
  onSelectNode?: (node: KnowledgeNode) => void;
}

export const RadioMain: React.FC<RadioMainProps> = ({ onSelectNode }) => {
  const [activeSection, setActiveSection] = useState<RadioSection>('exam');
  const { isDark } = useTheme();

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Secondary Tab Switcher for Radio Domain */}
      <div className={`border-b transition-colors ${
        isDark ? 'border-[#2D2D33] bg-[#111114]' : 'border-slate-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSection('exam')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'exam'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-[#1A1A20]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>CRAC 操作证书考试系统 (A / B / C 独立专区)</span>
            </button>

            <button
              onClick={() => setActiveSection('tools')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'tools'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-[#1A1A20]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>HAM 实用工具箱 (呼号地图 / 通联词典 / 频段 / 天馈)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Render Selected Radio Section */}
      <div className="flex-1">
        {activeSection === 'exam' ? (
          <RadioExamHub onSelectNode={onSelectNode} />
        ) : (
          <RadioToolsHub />
        )}
      </div>
    </div>
  );
};
