'use client'
import { UploadZone } from './UploadZone'
import { DocCard } from './DocCard'
import { WorkspaceRail } from './WorkspaceRail'
import { useDocuments } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import type { Document } from '@/hooks/useDocuments'
import { SparkleIcon, FileIcon, ChatIcon, FolderIcon } from '@/components/ui/icons'

interface DashboardProps {
  mode: Mode
  onDocOpen: (id: string) => void
}

export function Dashboard({ mode, onDocOpen }: DashboardProps) {
  const { documents, loading, addOptimistic, toggleStar } = useDocuments()

  function handleUploaded(doc: Document) {
    addOptimistic(doc)
    onDocOpen(doc.id)
  }

  const stats = [
    { label: 'Documents', value: documents.length, icon: <FileIcon size={14} /> },
    { label: 'Summaries', value: documents.filter(d => d.summary_json).length, icon: <SparkleIcon size={14} /> },
    { label: 'Starred', value: documents.filter(d => d.starred).length, icon: <FolderIcon size={14} /> },
    { label: 'Chats', value: 0, icon: <ChatIcon size={14} /> },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] p-4">
            <div className="flex items-center gap-2 text-[var(--text-muted)] mb-1.5">
              {s.icon}
              <span className="text-xs">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-[var(--text)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upload */}
      <UploadZone mode={mode} onUploaded={handleUploaded} />

      {/* Workspaces */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">Workspaces</p>
        <WorkspaceRail activeMode={mode} />
      </div>

      {/* Documents */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">
          Recent documents
        </p>
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-44 bg-[var(--bg-sunken)] rounded-[var(--radius)] animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileIcon size={28} className="text-[var(--border-strong)] mb-3" />
            <p className="text-sm font-medium text-[var(--text-soft)]">No documents yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Upload a document above to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {documents.map((doc, i) => (
              <DocCard key={doc.id} doc={doc} index={i} onOpen={onDocOpen} onStar={toggleStar} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
