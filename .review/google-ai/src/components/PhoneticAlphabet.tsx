import React, { useState } from 'react';
import { 
  Volume2, 
  Radio, 
  Search, 
  Mic
} from 'lucide-react';
import { PhoneticItem } from '../types';
import { phoneticData } from '../data/hamData';
import { morseAudio } from '../utils/morseAudio';
import { useTheme } from '../utils/theme';

export const PhoneticAlphabet: React.FC = () => {
  const { isDark } = useTheme();
  const [search, setSearch] = useState<string>('');
  const [testCallsign, setTestCallsign] = useState<string>('BG5XYZ');
  const [playingItem, setPlayingItem] = useState<string | null>(null);

  const filteredItems = phoneticData.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      item.letter.toLowerCase().includes(q) ||
      item.word.toLowerCase().includes(q) ||
      item.chinesePronunciation.toLowerCase().includes(q)
    );
  });

  const handlePlayAudio = (item: PhoneticItem) => {
    setPlayingItem(item.letter);
    morseAudio.speak(item.word);
    setTimeout(() => setPlayingItem(null), 1200);
  };

  const handlePlayMorse = (item: PhoneticItem) => {
    setPlayingItem(`morse-${item.letter}`);
    morseAudio.playMorse(item.morseAudioPattern);
    setTimeout(() => setPlayingItem(null), 1500);
  };

  // Breakdown test callsign into phonetics
  const callsignBreakdown = testCallsign
    .trim()
    .toUpperCase()
    .split('')
    .map((char) => {
      const match = phoneticData.find((p) => p.letter === char);
      if (match) return match;
      const digitMap: Record<string, { word: string; morse: string; pattern: string }> = {
        '0': { word: 'Nadazero / Zero', morse: '— — — — —', pattern: '-----' },
        '1': { word: 'Unaone / One', morse: '· — — — —', pattern: '.----' },
        '2': { word: 'Bissotwo / Two', morse: '· · — — —', pattern: '..---' },
        '3': { word: 'Terrathree / Three', morse: '· · · — —', pattern: '...--' },
        '4': { word: 'Kartefour / Four', morse: '· · · · —', pattern: '....-' },
        '5': { word: 'Pantafive / Five', morse: '· · · · ·', pattern: '.....' },
        '6': { word: 'Soxisix / Six', morse: '— · · · ·', pattern: '-....' },
        '7': { word: 'Setteseven / Seven', morse: '— — · · ·', pattern: '--...' },
        '8': { word: 'Oktoeight / Eight', morse: '— — — · ·', pattern: '---..' },
        '9': { word: 'Novenine / Nine', morse: '— — — — ·', pattern: '----.' },
        '/': { word: 'Stroke / Slant', morse: '— · · — ·', pattern: '-..-.' },
      };
      if (digitMap[char]) {
        return {
          letter: char,
          word: digitMap[char].word,
          ipa: '',
          chinesePronunciation: '',
          morse: digitMap[char].morse,
          morseAudioPattern: digitMap[char].pattern,
        };
      }
      return {
        letter: char,
        word: char,
        ipa: '',
        chinesePronunciation: '',
        morse: '',
        morseAudioPattern: '',
      };
    });

  const playEntireCallsignVoice = () => {
    const textToSpeak = callsignBreakdown.map((item) => item.word.split(' / ')[0]).join(' ');
    morseAudio.speak(textToSpeak);
  };

  const playEntireCallsignMorse = () => {
    const fullMorse = callsignBreakdown.map((item) => item.morseAudioPattern).join(' ');
    morseAudio.playMorse(fullMorse);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-wider font-mono">
            <Radio className="w-4 h-4" />
            <span>ITU / ICAO 国际业余无线电标准字母解释法与莫尔斯电码</span>
          </div>
          <h2 className={`text-base sm:text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            26 个英文字母标准读音、注音谐音与摩尔斯电码
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            在语音通联时为避免听错字母（如 B/D/E/P/T/V），必须使用北约/ITU国际标准解释法进行呼号报读。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索字母、单词或谐音..."
              className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-orange-500 ${
                isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Callsign Reader Simulator */}
      <div className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors ${
        isDark ? 'bg-[#111114] border-[#2D2D33]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-orange-600" />
            <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              呼号标准读法与电码即时转换仿真器
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={testCallsign}
              onChange={(e) => setTestCallsign(e.target.value.toUpperCase())}
              placeholder="输入呼号如 BG5XYZ"
              className={`font-mono font-bold text-xs uppercase px-3 py-1.5 rounded-xl border focus:outline-none focus:border-orange-500 ${
                isDark ? 'bg-[#1C1C21] border-[#2D2D33] text-orange-400' : 'bg-slate-50 border-slate-300 text-orange-600'
              }`}
            />
            <button
              onClick={playEntireCallsignVoice}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>全呼号播报</span>
            </button>
            <button
              onClick={playEntireCallsignMorse}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33]' : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              ⚡ 滴嗒电码
            </button>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {callsignBreakdown.map((item, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border text-center space-y-1 min-w-[70px] ${
                isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-sm font-mono font-bold text-orange-600">{item.letter}</div>
              <div className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {item.word.split(' / ')[0]}
              </div>
              <div className="text-[10px] font-mono text-slate-400">{item.morse || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid of 26 Alphabet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredItems.map((item) => {
          const isPlayingThis = playingItem === item.letter;
          const isPlayingMorse = playingItem === `morse-${item.letter}`;

          return (
            <div
              key={item.letter}
              className={`border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                isDark 
                  ? 'bg-[#111114] border-[#2D2D33] hover:border-orange-500' 
                  : 'bg-white border-slate-200 hover:border-orange-400'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-2xl font-mono font-bold text-orange-600">
                    {item.letter}
                  </span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-[#1C1C21] text-slate-400 border-[#2D2D33]' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {item.ipa}
                  </span>
                </div>

                <div className={`text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.word}
                </div>

                <div className="text-xs text-slate-500 mt-0.5">
                  谐音: <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.chinesePronunciation}</span>
                </div>

                <div className={`mt-2 p-2 rounded-xl border font-mono text-xs flex items-center justify-between ${
                  isDark ? 'bg-[#1C1C21] border-[#2D2D33]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-slate-400 text-[10px]">摩尔斯:</span>
                  <span className="font-bold text-orange-600 tracking-widest">{item.morse}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-[#2D2D33]">
                <button
                  onClick={() => handlePlayAudio(item)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isPlayingThis
                      ? 'bg-orange-600 text-white border-orange-600'
                      : isDark ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33] hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>读音</span>
                </button>

                <button
                  onClick={() => handlePlayMorse(item)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isPlayingMorse
                      ? 'bg-orange-600 text-white border-orange-600'
                      : isDark ? 'bg-[#1C1C21] text-slate-300 border-[#2D2D33] hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>⚡ 电码</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
