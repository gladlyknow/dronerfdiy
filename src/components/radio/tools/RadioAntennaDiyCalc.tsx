import React, { useState } from 'react';
import { Calculator, Zap, HelpCircle, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { useTheme } from '../../../utils/theme';

export const RadioAntennaDiyCalc: React.FC = () => {
  const { isDark } = useTheme();

  // Dipole calculator state
  const [freqMhz, setFreqMhz] = useState<number>(7.050);
  const [velocityFactor, setVelocityFactor] = useState<number>(0.95);
  const [antennaType, setAntennaType] = useState<'dipole' | 'inverted_v' | 'quarter_wave'>('dipole');

  // Balun calculator state
  const [balunRatio, setBalunRatio] = useState<'1:1' | '1:4' | '1:9' | '1:49'>('1:1');
  const [powerWatts, setPowerWatts] = useState<number>(100);

  // Calculations
  // Total half-wave length L (meters) = (300 / f) * 0.5 * k
  const isQuarterWave = antennaType === 'quarter_wave';
  const totalLengthM = ((300 / freqMhz) * (isQuarterWave ? 0.25 : 0.5) * velocityFactor);
  const singleArmLengthM = isQuarterWave ? totalLengthM : totalLengthM / 2;
  const singleArmLengthCm = (singleArmLengthM * 100).toFixed(1);
  const totalLengthCm = (totalLengthM * 100).toFixed(1);

  // Balun winding specs
  const balunSpecs: Record<string, { core: string; primary: string; secondary: string; capacitor: string; usage: string }> = {
    '1:1': {
      core: '尺寸/材料起始参考；按厂家曲线与温升核验',
      primary: '双线并绕 8~10 匝 (Guanella 电流型)',
      secondary: '对等并联',
      capacitor: '无需电容',
      usage: '标准 50Ω 半波偶极天线、正V天线、八木天线馈电点平衡-不平衡转换与共模扼流。',
    },
    '1:4': {
      core: '尺寸/材料起始参考；按厂家曲线与温升核验',
      primary: '双线并绕 6~8 匝',
      secondary: '串联倍压输出 (200Ω:50Ω)',
      capacitor: '无需电容',
      usage: '折合振子 (Folded Dipole)、卡罗天线 (Carolina Windom) 或环形天线匹配。',
    },
    '1:9': {
      core: '尺寸/材料起始参考；按厂家曲线与温升核验',
      primary: '三线并绕 9 匝 (匝数比 1:3)',
      secondary: '初级3匝，次级9匝自耦',
      capacitor: '无需电容',
      usage: '长线天线 (Random Wire 450Ω:50Ω) 宽频接收与非谐振便携发射。',
    },
    '1:49': {
      core: '尺寸/材料起始参考；按厂家曲线与温升核验',
      primary: '初级 2 匝 (与次级并绕 2 匝)',
      secondary: '次级共 14 匝自耦 (匝数比 1:7，阻抗比 1:49，约 2450Ω:50Ω)',
      capacitor: '并联 100pF 2~3kV 高压瓷片电容 (补偿 10m/15m 高频漏感)',
      usage: '端馈半波天线 (EFHW) 40m/20m/15m/10m 多波段自然谐振免天调。',
    },
  };

  const currentBalun = balunSpecs[balunRatio];

  return (
    <div className="space-y-6">
      {/* 1. Antenna Resonance Calculator */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              射频天线下料起点计算器
            </h3>
            <p className="text-xs text-slate-500">
              根据频率和导线缩短系数估算下料起点；安装后需通过实测修剪。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              目标中心谐振频率 (MHz)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.005"
                value={freqMhz}
                onChange={(e) => setFreqMhz(parseFloat(e.target.value) || 7.05)}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                  isDark ? 'bg-[#18181D] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
            {/* Quick frequency presets */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {[
                { label: '40m (7.05M)', f: 7.050 },
                { label: '20m (14.2M)', f: 14.200 },
                { label: '10m (29.6M)', f: 29.600 },
                { label: '2m (145M)', f: 145.000 },
                { label: '70cm (435M)', f: 435.000 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setFreqMhz(p.f)}
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors cursor-pointer ${
                    freqMhz === p.f
                      ? 'bg-orange-600 text-white font-bold border-orange-600'
                      : isDark ? 'bg-[#1A1A20] text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              天线导线缩短系数 (Velocity Factor k)
            </label>
            <select
              value={velocityFactor}
              onChange={(e) => setVelocityFactor(parseFloat(e.target.value))}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm font-mono focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                isDark ? 'bg-[#18181D] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value={0.95}>0.95 (标准绝缘外皮铜线 / 推荐)</option>
              <option value={0.96}>0.96 (细裸铜线 / 特氟龙镀银线)</option>
              <option value={0.94}>0.94 (粗多股胶皮线 / 铝管八木振子)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              实际初次下料建议各单臂多预留 15cm 用于向后折回打结微调驻波。
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              天线构型类型
            </label>
            <select
              value={antennaType}
              onChange={(e) => setAntennaType(e.target.value as any)}
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                isDark ? 'bg-[#18181D] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              <option value="dipole">水平半波偶极天线 (1/2λ Dipole, 阻抗约 73Ω)</option>
              <option value="inverted_v">120° 正V / 倒V天线 (阻抗约 50Ω 直接匹配)</option>
              <option value="quarter_wave">1/4 波长垂直地网天线 (1/4λ GP)</option>
            </select>
          </div>
        </div>

        {/* Calculation Result Display */}
        <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-3 gap-3 ${
          isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-orange-50/70 border-orange-200'
        }`}>
          <div>
            <div className="text-xs text-slate-500">{isQuarterWave ? '垂直振子下料长度' : '单臂振子下料长度'}</div>
            <div className="text-2xl font-mono font-black text-orange-600 dark:text-orange-400">
              {singleArmLengthM.toFixed(3)} <span className="text-xs font-sans text-slate-500">米 ({singleArmLengthCm} cm)</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">{isQuarterWave ? '每根地网建议长度（同振子起点）' : '天线总跨度展开长度'}</div>
            <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
              {isQuarterWave ? singleArmLengthM.toFixed(3) : totalLengthM.toFixed(3)} <span className="text-xs font-sans text-slate-500">米 ({isQuarterWave ? singleArmLengthCm : totalLengthCm} cm)</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">输入阻抗与馈线匹配建议</div>
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
              {antennaType === 'inverted_v' ? '倒 V 的阻抗会随夹角和高度变化；以仪表实测为准。' : isQuarterWave ? '建议至少布设多根地网；长度、数量与环境均需实测优化。' : '可从 1:1 电流巴伦起步，按实际共模与驻波测量调整。'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Magnetic Core Balun Winding Calculator */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              铁氧体磁环巴伦 (Balun) 绕制阻抗匹配指南
            </h3>
            <p className="text-xs text-slate-500">
              支持 1:1 电流巴伦、1:4、1:9 及 1:49 端馈天线自耦变压器
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              巴伦变比与阻抗类型
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['1:1', '1:4', '1:9', '1:49'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setBalunRatio(r)}
                  className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    balunRatio === r
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/20'
                      : isDark ? 'bg-[#18181D] text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              耐受功率档位
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[25, 100, 1000].map((w) => (
                <button
                  key={w}
                  onClick={() => setPowerWatts(w)}
                  className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    powerWatts === w
                      ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                      : isDark ? 'bg-[#18181D] text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  {w === 1000 ? '1000W 参考档' : `${w}W 参考档`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Balun Winding Blueprint */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#18181D] border-[#2C2C33]' : 'bg-sky-50/70 border-sky-200'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-200/60 dark:border-slate-800">
            <span className="font-bold text-sm text-sky-600 dark:text-sky-400">
              {balunRatio} 巴伦绕制规范与选型参数
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 font-mono font-bold">
              磁环起始参考: {currentBalun.core}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-semibold">初级 / 次级绕法：</span>
              <div className="font-mono mt-0.5 text-slate-800 dark:text-slate-200">{currentBalun.primary}</div>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">补偿高压电容：</span>
              <div className="font-mono mt-0.5 text-slate-800 dark:text-slate-200">{currentBalun.capacitor}</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/40 dark:border-slate-800">
            <strong className="text-slate-800 dark:text-slate-200">最佳适用场景：</strong>
            {currentBalun.usage} 参数仅为起始参考，需结合磁材、频段、线径、温升与实测驻波核验。
          </div>
        </div>
      </div>
    </div>
  );
};
