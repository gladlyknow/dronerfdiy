import React, { useEffect, useRef, useState } from 'react';
import { KnowledgeNode } from '../../types';
import { RadioExamHub } from './exam/RadioExamHub';
import { RadioToolsHub } from './tools/RadioToolsHub';
import { Award, Wrench } from 'lucide-react';
import { useTheme } from '../../utils/theme';
import type { ExamJumpRequest, ExamJumpTarget } from '../../types';
import type { ExamSubTab } from './exam/LevelExamView';
import type { ToolSubTab } from './tools/RadioToolsHub';

export type RadioSection = 'exam' | 'tools';

interface RadioMainProps {
  onSelectNode?: (node: KnowledgeNode) => void;
  initialSection?: RadioSection;
  initialLevel?: 'A' | 'B' | 'C';
  initialTab?: ExamSubTab;
  initialTool?: ToolSubTab;
  onNavigate?: (section: RadioSection, level: 'A' | 'B' | 'C', tab: ExamSubTab, tool?: ToolSubTab) => void;
}

export const RadioMain: React.FC<RadioMainProps> = ({
  onSelectNode,
  initialSection = 'exam',
  initialLevel = 'A',
  initialTab = 'knowledge',
  initialTool = 'districts',
  onNavigate,
}) => {
  const [activeSection, setActiveSection] = useState<RadioSection>(initialSection);
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [activeTab, setActiveTab] = useState<ExamSubTab>(initialTab);
  const { isDark } = useTheme();
  const [target, setTarget] = useState<ExamJumpTarget | null>(null);
  const jumpRequestId = useRef(0);
  const jumpToQuestion = (next: ExamJumpRequest) => {
    jumpRequestId.current += 1;
    setActiveSection('exam');
    setTarget({ ...next, requestId: jumpRequestId.current });
    setActiveLevel(next.level);
    setActiveTab('question_bank');
    onNavigate?.('exam', next.level, 'question_bank', initialTool);
  };
  useEffect(() => setActiveSection(initialSection), [initialSection]);
  useEffect(() => setActiveLevel(initialLevel), [initialLevel]);
  useEffect(() => setActiveTab(initialTab), [initialTab]);
  const selectSection = (section: RadioSection) => {
    setActiveSection(section);
    onNavigate?.(section, activeLevel, activeTab, initialTool);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Secondary Tab Switcher for Radio Domain */}
      <div className={`border-b transition-colors ${
        isDark ? 'border-[#2D2D33] bg-[#111114]' : 'border-slate-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectSection('exam')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'exam'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : isDark ? 'text-slate-400 hover:text-white hover:bg-[#1A1A20]' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>中国业余无线电学习与题库练习 (A / B / C)</span>
            </button>

            <button
              onClick={() => selectSection('tools')}
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
          <RadioExamHub
            onSelectNode={onSelectNode}
            target={target}
            initialLevel={initialLevel}
            initialTab={initialTab}
            onNavigate={(level, tab) => {
              setActiveLevel(level);
              setActiveTab(tab);
              onNavigate?.('exam', level, tab, initialTool);
            }}
          />
        ) : (
          <RadioToolsHub
            initialTool={initialTool}
            onToolChange={(tool) => onNavigate?.('tools', activeLevel, activeTab, tool)}
            onJumpToQuestion={jumpToQuestion}
          />
        )}
      </div>
    </div>
  );
};
