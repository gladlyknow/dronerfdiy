/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, TopDomain } from './components/Navbar';
import { RadioMain } from './components/radio/RadioMain';
import { DroneMain } from './components/drone/DroneMain';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DeploymentModal } from './components/DeploymentModal';
import { KnowledgeNode } from './types';
import { Radio as RadioIcon, Send, Search, Cloud } from 'lucide-react';
import { useTheme } from './utils/theme';

export default function App() {
  const [activeDomain, setActiveDomain] = useState<TopDomain>('radio');
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState<boolean>(false);
  const { isDark } = useTheme();

  // Bookmarks state for knowledge nodes
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ham_a_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['bands-limit', 'bands-priority', 'tech-emission']);
    } catch {
      return new Set(['bands-limit', 'bands-priority', 'tech-emission']);
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('ham_a_bookmarks', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K / /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsDeploymentOpen(false);
        setSelectedNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectNode = (node: KnowledgeNode) => {
    setSelectedNode(node);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors selection:bg-orange-500 selection:text-white ${
      isDark ? 'bg-[#0A0A0B] text-[#E0E0E0]' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* Top Standard Single-Row Navbar with Domain Switcher */}
      <Navbar
        activeDomain={activeDomain}
        onDomainChange={setActiveDomain}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDeployment={() => setIsDeploymentOpen(true)}
      />

      {/* Main Domain Views */}
      <main className="flex-1 flex flex-col pb-16 sm:pb-8 relative">
        {activeDomain === 'radio' ? (
          <RadioMain onSelectNode={handleSelectNode} />
        ) : (
          <DroneMain />
        )}
      </main>

      {/* Mobile Floating Bottom Bar for Fast Domain Toggling */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around px-4 py-2 shadow-2xl backdrop-blur-lg ${
        isDark ? 'bg-[#111114]/95 border-[#2D2D33]' : 'bg-white/95 border-slate-200 text-slate-700'
      }`}>
        <button
          onClick={() => setActiveDomain('radio')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeDomain === 'radio'
              ? 'text-orange-600 font-bold'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <RadioIcon className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Radio 业余无线电</span>
        </button>

        <button
          onClick={() => setActiveDomain('drone')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeDomain === 'drone'
              ? 'text-orange-600 font-bold'
              : isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          <Send className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Drone 穿越机</span>
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 hover:text-orange-600 cursor-pointer`}
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">全局搜索</span>
        </button>
      </div>

      {/* Global Knowledge Node Detail Drawer */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        isBookmarked={selectedNode ? bookmarkedIds.has(selectedNode.id) : false}
        onToggleBookmark={() => selectedNode && toggleBookmark(selectedNode.id)}
      />

      {/* Global Search Modal (Cmd+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNode={(node) => {
          setIsSearchOpen(false);
          handleSelectNode(node);
        }}
      />

      {/* Deployment & Git Modal */}
      <DeploymentModal
        isOpen={isDeploymentOpen}
        onClose={() => setIsDeploymentOpen(false)}
      />
    </div>
  );
}
