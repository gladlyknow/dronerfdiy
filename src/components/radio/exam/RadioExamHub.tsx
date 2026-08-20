import React from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { LevelExamView } from './LevelExamView';
import { Award, BookOpen, Clock3, Radio, ShieldCheck, Target } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface RadioExamHubProps {
  onSelectNode?: (node: KnowledgeNode) => void;
}

export const RadioExamHub: React.FC<RadioExamHubProps> = ({ onSelectNode }) => {
  const { isDark } = useTheme();
  const config = EXAM_LEVEL_CONFIGS.A;

  const stats = [
    { icon: <BookOpen className="w-4 h-4" />, value: '683', label: 'A 类题库题量' },
    { icon: <Target className="w-4 h-4" />, value: '40', label: '每卷题数' },
    { icon: <ShieldCheck className="w-4 h-4" />, value: '30', label: '答对合格' },
    { icon: <Clock3 className="w-4 h-4" />, value: '40 min', label: '考试时间' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <section
        className={`rounded-3xl border-2 p-4 sm:p-5 shadow-sm ${
          isDark ? 'bg-[#111114] border-emerald-700/70' : 'bg-white border-emerald-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">A</div>
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <h1 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{config.title}</h1>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{config.subtitle}</div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">{config.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            {stats.map((item) => (
              <div key={item.label} className={`min-w-[112px] p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <div className="flex items-center gap-1.5 text-emerald-600">{item.icon}<strong className="font-mono text-base">{item.value}</strong></div>
                <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 font-bold">30–3000 MHz</span>
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-600 font-bold">≤25 W</span>
          <span className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 font-bold">32 单选 + 8 多选</span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-bold">7/14/21/28 MHz 非 A 类发射范围</span>
        </div>
      </section>

      <div className={`rounded-2xl border px-4 py-3 flex gap-2 text-xs ${isDark ? 'bg-[#111114] border-[#2D2D33] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
        <Radio className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <span>当前 `/redio/` 专注 A 证学习。Google AI 原工程中的 B/C 旧规则已从生产入口移除，避免和当前 A 类题库口径混用。</span>
      </div>

      <LevelExamView level="A" onSelectNode={onSelectNode} />
    </div>
  );
};
