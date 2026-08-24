import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Crosshair,
  Layers3,
  MapPin,
  Maximize2,
  Radio,
  RotateCcw,
  Ruler,
  Search,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { examCallsignDistricts } from '../data/aKnowledgeData';
import {
  CHINA_MAP_FRAME,
  CHINA_MAP_GRATICULES,
  CHINA_MAP_REGIONS,
  SOUTH_CHINA_SEA_PATHS,
} from '../data/chinaProvinceGeometry';
import { CHINA_PROVINCE_METADATA, type ChinaProvinceMetadata } from '../data/chinaProvinceMetadata';
import { useTheme } from '../utils/theme';

const ZONE_COLORS: Record<number, string> = {
  1: '#be4961',
  2: '#277c61',
  3: '#367fa4',
  4: '#5965a6',
  5: '#7959a8',
  6: '#a87532',
  7: '#b85f38',
  8: '#2d817d',
  9: '#718747',
  0: '#795b82',
};

const SPECIAL_PREFIXES = [
  { prefixes: ['VR2'], label: '香港业余电台特别字冠', region: '香港特别行政区' },
  { prefixes: ['XX9'], label: '澳门业余电台特别字冠', region: '澳门特别行政区' },
  { prefixes: ['BV', 'BX', 'BM', 'BN'], label: '台湾地区业余电台特别字冠', region: '台湾省' },
];

const MAP_LABEL_OFFSETS: Record<string, [number, number]> = {
  北京市: [-4, -18],
  天津市: [20, 4],
  上海市: [20, 4],
  香港特别行政区: [20, 13],
  澳门特别行政区: [-18, 18],
  台湾省: [16, 2],
};

type SearchResult =
  | { kind: 'province'; province: ChinaProvinceMetadata }
  | { kind: 'zone'; zone: number }
  | { kind: 'special'; label: string }
  | { kind: 'none' }
  | null;

const normalize = (value: string) => value.trim().toUpperCase();

export const ExamDistrictMap: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedZone, setSelectedZone] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<ChinaProvinceMetadata | null>(
    CHINA_PROVINCE_METADATA.find((province) => province.id === 'BJ') || null,
  );
  const [hoveredProvince, setHoveredProvince] = useState<ChinaProvinceMetadata | null>(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult>(null);
  const [mapZoom, setMapZoom] = useState(1);

  const examProvinces = useMemo(
    () =>
      CHINA_PROVINCE_METADATA.filter((province) =>
        examCallsignDistricts.some(
          (district) => district.zone === province.zone && district.provinces.includes(province.name),
        ),
      ),
    [],
  );

  const activeDistrict =
    examCallsignDistricts.find((district) => district.zone === selectedZone) ||
    examCallsignDistricts[0];
  const selectedSpecialProvince = searchResult?.kind === 'special'
    ? CHINA_PROVINCE_METADATA.find((province) =>
        province.prefix.split(' / ').some((prefix) => normalize(query).startsWith(normalize(prefix))),
      ) || null
    : null;
  const focusProvince = hoveredProvince || selectedSpecialProvince || selectedProvince;

  const zoneForProvince = (name: string) =>
    examCallsignDistricts.find((district) => district.provinces.includes(name))?.zone;

  const selectZone = (zone: number, clearSearch = true) => {
    setSelectedZone(zone);
    setSelectedProvince(examProvinces.find((province) => province.zone === zone) || null);
    if (clearSearch) {
      setQuery('');
      setSearchResult(null);
    }
  };

  const selectProvince = (province: ChinaProvinceMetadata, clearSearch = true) => {
    const zone = zoneForProvince(province.name);
    if (zone === undefined) return;
    setSelectedZone(zone);
    setSelectedProvince(province);
    if (clearSearch) {
      setQuery('');
      setSearchResult(null);
    }
  };

  const selectMapRegion = (name: string) => {
    const province = CHINA_PROVINCE_METADATA.find((item) => item.name === name);
    const zone = zoneForProvince(name);
    if (province && zone !== undefined) {
      selectProvince(province);
      return;
    }

    const special = SPECIAL_PREFIXES.find((item) => item.region === name);
    if (special) {
      setQuery(special.prefixes[0]);
      setSearchResult({ kind: 'special', label: special.label });
    }
  };

  const resolveSearch = (value: string): SearchResult => {
    const normalized = normalize(value);
    if (!normalized) return null;

    const special = SPECIAL_PREFIXES.find(({ prefixes }) =>
      prefixes.some((prefix) => normalized.startsWith(prefix)),
    );
    if (special) return { kind: 'special', label: special.label };

    const callsignMatch = normalized.match(/^(?:BA|BD|BG|BH|BY|BI|BR)([0-9])/);
    if (callsignMatch) return { kind: 'zone', zone: Number(callsignMatch[1]) };

    const directZone = normalized.match(/^(?:第\s*)?([0-9])\s*区?$/);
    if (directZone) return { kind: 'zone', zone: Number(directZone[1]) };

    const province = examProvinces.find((item) =>
      [item.name, item.shortName, item.capital, item.prefix]
        .filter(Boolean)
        .some((candidate) => normalize(String(candidate)).includes(normalized)),
    );
    return province ? { kind: 'province', province } : { kind: 'none' };
  };

  const handleSearchChange = (value: string) => {
    setQuery(value);
    const result = resolveSearch(value);
    setSearchResult(result);

    if (result?.kind === 'province') selectProvince(result.province, false);
    if (result?.kind === 'zone') selectZone(result.zone, false);
  };

  const panelClass = isDark
    ? 'border-[#2D2D33] bg-[#101114]'
    : 'border-slate-200 bg-white';

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-6">
      <header className={`overflow-hidden rounded-2xl border ${panelClass}`}>
        <div className="border-b border-slate-200 px-5 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-slate-500 dark:border-[#303136]">
          Geographic operations console / province geometry / callsign intelligence
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
              <Layers3 className="h-4 w-4" />
              China callsign district atlas · R2 reference
            </div>
            <h2 className={`mt-2 text-xl font-black sm:text-2xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
              中国业余无线电呼号分区态势图
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
              真实省级边界经纬度数据采用 Albers 等面积投影，完整呈现大陆 31 个题库行政区、台湾、香港、澳门与南海附图；
              呼号数字映射严格来自 R2 题库，用于分区记忆、呼号识别和省份定位。
            </p>
          </div>

          <dl className="grid grid-cols-4 border-y border-slate-200 py-3 dark:border-[#303136] lg:min-w-[460px] lg:border-y-0 lg:border-l lg:py-0 lg:pl-6">
            {[
              ['10', '数字分区'],
              ['31', '题库行政区'],
              ['34', '省级轮廓'],
              ['AEA', '等面积投影'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-slate-200 px-3 last:border-r-0 dark:border-[#303136]">
                <dt className="font-mono text-lg font-black text-orange-600">{value}</dt>
                <dd className="mt-0.5 text-[10px] text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className={`overflow-hidden rounded-2xl border ${panelClass}`}>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-3 dark:border-[#303136] lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
              {examCallsignDistricts.map((district) => {
                const active = district.zone === selectedZone;
                return (
                  <button
                    key={district.zone}
                    type="button"
                    onClick={() => selectZone(district.zone)}
                    aria-pressed={active}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? 'text-white shadow-sm'
                        : isDark
                          ? 'border-[#303136] bg-[#17181c] text-slate-400 hover:border-slate-600 hover:text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400'
                    }`}
                    style={active ? { backgroundColor: ZONE_COLORS[district.zone], borderColor: ZONE_COLORS[district.zone] } : undefined}
                  >
                    {district.zone} 区
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] text-slate-500">{Math.round(mapZoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setMapZoom((value) => Math.max(1, value - 0.25))}
                aria-label="缩小地图"
                className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:text-orange-600 dark:border-[#3a3b40]"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom(1)}
                aria-label="重置地图缩放"
                className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:text-orange-600 dark:border-[#3a3b40]"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMapZoom((value) => Math.min(2.25, value + 0.25))}
                aria-label="放大地图"
                className="rounded-md border border-slate-300 p-1.5 text-slate-500 hover:text-orange-600 dark:border-[#3a3b40]"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className={`relative overflow-x-auto ${isDark ? 'bg-[#061018]' : 'bg-[#e8f0f4]'}`}>
            <svg
              viewBox={CHINA_MAP_FRAME.viewBox}
              className="h-auto w-full min-w-[760px]"
              style={{ width: `${mapZoom * 100}%` }}
              role="img"
              aria-label="采用真实省级边界和 Albers 等面积投影的中国业余无线电呼号分区地图"
            >
              <defs>
                <pattern id="geo-console-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M24 0H0V24" fill="none" stroke={isDark ? '#8aa1b4' : '#71869a'} strokeOpacity="0.06" strokeWidth="1" />
                </pattern>
                <filter id="active-region-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#020617" floodOpacity="0.52" />
                </filter>
                <clipPath id="national-map-clip"><rect width="1200" height="760" /></clipPath>
                <clipPath id="south-sea-clip"><rect width={CHINA_MAP_FRAME.inset.width} height={CHINA_MAP_FRAME.inset.height} rx="8" /></clipPath>
              </defs>

              <rect width="1200" height="760" fill={isDark ? '#061018' : '#e8f0f4'} />
              <rect width="1200" height="760" fill="url(#geo-console-grid)" />
              <path d="M18 46V18H46M1154 18h28v28M18 714v28h28M1182 714v28h-28" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.8" />
              <text x="34" y="40" fontSize="9" fontFamily="monospace" letterSpacing="2.2" fill={isDark ? '#8194a6' : '#536b7d'}>
                NATIONAL PROVINCE GEOMETRY · ALBERS EQUAL-AREA · R2 CALLSIGN DISTRICT OVERLAY
              </text>
              <text x="1164" y="40" textAnchor="end" fontSize="9" fontFamily="monospace" fill="#f97316">
                VECTOR / LOCAL / OFFLINE
              </text>

              <g clipPath="url(#national-map-clip)">
                <g fill="none" stroke={isDark ? '#8ba2b6' : '#6f8799'} strokeWidth="0.8" strokeDasharray="3 6" opacity="0.22" pointerEvents="none">
                  {CHINA_MAP_GRATICULES.map((line) => <path key={line.label} d={line.d} vectorEffect="non-scaling-stroke" />)}
                </g>

                {CHINA_MAP_REGIONS.map((region) => {
                  const province = CHINA_PROVINCE_METADATA.find((item) => item.name === region.name);
                  const zone = zoneForProvince(region.name);
                  const isSpecial = zone === undefined;
                  const zoneSelected = zone === selectedZone;
                  const provinceSelected = region.name === selectedProvince?.name;
                  const hovered = region.name === hoveredProvince?.name;
                  const color = isSpecial ? '#607887' : ZONE_COLORS[zone];
                  const fillOpacity = provinceSelected || hovered ? 0.96 : zoneSelected ? 0.82 : isSpecial ? 0.38 : 0.48;
                  const offset = MAP_LABEL_OFFSETS[region.name] || [0, 0];
                  const labelX = region.label[0] + offset[0];
                  const labelY = region.label[1] + offset[1];
                  const label = province?.shortName || region.name.slice(0, 1);
                  const prefix = isSpecial ? province?.prefix.split(' / ')[0] || 'SPECIAL' : `Z${zone}`;

                  return (
                    <g
                      key={region.adcode}
                      role="button"
                      tabIndex={0}
                      aria-label={isSpecial ? `${region.name}，特别字冠区域` : `${region.name}，第 ${zone} 区`}
                      className="cursor-pointer outline-none"
                      onClick={() => selectMapRegion(region.name)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') selectMapRegion(region.name);
                      }}
                      onMouseEnter={() => setHoveredProvince(province || null)}
                      onMouseLeave={() => setHoveredProvince(null)}
                    >
                      {region.paths.map((path, index) => (
                        <path
                          key={index}
                          d={path}
                          fill={color}
                          fillOpacity={fillOpacity}
                          fillRule="evenodd"
                          stroke={provinceSelected ? '#fb923c' : zoneSelected ? '#e8f4fa' : isDark ? '#688092' : '#63798a'}
                          strokeWidth={provinceSelected ? 2.8 : zoneSelected ? 1.45 : 0.8}
                          strokeDasharray={isSpecial ? '3 2' : undefined}
                          filter={provinceSelected ? 'url(#active-region-shadow)' : undefined}
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {(offset[0] !== 0 || offset[1] !== 0) && (
                        <line
                          x1={region.label[0]}
                          y1={region.label[1]}
                          x2={labelX}
                          y2={labelY - 4}
                          stroke={isDark ? '#9fb3c3' : '#506879'}
                          strokeWidth="0.7"
                          vectorEffect="non-scaling-stroke"
                          pointerEvents="none"
                        />
                      )}
                      <g pointerEvents="none">
                        {(provinceSelected || hovered) && <circle cx={labelX} cy={labelY} r="14" fill="#061018" fillOpacity="0.72" stroke="#fb923c" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
                        <text x={labelX} y={labelY - 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="800" fill={provinceSelected || hovered || zoneSelected ? '#ffffff' : isDark ? '#d3dee7' : '#243b4b'}>
                          {label}
                        </text>
                        <text x={labelX} y={labelY + 10} textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill={provinceSelected || hovered || zoneSelected ? '#ffffff' : isDark ? '#9fb0bd' : '#4f6574'}>
                          {prefix}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              <g transform={`translate(${CHINA_MAP_FRAME.inset.x} ${CHINA_MAP_FRAME.inset.y})`}>
                <rect width={CHINA_MAP_FRAME.inset.width} height={CHINA_MAP_FRAME.inset.height} rx="8" fill={isDark ? '#07151f' : '#dce9ef'} stroke={isDark ? '#526b7c' : '#718797'} strokeWidth="1" />
                <g clipPath="url(#south-sea-clip)">
                  <path d={`M0 30H${CHINA_MAP_FRAME.inset.width}M0 90H${CHINA_MAP_FRAME.inset.width}M0 150H${CHINA_MAP_FRAME.inset.width}M0 210H${CHINA_MAP_FRAME.inset.width}`} stroke={isDark ? '#7d93a3' : '#6f8797'} strokeOpacity="0.12" strokeDasharray="3 4" />
                  {CHINA_MAP_REGIONS.flatMap((region) => region.insetPaths).map((path, index) => (
                    <path key={`island-${index}`} d={path} fill={ZONE_COLORS[7]} fillOpacity="0.76" stroke="#dff6ff" strokeWidth="0.65" fillRule="evenodd" />
                  ))}
                  {SOUTH_CHINA_SEA_PATHS.map((path, index) => (
                    <path key={`boundary-${index}`} d={path} fill="#38bdf8" fillOpacity="0.6" stroke="#7dd3fc" strokeWidth="0.45" />
                  ))}
                  {[
                    ['东沙', 96, 61],
                    ['西沙', 59, 104],
                    ['中沙', 88, 120],
                    ['南沙', 73, 172],
                    ['曾母暗沙', 59, 235],
                  ].map(([name, x, y]) => (
                    <g key={String(name)} transform={`translate(${x} ${y})`}>
                      <circle r="2.2" fill="#fb923c" stroke="#fff7ed" strokeWidth="0.7" />
                      <text x="5" y="2.5" fontSize="6.5" fontWeight="700" fill={isDark ? '#d9e8f1' : '#334b5b'}>{name}</text>
                    </g>
                  ))}
                </g>
                <text x="10" y="18" fontSize="9" fontWeight="800" fill={isDark ? '#dbe8f0' : '#263f50'}>南海诸岛附图</text>
                <text x={CHINA_MAP_FRAME.inset.width - 10} y="18" textAnchor="end" fontSize="6.5" fontFamily="monospace" fill={isDark ? '#7f96a7' : '#607989'}>3°N—25°N</text>
                <text x="10" y={CHINA_MAP_FRAME.inset.height - 9} fontSize="6.5" fontFamily="monospace" fill={isDark ? '#7f96a7' : '#607989'}>SOUTH CHINA SEA / INSET</text>
              </g>

              <g transform="translate(38 704)" fontFamily="monospace">
                <path d="M0 0H120M0 -4V4M60 -4V4M120 -4V4" stroke={isDark ? '#c2d1dc' : '#3f5666'} strokeWidth="1" />
                <text x="0" y="15" fontSize="7" fill={isDark ? '#8195a4' : '#5f7483'}>0</text>
                <text x="60" y="15" textAnchor="middle" fontSize="7" fill={isDark ? '#8195a4' : '#5f7483'}>500</text>
                <text x="120" y="15" textAnchor="end" fontSize="7" fill={isDark ? '#8195a4' : '#5f7483'}>1000 km · reference</text>
              </g>
              <text x="38" y="746" fontSize="7.5" fontFamily="monospace" letterSpacing="1.3" fill={isDark ? '#657b8b' : '#657988'}>
                STUDY INTERFACE · PROVINCIAL GEOMETRY IS NOT A SURVEYING OR ADMINISTRATIVE BOUNDARY DOCUMENT
              </text>
            </svg>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 dark:border-[#303136] sm:flex-row sm:items-center sm:justify-between">
            <span>真实省级轮廓 · 点击区域定位 · 橙色描边表示当前省份 · 白色边界表示当前呼号区。</span>
            <span className="font-mono">手机端横向拖动 / 100%—225% 等比缩放</span>
          </div>
        </section>

        <aside className="grid gap-4 lg:grid-cols-3 2xl:block 2xl:space-y-4">
          <section className={`rounded-2xl border p-4 ${panelClass}`}>
            <label htmlFor="callsign-zone-search" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Province / callsign locator
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="callsign-zone-search"
                value={query}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="省名、简称、BG5ABC 或 5区"
                className={`w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-orange-500 ${
                  isDark ? 'border-[#303136] bg-[#17181c] text-white' : 'border-slate-300 bg-slate-50 text-slate-900'
                }`}
              />
            </div>

            {searchResult?.kind === 'special' && (
              <div className="mt-3 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{searchResult.label}。该字冠不通过大陆 1～0 区数字表推断，本图不作错误归区。</span>
              </div>
            )}
            {searchResult?.kind === 'none' && (
              <p className="mt-3 text-xs text-rose-600">未找到匹配的题库省份、数字分区或常见呼号格式。</p>
            )}
            {(searchResult?.kind === 'province' || searchResult?.kind === 'zone') && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Crosshair className="h-3.5 w-3.5" />
                已定位到第 {selectedZone} 区{selectedProvince ? ` · ${selectedProvince.name}` : ''}
              </p>
            )}
          </section>

          <section className={`rounded-2xl border p-4 ${panelClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">active district</p>
                <h3 className={`mt-1 text-lg font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
                  第 {selectedZone} 区
                </h3>
                <p className="mt-1 text-xs text-slate-500">助记：{activeDistrict.mnemonic}</p>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl font-mono text-xl font-black text-white"
                style={{ backgroundColor: ZONE_COLORS[selectedZone] }}
              >
                {selectedZone}
              </div>
            </div>

            {focusProvince && (
              <div className={`mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border ${isDark ? 'border-[#303136] bg-[#303136]' : 'border-slate-200 bg-slate-200'}`}>
                {[
                  ['聚焦区域', `${focusProvince.name} · ${focusProvince.shortName}`],
                  ['省会 / 首府', focusProvince.capital],
                  ['呼号字冠', focusProvince.prefix],
                  ['题库映射', zoneForProvince(focusProvince.name) === undefined ? '特别字冠 · 不套用数字区' : `第 ${zoneForProvince(focusProvince.name)} 区`],
                ].map(([label, value]) => (
                  <div key={label} className={`min-h-[58px] p-2.5 ${isDark ? 'bg-[#15161a]' : 'bg-slate-50'}`}>
                    <div className="font-mono text-[8px] uppercase tracking-wider text-slate-500">{label}</div>
                    <div className={`mt-1 text-[11px] font-semibold leading-4 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            <div className={`mt-4 rounded-xl border p-3 ${isDark ? 'border-[#303136] bg-[#17181c]' : 'border-slate-200 bg-slate-50'}`}>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-orange-600">
                <Radio className="h-3.5 w-3.5" /> 呼号结构
              </div>
              <div className="grid grid-cols-[auto_auto_auto_1fr] gap-px overflow-hidden rounded-lg border border-slate-200 text-center font-mono dark:border-[#34353a]">
                {[
                  ['B', '国家前缀'],
                  ['G', '电台种类'],
                  [String(selectedZone), '分区数字'],
                  ['ABC', '呼号后缀'],
                ].map(([value, label]) => (
                  <div key={label} className={isDark ? 'bg-[#0f1013]' : 'bg-white'}>
                    <div className="px-2 py-2 text-sm font-black text-orange-600">{value}</div>
                    <div className="border-t border-slate-200 px-1 py-1 text-[8px] text-slate-500 dark:border-[#34353a]">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-5 text-slate-500">
                示例 BG{selectedZone}ABC：B + 电台种类字母 + 分区数字 + 后缀。
              </p>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span>省份 / 首府</span>
                <span>{activeDistrict.provinces.length} 项</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-[#303136]">
                {activeDistrict.provinces.map((name) => {
                  const province = examProvinces.find((item) => item.name === name);
                  const active = province?.id === selectedProvince?.id;
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => province && selectProvince(province)}
                      className={`flex w-full items-center justify-between py-2 text-left text-xs transition ${
                        active ? 'font-bold text-orange-600' : 'text-slate-600 hover:text-orange-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" /> {name}
                      </span>
                      <span className="text-slate-500">{province?.capital}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 border-l-2 border-orange-500 pl-3 text-[10px] leading-5 text-slate-500">
              <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>省界按经纬度数据投影生成，缩放保持几何比例；地图仅供学习定位，不提供测绘精度。</span>
            </div>
          </section>

          <section className={`rounded-2xl border p-4 ${panelClass}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> 考试边界与特别字冠
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              数字分区表覆盖 31 个大陆省级行政区。VR2、XX9 与 BV/BX/BM/BN 等特别字冠另行识别，
              不并入本题库 1～0 数字分区表。
            </p>
            <a
              href="https://bzdt.tianditu.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-orange-600 hover:text-orange-500"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> 自然资源部标准地图服务
            </a>
            <p className="mt-2 text-[10px] leading-4 text-slate-500">公开行政边界表达以国家标准地图及其审图要求为准。</p>
          </section>
        </aside>
      </div>

      <section className={`overflow-hidden rounded-2xl border ${panelClass}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-[#303136]">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldCheck className="h-4 w-4 text-orange-600" /> 1～0 区完整速查矩阵
          </div>
          <button
            type="button"
            onClick={() => selectZone(1)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-orange-600"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 重置到 1 区
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5">
          {examCallsignDistricts.map((district) => (
            <button
              type="button"
              key={district.zone}
              onClick={() => selectZone(district.zone)}
              className={`border-b border-r border-slate-200 p-3 text-left transition dark:border-[#303136] ${
                selectedZone === district.zone
                  ? 'bg-orange-500/10'
                  : isDark
                    ? 'hover:bg-[#17181c]'
                    : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-black text-white"
                  style={{ backgroundColor: ZONE_COLORS[district.zone] }}
                >
                  {district.zone}
                </span>
                <span className="text-xs font-bold">{district.mnemonic}</span>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-slate-500">
                {district.provinces
                  .map((name) => examProvinces.find((province) => province.name === name)?.shortName || name)
                  .join(' · ')}
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
