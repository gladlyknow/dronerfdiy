import React, { useState } from 'react';
import { ExamLevel, KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { LevelExamView } from './LevelExamView';
import { Award, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface RadioExamHubProps {
  onSelectNode?: (node: KnowledgeNode) => void;
}

export const RadioExamHub: React.FC<RadioExamHubProps> = ({ onSelectNode }) => {
  const [activeLevel, setActiveLevel] = useState<'A' | 'B' | 'C'>('A');
  const { isDark } = useTheme();

  const levels: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* 3 Exam Tier Independent Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map((lvl) => {
          const cfg = EXAM_LEVEL_CONFIGS[lvl];
          const isSelected = activeLevel === lvl;

          return (
            <div
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden select-none ${
                isSelected
                  ? lvl === 'A'
                    ? isDark ? 'bg-[#141418] border-emerald-500 shadow-lg shadow-emerald-950/40' : 'bg-emerald-50/70 border-emerald-500 shadow-md'
                    : lvl === 'B'
                    ? isDark ? 'bg-[#141418] border-sky-500 shadow-lg shadow-sky-950/40' : 'bg-sky-50/70 border-sky-500 shadow-md'
                    : isDark ? 'bg-[#141418] border-amber-500 shadow-lg shadow-amber-950/40' : 'bg-amber-50/70 border-amber-500 shadow-md'
                  : isDark
                  ? 'bg-[#111114] border-[#26262D] hover:border-slate-700 opacity-75 hover:opacity-100'
                  : 'bg-white border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm ${
                    lvl === 'A' ? 'bg-emerald-600' : lvl === 'B' ? 'bg-sky-600' : 'bg-amber-600'
                  }`}>
                    {lvl}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm sm:text-base ${
                      isSelected ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {cfg.badge}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-500">
                      {cfg.allowedBands}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                    lvl === 'A' ? 'bg-emerald-600' : lvl === 'B' ? 'bg-sky-600' : 'bg-amber-600'
                  }`}>
                    当前选定
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                {cfg.description}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <span className="text-slate-500">功率: {cfg.maxPower}</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  题量: {cfg.totalQuestions}题 (及格≥{cfg.passScore})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Render the Active Level Sub-Modules */}
      <LevelExamView
        key={activeLevel}
        level={activeLevel}
        onSelectNode={onSelectNode}
      />
    </div>
  );
};
