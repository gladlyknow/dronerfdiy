import React, { useMemo, useState } from 'react';
import { MapPin, Radio, RotateCcw, ShieldCheck } from 'lucide-react';
import { CHINA_PROVINCES_GEO, ChinaProvinceGeo } from '../data/chinaMapPaths';
import { useTheme } from '../utils/theme';

const EXAM_ZONES: Array<{ zone: number; name: string; provinces: string[] }> = [
  { zone: 1, name: '1 区', provinces: ['北京市'] },
  { zone: 2, name: '2 区', provinces: ['黑龙江省', '吉林省', '辽宁省'] },
  { zone: 3, name: '3 区', provinces: ['天津市', '内蒙古自治区', '河北省', '山西省'] },
  { zone: 4, name: '4 区', provinces: ['上海市', '山东省', '江苏省'] },
  { zone: 5, name: '5 区', provinces: ['浙江省', '江西省', '福建省'] },
  { zone: 6, name: '6 区', provinces: ['安徽省', '河南省', '湖北省'] },
  { zone: 7, name: '7 区', provinces: ['湖南省', '广东省', '广西壮族自治区', '海南省'] },
  { zone: 8, name: '8 区', provinces: ['四川省', '重庆市', '贵州省', '云南省'] },
  { zone: 9, name: '9 区', provinces: ['陕西省', '甘肃省', '宁夏回族自治区', '青海省'] },
  { zone: 0, name: '0 区', provinces: ['新疆维吾尔自治区', '西藏自治区'] },
];

const ZONE_COLORS: Record<number, string> = {
  1: '#e11d48',
  2: '#059669',
  3: '#0284c7',
  4: '#4f46e5',
  5: '#7c3aed',
  6: '#d97706',
  7: '#ea580c',
  8: '#0d9488',
  9: '#65a30d',
  0: '#c026d3',
};

const provinceMatchesExamTable = (province: ChinaProvinceGeo) => {
  const row = EXAM_ZONES.find((item) => item.zone === province.zone);
  return !!row?.provinces.includes(province.name);
};

export const ExamDistrictMap: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedZone, setSelectedZone] = useState(1);
  const [hoveredProvince, setHoveredProvince] = useState<ChinaProvinceGeo | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<ChinaProvinceGeo | null>(
    CHINA_PROVINCES_GEO.find((item) => item.id === 'BJ') || null,
  );

  const selectedRow = EXAM_ZONES.find((item) => item.zone === selectedZone) || EXAM_ZONES[0];
  const examProvinces = useMemo(
    () => CHINA_PROVINCES_GEO.filter(provinceMatchesExamTable),
    [],
  );

  const selectZone = (zone: number) => {
    setSelectedZone(zone);
    const first = examProvinces.find((item) => item.zone === zone) || null;
    setSelectedProvince(first);
  };

  const selectProvince = (province: ChinaProvinceGeo) => {
    setSelectedZone(province.zone);
    setSelectedProvince(province);
  };

  const focusProvince = hoveredProvince || selectedProvince;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-6 space-y-4">
      <section
        className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${
          isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
              <MapPin className="w-4 h-4" />
              A 类题库 · 呼号分区
            </div>
            <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              中国业余无线电呼号 1～0 区考试分区示意图
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
              地图按 A 类题库中的 1～0 区对 31 个大陆省级行政区着色，用于考试记忆与快速定位。
              本图为学习示意图，不作为测绘或行政边界依据；香港、澳门、台湾的呼号制度不属于本题库这张 1～0 区分区表考点。
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              31 个题库省级行政区
            </span>
            <button
              type="button"
              onClick={() => selectZone(1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#2D2D33] hover:border-orange-400 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <section
          className={`xl:col-span-8 rounded-2xl border overflow-hidden shadow-sm ${
            isDark ? 'bg-[#090A0F] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="p-3 border-b border-slate-200 dark:border-[#2D2D33] flex flex-wrap gap-1.5">
            {EXAM_ZONES.map((item) => (
              <button
                key={item.zone}
                type="button"
                onClick={() => selectZone(item.zone)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                  selectedZone === item.zone
                    ? 'text-white shadow-sm'
                    : isDark
                      ? 'bg-[#18181D] text-slate-300 border-[#2D2D33] hover:border-slate-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
                style={selectedZone === item.zone ? { backgroundColor: ZONE_COLORS[item.zone], borderColor: ZONE_COLORS[item.zone] } : undefined}
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="relative overflow-auto min-h-[430px] sm:min-h-[560px]">
            <svg viewBox="0 0 1000 830" className="w-full min-w-[700px] h-auto" role="img" aria-label="中国业余无线电 A 类题库呼号分区示意图">
              <rect width="1000" height="830" fill={isDark ? '#0b1220' : '#eff6ff'} />

              {examProvinces.map((province) => {
                const selected = selectedZone === province.zone;
                const exact = selectedProvince?.id === province.id;
                const hovered = hoveredProvince?.id === province.id;
                const base = ZONE_COLORS[province.zone];
                const fill = selected || hovered || exact ? base : `${base}${isDark ? '55' : '35'}`;

                return (
                  <g
                    key={province.id}
                    onMouseEnter={() => setHoveredProvince(province)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => selectProvince(province)}
                    className="cursor-pointer"
                  >
                    <path
                      d={province.path}
                      fill={fill}
                      stroke={exact ? '#ffffff' : selected ? base : isDark ? '#475569' : '#94a3b8'}
                      strokeWidth={exact ? 3 : selected ? 1.8 : 1}
                    />
                    {province.subPaths?.map((path, index) => (
                      <path
                        key={index}
                        d={path}
                        fill={fill}
                        stroke={selected ? base : isDark ? '#475569' : '#94a3b8'}
                        strokeWidth="1"
                      />
                    ))}
                    <text
                      x={province.labelX}
                      y={province.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight={selected ? '800' : '600'}
                      fill={selected || hovered || exact ? '#ffffff' : isDark ? '#e2e8f0' : '#334155'}
                      pointerEvents="none"
                    >
                      {province.shortName}
                    </text>
                    <text
                      x={province.labelX}
                      y={province.labelY + 13}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="800"
                      fill={selected ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                      pointerEvents="none"
                    >
                      {province.zone}区
                    </text>
                  </g>
                );
              })}

              {/* 地理提示：不参与本题库 1～0 区着色 */}
              <g opacity="0.8" pointerEvents="none">
                <path
                  d="M 852 615 C 865 630 870 650 864 675 C 858 700 846 716 838 704 C 832 690 836 666 842 642 C 846 628 848 620 852 615 Z"
                  fill={isDark ? '#334155' : '#cbd5e1'}
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  strokeWidth="1.2"
                />
                <text x="872" y="666" fontSize="9" fill={isDark ? '#94a3b8' : '#64748b'}>台湾*</text>
                <circle cx="730" cy="722" r="4" fill={isDark ? '#475569' : '#cbd5e1'} />
                <text x="738" y="726" fontSize="8" fill={isDark ? '#94a3b8' : '#64748b'}>香港*</text>
                <circle cx="709" cy="729" r="4" fill={isDark ? '#475569' : '#cbd5e1'} />
                <text x="676" y="745" fontSize="8" fill={isDark ? '#94a3b8' : '#64748b'}>澳门*</text>
              </g>

              <text x="955" y="805" textAnchor="end" fontSize="9" fill={isDark ? '#64748b' : '#94a3b8'}>
                * 地理提示；非本题库 1～0 分区表考点
              </text>
            </svg>
          </div>
        </section>

        <aside className="xl:col-span-4 space-y-4">
          <section
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${
              isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-xl text-white flex items-center justify-center text-xl font-black shadow-sm"
                style={{ backgroundColor: ZONE_COLORS[selectedZone] }}
              >
                {selectedZone}
              </div>
              <div>
                <div className="font-black">第 {selectedZone} 区</div>
                <div className="text-xs text-slate-500">{selectedRow.provinces.length} 个题库省级行政区</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedRow.provinces.map((name) => {
                const province = examProvinces.find((item) => item.name === name);
                const active = selectedProvince?.name === name;
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => province && selectProvince(province)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                      active
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : isDark
                          ? 'bg-[#18181D] border-[#2D2D33] text-slate-300 hover:border-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {focusProvince && (
              <div className={`mt-4 rounded-xl border p-3 text-xs ${isDark ? 'bg-[#18181D] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 font-black text-orange-600 mb-2">
                  <Radio className="w-3.5 h-3.5" />
                  {focusProvince.name} · {focusProvince.zone} 区
                </div>
                <div className="space-y-1 text-slate-500 dark:text-slate-400">
                  <div>省会/首府：{focusProvince.capital}</div>
                  <div>题库记忆：呼号第三部分中的分区数字对应第 {focusProvince.zone} 区。</div>
                </div>
              </div>
            )}
          </section>

          <section
            className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${
              isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-sm mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              1～0 区完整对照
            </div>
            <div className="space-y-2">
              {EXAM_ZONES.map((item) => (
                <button
                  type="button"
                  key={item.zone}
                  onClick={() => selectZone(item.zone)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-all cursor-pointer ${
                    selectedZone === item.zone
                      ? 'border-orange-500 bg-orange-500/10'
                      : isDark
                        ? 'border-[#2D2D33] bg-[#18181D] hover:border-slate-600'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-2 items-start">
                    <span
                      className="w-6 h-6 shrink-0 rounded-md text-white flex items-center justify-center text-xs font-black"
                      style={{ backgroundColor: ZONE_COLORS[item.zone] }}
                    >
                      {item.zone}
                    </span>
                    <span className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.provinces.join('、')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};
