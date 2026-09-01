/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { NodeDetailDrawer } from './components/NodeDetailDrawer';
import { RadioSearchModal } from './components/RadioSearchModal';
import { RadioBackToTop } from './components/radio/RadioBackToTop';
import type { KnowledgeNode } from './types';
import { useAuth } from './auth/AuthProvider';
import { RadioEarth } from './components/radio/RadioEarth';

export default function App() {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, setFavorite } = useAuth();

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ham_a_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['a-law-scope', 'a-comm-callsign', 'a-tech-emission']);
    } catch {
      return new Set(['a-law-scope', 'a-comm-callsign', 'a-tech-emission']);
    }
  });

  const toggleBookmark = (id: string) => {
    const favorited = !bookmarkedIds.has(id);
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
    if (user) void setFavorite('knowledge', id, favorited);
  };

  useEffect(() => {
    const reloadBookmarks = () => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem('ham_a_bookmarks') ?? '[]');
        if (Array.isArray(saved)) {
          setBookmarkedIds(new Set(saved.filter((id): id is string => typeof id === 'string')));
        }
      } catch {
        // Existing local state remains available if browser storage is malformed.
      }
    };
    window.addEventListener('dronerf:cloud-sync', reloadBookmarks);
    return () => window.removeEventListener('dronerf:cloud-sync', reloadBookmarks);
  }, []);

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
    <div className="min-h-screen selection:bg-orange-500 selection:text-white">
      <RadioEarth onOpenSearch={() => setIsSearchOpen(true)} onSelectNode={setSelectedNode} />

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

      <RadioBackToTop />
    </div>
  );
}
