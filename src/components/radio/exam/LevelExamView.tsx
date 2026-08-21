import React, { useEffect, useState } from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { ExamLevelKnowledge } from './ExamLevelKnowledge';
import { ExamQuestionBankViewer } from './ExamQuestionBankViewer';
import { ExamSimulator } from './ExamSimulator';
import { ExamWrongQuestionBook } from './ExamWrongQuestionBook';
import { BookOpen, FileText, Award, AlertCircle, LockKeyhole } from 'lucide-react';
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
  const sourceReady = config.sourceStatus === 'complete';

  useEffect(() => setSubTab('knowledge'), [level]);

  const subTabsList = [
    { id: 'knowledge' as ExamSubTab, label: '1. 考点速记与全景知识图谱', icon: <BookOpen className="w-4 h-4" />, enabled: true },
    { id: 'question_bank' as ExamSubTab, label: '2. 原始题库完整浏览', icon: <FileText className="w-4 h-4" />, enabled: sourceReady },
    { id: 'simulator' as ExamSubTab, label: '3. 全真模拟考试自测', icon: <Award className="w-4 h-4" />, enabled: sourceReady },
    { id: 'wrong_book' as ExamSubTab, label: '4. 错题本与攻坚强化', icon: <AlertCircle className="w-4 h-4" />, enabled: sourceReady },
  ];

  return (
    <div className="space-y-4">
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto shadow-xs select-none ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        {subTabsList.map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => tab.enabled && setSubTab(tab.id)}
              disabled={!tab.enabled}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                !tab.enabled
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20 cursor-pointer'
                    : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-[#18181D] cursor-pointer'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer'
              }`}
            >
              <span>{tab.enabled ? tab.icon : <LockKeyhole className="w-4 h-4" />}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {!sourceReady && (
        <div className={`px-4 py-3 rounded-xl border text-xs text-slate-500 ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
          {level} 类题库、模拟考试和错题本将在对应原始题库导入并通过完整性校验后自动解锁。
        </div>
      )}

      <div>
        {subTab === 'knowledge' && <ExamLevelKnowledge level={level} onSelectNode={onSelectNode} onJumpToQuestionBank={() => sourceReady && setSubTab('question_bank')} />}
        {sourceReady && subTab === 'question_bank' && <ExamQuestionBankViewer level={level} />}
        {sourceReady && subTab === 'simulator' && <ExamSimulator level={level} onGoToWrongBook={() => setSubTab('wrong_book')} />}
        {sourceReady && subTab === 'wrong_book' && <ExamWrongQuestionBook level={level} onJumpToQuestionBank={() => setSubTab('question_bank')} />}
      </div>
    </div>
  );
};
