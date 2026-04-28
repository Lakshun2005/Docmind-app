'use client';

import React, { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useDocuments } from '@/hooks/useDocuments';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Workspace } from '@/components/workspace/Workspace';
import { ModeSelect } from '@/components/onboarding/ModeSelect';
import type { Mode } from '@/lib/modes';

export default function Home() {
  const { state, loading, completeOnboarding } = useAppState();
  const { documents } = useDocuments();
  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Sync theme to document
  React.useEffect(() => {
    if (state?.theme) {
      document.documentElement.dataset.theme = state.theme;
    }
  }, [state?.theme]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading DocMind…</p>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!state?.onboarding_done) {
    return (
      <ModeSelect
        onSelect={(mode: Mode) => completeOnboarding(mode)}
      />
    );
  }

  const activeMode = (state?.active_mode as Mode) ?? 'business';

  function handleDocOpen(id: string) {
    setActiveDocId(id);
    setView('workspace');
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        view={view}
        onViewChange={setView}
        onDocSelect={handleDocOpen}
        recentDocs={documents.slice(0, 7)}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === 'dashboard' ? (
          <Dashboard
            mode={activeMode}
            onDocOpen={handleDocOpen}
          />
        ) : (
          <Workspace
            initialDocId={activeDocId}
          />
        )}
      </main>
    </div>
  );
}
