import React, { useState } from 'react';
import { 
  Network, 
  Radio, 
  Zap, 
  Award, 
  Activity, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  Sliders,
  Compass,
  FileCheck
} from 'lucide-react';
import { useTheme } from '../utils/theme';

export type DiagramTab = 'repeater' | 'antenna_rf' | 'license_flow' | 'modulation' | 'qso_protocol';

export const SystemDiagrams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DiagramTab>('repeater');
  const [repeaterMode, setRepeaterMode] = useState<'duplex' | 'simplex'>('duplex');
  const [swrValue, setSwrValue] = useState<number>(1.2);
  const [selectedEmission, setSelectedEmission] = useState<'F3E' | 'A1A' | 'J3E' | 'A3E'>('F3E');
  const { isDark } = useTheme();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className={`p-5 rounded-2xl border transition-colors shadow-xl ${
        isDark 
          ? 'bg-[#111114] border-[#2D2D33]' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#F27D26] font-bold text-xs uppercase tracking-wider">
              <Network className="w-4 h-4" />
              <span>业余无线电系统拓扑与原理架构全景图库</span>
            </div>
            <h2 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              通信系统架构 • 射频天馈链路 • 执照晋级拓扑 • 调制频谱
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#8E9299]' : 'text-slate-500'}`}>
              深度可视化业余电台通联网络、中继双工频差、50Ω 天馈驻波比匹配、ITU 发射类别波形及 A/B/C 级晋级流转。
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1.5 rounded-xl text-xs font-mono border flex items-center gap-1.5 ${
              isDark ? 'bg-[#1C1C21] text-[#E0E0E0] border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-[#F27D26]" />
              <span>5 大核心原理拓扑图</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 pt-5 border-t border-dashed mt-4 border-slate-700/40">
          {[
            { id: 'repeater', label: '📡 中继系统与网络拓扑', icon: <Radio className="w-3.5 h-3.5" /> },
            { id: 'antenna_rf', label: '⚡ 射频天馈与驻波匹配链路', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'license_flow', label: '⚖️ 执照申领与A/B/C晋级拓扑', icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'modulation', label: '📈 发射类别代码与调制波形', icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'qso_protocol', label: '🔄 标准通联时序与RST流转', icon: <Layers className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DiagramTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F27D26] text-black font-bold shadow-md'
                    : isDark
                    ? 'bg-[#1C1C21] text-[#8E9299] hover:text-white hover:bg-[#25252B] border border-[#2D2D33]'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Diagram Canvas Area */}

      {/* ========================================================================= */}
      {/* 1. REPEATER & NETWORK ARCHITECTURE */}
      {/* ========================================================================= */}
      {activeTab === 'repeater' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls Bar */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${isDark ? 'text-[#8E9299]' : 'text-slate-600'}`}>工作模式演示：</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/20 border border-slate-700/30">
                <button
                  onClick={() => setRepeaterMode('duplex')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    repeaterMode === 'duplex'
                      ? 'bg-[#F27D26] text-black font-bold shadow'
                      : isDark ? 'text-[#8E9299] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  异频中继台模式 (Duplex)
                </button>
                <button
                  onClick={() => setRepeaterMode('simplex')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    repeaterMode === 'simplex'
                      ? 'bg-[#10B981] text-black font-bold shadow'
                      : isDark ? 'text-[#8E9299] hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  直频同频通联 (Simplex)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border ${
                isDark ? 'bg-[#1C1C21] text-[#F27D26] border-[#2D2D33]' : 'bg-orange-50 text-orange-600 border-orange-200'
              }`}>
                2m 波段标准频差: 0.6 MHz
              </span>
              <span className={`px-2.5 py-1 rounded-lg border ${
                isDark ? 'bg-[#1C1C21] text-[#10B981] border-[#2D2D33]' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                70cm 波段标准频差: 5.0 MHz
              </span>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className={`p-6 rounded-2xl border overflow-x-auto shadow-2xl relative ${
            isDark ? 'bg-[#0E0E12] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="min-w-[760px] max-w-5xl mx-auto space-y-6">
              {/* Header Title inside SVG Canvas */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9299] pb-3 border-b border-dashed border-slate-700/30">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#F27D26] animate-ping" />
                  <span className="font-bold text-[#F27D26]">AMATEUR RADIO REPEATER & INTERNET GATEWAY TOPOLOGY</span>
                </span>
                <span>CTCSS 亚音频静噪 • 异频差频 • 双工器隔离度 &gt; 80dB</span>
              </div>

              {/* Vector Diagram Visual */}
              <div className="grid grid-cols-12 gap-4 items-center relative py-4">
                {/* Left: User Station 1 (Handheld / Mobile) */}
                <div className={`col-span-3 p-4 rounded-2xl border relative flex flex-col items-center text-center space-y-2 shadow-lg transition-transform hover:scale-[1.02] ${
                  isDark ? 'bg-[#16161B] border-[#F27D26]/40' : 'bg-white border-orange-300'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#F27D26]/10 border border-[#F27D26]/50 flex items-center justify-center text-[#F27D26]">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-xs text-white bg-black/40 px-2 py-0.5 rounded">
                    发射台 BG1AAA (手台/车台)
                  </div>
                  <div className="text-[11px] text-[#8E9299] font-mono leading-tight space-y-0.5">
                    <div>发射功率: ≤ 25W (A证)</div>
                    <div className="text-[#F27D26] font-bold">
                      {repeaterMode === 'duplex' ? 'TX: 434.750 MHz' : 'TX: 438.500 MHz'}
                    </div>
                    <div className="text-emerald-400">CTCSS 亚音: 88.5 Hz</div>
                  </div>
                </div>

                {/* Arrow from Station 1 to Repeater */}
                <div className="col-span-2 flex flex-col items-center justify-center space-y-1">
                  <div className="text-[10px] font-mono text-[#F27D26] font-bold text-center">
                    {repeaterMode === 'duplex' ? '上行无线电波 (Uplink)' : '直频无线电波'}
                  </div>
                  <div className="w-full flex items-center">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-[#F27D26] to-[#10B981]" />
                    <ArrowRight className="w-4 h-4 text-[#10B981] -ml-1" />
                  </div>
                  <div className="text-[9px] text-[#8E9299] font-mono">空间电磁波传输</div>
                </div>

                {/* Center: Central Repeater System & Tower */}
                <div className={`col-span-4 p-5 rounded-3xl border-2 relative shadow-2xl space-y-3 ${
                  repeaterMode === 'duplex'
                    ? isDark ? 'bg-[#181820] border-[#F27D26]' : 'bg-white border-orange-500'
                    : isDark ? 'bg-[#141418] border-slate-700 opacity-60' : 'bg-slate-100 border-slate-300 opacity-60'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
                    <span className="text-xs font-bold text-[#F27D26] flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      业余中继台 (Repeater Station)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/20 text-[#10B981] font-bold">
                      高山/铁塔顶架设
                    </span>
                  </div>

                  {/* Internal components flow of the repeater */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-black/40 border border-slate-700/50 flex items-center justify-between">
                      <span className="text-slate-300 text-[11px]">📡 玻璃钢全向高增益天线</span>
                      <span className="text-[#F27D26] text-[10px]">RX/TX 共用</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/40 flex items-center justify-between">
                      <span className="text-white text-[11px] font-bold">🎛️ 腔体双工器 (Duplexer)</span>
                      <span className="text-[#F27D26] text-[10px] font-bold">隔离度 &gt; 80dB</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-1.5 rounded-lg bg-black/30 border border-slate-700/40 text-center">
                        <div className="text-emerald-400 font-bold">接收机 (RX)</div>
                        <div className="text-[#8E9299]">解调 CTCSS 亚音</div>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/30 border border-slate-700/40 text-center">
                        <div className="text-[#F27D26] font-bold">发射机 (TX)</div>
                        <div className="text-[#8E9299]">高功率同频转发</div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-300 font-semibold">🌐 IP 网关 (EchoLink / DMR)</span>
                      <span className="text-[#8E9299] text-[10px]">连入全球互联网</span>
                    </div>
                  </div>
                </div>

                {/* Arrow from Repeater to Station 2 */}
                <div className="col-span-2 flex flex-col items-center justify-center space-y-1">
                  <div className="text-[10px] font-mono text-[#10B981] font-bold text-center">
                    {repeaterMode === 'duplex' ? '下行无线电波 (Downlink)' : '直频接收'}
                  </div>
                  <div className="w-full flex items-center">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-[#10B981] to-[#3B82F6]" />
                    <ArrowRight className="w-4 h-4 text-[#3B82F6] -ml-1" />
                  </div>
                  <div className="text-[9px] text-[#8E9299] font-mono">远距离广覆盖</div>
                </div>

                {/* Right: Remote Station 2 (Base Station / Car) */}
                <div className={`col-span-3 p-4 rounded-2xl border relative flex flex-col items-center text-center space-y-2 shadow-lg transition-transform hover:scale-[1.02] ${
                  isDark ? 'bg-[#16161B] border-[#3B82F6]/40' : 'bg-white border-blue-300'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/50 flex items-center justify-center text-[#3B82F6]">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-xs text-white bg-black/40 px-2 py-0.5 rounded">
                    接收台 BD4YYY (远端基地台)
                  </div>
                  <div className="text-[11px] text-[#8E9299] font-mono leading-tight space-y-0.5">
                    <div>通联信号: RST 59 极清晰</div>
                    <div className="text-[#3B82F6] font-bold">
                      {repeaterMode === 'duplex' ? 'RX: 439.750 MHz' : 'RX: 438.500 MHz'}
                    </div>
                    <div className="text-emerald-400">静噪自动开启</div>
                  </div>
                </div>
              </div>

              {/* Bottom Explainer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#F27D26]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>为什么要使用中继台？</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    VHF/UHF 频段无线电波为视距直线传播，受地球曲率和城市高楼阻挡。高处架设的中继台充当空中转发枢纽，将手台通信距离由 3~5km 拓展至 50~100km+。
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>双工器 (Duplexer) 的核心作用</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    使中继台能用一根天线同时接收上行弱信号与发射下行强信号。双工器具有极高带通与陷波抑制度（&gt;80dB），彻底防止发射信号堵塞/烧毁接收前端。
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700/40 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#3B82F6]">
                    <Info className="w-3.5 h-3.5" />
                    <span>CTCSS 亚音频静噪功能</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    连续音频控制静噪系统（67~254.1Hz 次可听音频）。手台发射时叠加亚音，中继台识别到匹配亚音后方打开接收静噪，防止外界电磁杂波误触发转发。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RF & ANTENNA FEEDER MATCHING PIPELINE */}
      {/* ========================================================================= */}
      {activeTab === 'antenna_rf' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Interactive SWR Tuner Slider */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-4 flex-1 min-w-[280px]">
              <div className="space-y-0.5">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  🎛️ 驻波比 (SWR) 实时仿真滑块:
                </span>
                <div className="text-[11px] text-[#8E9299]">拖动调节天线阻抗失配情况</div>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.5"
                step="0.1"
                value={swrValue}
                onChange={(e) => setSwrValue(parseFloat(e.target.value))}
                className="flex-1 accent-[#F27D26] cursor-pointer"
              />
              <span className={`px-3 py-1 rounded-xl font-mono text-sm font-bold border ${
                swrValue <= 1.5
                  ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                  : swrValue <= 2.0
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
              }`}>
                SWR = {swrValue.toFixed(1)}
              </span>
            </div>

            <div className="text-xs font-mono">
              {swrValue <= 1.5 ? (
                <span className="text-emerald-400 font-semibold">✅ 匹配优良 (反射功率 &lt; 4%)</span>
              ) : swrValue <= 2.0 ? (
                <span className="text-amber-400 font-semibold">⚠️ 阻抗偏离 (反射功率 ~11%)</span>
              ) : (
                <span className="text-red-400 font-bold">🚫 严重失配！功放管发热烧毁风险！</span>
              )}
            </div>
          </div>

          {/* SVG Pipeline Canvas */}
          <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-x-auto ${
            isDark ? 'bg-[#0E0E12] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="min-w-[800px] max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9299] pb-3 border-b border-dashed border-slate-700/30">
                <span className="font-bold text-[#F27D26]">RF TRANSMITTER & ANTENNA FEEDER 50Ω IMPEDANCE CHAIN</span>
                <span>公式: L(m) = 142.5 / f(MHz) • 驻波比 SWR = Vmax / Vmin</span>
              </div>

              {/* 5-Stage System Flow */}
              <div className="grid grid-cols-5 gap-3 items-stretch relative py-4">
                {/* 1. Transceiver */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-md ${
                  isDark ? 'bg-[#16161B] border-[#F27D26]/50' : 'bg-white border-orange-300'
                }`}>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-[#F27D26]/10 text-[#F27D26] flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <div className="text-xs font-bold text-white">业余无线电台 (Transceiver)</div>
                    <div className="text-[10px] text-[#8E9299]">高频振荡、调制与末级功放</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-700/50 text-[10px] font-mono text-[#F27D26]">
                    输出特性阻抗: 50 欧姆<br />
                    最大功率: ≤ 25W
                  </div>
                </div>

                {/* 2. Coaxial Feeder Cable */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-md ${
                  isDark ? 'bg-[#16161B] border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div className="text-xs font-bold text-white">同轴电缆馈线 (Coaxial Feeder)</div>
                    <div className="text-[10px] text-[#8E9299]">低损耗高频射频传输线</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-700/50 text-[10px] font-mono text-blue-400">
                    标准阻抗: 50Ω (RG-58/5D-FB)<br />
                    ⚠️ 严禁混用 75Ω 电视线
                  </div>
                </div>

                {/* 3. SWR / Power Meter */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-md ${
                  isDark ? 'bg-[#16161B] border-emerald-500/50' : 'bg-white border-emerald-300'
                }`}>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div className="text-xs font-bold text-white">驻波比功率计 (SWR Meter)</div>
                    <div className="text-[10px] text-[#8E9299]">测量前向功率与反射波电压</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-700/50 text-[10px] font-mono text-emerald-400">
                    当前 SWR: {swrValue.toFixed(1)}<br />
                    反射功率: {(Math.pow((swrValue - 1) / (swrValue + 1), 2) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* 4. Lightning Arrester & Grounding */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-md ${
                  isDark ? 'bg-[#16161B] border-amber-500/50' : 'bg-white border-amber-300'
                }`}>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                      4
                    </div>
                    <div className="text-xs font-bold text-white">天馈避雷器 (Lightning Arrester)</div>
                    <div className="text-[10px] text-[#8E9299]">气体放电管泄放感应雷</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-700/50 text-[10px] font-mono text-amber-400">
                    接地电阻: &lt; 4 欧姆<br />
                    雷暴天须主动拔下馈线插头
                  </div>
                </div>

                {/* 5. Antenna */}
                <div className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 shadow-md ${
                  isDark ? 'bg-[#16161B] border-[#F27D26]' : 'bg-white border-orange-500'
                }`}>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-xl bg-[#F27D26]/20 text-[#F27D26] flex items-center justify-center font-bold text-xs">
                      5
                    </div>
                    <div className="text-xs font-bold text-white">半波偶极/GP天线 (Antenna)</div>
                    <div className="text-[10px] text-[#8E9299]">将高频电流转换为空间电磁波</div>
                  </div>
                  <div className="p-2 rounded-lg bg-black/40 border border-slate-700/50 text-[10px] font-mono text-[#F27D26]">
                    振子总长: L ≈ 142.5/f<br />
                    145MHz振子长约 0.98m
                  </div>
                </div>
              </div>

              {/* Antenna Radiation & Standing Wave Visual */}
              <div className="p-4 rounded-2xl bg-black/40 border border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#F27D26] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>半波对称偶极天线电流与电压分布（驻波谐振）</span>
                  </span>
                  <div className="p-3 rounded-xl bg-[#111114] border border-slate-800 text-[11px] font-mono text-[#8E9299] space-y-1">
                    <div>• <span className="text-emerald-400 font-bold">天线馈电中心处（中点）</span>: 高频电流最大（波腹），电压最小（波节），输入阻抗约为 73Ω（接近 50Ω）。</div>
                    <div>• <span className="text-amber-400 font-bold">天线两端开口处（边缘）</span>: 高频电压最高（波腹），电流为零（波节）。发射时严禁用手触摸天线两端！</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>驻波比 SWR 过高的严重危害与避坑</span>
                  </span>
                  <div className="p-3 rounded-xl bg-[#111114] border border-slate-800 text-[11px] font-mono text-[#8E9299] space-y-1">
                    <div>• SWR &gt; 2.0 时，大量射频功率无法辐射到空中，全部反射回电台末级功放。</div>
                    <div>• 功放管（PA MOSFET）将反射功率转化为剧烈发热，导致过温烧穿损坏！</div>
                    <div>• <span className="text-red-400 font-bold">考点警示</span>: 严禁在未接天线或负载开路状态下按下 PTT 发射！</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LICENSING & OPERATOR PROGRESSION LIFECYCLE FLOW */}
      {/* ========================================================================= */}
      {activeTab === 'license_flow' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-x-auto ${
            isDark ? 'bg-[#0E0E12] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="min-w-[820px] max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9299] pb-3 border-b border-dashed border-slate-700/30">
                <span className="font-bold text-[#F27D26]">CRAC & MIIT AMATEUR RADIO LICENSING ROADMAP (A → B → C)</span>
                <span>法规依据: 《业余无线电台管理办法》• 《刑法》第288条</span>
              </div>

              {/* Step Flow Nodes */}
              <div className="grid grid-cols-4 gap-4 items-stretch relative py-4">
                {/* Stage 1: A Class Entry */}
                <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between space-y-3 shadow-lg relative ${
                  isDark ? 'bg-[#16161B] border-[#F27D26]' : 'bg-white border-orange-500'
                }`}>
                  <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-[#F27D26] text-black text-[10px] font-bold font-mono">
                    第 1 阶段: 入门级
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#F27D26]" />
                      A 类操作证书
                    </h4>
                    <div className="text-[11px] text-[#8E9299] space-y-1">
                      <div>• 考核科目: 30题 / 对25题合格</div>
                      <div>• 核准频段: <span className="text-[#F27D26] font-bold">30MHz ~ 3000MHz (UV段)</span></div>
                      <div>• 最大发射功率: <span className="text-[#F27D26] font-bold">≤ 25W</span></div>
                      <div>• 严禁发射: 短波 HF 30MHz 以下频段</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700/40 text-[10px] text-emerald-400 font-mono">
                    设台前置: 具备型号核准代码 (CMIIT ID) 设备
                  </div>
                </div>

                {/* Stage 2: Station License & 6 Months Log */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-lg relative ${
                  isDark ? 'bg-[#16161B] border-blue-500/50' : 'bg-white border-blue-300'
                }`}>
                  <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-blue-500 text-white text-[10px] font-bold font-mono">
                    第 2 阶段: 设台通联
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-blue-400" />
                      电台执照与通联
                    </h4>
                    <div className="text-[11px] text-[#8E9299] space-y-1">
                      <div>• 申请机构: 省级无线电管理机构</div>
                      <div>• 执照有效期: <span className="text-blue-400 font-bold">不超过 5 年</span></div>
                      <div>• 期满延续: <span className="text-blue-400 font-bold">届满 30 日前申请</span></div>
                      <div>• 晋级硬性条件: <span className="text-emerald-400 font-bold">设台通联满 6 个月</span></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700/40 text-[10px] text-blue-400 font-mono">
                    呼号分配: 国家统一分配 B 字头呼号
                  </div>
                </div>

                {/* Stage 3: B Class Shortwave Open */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-lg relative ${
                  isDark ? 'bg-[#16161B] border-emerald-500/50' : 'bg-white border-emerald-300'
                }`}>
                  <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold font-mono">
                    第 3 阶段: 开放短波
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      B 类操作证书
                    </h4>
                    <div className="text-[11px] text-[#8E9299] space-y-1">
                      <div>• 报考条件: 持 A 证设台满 6 个月</div>
                      <div>• 考核科目: 50题 / 对40题合格</div>
                      <div>• 核准频段: <span className="text-emerald-400 font-bold">短波 HF 全段 + UV段</span></div>
                      <div>• 最大功率: <span className="text-emerald-400 font-bold">≤ 100W (短波/UV)</span></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700/40 text-[10px] text-emerald-400 font-mono">
                    可开展跨洋 DX 电离层反射通联
                  </div>
                </div>

                {/* Stage 4: C Class 1000W */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-lg relative ${
                  isDark ? 'bg-[#16161B] border-purple-500/50' : 'bg-white border-purple-300'
                }`}>
                  <div className="absolute -top-3 left-4 px-2 py-0.5 rounded bg-purple-500 text-white text-[10px] font-bold font-mono">
                    第 4 阶段: 资深顶级
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      C 类操作证书
                    </h4>
                    <div className="text-[11px] text-[#8E9299] space-y-1">
                      <div>• 报考条件: 持 B 证满 24 个月</div>
                      <div>• 实际设台并在短波通联记录证明</div>
                      <div>• 考核科目: 80题 / 对60题合格</div>
                      <div>• 最大发射功率: <span className="text-purple-400 font-bold">≤ 1000W (1kW)</span></div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700/40 text-[10px] text-purple-400 font-mono">
                    业余无线电最高操作权限等级
                  </div>
                </div>
              </div>

              {/* Legal Trap & Penalty Bottom Red Line Box */}
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>严守法律红线：擅自设台发射与刑法第 288 条</span>
                  </div>
                  <p className="text-[11px] text-[#8E9299] leading-relaxed">
                    未取得执照擅自发射（黑电台）或冒用呼号、占用航空/铁路/应急频率，无管局可没收设备、没收违法所得并处以 5万~20万元罚款；情节严重的，构成《刑法》第二百八十八条【扰乱无线电通讯管理秩序罪】，处三年以下有期徒刑、拘役或者管制。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ITU EMISSION CODES & MODULATION WAVEFORMS */}
      {/* ========================================================================= */}
      {activeTab === 'modulation' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { code: 'F3E', title: '调频单路模拟话音', desc: '手台/车载对讲机最常用模式', color: '#F27D26' },
              { code: 'A1A', title: '等幅报电报 (CW)', desc: '莫尔斯电码开关键控', color: '#10B981' },
              { code: 'J3E', title: '单边带语音 (SSB)', desc: '抑制载波单边带(USB/LSB)', color: '#3B82F6' },
              { code: 'A3E', title: '常规双边带调幅 (AM)', desc: '全载波双边带模拟话音', color: '#A855F7' },
            ].map((em) => {
              const isSelected = selectedEmission === em.code;
              return (
                <button
                  key={em.code}
                  onClick={() => setSelectedEmission(em.code as any)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#1C1C23] border-[#F27D26] shadow-xl ring-1 ring-[#F27D26]'
                      : isDark
                      ? 'bg-[#111114] border-[#2D2D33] hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-base font-bold text-[#F27D26]">{em.code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#8E9299]">ITU标准</span>
                  </div>
                  <div className="text-xs font-bold text-white">{em.title}</div>
                  <div className="text-[11px] text-[#8E9299] mt-0.5">{em.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Visual Spectrum & Waveform Inspector */}
          <div className={`p-6 rounded-2xl border shadow-2xl relative ${
            isDark ? 'bg-[#0E0E12] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Decode Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#8E9299] uppercase tracking-wider">
                  ITU 发射类别三位代码命名规则剖析 ({selectedEmission})：
                </span>
                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-700/50">
                    <div className="text-[#F27D26] font-bold text-sm">第 1 位: {selectedEmission[0]}</div>
                    <div className="text-slate-300 font-semibold mt-1">主载波调制类型</div>
                    <div className="text-[11px] text-[#8E9299] mt-0.5">
                      {selectedEmission[0] === 'F' ? '频率调制 (FM)' : selectedEmission[0] === 'A' ? '双边带幅度调制 (AM)' : '单边带抑制载波 (SSB)'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-slate-700/50">
                    <div className="text-[#10B981] font-bold text-sm">第 2 位: {selectedEmission[1]}</div>
                    <div className="text-slate-300 font-semibold mt-1">调制信号性质</div>
                    <div className="text-[11px] text-[#8E9299] mt-0.5">
                      {selectedEmission[1] === '3' ? '单通道模拟量 (话音)' : '单通道不使用量化副载波 (莫尔斯电键)'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-slate-700/50">
                    <div className="text-[#3B82F6] font-bold text-sm">第 3 位: {selectedEmission[2]}</div>
                    <div className="text-slate-300 font-semibold mt-1">被发送信息类型</div>
                    <div className="text-[11px] text-[#8E9299] mt-0.5">
                      {selectedEmission[2] === 'E' ? '电话/话音 (Telephony)' : '听觉莫尔斯电报 (Telegraphy)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spectrum Chart Graphic */}
              <div className="p-5 rounded-2xl bg-black/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#F27D26] font-bold">频谱占用与功率效率特征</span>
                  <span className="text-[#8E9299]">频带宽度 vs 频谱利用率</span>
                </div>

                {selectedEmission === 'F3E' && (
                  <div className="space-y-2 text-xs leading-relaxed text-[#CCCCCC]">
                    <div className="p-3 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/30 text-[#FFFFFF]">
                      📻 <span className="font-bold text-[#F27D26]">F3E 调频话音</span>: 载波频率随音频幅度而偏移（频偏通常 ±5kHz）。抗干扰能力极强，音质保真度高，是手持对讲机和车载中继通联的标准配置（频宽约 12.5kHz ~ 25kHz）。
                    </div>
                  </div>
                )}

                {selectedEmission === 'A1A' && (
                  <div className="space-y-2 text-xs leading-relaxed text-[#CCCCCC]">
                    <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#FFFFFF]">
                      📻 <span className="font-bold text-[#10B981]">A1A 等幅莫尔斯报 (CW)</span>: 直接通过电键闭合通断主载波。频带占用极窄（仅约 100~500Hz），能量高度集中，在极低信噪比下依然能完成极限远距离跨洋通信。
                    </div>
                  </div>
                )}

                {selectedEmission === 'J3E' && (
                  <div className="space-y-2 text-xs leading-relaxed text-[#CCCCCC]">
                    <div className="p-3 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#FFFFFF]">
                      📻 <span className="font-bold text-[#3B82F6]">J3E 单边带话音 (SSB)</span>: 滤除载波和其中一个边带，只发射上边带 (USB) 或下边带 (LSB)。发射机功率 100% 用于传输有效语音，频宽仅 2.7kHz，是短波远程通联的黄金模式！
                    </div>
                  </div>
                )}

                {selectedEmission === 'A3E' && (
                  <div className="space-y-2 text-xs leading-relaxed text-[#CCCCCC]">
                    <div className="p-3 rounded-xl bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#FFFFFF]">
                      📻 <span className="font-bold text-[#A855F7]">A3E 常规双边带调幅</span>: 包含完整主载波以及上下两个对称边带。载波消耗了 2/3 的发射功率且不含有效信息，现主要用于航空无线电通信和中波广播。
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STANDARD QSO PROTOCOL & RST FLOWCHART */}
      {/* ========================================================================= */}
      {activeTab === 'qso_protocol' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-x-auto ${
            isDark ? 'bg-[#0E0E12] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="min-w-[820px] max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E9299] pb-3 border-b border-dashed border-slate-700/30">
                <span className="font-bold text-[#F27D26]">STANDARD QSO COMMUNICATION PROTOCOL & LOGBOOK WORKFLOW</span>
                <span>UTC 协调世界时 • RST 信号报告体系 • 73 祝福致敬</span>
              </div>

              {/* 6-Step Visual Timeline */}
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: '守听与询问频率空闲 (Clear Frequency Check)',
                    voice: '“此频率有人使用吗？Is this frequency in use? This is BG1AAA.”',
                    tip: '发射前必须至少守听数十秒，确认无其他电台正在通联后再发问，避免同频干扰。',
                    color: '#8E9299'
                  },
                  {
                    step: '2',
                    title: '发送普遍呼叫 (Calling CQ)',
                    voice: '“CQ CQ CQ，This is BG1AAA, Bravo Golf One Alfa Alfa Alfa, calling CQ and standing by.”',
                    tip: 'CQ 代表普遍呼叫。标准格式：CQ 报三遍，报出自身呼号与字母解释法，最后表明 standing by 守候应答。',
                    color: '#F27D26'
                  },
                  {
                    step: '3',
                    title: '应答与交换 RST 信号报告 (Signal Report Exchange)',
                    voice: '“BG1AAA this is BH4YYY, your signal is 59 (Five Nine), QTH Shanghai.”',
                    tip: 'R(可辨度 1-5 级)、S(信号强度 1-9 级)。FM 语音通常报告 59（满分完美），CW 电报报告 599 (含 T 音调)。',
                    color: '#10B981'
                  },
                  {
                    step: '4',
                    title: '交换台址 QTH、操作员姓名与设备信息 (Rig & Weather)',
                    voice: '“QSL! My QTH is Beijing, Operator name is Jack, Rig is 25W, Antenna is GP.”',
                    tip: 'QTH 代表电台地理位置，Rig 代表发射机与天线设备类型。',
                    color: '#3B82F6'
                  },
                  {
                    step: '5',
                    title: '致以 73 祝福告别 (Sign-off & 73s)',
                    voice: '“Thanks for the nice QSO! 73 and good luck to you! BG1AAA clear with BH4YYY.”',
                    tip: '73 在业余无线电界代表“美好的祝福 (Best Regards)”，必须在通联结束时规范致意。',
                    color: '#A855F7'
                  },
                  {
                    step: '6',
                    title: '填写电台日记 (Logbook) 与交换 QSL 卡片',
                    voice: '“记录 UTC 日期时间、频率 145.000MHz、模式 F3E、对方呼号 BH4YYY、RST 59”',
                    tip: '电台日记按国家规定必须如实填写并妥善保存备查。QSL 卡片是最终通联凭证。',
                    color: '#EC4899'
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className={`p-4 rounded-2xl border flex items-start gap-4 transition-transform hover:translate-x-1 ${
                      isDark ? 'bg-[#16161B] border-[#2D2D33]' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 text-black"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.step}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        <span className="text-[10px] font-mono text-[#8E9299]">Step 0{item.step}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-xs font-mono text-[#F27D26]">
                        {item.voice}
                      </div>
                      <div className="text-[11px] text-[#8E9299]">💡 {item.tip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
