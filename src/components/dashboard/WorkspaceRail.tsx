'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button, Chip } from '@/components/ui/primitives'
import { FolderIcon, PlusIcon, XIcon } from '@/components/ui/icons'
import type { Mode } from '@/lib/modes'
import { MODES } from '@/lib/modes'

interface Workspace {
  id: string
  name: string
  mode: string
  created_at: string
}

interface WorkspaceRailProps {
  activeMode: Mode
}

export function WorkspaceRail({ activeMode }: WorkspaceRailProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    supabase.from('workspaces').select('*').order('created_at').then(({ data }) => {
      if (data) setWorkspaces(data as Workspace[])
    })
  }, [])

  async function createWorkspace() {
    if (!newName.trim()) return
    const { data } = await supabase
      .from('workspaces')
      .insert({ name: newName.trim(), mode: activeMode })
      .select()
      .single()
    if (data) setWorkspaces(ws => [...ws, data as Workspace])
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-2 min-w-max">
        {workspaces.map(ws => {
          const m = MODES[ws.mode as Mode]
          return (
            <div
              key={ws.id}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] hover:border-[var(--border-strong)] cursor-pointer transition-colors"
            >
              <FolderIcon size={13} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-xs font-medium text-[var(--text)] whitespace-nowrap">{ws.name}</span>
              {m && <Chip color="accent" size="sm">{m.label}</Chip>}
            </div>
          )
        })}

        {creating ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--bg-raised)] border border-[var(--accent)] rounded-[var(--radius)]">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createWorkspace(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Workspace name"
              className="text-xs bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none w-28"
            />
            <button onClick={() => setCreating(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              <XIcon size={11} />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
            <PlusIcon size={12} />
            New workspace
          </Button>
        )}
      </div>
    </div>
  )
}
