'use client'
import { useState } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { MODES, type Mode } from '@/lib/modes'
import { ModeSwitcher } from '@/components/mode/ModeSwitcher'
import { Button } from '@/components/ui/primitives'
import {
  HomeIcon, FolderIcon, ChatIcon, SearchIcon,
  ChevronRightIcon, StarIcon, SunIcon, MoonIcon, SparkleIcon,
} from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import { clsx } from 'clsx'

interface SidebarProps {
  view: 'dashboard' | 'workspace'
  onViewChange: (view: 'dashboard' | 'workspace') => void
  onDocSelect: (id: string) => void
  recentDocs: Document[]
}

export function Sidebar({ view, onViewChange, onDocSelect, recentDocs }: SidebarProps) {
  const { state, setTheme, setMode, setSidebarCollapsed } = useAppState()
  const [search, setSearch] = useState('')
  const [modeSwitcherOpen, setModeSwitcherOpen] = useState(false)

  const collapsed = state?.sidebar_collapsed ?? false
  const activeMode = state?.active_mode as Mode | null
  const theme = state?.theme ?? 'light'

  const filtered = recentDocs
    .filter(d => search ? d.name.toLowerCase().includes(search.toLowerCase()) : true)
    .slice(0, 7)

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'workspace' as const, label: 'Workspace', icon: <FolderIcon /> },
  ]

  const thumbColors = ['#c85a3b', '#6b7eb5', '#5a8e6e', '#b58b4f', '#8a7a9e']

  return (
    <>
      <aside
        className="flex flex-col h-full bg-[var(--bg-raised)] border-r border-[var(--border)] transition-[width] duration-200 shrink-0 overflow-hidden"
        style={{ width: collapsed ? 56 : 228 }}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-12 px-3 border-b border-[var(--border)] shrink-0', collapsed ? 'justify-center' : 'gap-2')}>
          <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
            <SparkleIcon size={12} className="text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-sm text-[var(--text)] truncate">DocMind AI</span>}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-[var(--radius-sm)]">
              <SearchIcon size={12} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents…"
                className="flex-1 text-xs bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="px-2 pt-2 shrink-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors duration-100 mb-0.5',
                view === item.id
                  ? 'bg-[var(--bg-active)] text-[var(--text)] font-medium'
                  : 'text-[var(--text-soft)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Recent docs */}
        {!collapsed && filtered.length > 0 && (
          <div className="flex-1 overflow-y-auto px-2 pt-4 min-h-0">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-2 mb-1.5 font-medium">Recent</p>
            {filtered.map((doc, i) => (
              <button
                key={doc.id}
                onClick={() => onDocSelect(doc.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] group mb-0.5"
              >
                <span
                  className="w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ background: thumbColors[i % thumbColors.length] }}
                >
                  {doc.file_type.toUpperCase().slice(0, 2)}
                </span>
                <span className="flex-1 text-xs text-[var(--text-soft)] group-hover:text-[var(--text)] truncate text-left">{doc.name}</span>
                {doc.starred && <StarIcon size={10} className="text-[var(--accent)] shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={clsx('px-2 pb-3 pt-2 border-t border-[var(--border)] shrink-0 mt-auto', collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1')}>
          {/* Mode chip */}
          {!collapsed && activeMode && (
            <button
              onClick={() => setModeSwitcherOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] group"
            >
              <span className="text-base leading-none">{MODES[activeMode].icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] font-medium text-[var(--text)] truncate">{MODES[activeMode].label} mode</div>
                <div className="text-[10px] text-[var(--text-muted)]">Tap to change</div>
              </div>
            </button>
          )}

          {/* Theme + collapse */}
          <div className={clsx('flex gap-1', collapsed ? 'flex-col' : '')}>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="flex-1 flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              title="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon size={13} /> : <SunIcon size={13} />}
            </button>
            <button
              onClick={() => setSidebarCollapsed(!collapsed)}
              className="flex-1 flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRightIcon size={13} className={collapsed ? '' : 'rotate-180'} />
            </button>
          </div>
        </div>
      </aside>

      {activeMode && (
        <ModeSwitcher
          open={modeSwitcherOpen}
          currentMode={activeMode}
          onSwitch={(m) => setMode(m as Mode)}
          onClose={() => setModeSwitcherOpen(false)}
        />
      )}
    </>
  )
}
