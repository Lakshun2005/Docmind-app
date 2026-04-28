'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useDocuments } from '@/hooks/useDocuments'
import { FileIcon, StarIcon, PlusIcon } from '@/components/ui/icons'
import { Chip } from '@/components/ui/primitives'
import type { Document } from '@/hooks/useDocuments'
import { MODES } from '@/lib/modes'
import type { Mode } from '@/lib/modes'
import { clsx } from 'clsx'

interface Workspace {
  id: string
  name: string
  mode: string
}

interface DocListPanelProps {
  activeDocId: string | null
  onSelect: (id: string) => void
}

export function DocListPanel({ activeDocId, onSelect }: DocListPanelProps) {
  const { documents } = useDocuments()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('workspaces').select('*').order('created_at').then(({ data }) => {
      if (data) setWorkspaces(data as Workspace[])
    })
  }, [])

  const filtered = selectedWs
    ? documents.filter(d => {
        // Would need workspace_documents join — simplified: show all for MVP
        return true
      })
    : documents

  const THUMB_COLORS = ['#c85a3b', '#6b7eb5', '#5a8e6e', '#b58b4f', '#8a7a9e']

  return (
    <div className="flex flex-col h-full w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden">
      {/* Workspace selector */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedWs(null)}
            className={clsx('text-[11px] px-2 py-1 rounded-full whitespace-nowrap transition-colors', !selectedWs ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}
          >
            All
          </button>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => setSelectedWs(ws.id)}
              className={clsx('text-[11px] px-2 py-1 rounded-full whitespace-nowrap transition-colors', selectedWs === ws.id ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}
            >
              {ws.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doc list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileIcon size={20} className="text-[var(--border-strong)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No documents</p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const modeConfig = MODES[doc.mode as Mode]
            const isActive = doc.id === activeDocId
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={clsx(
                  'w-full flex flex-col items-start px-4 py-3 border-b border-[var(--border)] transition-colors duration-100 text-left relative',
                  isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                )}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--accent)]" />}
                
                <div className="flex items-start justify-between w-full gap-2 mb-1">
                  <span className={clsx('text-xs font-medium line-clamp-2 leading-snug flex-1', isActive ? 'text-[var(--text)]' : 'text-[var(--text-soft)]')}>
                    {doc.name}
                  </span>
                  {doc.starred && <StarIcon size={10} className="text-[var(--accent)] shrink-0 mt-0.5" />}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap w-full">
                  {modeConfig && <span className="text-[9px] font-medium text-[var(--accent)] uppercase tracking-wider">{modeConfig.label}</span>}
                  <span className="text-[10px] text-[var(--text-muted)]">{Math.round(doc.file_size / 1024)} KB</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
