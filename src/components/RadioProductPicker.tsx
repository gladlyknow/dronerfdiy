import React, { useState } from 'react';
import { GEAR_RECOMMENDATIONS } from '../data/droneAndDiyData';
import { DomainType, GearRecommendation } from '../types';

export const RadioProductPicker: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState<DomainType | 'all'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedGear, setSelectedGear] = useState<GearRecommendation | null>(null);

  const categories = [
    { id: 'all', label: '全部器材分类', domain: 'all' },
    { id: 'walkie', label: '手持对讲机 (UV段)', domain: 'radio' },
    { id: 'hf_base', label: '短波便携/基地台 (HF段)', domain: 'radio' },
    { id: 'test_instruments', label: '测试仪器 (NanoVNA/驻波表)', domain: 'radio' },
    { id: 'fpv_drone', label: 'FPV 穿越机整机/机架', domain: 'drone' },
    { id: 'radio_controller', label: 'ELRS 航模遥控器', domain: 'drone' },
    { id: 'goggles', label: 'FPV 飞行眼镜/高清图传', domain: 'drone' },
    { id: 'battery_charger', label: '智能平衡充与电源', domain: 'drone' },
  ];

  const filteredGear = GEAR_RECOMMENDATIONS.filter((item) => {
    const domainMatch = activeDomain === 'all' || item.domain === activeDomain;
    const catMatch = activeCategory === 'all' || item.category === activeCategory;
    return domainMatch && catMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span>🛒 HARDWARE BUYER'S GUIDE</span>
            <span>•</span>
            <span>装备选型与横评对比</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
            业余无线电与无人机穿越机器材选购指南
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            摒弃营销溢价与虚标参数，提供真实的客观评测、核准验机代码、优缺点比对与适用人群定位。
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Domain Toggle */}
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800 font-mono text-xs">
          <button
            onClick={() => {
              setActiveDomain('all');
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeDomain === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            全部大类 ({GEAR_RECOMMENDATIONS.length})
          </button>
          <button
            onClick={() => {
              setActiveDomain('radio');
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeDomain === 'radio'
                ? 'bg-orange-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-orange-500'
            }`}
          >
            📻 无线电设备
          </button>
          <button
            onClick={() => {
              setActiveDomain('drone');
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeDomain === 'drone'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
            }`}
          >
            🛸 穿越机器材
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {categories
            .filter((c) => activeDomain === 'all' || c.domain === 'all' || c.domain === activeDomain)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium ${
                  activeCategory === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGear.map((gear) => (
          <div
            key={gear.id}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {gear.brand}
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                    {gear.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
                    {gear.priceRange}
                  </span>
                  <div className="text-[10px] text-slate-400">参考预算</div>
                </div>
              </div>

              {/* Target User Badge */}
              <div className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                🎯 适用定位：{gear.targetUser}
              </div>

              {/* Key Specs Table */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 text-xs font-mono">
                {Object.entries(gear.keySpecs).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400">{k}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>

              {/* Pros & Cons */}
              <div className="space-y-1.5 text-xs">
                <div className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  👍 优势亮点：
                </div>
                <ul className="space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px] pl-2">
                  {gear.pros.map((p, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-amber-700 dark:text-amber-400 font-semibold pt-1">
                  ⚠️ 注意事项：
                </div>
                <ul className="space-y-0.5 text-slate-600 dark:text-slate-400 text-[11px] pl-2">
                  {gear.cons.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              💡 <span className="font-semibold text-slate-700 dark:text-slate-300">选型总结：</span>
              {gear.bestFor}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
