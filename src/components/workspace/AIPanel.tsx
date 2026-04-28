'use client'
import { useState } from 'react'
import { SparkleIcon } from '@/components/ui/icons'
import { Segmented } from '@/components/ui/primitives'
import type { Document } from '@/hooks/useDocuments'
import ChatTab from './ChatTab'
import GenerateTab from './GenerateTab'
import type { Mode } from '@/lib/modes'

interface AIPanelProps {
  doc: Document | null
}

export function AIPanel({ doc }: AIPanelProps) {
  const [tab, setTab] = useState<'chat' | 'generate'>('chat')

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg)] border-l border-[var(--border)]">
        <SparkleIcon size={24} className="text-[var(--border-strong)] mb-4" />
        <p className="text-sm text-[var(--text-soft)]">Select a document to use AI tools</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] border-l border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparkleIcon size={14} className="text-[var(--accent)]" />
          <span className="text-xs font-semibold text-[var(--text)]">DocMind AI</span>
        </div>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as 'chat' | 'generate')}
          options={[
            { value: 'chat', label: 'Chat' },
            { value: 'generate', label: 'Generate' },
          ]}
        />
      </div>

      {tab === 'chat' ? (
        <ChatTab doc={doc} />
      ) : (
        <GenerateTab doc={doc} mode={((doc.mode as Mode) ?? 'business') as any} />
      )}
    </div>
  )
}
