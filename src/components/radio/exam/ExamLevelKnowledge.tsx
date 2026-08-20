import React, { useState } from 'react';
import type { KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { AExamKnowledgeGraph } from '../../AExamKnowledgeGraph';
import { BookOpen, Network, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamLevelKnowledgeProps {
  level: 'A' | 'B' | 'C';
  onSelectNode?: (node: KnowledgeNode) => void;
  onJumpToQuestionBank?: () => void;
}

export const ExamLevelKnowledge: React.FC<ExamLevelKnowledgeProps> = ({ level, onSelectNode, onJumpToQuestionBank }) => {
  const { isDark } = useTheme();
  const [viewType, setViewType] = useState<'cards' | 'graph'>('cards');
  const config = EXAM_LEVEL_CONFIGS[level];

  if (level !== 'A') {
    return (
      <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
        <div className="font-bold">当前页面仅维护 A 类考试内容</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-emerald-600">A 类</span>
            <h3 className="font-bold text-sm sm:text-base">考点速记与全景知识图谱</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{config.allowedBands} · {config.maxPower}</p>
        </div>

        <div className={`flex items-center p-1 rounded-xl border ${isDark ? 'bg-[#18181C] border-[#2D2D33]' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => setViewType('cards')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'cards' ? 'bg-orange-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            <BookOpen className="w-3.5 h-3.5" />结构化考点卡片
          </button>
          <button onClick={() => setViewType('graph')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${viewType === 'graph' ? 'bg-orange-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            <Network className="w-3.5 h-3.5" />考点全景图谱
          </button>
        </div>
      </div>

      {viewType === 'graph' ? (
        <AExamKnowledgeGraph onSelectNode={onSelectNode} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {config.syllabus.map((item, index) => (
              <article key={item.title} className={`p-4 sm:p-5 rounded-2xl border shadow-xs ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-orange-600 dark:text-orange-400">§{index + 1} {item.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">{item.count}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-500 flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />已纳入 A 证图谱</span>
                  {onJumpToQuestionBank && <button onClick={onJumpToQuestionBank} className="text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer font-medium">刷题<ChevronRight className="w-3 h-3" /></button>}
                </div>
              </article>
            ))}
          </div>

          <section className={`p-5 rounded-3xl border ${isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h4 className="font-bold text-sm mb-3">A 类必记数字与高频陷阱</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-orange-500 mb-1">操作范围</div>
                <div className="font-mono font-black text-lg">30–3000 MHz</div>
                <div className="text-slate-500 mt-1">7 / 14 / 21 / 28 MHz 均低于 A 类下限。</div>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-orange-500 mb-1">最大发射功率</div>
                <div className="font-mono font-black text-lg">≤ 25 W</div>
                <div className="text-slate-500 mt-1">50 / 144 / 430 MHz 等仍需符合频率划分和执照。</div>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-sky-500 mb-1">执照续期</div>
                <div className="font-mono font-black text-lg">30 个工作日</div>
                <div className="text-slate-500 mt-1">不是简单的“提前 30 日”。</div>
              </div>
              <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="font-bold text-rose-500 mb-1">应急临时设台</div>
                <div className="font-mono font-black text-lg">48 小时内报告</div>
                <div className="text-slate-500 mt-1">紧急状态消除后及时关闭临时电台。</div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
