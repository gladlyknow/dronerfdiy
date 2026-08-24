import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Crosshair,
  MapPin,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { examCallsignDistricts } from '../data/aKnowledgeData';
import { CHINA_PROVINCES_GEO, type ChinaProvinceGeo } from '../data/chinaMapPaths';
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
  { prefixes: ['VR2'], label: '香港业余电台特别字冠' },
  { prefixes: ['XX9'], label: '澳门业余电台特别字冠' },
  { prefixes: ['BV', 'BX', 'BM', 'BN'], label: '台湾地区业余电台特别字冠' },
];

type SearchResult =
  | { kind: 'province'; province: ChinaProvinceGeo }
  | { kind: 'zone'; zone: number }
  | { kind: 'special'; label: string }
  | { kind: 'none' }
  | null;

const normalize = (value: string) => value.trim().toUpperCase();

export const ExamDistrictMap: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedZone, setSelectedZone] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState<ChinaProvinceGeo | null>(
    CHINA_PROVINCES_GEO.find((province) => province.id === 'BJ') || null,
  );
  const [hoveredProvince, setHoveredProvince] = useState<ChinaProvinceGeo | null>(null);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult>(null);

  const examProvinces = useMemo(
    () =>
      CHINA_PROVINCES_GEO.filter((province) =>
        examCallsignDistricts.some(
          (district) => district.zone === province.zone && district.provinces.includes(province.name),
        ),
      ),
    [],
  );

  const activeDistrict =
    examCallsignDistricts.find((district) => district.zone === selectedZone) ||
    examCallsignDistricts[0];
  const focusProvince = hoveredProvince || selectedProvince;

  const selectZone = (zone: number, clearSearch = true) => {
    setSelectedZone(zone);
    setSelectedProvince(examProvinces.find((province) => province.zone === zone) || null);
    if (clearSearch) {
      setQuery('');
      setSearchResult(null);
    }
  };

  const selectProvince = (province: ChinaProvinceGeo, clearSearch = true) => {
    setSelectedZone(province.zone);
    setSelectedProvince(province);
    if (clearSearch) {
      setQuery('');
      setSearchResult(null);
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
      <header className={`rounded-2xl border ${panelClass}`}>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
              <Crosshair className="h-4 w-4" />
              Callsign grid · R2 exam reference
            </div>
            <h2 className={`mt-2 text-xl font-black sm:text-2xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
              中国业余无线电 1～0 区分区图
            </h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-500">
              依据项目内 R2 题库呼号分区表整理，用于分区记忆、呼号数字识别和省份定位。
              本图是学习示意，不作为测绘底图、行政边界文件或电台许可依据。
            </p>
          </div>

          <dl className="grid grid-cols-3 border-y border-slate-200 py-3 dark:border-[#303136] lg:min-w-[360px] lg:border-y-0 lg:border-l lg:py-0 lg:pl-6">
            {[
              ['10', '数字分区'],
              ['31', '题库行政区'],
              ['R2', '权威题库映射'],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-slate-200 px-3 last:border-r-0 dark:border-[#303136]">
                <dt className="font-mono text-lg font-black text-orange-600">{value}</dt>
                <dd className="mt-0.5 text-[10px] text-slate-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
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
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> selected zone
              <span className="h-2 w-2 rounded-full bg-slate-400/50" /> other zones
            </div>
          </div>

          <div className={`relative overflow-x-auto ${isDark ? 'bg-[#091018]' : 'bg-[#eef3f6]'}`}>
            <svg
              viewBox="0 0 1000 830"
              className="h-auto w-full min-w-[650px]"
              role="img"
              aria-label="中国业余无线电 1 至 0 区考试分区学习示意图"
            >
              <defs>
                <pattern id="callsign-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    strokeOpacity="0.16"
                    strokeWidth="1"
                  />
                </pattern>
                <filter id="selected-zone-shadow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#020617" floodOpacity="0.35" />
                </filter>
              </defs>

              <rect width="1000" height="830" fill={isDark ? '#091018' : '#eef3f6'} />
              <rect width="1000" height="830" fill="url(#callsign-grid)" />
              <text x="32" y="38" fontSize="10" fontFamily="monospace" letterSpacing="2" fill={isDark ? '#64748b' : '#64748b'}>
                CRAC R2 · PROVINCE / CALLSIGN DISTRICT REFERENCE
              </text>

              {examProvinces.map((province) => {
                const zoneSelected = province.zone === selectedZone;
                const provinceSelected = province.id === selectedProvince?.id;
                const hovered = province.id === hoveredProvince?.id;
                const color = ZONE_COLORS[province.zone];
                const fill = zoneSelected || hovered ? color : `${color}${isDark ? '62' : '4a'}`;
                const labelColor = zoneSelected || hovered ? '#ffffff' : isDark ? '#cbd5e1' : '#334155';

                return (
                  <g
                    key={province.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${province.name}，第 ${province.zone} 区`}
                    className="cursor-pointer outline-none"
                    onClick={() => selectProvince(province)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') selectProvince(province);
                    }}
                    onMouseEnter={() => setHoveredProvince(province)}
                    onMouseLeave={() => setHoveredProvince(null)}
                  >
                    <path
                      d={province.path}
                      fill={fill}
                      stroke={provinceSelected ? '#f97316' : zoneSelected ? '#f8fafc' : isDark ? '#526170' : '#8495a5'}
                      strokeWidth={provinceSelected ? 3.5 : zoneSelected ? 1.8 : 1}
                      filter={zoneSelected ? 'url(#selected-zone-shadow)' : undefined}
                    />
                    {province.subPaths?.map((path, index) => (
                      <path
                        key={index}
                        d={path}
                        fill={fill}
                        stroke={provinceSelected ? '#f97316' : isDark ? '#526170' : '#8495a5'}
                        strokeWidth={provinceSelected ? 2 : 1}
                      />
                    ))}
                    <text
                      x={province.labelX}
                      y={province.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill={labelColor}
                      pointerEvents="none"
                    >
                      {province.shortName}
                    </text>
                    <text
                      x={province.labelX}
                      y={province.labelY + 14}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="monospace"
                      fill={labelColor}
                      opacity="0.82"
                      pointerEvents="none"
                    >
                      Z{province.zone}
                    </text>
                  </g>
                );
              })}

              <text x="32" y="800" fontSize="9" fontFamily="monospace" fill={isDark ? '#64748b' : '#64748b'}>
                TRAINING DIAGRAM · NOT FOR SURVEYING OR ADMINISTRATIVE BOUNDARY USE
              </text>
            </svg>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-[11px] text-slate-500 dark:border-[#303136] sm:flex-row sm:items-center sm:justify-between">
            <span>点击省份或分区切换；橙色描边表示当前省份。</span>
            <span className="font-mono">手机端可横向拖动地图查看细节</span>
          </div>
        </section>

        <aside className="space-y-4">
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

            {focusProvince && (
              <div className="mt-3 border-l-2 border-orange-500 pl-3 text-[11px] leading-5 text-slate-500">
                当前聚焦：{focusProvince.name} · {focusProvince.shortName} · 省会/首府 {focusProvince.capital}
              </div>
            )}
          </section>

          <section className={`rounded-2xl border p-4 ${panelClass}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> 考试边界与特别字冠
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              数字分区表覆盖 31 个大陆省级行政区。VR2、XX9 与 BV/BX/BM/BN 等特别字冠另行识别，
              不并入本题库 1～0 数字分区表。
            </p>
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
