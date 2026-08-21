import React, { useState } from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { A_BANK_INTEGRITY } from '../../../data/pdfQuestions';
import { LevelExamView } from './LevelExamView';
import { Award, BookOpen, CheckCircle2, Clock3, Database, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface RadioExamHubProps {
  onSelectNode?: (node: KnowledgeNode) => void;
}

type Level = 'A' | 'B' | 'C';

const levelStyles: Record<Level, { active: string; badge: string }> = {
  A: { active: 'border-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-600' },
  B: { active: 'border-sky-500 bg-sky-500/5', badge: 'bg-sky-600' },
  C: { active: 'border-amber-500 bg-amber-500/5', badge: 'bg-amber-600' },
};

export const RadioExamHub: React.FC<RadioExamHubProps> = ({ onSelectNode }) => {
  const { isDark } = useTheme();
  const [activeLevel, setActiveLevel] = useState<Level>('A');
  const config = EXAM_LEVEL_CONFIGS[activeLevel];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as Level[]).map((level) => {
          const item = EXAM_LEVEL_CONFIGS[level];
          const active = activeLevel === level;
          return (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`text-left p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                active
                  ? levelStyles[level].active
                  : isDark
                    ? 'bg-[#111114] border-[#2D2D33] hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center font-black text-xl ${levelStyles[level].badge}`}>{level}</span>
                  <div>
                    <div className={`font-black text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.badge}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{item.sourceStatus === 'complete' ? '原始题库已完整导入' : '独立入口 · 题库待导入'}</div>
                  </div>
                </div>
                {item.sourceStatus === 'complete' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Database className="w-5 h-5 text-slate-400" />}
              </div>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">{item.subtitle}</p>
            </button>
          );
        })}
      </section>

      {activeLevel === 'A' ? (
        <section className={`rounded-3xl border-2 p-4 sm:p-5 shadow-sm ${isDark ? 'bg-[#111114] border-emerald-700/70' : 'bg-white border-emerald-200'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-emerald-600" />
                <h1 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{config.title}</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">{config.description}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              {[
                { icon: <BookOpen className="w-4 h-4" />, value: `${A_BANK_INTEGRITY.actualQuestions}/${A_BANK_INTEGRITY.expectedQuestions}`, label: '原始题库覆盖' },
                { icon: <Target className="w-4 h-4" />, value: '40', label: '每卷题数' },
                { icon: <ShieldCheck className="w-4 h-4" />, value: '30', label: '答对合格' },
                { icon: <Clock3 className="w-4 h-4" />, value: '40 min', label: '考试时间' },
              ].map((item) => (
                <div key={item.label} className={`min-w-[112px] p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-emerald-50/50 border-emerald-100'}`}>
                  <div className="flex items-center gap-1.5 text-emerald-600">{item.icon}<strong className="font-mono text-base">{item.value}</strong></div>
                  <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-4 rounded-2xl border px-3 py-2.5 text-xs flex items-start gap-2 ${
            A_BANK_INTEGRITY.isComplete
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}>
            {A_BANK_INTEGRITY.isComplete ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>
              数据完整性：{A_BANK_INTEGRITY.actualQuestions} 道题、{A_BANK_INTEGRITY.uniqueQuestionIds} 个唯一题号、{A_BANK_INTEGRITY.actualSections} 个 [P] 小节、五模块合计 {A_BANK_INTEGRITY.moduleTotal} 题。
              {A_BANK_INTEGRITY.isComplete ? ' 校验通过。' : ' 校验未通过，请勿用于学习。'}
            </span>
          </div>
        </section>
      ) : (
        <section className={`rounded-3xl border p-5 ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <Database className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <h2 className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{config.title}</h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-2">{config.description}</p>
              <p className="text-xs text-orange-600 mt-3 font-medium">这里不会复用 A 类题目，也不会根据常识自动生成 B/C 题目；必须导入对应原始题库后才启用题库、模拟考试和完整知识图谱。</p>
            </div>
          </div>
        </section>
      )}

      <LevelExamView level={activeLevel} onSelectNode={onSelectNode} />
    </div>
  );
};
