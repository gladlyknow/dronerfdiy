import React, { useMemo, useState } from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { A_MODULE_CATALOG } from '../../../data/aSectionCatalog';
import { A_BANK_INTEGRITY, pdfQuestionsData } from '../../../data/pdfQuestions';
import { AExamKnowledgeGraph } from '../../AExamKnowledgeGraph';
import { BookOpen, Network, CheckCircle2, ChevronRight, Database, FileQuestion } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamLevelKnowledgeProps {
  level: 'A' | 'B' | 'C';
  onSelectNode?: (node: KnowledgeNode) => void;
  onJumpToQuestionBank?: () => void;
}

const categoryForModule = (code: string): KnowledgeNode['category'] => {
  if (code === '1') return 'law';
  if (code === '2') return 'comm';
  if (code === '5') return 'safety';
  return 'tech';
};

export const ExamLevelKnowledge: React.FC<ExamLevelKnowledgeProps> = ({ level, onSelectNode, onJumpToQuestionBank }) => {
  const { isDark } = useTheme();
  const [viewType, setViewType] = useState<'cards' | 'graph'>('cards');
  const config = EXAM_LEVEL_CONFIGS[level];

  const questionsBySection = useMemo(() => {
    const map = new Map<string, typeof pdfQuestionsData>();
    pdfQuestionsData.forEach((question) => {
      const code = question.sectionCode || '';
      const list = map.get(code) || [];
      list.push(question);
      map.set(code, list);
    });
    return map;
  }, []);

  if (config.sourceStatus !== 'complete') {
    return (
      <div className={`p-6 sm:p-10 rounded-3xl border ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="max-w-2xl mx-auto text-center">
          <Database className="w-9 h-9 text-slate-400 mx-auto mb-3" />
          <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{level} 类学习区已建立</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{config.description}</p>
          <div className="mt-4 p-3 rounded-xl bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs leading-relaxed">
            为满足“以当前题库为原始数据并保证完整展示”的要求，这里不会从 A 类数据推演或生成 {level} 类考点。导入 {level} 类原始题库后，将按相同结构自动生成题库、章节覆盖率和全景知识图谱。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-emerald-600">A 类</span>
            <h3 className="font-bold text-sm sm:text-base">考点速记与全景知识图谱</h3>
            <span className="text-[10px] font-mono text-emerald-600">683 / 683 已覆盖</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">5 大模块 · 51 个原始 [P] 小节 · 每个知识节点可反查对应原题</p>
        </div>

        <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-[#18181C] border-[#2D2D33]' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => setViewType('cards')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'cards' ? 'bg-orange-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            <BookOpen className="w-3.5 h-3.5" />结构化考点
          </button>
          <button onClick={() => setViewType('graph')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'graph' ? 'bg-orange-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            <Network className="w-3.5 h-3.5" />完整图谱
          </button>
        </div>
      </div>

      {viewType === 'graph' ? (
        <AExamKnowledgeGraph onSelectNode={onSelectNode} />
      ) : (
        <div className="space-y-4">
          {A_MODULE_CATALOG.map((module) => (
            <section key={module.code} className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isDark ? 'border-[#2D2D33]' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black font-mono">{module.code}</span>
                  <div>
                    <h4 className="font-black text-sm">{module.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{module.sections.length} 个 [P] 小节 · {module.count} 道原题</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />题量已与原始题库核对</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3 sm:p-4">
                {module.sections.map((section) => {
                  const questions = questionsBySection.get(section.code) || [];
                  const node: KnowledgeNode = {
                    id: `P-${section.code}`,
                    title: `§${section.code} ${section.title}`,
                    domain: 'radio',
                    category: categoryForModule(module.code),
                    level: 2,
                    examLevel: 'A',
                    sectionCode: section.code,
                    summary: `当前原始题库 [P]${section.code} 共 ${questions.length} 道题。`,
                    detail: '本节点只按原始题库章节字段组织，不添加题库之外的知识解释。',
                    questionIds: questions.map((q) => q.id),
                  };
                  return (
                    <button
                      key={section.code}
                      onClick={() => onSelectNode?.(node)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${isDark ? 'bg-[#16161b] border-[#2D2D33] hover:border-orange-500' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-orange-600">[P]{section.code}</span>
                        <span className="text-[10px] font-mono text-slate-500">{questions.length} 题</span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm mt-1.5 leading-snug">{section.title}</div>
                      <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><FileQuestion className="w-3 h-3" />点击查看本节全部关联原题</div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${A_BANK_INTEGRITY.isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            <div className="text-xs">
              <strong>完整性：</strong>5 模块 / {A_BANK_INTEGRITY.actualSections} 小节 / {A_BANK_INTEGRITY.actualQuestions} 题，唯一题号 {A_BANK_INTEGRITY.uniqueQuestionIds}。
            </div>
            {onJumpToQuestionBank && <button onClick={onJumpToQuestionBank} className="text-xs font-bold text-orange-600 flex items-center gap-1 cursor-pointer">进入 683 题完整题库<ChevronRight className="w-4 h-4" /></button>}
          </div>
        </div>
      )}
    </div>
  );
};
