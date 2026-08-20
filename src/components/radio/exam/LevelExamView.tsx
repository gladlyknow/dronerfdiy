import React, { useState } from 'react';
import { ExamLevel, KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { ExamLevelKnowledge } from './ExamLevelKnowledge';
import { ExamQuestionBankViewer } from './ExamQuestionBankViewer';
import { ExamSimulator } from './ExamSimulator';
import { ExamWrongQuestionBook } from './ExamWrongQuestionBook';
import { BookOpen, FileText, Award, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

export type ExamSubTab = 'knowledge' | 'question_bank' | 'simulator' | 'wrong_book';

interface LevelExamViewProps {
  level: 'A' | 'B' | 'C';
  onSelectNode?: (node: KnowledgeNode) => void;
}

export const LevelExamView: React.FC<LevelExamViewProps> = ({ level, onSelectNode }) => {
  const [subTab, setSubTab] = useState<ExamSubTab>('knowledge');
  const { isDark } = useTheme();
  const config = EXAM_LEVEL_CONFIGS[level];

  const subTabsList = [
    { id: 'knowledge' as ExamSubTab, label: '1. 考点速记与知识大纲', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'question_bank' as ExamSubTab, label: '2. 官方真题题库浏览', icon: <FileText className="w-4 h-4" /> },
    { id: 'simulator' as ExamSubTab, label: '3. 全真模拟考试自测', icon: <Award className="w-4 h-4" /> },
    { id: 'wrong_book' as ExamSubTab, label: '4. 错题本与攻坚强化', icon: <AlertCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Sub-Tabs Navigation Bar */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto shadow-xs select-none ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        {subTabsList.map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
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

      {/* Sub-view Rendering */}
      <div>
        {subTab === 'knowledge' && (
          <ExamLevelKnowledge
            level={level}
            onSelectNode={onSelectNode}
            onJumpToQuestionBank={() => setSubTab('question_bank')}
          />
        )}

        {subTab === 'question_bank' && (
          <ExamQuestionBankViewer
            level={level}
          />
        )}

        {subTab === 'simulator' && (
          <ExamSimulator
            level={level}
            onGoToWrongBook={() => setSubTab('wrong_book')}
          />
        )}

        {subTab === 'wrong_book' && (
          <ExamWrongQuestionBook
            level={level}
            onJumpToQuestionBank={() => setSubTab('question_bank')}
          />
        )}
      </div>
    </div>
  );
};
