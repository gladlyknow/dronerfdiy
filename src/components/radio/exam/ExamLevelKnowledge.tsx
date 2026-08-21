import React, { useMemo, useState } from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { getBank, getBankIntegrity, getModuleCatalog } from '../../../data/bankData';
import { AExamKnowledgeGraph } from '../../AExamKnowledgeGraph';
import { BookOpen, Network, CheckCircle2, ChevronRight, FileQuestion } from 'lucide-react';
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
  const bank = getBank(level);
  const integrity = getBankIntegrity(level);
  const modules = getModuleCatalog(level);

  const questionsBySection = useMemo(() => {
    const map = new Map<string, typeof bank>();
    bank.forEach((question) => {
      const code = question.sectionCode || '';
      const list = map.get(code) || [];
      list.push(question);
      map.set(code, list);
    });
    return map;
  }, [bank]);

  return (
    <div className="space-y-4">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-orange-600">{level} 类</span>
            <h3 className="font-bold text-sm sm:text-base">考点速记与全景知识图谱</h3>
            <span className="text-[10px] font-mono text-emerald-600">{integrity.actualQuestions}/{integrity.count} 已覆盖</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{modules.length} 大模块 · {integrity.sections} 个原始 [P] 小节 · 所有节点可反查源题</p>
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
        <AExamKnowledgeGraph level={level} onSelectNode={onSelectNode} />
      ) : (
        <div className="space-y-4">
          {modules.map((module) => (
            <section key={module.code} className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${isDark ? 'border-[#2D2D33]' : 'border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black font-mono">{module.code}</span>
                  <div>
                    <h4 className="font-black text-sm">{module.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">{module.sections.length} 个 [P] 小节 · {module.count} 道原题</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />题量与 R2 PDF 自动核对</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-3 sm:p-4">
                {module.sections.map((section) => {
                  const questions = questionsBySection.get(section.sectionCode) || [];
                  const node: KnowledgeNode = {
                    id: `${level}-P-${section.sectionCode}`,
                    title: `${level} 类 · [P]${section.sectionCode}`,
                    domain: 'radio',
                    category: categoryForModule(module.code),
                    level: 2,
                    examLevel: level,
                    sectionCode: section.sectionCode,
                    summary: `R2 ${level} 类原始题库 [P]${section.sectionCode} 共 ${questions.length} 道题。`,
                    detail: '本节点仅按源 PDF 的 [P] 字段组织。源文件未提供章节标题时，不由模型补写标题。',
                    questionIds: questions.map((q) => q.id),
                  };
                  return (
                    <button
                      key={section.sectionCode}
                      onClick={() => onSelectNode?.(node)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${isDark ? 'bg-[#16161b] border-[#2D2D33] hover:border-orange-500' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-orange-600">[P]{section.sectionCode}</span>
                        <span className="text-[10px] font-mono text-slate-500">{questions.length} 题</span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm mt-1.5 leading-snug">原始题库小节 {section.sectionCode}</div>
                      <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><FileQuestion className="w-3 h-3" />点击查看本节全部关联原题</div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${integrity.isComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            <div className="text-xs">
              <strong>完整性：</strong>{modules.length} 模块 / {integrity.sections} 小节 / {integrity.actualQuestions} 题 / 唯一 [I] {integrity.uniqueIds} / 缺失字段 {integrity.missingFields}。
            </div>
            {onJumpToQuestionBank && <button onClick={onJumpToQuestionBank} className="text-xs font-bold text-orange-600 flex items-center gap-1 cursor-pointer">进入 {integrity.actualQuestions} 题完整题库<ChevronRight className="w-4 h-4" /></button>}
          </div>

          <div className="text-[11px] text-slate-500 px-1">{config.subtitle}</div>
        </div>
      )}
    </div>
  );
};
