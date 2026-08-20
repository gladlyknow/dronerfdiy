import React, { useState } from 'react';
import { DRONE_SUBSYSTEMS } from '../../data/droneAndDiyData';
import { Layers, Zap, Cpu, Radio, Video, Box, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../utils/theme';

export const DroneSubsystems: React.FC = () => {
  const { isDark } = useTheme();
  const [activeSystemId, setActiveSystemId] = useState<string>(DRONE_SUBSYSTEMS[0].id);

  const activeSystem = DRONE_SUBSYSTEMS.find((s) => s.id === activeSystemId) || DRONE_SUBSYSTEMS[0];

  const getIcon = (id: string) => {
    switch (id) {
      case 'power_system': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'flight_controller': return <Cpu className="w-4 h-4 text-sky-500" />;
      case 'rf_link': return <Radio className="w-4 h-4 text-emerald-500" />;
      case 'vtx_system': return <Video className="w-4 h-4 text-rose-500" />;
      case 'frame_structure': return <Box className="w-4 h-4 text-purple-500" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* 5 Subsystems Selector Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {DRONE_SUBSYSTEMS.map((sys) => {
          const isSelected = activeSystemId === sys.id;
          return (
            <button
              key={sys.id}
              onClick={() => setActiveSystemId(sys.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                isSelected
                  ? 'bg-orange-600 text-white font-bold border-orange-600 shadow-md shadow-orange-600/20'
                  : isDark
                  ? 'bg-[#141418] border-[#2D2D33] text-slate-300 hover:border-slate-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {getIcon(sys.id)}
              </div>
              <div className="truncate text-xs">
                {sys.title.split(' ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Subsystem Detail Card */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm space-y-6 ${
        isDark ? 'bg-[#141418] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="border-b pb-4 border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{activeSystem.icon}</span>
              <span>{activeSystem.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {activeSystem.summary}
            </p>
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeSystem.components.map((comp, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#18181D] border-[#28282F]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400 mb-2">
                  {comp.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {comp.description}
                </p>

                {/* Specs List */}
                <div className="space-y-1 mb-3">
                  {comp.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-start gap-1">
                      <span className="text-orange-500">•</span>
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware tip */}
              <div className={`p-2.5 rounded-xl border text-[11px] leading-relaxed mt-2 ${
                isDark ? 'bg-[#111114] border-[#222227] text-amber-300/90' : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <strong>⚡ 调测避坑：</strong> {comp.tips}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
