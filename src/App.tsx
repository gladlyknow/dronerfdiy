/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RadioNavbar } from './components/RadioNavbar';
import { RadioMain } from './components/radio/RadioMain';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { RadioSearchModal } from './components/RadioSearchModal';
import type { KnowledgeNode } from './types';
import { useTheme } from './utils/theme';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isDark } = useTheme();

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ham_a_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['a-law-scope', 'a-comm-callsign', 'a-tech-emission']);
    } catch {
      return new Set(['a-law-scope', 'a-comm-callsign', 'a-tech-emission']);
    }
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem('ham_a_bookmarks', JSON.stringify(Array.from(next)));
      } catch (error) {
        console.warn(error);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      } else if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault();
        setIsSearchOpen(true);
      } else if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors selection:bg-orange-500 selection:text-white ${
        isDark ? 'bg-[#0A0A0B] text-[#E0E0E0]' : 'bg-[#F8FAFC] text-slate-800'
      }`}
    >
      <RadioNavbar onOpenSearch={() => setIsSearchOpen(true)} />

      <main className="flex-1 flex flex-col pb-8 relative">
        <RadioMain onSelectNode={setSelectedNode} />
      </main>

      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        isBookmarked={selectedNode ? bookmarkedIds.has(selectedNode.id) : false}
        onToggleBookmark={() => selectedNode && toggleBookmark(selectedNode.id)}
      />

      <RadioSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectNode={setSelectedNode}
      />
    </div>
  );
}
