import React, { useState } from 'react';
import { ExamLevel, KnowledgeNode } from '../../../types';
import { EXAM_LEVEL_CONFIGS } from '../../../data/examLevelsData';
import { hamKnowledgeTree } from '../../../data/hamData';
import { KnowledgeGraph } from '../../KnowledgeGraph';
import { BookOpen, Network, CheckCircle2, AlertTriangle, Zap, FileText, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

interface ExamLevelKnowledgeProps {
  level: ExamLevel;
  onSelectNode?: (node: KnowledgeNode) => void;
  onJumpToQuestionBank?: () => void;
}

export const ExamLevelKnowledge: React.FC<ExamLevelKnowledgeProps> = ({ level, onSelectNode, onJumpToQuestionBank }) => {
  const config = EXAM_LEVEL_CONFIGS[level];
  const { isDark } = useTheme();
  const [viewType, setViewType] = useState<'cards' | 'graph'>('cards');

  return (
    <div className="space-y-4">
      {/* Top Banner & View Switcher */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
              level === 'A' ? 'bg-emerald-600' : level === 'B' ? 'bg-sky-600' : 'bg-amber-600'
            }`}>
              {config.badge}
            </span>
            <h3 className="font-bold text-sm sm:text-base">考点速记与知识大纲</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            涵盖 {config.allowedBands} · 功率限制 {config.maxPower}
          </p>
        </div>

        {/* Card View vs Graph View Toggle (Plan A) */}
        <div className={`flex items-center p-1 rounded-xl border ${
          isDark ? 'bg-[#18181C] border-[#2D2D33]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setViewType('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewType === 'cards'
                ? 'bg-orange-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>结构化考点卡片</span>
          </button>
          <button
            onClick={() => setViewType('graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewType === 'graph'
                ? 'bg-orange-600 text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>考点全景图谱</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: Structured Knowledge Cards */}
      {viewType === 'cards' ? (
        <div className="space-y-4">
          {/* Syllabus Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.syllabus.map((s, idx) => (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                  isDark ? 'bg-[#141418] border-[#2D2D33] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                    <span>§{idx + 1}</span>
                    <span>{s.title}</span>
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                    考纲约 {s.count}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {s.desc}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 考点已覆盖
                  </span>
                  {onJumpToQuestionBank && (
                    <button
                      onClick={onJumpToQuestionBank}
                      className="text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <span>刷本章真题</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Key Formula & Traps Cheat Sheet for this level */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>{level} 类考试必记公式与高频陷阱速查</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {level === 'A' && (
                <>
                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-orange-500 mb-1">波长与频率换算公式</div>
                    <div className="font-mono bg-orange-500/10 text-orange-600 px-2 py-1 rounded mb-1.5 font-bold">
                      λ (米) = 300 / f (MHz)
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      如 145MHz 波长约为 2.07米 (2米波段)；435MHz 约为 0.69米 (70厘米波段)。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-rose-500 mb-1">【必考陷阱】430-440MHz 业务性质</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      我国 430-440MHz 为<strong className="text-rose-500">次要业务</strong>！主要业务为雷达定位。业余电台不得干扰雷达，遇干扰不得要求保护。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-sky-500 mb-1">【新规】电台执照有效期与延续</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      电台执照有效期不超过 <strong>5 年</strong>。期满继续使用的，应当在<strong>届满 30 日前</strong>向原核发机构申请延续。
                    </div>
                  </div>
                </>
              )}

              {level === 'B' && (
                <>
                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-orange-500 mb-1">超外差镜像频率计算</div>
                    <div className="font-mono bg-orange-500/10 text-orange-600 px-2 py-1 rounded mb-1.5 font-bold">
                      f_image = f_RF ± 2 × f_IF
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      射频接收频率 f_RF 加上或减去两倍中频 f_IF 产生镜像干扰频率。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-sky-500 mb-1">电离层反射与最高可用频率</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      短波主要依靠 <strong>F2 层</strong> 进行越洋远距离天波反射。工作频率必须低于最高可用频率 (MUF)，高于最低可用频率 (LUF)。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-amber-500 mb-1">驻波比 SWR 与功率反射</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      50Ω 纯阻匹配时 SWR = 1.0。SWR = 1.5 时反射功率约 4%；SWR = 2.0 时反射功率约 11.1%；SWR &gt; 3.0 时极易烧毁功放。
                    </div>
                  </div>
                </>
              )}

              {level === 'C' && (
                <>
                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-orange-500 mb-1">天线增益 dBi 与 dBd 换算</div>
                    <div className="font-mono bg-orange-500/10 text-orange-600 px-2 py-1 rounded mb-1.5 font-bold">
                      G (dBi) = G (dBd) + 2.15 dB
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      以半波偶极天线为基准 (0 dBd) 相当于以点源各向同性辐射为基准的 2.15 dBi。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-rose-500 mb-1">千瓦级大功率杂散与 EMC 抑制</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      1000W 发射机杂散辐射衰减必须满足 <strong>&gt; 60 dBc</strong> 且绝对功率 ≤ 50mW，加装 Chebyshev / Butterworth 阶次低通滤波器。
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-xs ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-bold text-sky-500 mb-1">防雷 60米 滚球法保护半径</div>
                    <div className="text-slate-600 dark:text-slate-300">
                      依照 GB 50057 标准，三类防雷建筑滚球半径为 60 米，利用滚球与避雷针切线计算天线避雷保护角。
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* View Mode 2: Integrated Knowledge Graph Canvas (Plan A) */
        <div className={`h-[600px] rounded-3xl border overflow-hidden relative shadow-sm ${
          isDark ? 'bg-[#0E0E11] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          <KnowledgeGraph onSelectNode={onSelectNode} />
        </div>
      )}
    </div>
  );
};
