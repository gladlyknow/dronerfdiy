import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, FileQuestion, Layers3, Network } from 'lucide-react';
import type { KnowledgeNode, ExamQuestion } from '../types';
import { getBank, getBankIntegrity, getModuleCatalog } from '../data/bankData';
import { useTheme } from '../utils/theme';

interface AExamKnowledgeGraphProps {
  level: 'A' | 'B' | 'C';
  onSelectNode?: (node: KnowledgeNode) => void;
}

const categoryForModule = (code: string): KnowledgeNode['category'] => {
  if (code === '1') return 'law';
  if (code === '2') return 'comm';
  if (code === '5') return 'safety';
  return 'tech';
};

const sectionNode = (level: 'A' | 'B' | 'C', code: string, questions: ExamQuestion[]): KnowledgeNode => ({
  id: `${level}-P-${code}`,
  title: `${level} 类 · [P]${code}`,
  domain: 'radio',
  category: categoryForModule(code.split('.')[0]),
  level: 2,
  examLevel: level,
  sectionCode: code,
  summary: `来自 R2 ${level} 类原始题库 [P]${code}，共 ${questions.length} 道原题。`,
  detail: `本节点按源 PDF 的 [P]${code} 字段归类。题目、选项和标准答案均直接来自源 PDF；源文件未给出的章节标题和解析不由模型补写。`,
  questionIds: questions.map((q) => q.id),
});

const questionNode = (level: 'A' | 'B' | 'C', q: ExamQuestion): KnowledgeNode => ({
  id: `${level}-Q-${q.id}`,
  title: `${q.id} · ${q.question}`,
  domain: 'radio',
  category: categoryForModule((q.sectionCode || '3').split('.')[0]),
  level: 3,
  examLevel: level,
  sectionCode: q.sectionCode,
  summary: q.question,
  detail: `${q.options.map((option) => `${option.key}. ${option.text}`).join('\n')}\n\n[T] 标准答案：${q.answerType || ''}`,
  questionIds: [q.id],
  targetQuestionId: q.id,
});

export const AExamKnowledgeGraph: React.FC<AExamKnowledgeGraphProps> = ({ level, onSelectNode }) => {
  const { isDark } = useTheme();
  const bank = getBank(level);
  const modules = getModuleCatalog(level);
  const integrity = getBankIntegrity(level);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(modules.map((m) => m.code)));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const questionsBySection = useMemo(() => {
    const map = new Map<string, ExamQuestion[]>();
    bank.forEach((question) => {
      const code = question.sectionCode || '未分类';
      const list = map.get(code) || [];
      list.push(question);
      map.set(code, list);
    });
    return map;
  }, [bank]);

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-[#0b0b0e] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`p-4 sm:p-5 border-b ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
              <Network className="w-5 h-5 text-orange-600" />
              {level} 类原始题库全景知识图谱
            </div>
            <p className="text-xs text-slate-500 mt-1">结构完全由当前 R2 PDF 的 [P] 字段生成：模块 → 小节 → 原题。展开任一小节即可查看该节点覆盖的全部源题。</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 font-bold">{modules.length} 模块</span>
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 font-bold">{integrity.sections} 小节</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold">{integrity.actualQuestions} 原题</span>
            <span className={`px-2.5 py-1 rounded-lg font-bold ${integrity.isComplete ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
              {integrity.isComplete ? '完整性通过' : '数据异常'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5 space-y-3">
        {modules.map((module) => {
          const moduleOpen = expandedModules.has(module.code);
          return (
            <section key={module.code} className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
              <button
                onClick={() => toggleSet(setExpandedModules, module.code)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black font-mono shrink-0">{module.code}</span>
                  <div className="min-w-0">
                    <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{module.title}</h4>
                    <div className="text-[11px] text-slate-500 mt-1">{module.sections.length} 个 [P] 小节 · {module.count} 道原题</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${moduleOpen ? 'rotate-180' : ''}`} />
              </button>

              {moduleOpen && (
                <div className={`border-t p-3 space-y-2 ${isDark ? 'border-[#2D2D33] bg-[#0d0d10]' : 'border-slate-100 bg-slate-50/60'}`}>
                  {module.sections.map((section) => {
                    const questions = questionsBySection.get(section.sectionCode) || [];
                    const sectionOpen = expandedSections.has(section.sectionCode);
                    const countMatches = questions.length === section.count;
                    return (
                      <div key={section.sectionCode} className={`rounded-xl border overflow-hidden ${isDark ? 'bg-[#151519] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-stretch">
                          <button
                            onClick={() => toggleSet(setExpandedSections, section.sectionCode)}
                            className="flex-1 p-3 text-left cursor-pointer flex items-start justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[11px] font-bold text-orange-600">[P]{section.sectionCode}</span>
                                <span className="font-bold text-xs sm:text-sm">原始题库小节 {section.sectionCode}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                <span>{questions.length} 道原题</span>
                                {countMatches && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3 h-3" />数量校验通过</span>}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${sectionOpen ? 'rotate-90' : ''}`} />
                          </button>
                          <button
                            onClick={() => onSelectNode?.(sectionNode(level, section.sectionCode, questions))}
                            className="px-3 border-l border-slate-200 dark:border-[#2D2D33] text-[10px] text-orange-600 hover:bg-orange-500/10 cursor-pointer"
                          >
                            节点详情
                          </button>
                        </div>

                        {sectionOpen && (
                          <div className={`border-t p-2 space-y-1.5 max-h-[480px] overflow-y-auto ${isDark ? 'border-[#2D2D33]' : 'border-slate-100'}`}>
                            {questions.map((question, index) => (
                              <button
                                key={question.id}
                                onClick={() => onSelectNode?.(questionNode(level, question))}
                                className={`w-full p-2.5 rounded-lg border text-left flex gap-2.5 cursor-pointer transition-colors ${isDark ? 'bg-[#101014] border-[#25252b] hover:border-orange-500' : 'bg-slate-50 border-slate-200 hover:border-orange-400'}`}
                              >
                                <span className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-600 flex items-center justify-center text-[10px] font-mono shrink-0">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                    <FileQuestion className="w-3 h-3" />
                                    <span>{question.id}</span>
                                    {question.jCode && <span>{question.jCode}</span>}
                                    <span className="ml-auto">答案 {question.answerType}</span>
                                  </div>
                                  <div className="text-xs mt-1 leading-relaxed">{question.question}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className={`px-5 py-3 border-t text-[11px] text-slate-500 flex items-center gap-2 ${isDark ? 'border-[#2D2D33]' : 'border-slate-200'}`}>
        <Layers3 className="w-4 h-4 text-orange-600" />
        {modules.map((m) => `${m.title} ${m.count} 题`).join(' · ')}。合计 {integrity.sectionTotal} 题，必须与源 PDF 题量 {integrity.count} 完全一致。
      </div>
    </div>
  );
};
