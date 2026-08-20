import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Radio, 
  Compass, 
  Sparkles, 
  Info, 
  Globe, 
  Search,
  Activity,
  Layers,
  Volume2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Navigation,
  Crosshair,
  Sliders,
  Share2,
  Download
} from 'lucide-react';
import { CallsignDistrict } from '../types';
import { callsignDistricts } from '../data/hamData';
import { 
  CHINA_PROVINCES_GEO, 
  ChinaProvinceGeo, 
  SOUTH_CHINA_SEA_INSET, 
  COASTAL_SEAS, 
  MAJOR_RADIO_STATIONS, 
  RadioStationHub,
  MAP_GRATICULE
} from '../data/chinaMapPaths';
import { useTheme } from '../utils/theme';
import { morseAudio } from '../utils/morseAudio';

export const ZONE_COLORS: Record<number, { bg: string; border: string; text: string; lightBg: string; name: string; darkFill: string; accent: string }> = {
  1: { bg: '#E11D48', border: '#BE123C', text: '#FFFFFF', lightBg: '#FFE4E6', name: '1区 (北京)', darkFill: '#881337', accent: '#FB7185' },
  2: { bg: '#059669', border: '#047857', text: '#FFFFFF', lightBg: '#D1FAE5', name: '2区 (黑吉辽)', darkFill: '#064E3B', accent: '#34D399' },
  3: { bg: '#0284C7', border: '#0369A1', text: '#FFFFFF', lightBg: '#E0F2FE', name: '3区 (冀晋蒙津)', darkFill: '#0C4A6E', accent: '#38BDF8' },
  4: { bg: '#4F46E5', border: '#4338CA', text: '#FFFFFF', lightBg: '#EEF2FF', name: '4区 (苏鲁沪)', darkFill: '#312E81', accent: '#818CF8' },
  5: { bg: '#7C3AED', border: '#6D28D9', text: '#FFFFFF', lightBg: '#F5F3FF', name: '5区 (浙赣闽台)', darkFill: '#4C1D95', accent: '#A78BFA' },
  6: { bg: '#D97706', border: '#B45309', text: '#FFFFFF', lightBg: '#FEF3C7', name: '6区 (皖豫鄂)', darkFill: '#78350F', accent: '#FBBF24' },
  7: { bg: '#EA580C', border: '#C2410C', text: '#FFFFFF', lightBg: '#FFEDD5', name: '7区 (湘粤桂琼港澳)', darkFill: '#7C2D12', accent: '#FB923C' },
  8: { bg: '#0D9488', border: '#0F766E', text: '#FFFFFF', lightBg: '#CCFBF1', name: '8区 (川渝黔滇)', darkFill: '#134E4A', accent: '#2DD4BF' },
  9: { bg: '#65A30D', border: '#4D7C0F', text: '#FFFFFF', lightBg: '#ECFCCB', name: '9区 (陕甘青宁)', darkFill: '#365314', accent: '#A3E635' },
  0: { bg: '#C026D3', border: '#A21CAF', text: '#FFFFFF', lightBg: '#FAE8FF', name: '0区 (新藏)', darkFill: '#701A75', accent: '#E879F9' },
};

export const DistrictMap: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [selectedProvince, setSelectedProvince] = useState<ChinaProvinceGeo | null>(
    CHINA_PROVINCES_GEO.find((p) => p.id === 'BJ') || null
  );
  const [hoveredProvince, setHoveredProvince] = useState<ChinaProvinceGeo | null>(null);
  const [hoveredStation, setHoveredStation] = useState<RadioStationHub | null>(null);
  
  // Interactive Viewport & GIS Pan/Zoom
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layer Toggles
  const [showDistrictColor, setShowDistrictColor] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showSeaLabels, setShowSeaLabels] = useState<boolean>(true);
  const [showMaidenhead, setShowMaidenhead] = useState<boolean>(false);
  const [showPropagationWaves, setShowPropagationWaves] = useState<boolean>(true);
  const [showGreatCircleLines, setShowGreatCircleLines] = useState<boolean>(false);
  const [labelStyle, setLabelStyle] = useState<'short' | 'full' | 'grid'>('short');
  
  const [searchCallsign, setSearchCallsign] = useState<string>('');
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const activeDistrict = callsignDistricts.find((d) => d.zone === selectedZone) || callsignDistricts[0];

  // Real-time Callsign Decoder Tool
  const callsignAnalysis = useMemo(() => {
    const raw = searchCallsign.trim().toUpperCase();
    if (!raw) return null;

    const match = raw.match(/^(BA|BD|BG|BH|BI|BY|BR|BV|BX|BM|BN|VR2|XX9)(\d)?([A-Z0-9]+)?(\/.*)?$/);
    const prefix = match ? match[1] : '';
    const zoneNum = match && match[2] !== undefined ? parseInt(match[2], 10) : null;
    const suffix = match ? match[3] || '' : '';
    const portablePart = match ? match[4] || '' : '';

    let typeDesc = '标准业余无线电呼号';
    let regionDesc = '';

    if (prefix === 'BG' || prefix === 'BH') {
      typeDesc = 'A/B 类个人业余电台 (初/中级)';
    } else if (prefix === 'BA' || prefix === 'BD') {
      typeDesc = 'B/C 类资深个人业余电台 (高级/短波)';
    } else if (prefix === 'BY') {
      typeDesc = '集体电台 / 俱乐部协会电台 (Club Station)';
    } else if (prefix === 'BR') {
      typeDesc = '专用无线电自动信标台 (Beacon Station)';
    } else if (prefix === 'BI') {
      typeDesc = '中国海岛业余无线电台 (IOTA 通联活动)';
    } else if (prefix === 'VR2') {
      typeDesc = '中国香港特别行政区业余电台';
      regionDesc = '中国香港 (第 7 呼号分区)';
    } else if (prefix === 'XX9') {
      typeDesc = '中国澳门特别行政区业余电台';
      regionDesc = '中国澳门 (第 7 呼号分区)';
    } else if (prefix === 'BV' || prefix === 'BX' || prefix === 'BM' || prefix === 'BN') {
      typeDesc = '中国台湾省业余无线电台';
      regionDesc = '中国台湾省 (第 5 呼号分区/特别字冠)';
    }

    const matchedDist = zoneNum !== null ? callsignDistricts.find((d) => d.zone === zoneNum) : null;

    return {
      raw,
      isValid: !!match,
      prefix,
      zoneNum,
      suffix,
      portablePart,
      typeDesc,
      regionDesc,
      matchedDist,
    };
  }, [searchCallsign]);

  // When callsign zone matches, auto switch to that zone
  const handleCallsignSearchChange = (val: string) => {
    setSearchCallsign(val);
    const raw = val.trim().toUpperCase();
    
    // Check Taiwan
    if (raw.startsWith('BV') || raw.startsWith('BX') || raw.startsWith('BM') || raw.startsWith('BN')) {
      setSelectedZone(5);
      const tw = CHINA_PROVINCES_GEO.find(p => p.id === 'TW');
      if (tw) setSelectedProvince(tw);
      return;
    }
    // Check HK/Macau
    if (raw.startsWith('VR2') || raw.startsWith('XX9')) {
      setSelectedZone(7);
      const reg = CHINA_PROVINCES_GEO.find(p => raw.startsWith('VR2') ? p.id === 'HK' : p.id === 'MO');
      if (reg) setSelectedProvince(reg);
      return;
    }

    const match = raw.match(/^(?:BA|BD|BG|BH|BI|BY|BR)(\d)/);
    if (match) {
      const z = parseInt(match[1], 10);
      if (!isNaN(z) && z >= 0 && z <= 9) {
        setSelectedZone(z);
        const prov = CHINA_PROVINCES_GEO.find(p => p.zone === z);
        if (prov) setSelectedProvince(prov);
      }
    }
  };

  const handleSelectProvince = (prov: ChinaProvinceGeo) => {
    setSelectedProvince(prov);
    setSelectedZone(prov.zone);
    morseAudio.playTone(800, 40);
  };

  // Zoom & Pan Actions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.8));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.8), 3.0));
  };

  const activeFocusProv = hoveredProvince || selectedProvince || CHINA_PROVINCES_GEO.find(p => p.zone === selectedZone);

  // Capital station Beijing BY1PK coordinate
  const beijingCoord = { x: 712, y: 282 };

  return (
    <div className={`max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-in fade-in duration-200 ${
      isFullscreen ? 'fixed inset-0 z-50 p-4 bg-slate-950 overflow-y-auto max-w-none' : ''
    }`}>
      {/* Top Banner & Standard Map Header */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
              <Compass className="w-4 h-4" />
              <span>中华人民共和国标准地图 • 业余无线电 10 大呼号分区拓扑体系</span>
            </div>
            <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>中国业余无线电台呼号分区标准地图 (1区 ~ 0区)</span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-bold">
                国家标准底图规范
              </span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              严格遵循中国标准地图制图规范，包含 34 个省级行政区、台湾省、香港、澳门、南海诸岛（十段线/九段线、东沙、西沙、中沙黄岩岛、南沙、曾母暗沙）、钓鱼岛及赤尾屿等全部领土要素与沿海水域。
            </p>
          </div>

          {/* Callsign Quick Search Bar */}
          <div className={`border rounded-2xl p-3.5 sm:p-4 w-full lg:w-96 shadow-xs space-y-2 ${
            isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <Radio className="w-3.5 h-3.5 text-orange-600" />
                <span>呼号智能定位与实时解码</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">支持 BG7 / BV2 / BY1 / VR2 / XX9</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchCallsign}
                onChange={(e) => handleCallsignSearchChange(e.target.value)}
                placeholder="输入任意呼号在标准地图定位..."
                className={`w-full text-xs font-mono font-bold uppercase rounded-xl pl-8 pr-3 py-2 border focus:outline-none focus:border-orange-500 ${
                  isDark ? 'bg-[#111114] border-[#2D2D33] text-orange-400' : 'bg-white border-slate-300 text-orange-600'
                }`}
              />
            </div>

            {callsignAnalysis && callsignAnalysis.raw && (
              <div className="text-[11px] font-mono space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">性质:</span>
                  <span className="font-bold text-orange-600 truncate max-w-[200px]">{callsignAnalysis.typeDesc}</span>
                </div>
                {callsignAnalysis.matchedDist && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>定位归属:</span>
                    <span>第 {callsignAnalysis.matchedDist.zone} 分区 • {callsignAnalysis.matchedDist.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 10 Zone Buttons Toolbar */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
          {callsignDistricts.map((dist) => {
            const isSelected = selectedZone === dist.zone;
            const color = ZONE_COLORS[dist.zone];
            return (
              <button
                key={dist.zone}
                onClick={() => {
                  setSelectedZone(dist.zone);
                  const firstProv = CHINA_PROVINCES_GEO.find((p) => p.zone === dist.zone);
                  if (firstProv) setSelectedProvince(firstProv);
                  morseAudio.playTone(600 + dist.zone * 40, 30);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'ring-2 ring-orange-500 shadow-md font-bold'
                    : isDark
                    ? 'bg-[#16161B] hover:bg-[#1F1F26] border-[#2D2D33]'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
                style={{
                  borderLeftColor: color.bg,
                  borderLeftWidth: '4px',
                }}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold" style={{ color: color.bg }}>
                    {dist.zone} 区
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {dist.provinces[0]?.replace(/(省|市|自治区|特别行政区)/g, '') || ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map Viewer & Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Side: Full Standard Vector Map (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div
            ref={mapContainerRef}
            className={`border rounded-2xl overflow-hidden relative shadow-lg transition-colors ${
              isDark ? 'bg-[#090A0F] border-[#2D2D33]' : 'bg-[#F4F7FA] border-slate-300'
            }`}
            style={{ minHeight: isFullscreen ? '75vh' : '580px' }}
          >
            {/* GIS Interactive Float Toolbar */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl backdrop-blur-md border shadow-md bg-white/80 dark:bg-black/70 border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                title="放大地图"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                title="缩小地图"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer text-[11px] font-mono font-bold"
                title="重置全貌视角"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
              <span className="text-[10px] font-mono text-slate-500 px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
              <button
                onClick={() => setIsFullscreen((prev) => !prev)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                title={isFullscreen ? '退出全屏' : '全屏浏览'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Layer Control Pills */}
            <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-1.5 p-1 rounded-xl backdrop-blur-md border shadow-md bg-white/80 dark:bg-black/70 border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                onClick={() => setShowStations((prev) => !prev)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  showStations ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                📡 骨干台站
              </button>
              <button
                onClick={() => setShowMaidenhead((prev) => !prev)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  showMaidenhead ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                🌐 网格定位
              </button>
              <button
                onClick={() => setShowGraticule((prev) => !prev)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  showGraticule ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                🧭 经纬网
              </button>
              <button
                onClick={() => setShowGreatCircleLines((prev) => !prev)}
                className={`px-2 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  showGreatCircleLines ? 'bg-orange-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ⚡ 大圆路径
              </button>
            </div>

            {/* SVG Standard Map Canvas */}
            <div
              className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'} select-none`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              <svg
                viewBox="0 0 1000 800"
                className="w-full h-full transition-transform duration-75"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <defs>
                  {/* Subtle Grid Pattern for cartographic atmosphere */}
                  <pattern id="cartoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke={isDark ? '#1F2430' : '#E2E8F0'}
                      strokeWidth="0.5"
                      strokeDasharray="2,2"
                    />
                  </pattern>

                  {/* Gradient for standard map water body */}
                  <radialGradient id="waterGrad" cx="60%" cy="50%" r="60%">
                    <stop offset="0%" stopColor={isDark ? '#0C121E' : '#EBF4FC'} />
                    <stop offset="100%" stopColor={isDark ? '#080C14' : '#DBEAFE'} />
                  </radialGradient>

                  {/* Radar beacon glow */}
                  <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#EA580C" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Map Base Sea Background */}
                <rect width="1000" height="800" fill="url(#waterGrad)" />
                <rect width="1000" height="800" fill="url(#cartoGrid)" />

                {/* Standard Lat/Long Graticule Lines */}
                {showGraticule && (
                  <g className="graticule" opacity={isDark ? 0.35 : 0.45}>
                    {/* Meridians */}
                    {MAP_GRATICULE.meridians.map((m) => (
                      <g key={m.deg}>
                        <line
                          x1={m.x}
                          y1="30"
                          x2={m.x}
                          y2="770"
                          stroke={isDark ? '#38BDF8' : '#0284C7'}
                          strokeWidth="0.75"
                          strokeDasharray="4,4"
                        />
                        <text
                          x={m.x}
                          y="24"
                          textAnchor="middle"
                          fontSize="9"
                          fill={isDark ? '#94A3B8' : '#64748B'}
                          fontFamily="monospace"
                        >
                          {m.deg}
                        </text>
                      </g>
                    ))}
                    {/* Parallels */}
                    {MAP_GRATICULE.parallels.map((p) => (
                      <g key={p.deg}>
                        <line
                          x1="30"
                          y1={p.y}
                          x2={970}
                          y2={p.y}
                          stroke={isDark ? '#38BDF8' : '#0284C7'}
                          strokeWidth="0.75"
                          strokeDasharray="4,4"
                        />
                        <text
                          x="24"
                          y={p.y + 3}
                          textAnchor="end"
                          fontSize="9"
                          fill={isDark ? '#94A3B8' : '#64748B'}
                          fontFamily="monospace"
                        >
                          {p.deg}
                        </text>
                      </g>
                    ))}
                  </g>
                )}

                {/* Capital Radio Wave Propagation from BY1PK (Beijing) */}
                {showPropagationWaves && (
                  <g className="propagation-waves" opacity={isDark ? 0.25 : 0.35}>
                    <circle cx={beijingCoord.x} cy={beijingCoord.y} r="100" fill="none" stroke="#EA580C" strokeWidth="1" strokeDasharray="4,4" />
                    <circle cx={beijingCoord.x} cy={beijingCoord.y} r="200" fill="none" stroke="#EA580C" strokeWidth="1" strokeDasharray="5,5" />
                    <circle cx={beijingCoord.x} cy={beijingCoord.y} r="320" fill="none" stroke="#EA580C" strokeWidth="1" strokeDasharray="6,6" />
                    <circle cx={beijingCoord.x} cy={beijingCoord.y} r="460" fill="none" stroke="#EA580C" strokeWidth="1" strokeDasharray="8,8" />
                  </g>
                )}

                {/* Great Circle Azimuth Lines to Major Centers */}
                {showGreatCircleLines && (
                  <g className="great-circle" opacity={0.5}>
                    {MAJOR_RADIO_STATIONS.filter(s => s.callsign !== 'BY1PK').map((st) => (
                      <line
                        key={st.callsign}
                        x1={beijingCoord.x}
                        y1={beijingCoord.y}
                        x2={st.x}
                        y2={st.y}
                        stroke="#F97316"
                        strokeWidth="1.2"
                        strokeDasharray="3,3"
                      />
                    ))}
                  </g>
                )}

                {/* ======================================================== */}
                {/* 34 Administrative Regions (Provinces / Municipalities) */}
                {/* ======================================================== */}
                <g className="provinces-layer">
                  {CHINA_PROVINCES_GEO.map((prov) => {
                    const isZoneSelected = selectedZone === prov.zone;
                    const isProvSelected = selectedProvince?.id === prov.id;
                    const isHovered = hoveredProvince?.id === prov.id;
                    const color = ZONE_COLORS[prov.zone];

                    // Fill calculation
                    let fillColor = isDark ? '#1E2330' : '#F1F5F9';
                    if (showDistrictColor) {
                      fillColor = isDark ? color.darkFill : color.lightBg;
                    }
                    if (isZoneSelected) {
                      fillColor = isDark ? color.bg : color.lightBg;
                    }
                    if (isProvSelected || isHovered) {
                      fillColor = color.bg;
                    }

                    return (
                      <g
                        key={prov.id}
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredProvince(prov)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => handleSelectProvince(prov)}
                      >
                        {/* Main Province Polygon */}
                        <path
                          d={prov.path}
                          fill={fillColor}
                          stroke={
                            isProvSelected
                              ? '#F97316'
                              : isZoneSelected
                              ? color.border
                              : isDark
                              ? '#334155'
                              : '#CBD5E1'
                          }
                          strokeWidth={isProvSelected ? 2.5 : isZoneSelected ? 1.5 : 0.8}
                          className="transition-colors duration-150"
                        />

                        {/* Attached Islands / Enclaves (Zhoushan, Diaoyu, Penghu, Kinmen, etc.) */}
                        {prov.subPaths &&
                          prov.subPaths.map((sp, idx) => (
                            <path
                              key={idx}
                              d={sp}
                              fill={fillColor}
                              stroke={isZoneSelected ? color.border : isDark ? '#475569' : '#94A3B8'}
                              strokeWidth={isProvSelected ? 2 : 1}
                            />
                          ))}
                      </g>
                    );
                  })}
                </g>

                {/* Province Text Labels & Callsign Badges */}
                <g className="province-labels pointer-events-none">
                  {CHINA_PROVINCES_GEO.map((prov) => {
                    const isZoneSelected = selectedZone === prov.zone;
                    const isProvSelected = selectedProvince?.id === prov.id;
                    const color = ZONE_COLORS[prov.zone];

                    return (
                      <g key={prov.id} transform={`translate(${prov.labelX}, ${prov.labelY})`}>
                        {/* Short / Full Name */}
                        <text
                          textAnchor="middle"
                          fontSize={isProvSelected ? '13' : '11'}
                          fontWeight={isProvSelected || isZoneSelected ? 'bold' : 'normal'}
                          fill={
                            isProvSelected
                              ? '#FFFFFF'
                              : isZoneSelected
                              ? isDark
                                ? '#FFFFFF'
                                : color.darkFill
                              : isDark
                              ? '#CBD5E1'
                              : '#334155'
                          }
                          style={{ textShadow: isDark ? '0 1px 3px #000000' : '0 1px 2px #FFFFFF' }}
                        >
                          {labelStyle === 'full' ? prov.name.replace(/(省|自治区|特别行政区)/g, '') : prov.shortName}
                        </text>

                        {/* Maidenhead Grid Locator Tag */}
                        {showMaidenhead && prov.maidenheadGrid && (
                          <text
                            y="11"
                            textAnchor="middle"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={isDark ? '#FDBA74' : '#C2410C'}
                          >
                            {prov.maidenheadGrid}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>

                {/* Standard Sea Names */}
                {showSeaLabels && (
                  <g className="sea-labels pointer-events-none" opacity={isDark ? 0.7 : 0.85}>
                    {COASTAL_SEAS.map((sea) => (
                      <text
                        key={sea.name}
                        x={sea.x}
                        y={sea.y}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        letterSpacing="3"
                        fill={isDark ? '#38BDF8' : '#0284C7'}
                        transform={sea.angle ? `rotate(${sea.angle}, ${sea.x}, ${sea.y})` : undefined}
                      >
                        {sea.name}
                      </text>
                    ))}
                  </g>
                )}

                {/* Diaoyu Islands & Chiwei Yu Callout */}
                <g className="diaoyu-islands-callout pointer-events-none" transform="translate(870, 605)">
                  <rect x="-10" y="-18" width="125" height="32" rx="6" fill={isDark ? '#18181B' : '#FFFFFF'} stroke="#EA580C" strokeWidth="1" />
                  <text x="52" y="-5" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill={isDark ? '#FDBA74' : '#C2410C'}>
                    钓鱼岛及附属岛屿
                  </text>
                  <text x="52" y="7" textAnchor="middle" fontSize="7.5" fill={isDark ? '#94A3B8' : '#64748B'}>
                    中国领土 (5区/BV/BI5)
                  </text>
                  <line x1="-10" y1="-2" x2="-20" y2="8" stroke="#EA580C" strokeWidth="1" strokeDasharray="2,2" />
                </g>

                {/* Radio Backbone Repeaters & Hubs */}
                {showStations && (
                  <g className="radio-stations">
                    {MAJOR_RADIO_STATIONS.map((st) => {
                      const isHovered = hoveredStation?.callsign === st.callsign;
                      return (
                        <g
                          key={st.callsign}
                          transform={`translate(${st.x}, ${st.y})`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredStation(st)}
                          onMouseLeave={() => setHoveredStation(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            morseAudio.playTone(1000, 60);
                          }}
                        >
                          {/* Pulsing ring for Beijing hub or hovered */}
                          {(st.callsign === 'BY1PK' || isHovered) && (
                            <circle r="14" fill="none" stroke="#EA580C" strokeWidth="1.5" className="animate-ping" opacity="0.75" />
                          )}
                          <circle r="5" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1.5" />
                          <rect
                            x="7"
                            y="-9"
                            width={st.callsign.length * 6.5 + 8}
                            height="15"
                            rx="3"
                            fill={isDark ? '#000000' : '#FFFFFF'}
                            stroke="#EA580C"
                            strokeWidth="0.8"
                            opacity="0.9"
                          />
                          <text
                            x="11"
                            y="2"
                            fontSize="8.5"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill={isDark ? '#FDBA74' : '#EA580C'}
                          >
                            {st.callsign}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* ======================================================== */}
                {/* Standard South China Sea Inset (南海诸岛标准附图) */}
                {/* ======================================================== */}
                <g className="south-china-sea-inset" transform="translate(815, 545)">
                  {/* Outer Frame Box with Standard Double Lines */}
                  <rect
                    width="170"
                    height="230"
                    fill={isDark ? '#080C14' : '#F0F7FF'}
                    stroke={isDark ? '#475569' : '#94A3B8'}
                    strokeWidth="1.5"
                    rx="4"
                  />
                  <rect
                    x="3"
                    y="3"
                    width="164"
                    height="224"
                    fill="none"
                    stroke={isDark ? '#334155' : '#CBD5E1'}
                    strokeWidth="0.8"
                  />

                  {/* Header Title */}
                  <rect x="8" y="8" width="154" height="18" rx="3" fill={isDark ? '#1E293B' : '#E2E8F0'} />
                  <text
                    x="85"
                    y="20"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="bold"
                    fill={isDark ? '#F8FAFC' : '#0F172A'}
                  >
                    {SOUTH_CHINA_SEA_INSET.title}
                  </text>

                  {/* Ten-Dash Lines (十段线) */}
                  <g className="ten-dash-lines">
                    {SOUTH_CHINA_SEA_INSET.tenDashLines.map((line, idx) => (
                      <path
                        key={idx}
                        d={line}
                        fill="none"
                        stroke="#EA580C"
                        strokeWidth="2"
                        strokeDasharray="4,3"
                      />
                    ))}
                  </g>

                  {/* Islands & Atolls (东沙/西沙/中沙黄岩岛/南沙/曾母暗沙) */}
                  {SOUTH_CHINA_SEA_INSET.islands.map((island) => (
                    <g key={island.name} transform={`translate(${island.x}, ${island.y})`}>
                      <circle
                        r={island.radius}
                        fill="#EA580C"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                        className="animate-pulse"
                      />
                      <text
                        x={island.radius + 4}
                        y="3"
                        fontSize="7.5"
                        fontWeight="bold"
                        fill={isDark ? '#E2E8F0' : '#1E293B'}
                      >
                        {island.name}
                      </text>
                    </g>
                  ))}

                  {/* Inset Scale Bar & Standard Compass */}
                  <g transform="translate(12, 212)">
                    <line x1="0" y1="0" x2="35" y2="0" stroke={isDark ? '#94A3B8' : '#475569'} strokeWidth="1.5" />
                    <text x="17" y="9" textAnchor="middle" fontSize="6.5" fill={isDark ? '#94A3B8' : '#64748B'} fontFamily="monospace">
                      1:2000万
                    </text>
                  </g>
                  <g transform="translate(148, 208)">
                    <circle r="8" fill="none" stroke={isDark ? '#94A3B8' : '#475569'} strokeWidth="0.8" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#EA580C" strokeWidth="1" />
                    <text x="0" y="-9" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#EA580C">N</text>
                  </g>
                </g>

                {/* Standard Map Scale Bar (Bottom Left) */}
                <g className="standard-scale-bar" transform="translate(35, 755)">
                  <rect x="-10" y="-16" width="200" height="32" rx="4" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#374151' : '#E5E7EB'} opacity="0.9" />
                  <line x1="0" y1="0" x2="180" y2="0" stroke={isDark ? '#F9FAFB' : '#111827'} strokeWidth="2.5" />
                  <line x1="0" y1="-3" x2="0" y2="3" stroke={isDark ? '#F9FAFB' : '#111827'} strokeWidth="1.5" />
                  <line x1="45" y1="-3" x2="45" y2="3" stroke={isDark ? '#F9FAFB' : '#111827'} strokeWidth="1.5" />
                  <line x1="90" y1="-3" x2="90" y2="3" stroke={isDark ? '#F9FAFB' : '#111827'} strokeWidth="1.5" />
                  <line x1="180" y1="-3" x2="180" y2="3" stroke={isDark ? '#F9FAFB' : '#111827'} strokeWidth="1.5" />
                  
                  <text x="0" y="-6" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={isDark ? '#9CA3AF' : '#4B5563'}>0</text>
                  <text x="45" y="-6" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={isDark ? '#9CA3AF' : '#4B5563'}>250</text>
                  <text x="90" y="-6" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={isDark ? '#9CA3AF' : '#4B5563'}>500</text>
                  <text x="180" y="-6" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill={isDark ? '#9CA3AF' : '#4B5563'}>1000 km</text>
                  <text x="90" y="10" textAnchor="middle" fontSize="7" fontWeight="bold" fill={isDark ? '#9CA3AF' : '#4B5563'}>
                    比例尺 1 : 16,000,000 (阿尔伯斯等角投影)
                  </text>
                </g>

                {/* Standard Compass Rose (Top Right) */}
                <g className="compass-rose" transform="translate(950, 50)">
                  <circle r="20" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#374151' : '#CBD5E1'} strokeWidth="1" />
                  <polygon points="0,-16 4,0 0,3 -4,0" fill="#EA580C" />
                  <polygon points="0,16 4,0 0,-3 -4,0" fill={isDark ? '#6B7280' : '#9CA3AF'} />
                  <text x="0" y="-18" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#EA580C">N</text>
                  <text x="0" y="24" textAnchor="middle" fontSize="7" fill={isDark ? '#9CA3AF' : '#6B7280'}>S</text>
                  <text x="-22" y="3" textAnchor="middle" fontSize="7" fill={isDark ? '#9CA3AF' : '#6B7280'}>W</text>
                  <text x="22" y="3" textAnchor="middle" fontSize="7" fill={isDark ? '#9CA3AF' : '#6B7280'}>E</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed District & Province Inspector (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active District Card */}
          <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-white shadow-xs text-sm"
                  style={{ backgroundColor: ZONE_COLORS[selectedZone].bg }}
                >
                  {selectedZone}
                </span>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {activeDistrict.name}
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    呼号格式: B* {selectedZone} ...
                  </div>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${activeDistrict.badgeColor}`}>
                {activeDistrict.provinces.length} 个省级行政区
              </span>
            </div>

            {/* Mnemonic Banner */}
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs">
              <div className="font-bold text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CRAC 官方速记口诀</span>
              </div>
              <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {activeDistrict.mnemonic}
              </div>
            </div>

            {/* Province Buttons inside this Zone */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">
                本分区所辖省级行政区 (点击联动地图):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {activeDistrict.provinces.map((provName) => {
                  const geo = CHINA_PROVINCES_GEO.find((p) => p.name === provName || provName.includes(p.shortName));
                  const isProvActive = selectedProvince?.name === provName;
                  return (
                    <button
                      key={provName}
                      onClick={() => {
                        if (geo) handleSelectProvince(geo);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isProvActive
                          ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-xs'
                          : isDark
                          ? 'bg-[#18181D] hover:bg-[#202028] text-slate-300 border-[#2D2D33]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {provName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Selected Province Details */}
            {activeFocusProv && (
              <div className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
                isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-sm text-orange-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{activeFocusProv.name} ({activeFocusProv.shortName})</span>
                  </div>
                  <span className="font-mono text-slate-400">省会/首府: {activeFocusProv.capital}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400">标准字冠: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{activeFocusProv.prefix}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">梅登黑德网格: </span>
                    <span className="font-bold text-orange-600">{activeFocusProv.maidenheadGrid || 'OM89'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">CQ 分区: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Zone {activeFocusProv.cqZone || 24}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">ITU 分区: </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Zone {activeFocusProv.ituZone || 44}</span>
                  </div>
                </div>

                {activeFocusProv.repeaterStation && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                    <div className="text-slate-400 mb-0.5">骨干台站 / 常用中继:</div>
                    <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      <span>{activeFocusProv.repeaterStation}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Exam Pitfalls & Rules Card */}
          <div className={`border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition-colors ${
            isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
          }`}>
            <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>本分区 CRAC 官方必考真题点</span>
            </h4>
            <div className="space-y-2 text-xs">
              {(activeDistrict.notes || [activeDistrict.specialRules, activeDistrict.description].filter(Boolean) as string[]).map((note, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border leading-relaxed flex items-start gap-2 ${
                    isDark ? 'bg-[#18181D] border-[#2D2D33] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
