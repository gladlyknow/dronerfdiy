import React from 'react';
import { DIY_PROJECTS_DATA } from '../../data/droneAndDiyData';
import { Wrench, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export const DroneDiyLab: React.FC = () => {
  const { isDark } = useTheme();

  const fpvBuild = DIY_PROJECTS_DATA.find((p) => p.domain === 'drone') || DIY_PROJECTS_DATA[0];

  return (
    <div className="space-y-5">
      {/* Overview Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                难度：{fpvBuild.difficulty}
              </span>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {fpvBuild.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {fpvBuild.summary}
            </p>
          </div>
        </div>

        {/* Materials & Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">📦 所需核心硬件耗材：</span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              {fpvBuild.materials.map((m, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-orange-500">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 block">🛠️ 推荐工具与安全套件：</span>
            <ul className="space-y-1 text-slate-600 dark:text-slate-400">
              {fpvBuild.tools.map((t, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-emerald-500">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Steps Breakdown */}
      <div className="space-y-3">
        {fpvBuild.steps.map((step, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
            }`}
          >
            <h4 className="font-bold text-sm sm:text-base text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </span>
              <span>{step.title}</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
              {step.desc}
            </p>
            {step.tips && (
              <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                isDark ? 'bg-[#18181D] border-[#26262B] text-amber-300/90' : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <strong>💡 工艺技巧：</strong> {step.tips}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Safety Warning */}
      {fpvBuild.caution && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
          isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">⚠️ 装机通电安全铁律：</strong>
            {fpvBuild.caution}
          </div>
        </div>
      )}
    </div>
  );
};
