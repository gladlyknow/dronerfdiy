import React from 'react';
import { Search, Sun, Moon, Radio as RadioIcon } from 'lucide-react';
import { useTheme } from '../utils/theme';
import { BrandLogo } from './BrandLogo';
import { AccountButton } from './auth/AccountButton';

interface RadioNavbarProps {
  onOpenSearch: () => void;
}

export const RadioNavbar: React.FC<RadioNavbarProps> = ({ onOpenSearch }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-colors ${
        isDark
          ? 'border-[#2D2D33] bg-[#111114]/95 backdrop-blur-md text-[#E0E0E0]'
          : 'border-slate-200 bg-white/95 backdrop-blur-md text-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <a href="/radio/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 select-none">
          <BrandLogo size={36} showText={false} />
          <div>
            <div
              className={`font-black text-sm sm:text-base tracking-tight leading-tight flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              <RadioIcon className="w-4 h-4 text-orange-600" />
              <span>DRONERF DIY · RADIO</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider hidden sm:block">
              业余无线电 · 学习练习 · RF 工具 · 全景知识图谱
            </div>
          </div>
        </a>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
            <span className="hidden sm:inline">搜索知识点</span>
            <kbd
              className={`hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                isDark
                  ? 'bg-[#0A0A0B] text-[#8E9299] border-[#2D2D33]'
                  : 'bg-white text-slate-500 border-slate-300'
              }`}
            >
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              isDark
                ? 'bg-[#1C1C21] border-[#2D2D33] text-amber-400 hover:border-amber-400/60'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
            }`}
            title={isDark ? '切换至明亮模式' : '切换至暗黑模式'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <AccountButton variant="radio" />
        </div>
      </div>
    </header>
  );
};
