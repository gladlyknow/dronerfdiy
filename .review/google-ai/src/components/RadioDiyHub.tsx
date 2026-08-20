import React, { useState } from 'react';
import { DIY_PROJECTS_DATA } from '../data/droneAndDiyData';
import { DiyProjectItem, DomainType } from '../types';

export const RadioDiyHub: React.FC<{ defaultDomain?: DomainType }> = ({ defaultDomain = 'radio' }) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainType | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | '入门' | '进阶' | '专家'>('all');
  const [activeProject, setActiveProject] = useState<DiyProjectItem>(DIY_PROJECTS_DATA[0]);

  // Antenna Calculator State
  const [calcFreq, setCalcFreq] = useState<number>(145.0);
  const [calcVelocityFactor, setCalcVelocityFactor] = useState<number>(0.95);

  // Balun Calculator State
  const [balunRatio, setBalunRatio] = useState<number>(4);
  const [balunInputPower, setBalunInputPower] = useState<number>(100);

  const filteredProjects = DIY_PROJECTS_DATA.filter((p) => {
    const domainMatch = selectedDomain === 'all' || p.domain === selectedDomain;
    const diffMatch = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    return domainMatch && diffMatch;
  });

  // Calculate Dipole dimensions
  const totalLengthM = (142.6 * (calcVelocityFactor / 0.95)) / calcFreq;
  const singleArmCm = (totalLengthM / 2) * 100;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <span>🛠️ HANDS-ON DIY LAB</span>
            <span>•</span>
            <span>硬件手作与天线实验室</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
            无线电与无人机极客动手制作中心
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            从自制短波/超短波偶极天线、磁环巴伦绕制，到 5寸 FPV 穿越机全套飞塔电调焊接与 5.8GHz 极化天线调谐，提供完整的图文步骤、计算公式与避坑法则。
          </p>
        </div>
      </div>

      {/* Interactive Toolkits: Antenna Calculator & Balun Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Antenna Calculator */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold">
                📐
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  半波偶极 / 正V天线 谐振尺寸计算器
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  采用标准 0.95 导体端点缩短系数，精准算出单臂与总长
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
              SWR &lt; 1.2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1">
                目标工作中心频率 (MHz)
              </label>
              <input
                type="number"
                step="0.05"
                value={calcFreq}
                onChange={(e) => setCalcFreq(parseFloat(e.target.value) || 145.0)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[
                  { label: '40m (7.05M)', f: 7.05 },
                  { label: '20m (14.27M)', f: 14.27 },
                  { label: '2m (145.0M)', f: 145.0 },
                  { label: '0.7m (438.5M)', f: 438.5 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setCalcFreq(item.f)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/20 text-slate-600 dark:text-slate-300 font-mono"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1">
                振子缩短系数 (默认 0.95)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.8"
                max="1.0"
                value={calcVelocityFactor}
                onChange={(e) => setCalcVelocityFactor(parseFloat(e.target.value) || 0.95)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">粗线径/套管取 0.93~0.95；细铜线取 0.96</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">单臂振子裁剪长度</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-orange-600 dark:text-orange-400 mt-0.5">
                {singleArmCm.toFixed(1)} <span className="text-xs font-normal">cm</span>
              </div>
              <div className="text-[10px] text-slate-400">（建议初剪留 +2cm 供微调）</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">天线总展开跨度 (1/2λ)</div>
              <div className="text-xl sm:text-2xl font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {totalLengthM.toFixed(3)} <span className="text-xs font-normal">m</span>
              </div>
              <div className="text-[10px] text-slate-400">理论输入阻抗约 73Ω（正V夹角120°约50Ω）</div>
            </div>
          </div>
        </div>

        {/* Tool 2: Balun Design & Power Matcher */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                🧲
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  磁环巴伦 (Balun) 绕制阻抗匹配器
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  计算线圈匝数比、阻抗变换比与磁环磁通安全
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              Ferrite Core
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1">
                选择阻抗变换比 (输入 50Ω)
              </label>
              <select
                value={balunRatio}
                onChange={(e) => setBalunRatio(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1:1 纯平衡隔离巴伦 (匹配 50Ω 偶极/八木)</option>
                <option value={4}>1:4 自耦巴伦 (匹配 200Ω 环形/温顿天线)</option>
                <option value={9}>1:9 阻抗变换巴伦 (匹配 450Ω 长线端馈天线)</option>
                <option value={49}>1:49 高阻压巴伦 (匹配 2450Ω 半波端馈EFHW)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mb-1">
                设计发射功率 (Watts)
              </label>
              <input
                type="number"
                value={balunInputPower}
                onChange={(e) => setBalunInputPower(parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span>天线端负载阻抗:</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {50 * balunRatio} Ω
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>推荐磁环型号:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {balunInputPower > 50 ? 'FT240-43 (高功率防发热饱和)' : 'FT140-43 / FT50-43 (便携QRP)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>绕线方案:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {balunRatio === 1 ? '双线并绕 8 匝 (Guanella电流型)' : balunRatio === 4 ? '双线串并联 2:1 匝比 (Ruthroff自耦型)' : balunRatio === 9 ? '三线并绕 3:1 匝比' : '初级2匝，次级14匝 (1:7 匝数比)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Filter and Selection */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">实战手作工程指南</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {filteredProjects.length} 个经典项目
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDomain === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              全部领域
            </button>
            <button
              onClick={() => setSelectedDomain('radio')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDomain === 'radio'
                  ? 'bg-orange-500 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-orange-500'
              }`}
            >
              📻 无线电
            </button>
            <button
              onClick={() => setSelectedDomain('drone')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedDomain === 'drone'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-500'
              }`}
            >
              🛸 穿越机
            </button>
          </div>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
          >
            <option value="all">全部难度</option>
            <option value="入门">入门级</option>
            <option value="进阶">进阶级</option>
            <option value="专家">专家级</option>
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProjects.map((proj) => {
          const isSelected = activeProject.id === proj.id;
          return (
            <button
              key={proj.id}
              onClick={() => setActiveProject(proj)}
              className={`p-4 rounded-xl text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-500 dark:border-orange-500 shadow-md ring-1 ring-orange-500/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      proj.domain === 'radio'
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {proj.domain === 'radio' ? '📻 无线电' : '🛸 穿越机'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      proj.difficulty === '入门'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {proj.difficulty}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                  {proj.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {proj.summary}
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {proj.tags.slice(0, 2).map((t) => (
                  <span key={t} className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Project Detail Drawer / Showcase */}
      {activeProject && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {activeProject.domain === 'radio' ? '业余无线电 DIY' : 'FPV 无人机 DIY'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  难度：{activeProject.difficulty}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {activeProject.title}
              </h2>
            </div>

            {activeProject.formula && (
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-orange-600 dark:text-orange-400 font-bold self-start md:self-auto">
                📐 核心公式：{activeProject.formula}
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {activeProject.summary}
          </p>

          {/* BOM Materials & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📦 所需材料物料清单 (BOM)</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {activeProject.materials.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500 font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🔧 所需仪器与工具</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {activeProject.tools.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Procedure */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋 详细制作与装配步骤</span>
            </h4>
            <div className="space-y-3">
              {activeProject.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                      {step.title}
                    </h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                    {step.desc}
                  </p>
                  {step.tips && (
                    <div className="ml-7 mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                      💡 极客避坑秘籍：{step.tips}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Safety & Caution Warning */}
          {activeProject.caution && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <span className="font-bold">安全注意事项：</span>
                {activeProject.caution}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
