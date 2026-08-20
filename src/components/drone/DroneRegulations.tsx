import React from 'react';
import { DRONE_REGULATIONS } from '../../data/droneAndDiyData';
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export const DroneRegulations: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-4">
      {/* Policy Header Banner */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              2024 国务院 & 中央军委《无人驾驶航空器飞行管理暂行条例》合规指引
            </h3>
            <p className="text-xs text-slate-500">
              自 2024 年 1 月 1 日起正式施行 · 国家空管委与中国民用航空局 (CAAC) 统一规范
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-emerald-500">120 米真高适飞空域</span>
            <p className="text-slate-500 mt-0.5">管制空域以外、真高 120 米以下为微轻型适飞空域，免申请计划。</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-orange-500">UOM 平台实名登记 (强制)</span>
            <p className="text-slate-500 mt-0.5">所有无人机必须注册登记并在机身张贴二维码标牌。</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#18181D] border-[#26262B]' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-bold text-rose-500">严禁侵入管制禁飞区</span>
            <p className="text-slate-500 mt-0.5">机场净空保护区、军事设施、核设施、政府核心机关等红线区域。</p>
          </div>
        </div>
      </div>

      {/* Regulation items list */}
      <div className="space-y-3">
        {DRONE_REGULATIONS.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-orange-500">•</span>
                <span>{item.title}</span>
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                item.complianceLevel === 'mandatory'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {item.complianceLevel === 'mandatory' ? '法律强制' : '执照规范'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border text-xs font-semibold mb-3 ${
              isDark ? 'bg-[#18181D] border-[#26262B] text-amber-300/90' : 'bg-orange-50/70 border-orange-200 text-orange-950'
            }`}>
              条例文本要求：{item.rule}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
