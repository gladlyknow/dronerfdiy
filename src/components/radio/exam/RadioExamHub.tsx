import React, { useEffect, useState } from 'react';
import type { ExamJumpTarget, KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { getBankIntegrity } from '../../../data/bankData';
import { LevelExamView } from './LevelExamView';
import { Award, BookOpen, CheckCircle2, Clock3, Database, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import { useTheme } from '../../../utils/theme';
import type { ExamSubTab } from './LevelExamView';

interface RadioExamHubProps {
  onSelectNode?: (node: KnowledgeNode) => void;
  target?: ExamJumpTarget | null;
  initialLevel?: Level;
  initialTab?: ExamSubTab;
  onNavigate?: (level: Level, tab: ExamSubTab) => void;
}

type Level = 'A' | 'B' | 'C';

const levelStyles: Record<Level, { active: string; badge: string; accent: string }> = {
  A: { active: 'border-emerald-500 bg-emerald-500/5', badge: 'bg-emerald-600', accent: 'text-emerald-600' },
  B: { active: 'border-sky-500 bg-sky-500/5', badge: 'bg-sky-600', accent: 'text-sky-600' },
  C: { active: 'border-amber-500 bg-amber-500/5', badge: 'bg-amber-600', accent: 'text-amber-600' },
};

export const RadioExamHub: React.FC<RadioExamHubProps> = ({
  onSelectNode,
  target,
  initialLevel = 'A',
  initialTab = 'knowledge',
  onNavigate,
}) => {
  const { isDark } = useTheme();
  const [activeLevel, setActiveLevel] = useState<Level>(initialLevel);
  const [activeTab, setActiveTab] = useState<ExamSubTab>(initialTab);
  const config = EXAM_LEVEL_CONFIGS[activeLevel];
  const integrity = getBankIntegrity(activeLevel);
  const style = levelStyles[activeLevel];
  useEffect(() => { if (target) setActiveLevel(target.level); }, [target?.level, target?.requestId]);
  useEffect(() => setActiveLevel(initialLevel), [initialLevel]);
  useEffect(() => setActiveTab(initialTab), [initialTab]);
  const selectLevel = (level: Level) => {
    setActiveLevel(level);
    onNavigate?.(level, activeTab);
  };
  const selectTab = (tab: ExamSubTab) => {
    setActiveTab(tab);
    onNavigate?.(activeLevel, tab);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(['A', 'B', 'C'] as Level[]).map((level) => {
          const item = EXAM_LEVEL_CONFIGS[level];
          const itemIntegrity = getBankIntegrity(level);
          const active = activeLevel === level;
          return (
            <button
              key={level}
              onClick={() => selectLevel(level)}
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
                    <div className="text-[11px] text-slate-500 mt-1">R2 原始题库 · {itemIntegrity.actualQuestions} 题</div>
                  </div>
                </div>
                {itemIntegrity.isComplete ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-rose-500" />}
              </div>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">{item.subtitle}</p>
            </button>
          );
        })}
      </section>

      <section className={`rounded-3xl border-2 p-4 sm:p-5 shadow-sm ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-black text-lg ${style.badge}`}>{activeLevel}</span>
              <div>
                <div className="flex items-center gap-2">
                  <Award className={`w-4 h-4 ${style.accent}`} />
                  <h1 className={`font-black text-base sm:text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{config.title}</h1>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{config.allowedBands} · {config.maxPower}</div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">{config.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            {[
              { icon: <BookOpen className="w-4 h-4" />, value: `${integrity.actualQuestions}`, label: 'R2 题库总量' },
              { icon: <Target className="w-4 h-4" />, value: `${config.totalQuestions}`, label: '每卷题数' },
              { icon: <ShieldCheck className="w-4 h-4" />, value: `${config.passScore}`, label: '答对合格' },
              { icon: <Clock3 className="w-4 h-4" />, value: `${config.timeLimitMin} min`, label: '考试时间' },
            ].map((item) => (
              <div key={item.label} className={`min-w-[112px] p-3 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`flex items-center gap-1.5 ${style.accent}`}>{item.icon}<strong className="font-mono text-base">{item.value}</strong></div>
                <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 rounded-2xl border px-3 py-2.5 text-xs flex items-start gap-2 ${
          integrity.isComplete
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
        }`}>
          {integrity.isComplete ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>
            数据完整性：{integrity.actualQuestions} 道题 / {integrity.uniqueIds} 个唯一 [I] 题号 / {integrity.sections} 个 [P] 小节 / 缺失字段 {integrity.missingFields}。
            {integrity.isComplete ? ' 校验通过。' : ' 校验未通过，请勿用于学习。'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-slate-500">
          <span className="px-2 py-1 rounded-md bg-slate-500/10">PDF {integrity.pages} 页</span>
          <span className="px-2 py-1 rounded-md bg-slate-500/10">单选 {integrity.singles}</span>
          <span className="px-2 py-1 rounded-md bg-slate-500/10">多选 {integrity.multiples}</span>
          <span className="px-2 py-1 rounded-md bg-slate-500/10">SHA-256 {integrity.sha256.slice(0, 12)}…</span>
          <span className="px-2 py-1 rounded-md bg-slate-500/10 inline-flex items-center gap-1"><Database className="w-3 h-3" />R2 PDF 权威源</span>
        </div>
      </section>

      <LevelExamView
        level={activeLevel}
        onSelectNode={onSelectNode}
        target={target?.level === activeLevel ? target : null}
        initialTab={activeTab}
        onTabChange={selectTab}
      />
    </div>
  );
};
