import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Calculator, 
  Radio, 
  Activity
} from 'lucide-react';
import { bandPowerSpecs } from '../data/hamData';
import { useTheme } from '../utils/theme';
import { FrequencyAllocationTable } from './FrequencyAllocationTable';

export const BandPowerMatrix: React.FC = () => {
  const { isDark } = useTheme();
  // Calculators state
  const [calcFreq, setCalcFreq] = useState<number>(145.0);
  const [swrValue, setSwrValue] = useState<number>(1.2);
  const [licenseClass, setLicenseClass] = useState<'A' | 'B' | 'C'>('A');
  const [view, setView] = useState<'plan' | 'permissions'>('plan');
  const licenseSummary = {
    A: '30–3000 MHz 内核准的业余频段，最大发射功率不大于 25 W',
    B: '30 MHz 以下小于 15 W；30 MHz 以上不大于 25 W',
    C: '30 MHz 以下不大于 1000 W；30 MHz 以上不大于 25 W',
  }[licenseClass];
  const powerFor = (item: typeof bandPowerSpecs[number]) =>
    licenseClass === 'A' ? item.maxPowerA : licenseClass === 'B' ? item.maxPowerB : item.maxPowerC;
  const allowedFor = (item: typeof bandPowerSpecs[number]) =>
    licenseClass === 'A'
      ? item.aClassAllowed
      : licenseClass === 'B'
        ? item.bClassAllowed
        : item.cClassAllowed;

  // Wavelength calculation: lambda = 300 / f
  const calcWavelength = calcFreq > 0 ? (300 / calcFreq).toFixed(2) : '0';
  // Half-wave dipole total length: L (m) = 142.5 / f (MHz)
  const calcDipoleLength = calcFreq > 0 ? (142.5 / calcFreq).toFixed(3) : '0';
  // Quarter-wave whip antenna length: L/2 = 71.25 / f (MHz)
  const calcQuarterWhip = calcFreq > 0 ? (71.25 / calcFreq).toFixed(3) : '0';

  // SWR Reflection power percentage: |(SWR-1)/(SWR+1)|^2 * 100
  const reflectionRate = useMemoReflection(swrValue);

  function useMemoReflection(swr: number) {
    if (swr <= 1) return 0;
    const gamma = (swr - 1) / (swr + 1);
    return Math.min(100, Math.round(gamma * gamma * 100 * 10) / 10);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className={`flex overflow-x-auto rounded-xl border p-1 ${isDark ? 'border-[#2D2D33] bg-[#111114]' : 'border-slate-200 bg-white'}`}>
        <button type="button" aria-pressed={view === 'plan'} onClick={() => setView('plan')} className={`min-w-max flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${view === 'plan' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-orange-600'}`}>频率划分总表 §1.7.1</button>
        <button type="button" aria-pressed={view === 'permissions'} onClick={() => setView('permissions')} className={`min-w-max flex-1 rounded-lg px-4 py-2 text-xs font-bold transition-colors ${view === 'permissions' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-500 hover:text-orange-600'}`}>证书权限与计算</button>
      </div>
      {view === 'plan' ? <FrequencyAllocationTable /> : (
        <>
      {/* Top Banner */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Zap className="w-4 h-4" />
            <span>业余无线电 {licenseClass} 类工作频段与最大发射功率矩阵</span>
          </div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            核准频率范围、功率上限与业务性质
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {licenseClass} 类：{licenseSummary}。实际发射仍须以电台执照载明事项和频率使用规定为准。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-[#2D2D33]">
            {(['A', 'B', 'C'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setLicenseClass(level)}
                aria-pressed={licenseClass === level}
                className={`px-3 py-1.5 text-xs font-bold ${
                  licenseClass === level ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-orange-600'
                }`}
              >
                {level} 类
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table of Bands */}
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-[#2D2D33] flex items-center justify-between">
          <h3 className={`font-bold text-xs sm:text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Radio className="w-4 h-4 text-orange-600" />
            <span>中国业余电台各频段 {licenseClass} 类权限对照表（R2 题库口径）</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">R2题库映射</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`uppercase text-[11px] font-mono border-b border-slate-200 dark:border-[#2D2D33] ${
              isDark ? 'bg-[#0A0A0B] text-slate-400' : 'bg-slate-50 text-slate-600'
            }`}>
              <tr>
                <th className="px-4 py-3">频段名称</th>
                <th className="px-4 py-3">频率范围与波长</th>
                <th className="px-4 py-3">{licenseClass} 类操作权限</th>
                <th className="px-4 py-3">{licenseClass} 类最大发射功率</th>
                <th className="px-4 py-3">业务性质</th>
                <th className="px-4 py-3">高频考点 / 避坑提示</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#2D2D33]">
              {bandPowerSpecs.map((item, idx) => (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    !allowedFor(item)
                      ? 'bg-rose-50/40 dark:bg-rose-950/20' 
                      : isDark ? 'hover:bg-[#1C1C21]' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold">
                    <div className="flex items-center gap-2">
                      {allowedFor(item) ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                      <span className={isDark ? 'text-white' : 'text-slate-900'}>{item.bandName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-orange-600 font-semibold">{item.frequencyRange}</td>
                  <td className="px-4 py-3">
                    {allowedFor(item) ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>允许发射</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold font-mono">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>当前类别不可发射</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold">
                    <span className={allowedFor(item) ? 'text-orange-600' : 'text-slate-400'}>
                      {powerFor(item)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      item.serviceStatus.includes('主要')
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                    }`}>
                      {item.serviceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {item.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="px-1 text-[11px] leading-5 text-slate-500">
        权限来源：R2 题库 MC1-0059～MC1-0061；频段业务性质来源：[P]1.7.1。过渡期旧 B 类证书的 100 W 权限不与新证通用口径混写。
      </p>

      {/* Interactive Practical Calculators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Calculator 1: Frequency & Antenna Length */}
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Calculator className="w-4 h-4" />
            <span>波长与偶极天线振子长度交互计算器</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500 font-mono block">
              输入工作频率 (MHz):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="1"
                value={calcFreq}
                onChange={(e) => setCalcFreq(parseFloat(e.target.value) || 0)}
                className={`w-32 font-mono font-bold text-sm px-3 py-2 rounded-xl border focus:outline-none focus:border-orange-500 ${
                  isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <span className="text-xs text-slate-400 font-mono">MHz</span>

              {/* Quick presets */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => setCalcFreq(145.0)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-mono font-bold border border-orange-200 dark:border-orange-900 cursor-pointer"
                >
                  2m(145)
                </button>
                <button
                  onClick={() => setCalcFreq(435.0)}
                  className="px-2 py-1 text-[11px] rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 font-mono font-bold border border-orange-200 dark:border-orange-900 cursor-pointer"
                >
                  0.7m(435)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2">
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400 font-mono">波长 λ = 300 / f</div>
              <div className="text-sm font-bold font-mono text-orange-600 mt-1">{calcWavelength} m</div>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400 font-mono">1/2 波长偶极子</div>
              <div className={`text-sm font-bold font-mono mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{calcDipoleLength} m</div>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400 font-mono">1/4 鞭状天线</div>
              <div className="text-sm font-bold font-mono text-emerald-600 mt-1">{calcQuarterWhip} m</div>
            </div>
          </div>
        </div>

        {/* Calculator 2: SWR & Reflection Loss */}
        <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Activity className="w-4 h-4" />
            <span>驻波比 (SWR) 与反射功率损耗估算</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">调节 SWR 读数:</span>
              <span className="font-bold text-orange-600">{swrValue.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={swrValue}
              onChange={(e) => setSwrValue(parseFloat(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400">反射功率比例</div>
              <div className="text-base font-bold font-mono text-rose-600 mt-0.5">{reflectionRate}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">发射机实际输出衰减</div>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-center ${
              isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="text-[10px] text-slate-400">安全评估状态</div>
              <div className={`text-xs font-bold mt-1 ${
                swrValue <= 1.5 
                  ? 'text-emerald-600' 
                  : swrValue <= 2.0 
                  ? 'text-amber-600' 
                  : 'text-rose-600'
              }`}>
                {swrValue <= 1.5 
                  ? '✅ 优秀 (SWR ≤ 1.5)' 
                  : swrValue <= 2.0 
                  ? '⚠️ 良好，可用 (SWR ≤ 2.0)' 
                  : '❌ 危险，天线失谐 (SWR > 2.0)'}
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
