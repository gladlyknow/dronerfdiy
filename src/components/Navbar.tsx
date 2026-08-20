import React from 'react';
import { 
  Radio as RadioIcon, 
  Send, 
  Search, 
  Sun, 
  Moon, 
  Cloud,
  Layers,
  Award
} from 'lucide-react';
import { useTheme } from '../utils/theme';
import { BrandLogo } from './BrandLogo';

export type TopDomain = 'radio' | 'drone';

interface NavbarProps {
  activeDomain: TopDomain;
  onDomainChange: (domain: TopDomain) => void;
  onOpenSearch: () => void;
  onOpenDeployment: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeDomain,
  onDomainChange,
  onOpenSearch,
  onOpenDeployment,
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-colors ${
      isDark 
        ? 'border-[#2D2D33] bg-[#111114]/95 backdrop-blur-md text-[#E0E0E0]' 
        : 'border-slate-200 bg-white/95 backdrop-blur-md text-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand Wordmark & Vector Logo */}
        <div 
          onClick={() => onDomainChange('radio')}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer select-none"
        >
          <BrandLogo size={36} showText={false} />
          <div>
            <div className={`font-black text-sm sm:text-base tracking-tight leading-tight flex items-center gap-1.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>DRONE & RADIO</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider hidden sm:block">
              业余无线电 (CRAC考试/工具) · 穿越机 (硬件/调参/DIY)
            </div>
          </div>
        </div>

        {/* Zone 2: 2 Core Domains Switcher Tabs */}
        <nav className="flex items-center gap-1 p-1 rounded-2xl border border-slate-200/80 dark:border-[#2D2D33] bg-slate-100/60 dark:bg-[#18181D]">
          <button
            onClick={() => onDomainChange('radio')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
              activeDomain === 'radio'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#222228]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <RadioIcon className="w-4 h-4" />
            <span>📻 Radio 业余无线电</span>
          </button>

          <button
            onClick={() => onDomainChange('drone')}
            className={`flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
              activeDomain === 'drone'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#222228]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>🛸 Drone 无人机 / 穿越机</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
              isDark
                ? 'bg-[#1C1C21] border-[#2D2D33] text-[#8E9299] hover:border-[#F27D26] hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-orange-400 hover:text-slate-900 shadow-sm'
            }`}
            title="全局搜索 (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden md:inline text-xs">搜索</span>
            <kbd className={`hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded border ${
              isDark ? 'bg-[#0A0A0B] text-[#8E9299] border-[#2D2D33]' : 'bg-white text-slate-500 border-slate-300'
            }`}>
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              isDark 
                ? 'bg-[#1C1C21] border-[#2D2D33] text-amber-400 hover:border-amber-400/60' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
            }`}
            title={isDark ? '切换至明亮模式' : '切换至暗黑极客模式'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* GitHub / Deploy modal */}
          <button
            onClick={onOpenDeployment}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#1C1C21] border-[#2D2D33] text-[#E0E0E0] hover:text-[#F27D26] hover:border-[#F27D26]/50'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-orange-700 hover:border-orange-300 shadow-sm'
            }`}
            title="部署与开源代码"
          >
            <Cloud className="w-3.5 h-3.5 text-orange-600" />
            <span>部署与源码</span>
          </button>
        </div>
      </div>
    </header>
  );
};
