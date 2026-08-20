import React, { useState } from 'react';
import { GEAR_RECOMMENDATIONS } from '../../data/droneAndDiyData';
import { ShoppingBag, Star, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export const DroneGearRecommender: React.FC = () => {
  const { isDark } = useTheme();
  const droneGears = GEAR_RECOMMENDATIONS.filter((g) => g.domain === 'drone');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              无人机与 FPV 穿越机硬件器材选型库
            </h3>
            <p className="text-xs text-slate-500">
              拒绝商业充值带货 · 客观评测遥控器、飞行眼镜、高刷图传与动力套件
            </p>
          </div>
        </div>
      </div>

      {/* Gear Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {droneGears.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-xs ${
              isDark ? 'bg-[#141418] border-[#2D2D33] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400">
                    {item.brand}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {item.name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-black bg-orange-500/10 text-orange-600 border border-orange-500/20">
                  {item.priceRange}
                </span>
              </div>

              <div className="text-xs text-slate-500 mb-3">
                🎯 目标人群：{item.targetUser}
              </div>

              {/* Key specs table */}
              <div className={`p-3 rounded-2xl border text-xs mb-3 space-y-1.5 ${
                isDark ? 'bg-[#18181D] border-[#28282F]' : 'bg-slate-50 border-slate-200'
              }`}>
                {Object.entries(item.keySpecs).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-2">
                    <span className="text-slate-500">{k}:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200 text-right">{v}</span>
                  </div>
                ))}
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="space-y-1">
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 核心优势
                  </span>
                  {item.pros.map((p, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      • {p}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-rose-500 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> 局限与缺点
                  </span>
                  {item.cons.map((c, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      • {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border text-[11px] mt-2 ${
              isDark ? 'bg-[#18181D] border-[#26262B] text-amber-300/90' : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}>
              <strong>💡 极客建议：</strong> {item.bestFor}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
