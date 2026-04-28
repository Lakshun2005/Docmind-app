'use client'
import { StarIcon, FileIcon, ChevronRightIcon } from '@/components/ui/icons'
import { Chip } from '@/components/ui/primitives'
import type { Document } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import { MODES } from '@/lib/modes'
import { clsx } from 'clsx'

const THUMB_COLORS = ['#c85a3b', '#6b7eb5', '#5a8e6e', '#b58b4f', '#8a7a9e']

interface DocCardProps {
  doc: Document
  index: number
  onOpen: (id: string) => void
  onStar: (id: string) => void
}

export function DocCard({ doc, index, onOpen, onStar }: DocCardProps) {
  const color = THUMB_COLORS[index % THUMB_COLORS.length]
  const modeConfig = MODES[doc.mode as Mode]
  const sizeLabel = doc.file_size > 1024 * 1024
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(doc.file_size / 1024)} KB`

  return (
    <div
      onClick={() => onOpen(doc.id)}
      className="group flex flex-col bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] p-4 cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] transition-all duration-150"
    >
      {/* Thumbnail */}
      <div
        className="w-full h-24 rounded-[var(--radius-sm)] mb-3 flex items-center justify-center text-white text-2xl font-bold opacity-90"
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
      >
        <FileIcon size={28} className="opacity-60" />
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-xs font-medium text-[var(--text)] line-clamp-2 leading-snug flex-1">{doc.name}</p>
        <button
          onClick={e => { e.stopPropagation(); onStar(doc.id) }}
          className={clsx('shrink-0 p-0.5 rounded', doc.starred ? 'text-[var(--accent)]' : 'text-[var(--border-strong)] hover:text-[var(--text-muted)]')}
        >
          <StarIcon size={12} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {modeConfig && (
          <Chip color="accent" size="sm">{modeConfig.label}</Chip>
        )}
        <span className="text-[10px] text-[var(--text-muted)]">{doc.page_count}p · {sizeLabel}</span>
        {doc.is_large && <Chip color="yellow" size="sm">Large</Chip>}
      </div>

      {/* Open hint */}
      <div className="mt-3 flex items-center gap-1 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium">
        <span>Open</span>
        <ChevronRightIcon size={11} />
      </div>
    </div>
  )
}
