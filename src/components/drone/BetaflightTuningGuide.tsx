import React, { useState } from 'react';
import { BETAFLIGHT_PID_GUIDES } from '../../data/droneAndDiyData';
import { Sliders, AlertTriangle, CheckCircle2, Flame, Activity } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export const BetaflightTuningGuide: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedParam, setSelectedParam] = useState<'P' | 'I' | 'D' | 'FeedForward'>('P');

  const activeGuide = BETAFLIGHT_PID_GUIDES.find((g) => g.param === selectedParam) || BETAFLIGHT_PID_GUIDES[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Betaflight PID 姿态解算闭环调参指南
            </h3>
            <p className="text-xs text-slate-500">
              解决机身高速震颤、转弯漂移、翻滚反弹 (Bounce-back) 与电机发烫问题
            </p>
          </div>
        </div>
      </div>

      {/* PID Param Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {BETAFLIGHT_PID_GUIDES.map((g) => {
          const isSelected = selectedParam === g.param;
          return (
            <button
              key={g.param}
              onClick={() => setSelectedParam(g.param)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-orange-600 text-white font-bold border-orange-600 shadow-md shadow-orange-600/20'
                  : isDark
                  ? 'bg-[#141418] border-[#2D2D33] text-slate-300 hover:border-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="text-sm font-mono font-black">{g.param} 增益</div>
              <div className="text-[11px] truncate opacity-90">{g.fullName.split(' ')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Analysis Card for Selected Param */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm space-y-4 ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="border-b pb-3 border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-mono font-black text-sm">
                {activeGuide.param}
              </span>
              <span>{activeGuide.fullName}</span>
            </h4>
          </div>
        </div>

        {/* Role */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
          isDark ? 'bg-[#18181D] border-[#26262B] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <strong className="text-orange-600 dark:text-orange-400">物理作用机制：</strong>
          {activeGuide.role}
        </div>

        {/* Symptoms Grid: Too Low vs Too High */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-sky-50/70 border-sky-200 text-sky-950'
          }`}>
            <div className="font-bold text-sky-500 mb-1 flex items-center gap-1.5">
              <span>📉 数值过低 (Too Low) 症状：</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              {activeGuide.tooLowSymptom}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}>
            <div className="font-bold text-rose-500 mb-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>📈 数值过高 (Too High) 症状与风险：</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              {activeGuide.tooHighSymptom}
            </p>
          </div>
        </div>

        {/* Actionable tuning advice */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
          isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}>
          <div className="font-bold mb-1 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>实飞微调黄金法则：</span>
          </div>
          <div>{activeGuide.tuningAdvice}</div>
        </div>
      </div>
    </div>
  );
};
