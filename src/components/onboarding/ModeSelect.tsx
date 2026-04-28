'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MODES, type Mode } from '@/lib/modes'
import { Button } from '@/components/ui/primitives'
import { SparkleIcon } from '@/components/ui/icons'

interface ModeSelectProps {
  onSelect: (mode: Mode) => void
}

export function ModeSelect({ onSelect }: ModeSelectProps) {
  const [selected, setSelected] = useState<Mode | null>(null)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)] px-6"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-[var(--accent-soft)] rounded-full">
            <SparkleIcon size={13} className="text-[var(--accent)]" />
            <span className="text-xs font-medium text-[var(--accent)]">DocMind AI</span>
          </div>
          <h1 className="serif text-3xl text-[var(--text)] mb-2">What will you use DocMind for?</h1>
          <p className="text-sm text-[var(--text-muted)]">Choose your focus area. You can change this later.</p>
        </motion.div>

        {/* Mode grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl mb-8"
        >
          {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, m]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={[
                'flex flex-col items-start p-4 rounded-[var(--radius)] border text-left transition-all duration-150',
                selected === key
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow-md)]'
                  : 'border-[var(--border)] bg-[var(--bg-raised)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]',
              ].join(' ')}
            >
              <span className="text-2xl mb-2 leading-none">{m.icon}</span>
              <span className="text-sm font-semibold text-[var(--text)] mb-0.5">{m.label}</span>
              <span className="text-[11px] text-[var(--text-muted)] leading-snug">{m.description}</span>
            </button>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <Button
            size="lg"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
            className="min-w-[160px] justify-center"
          >
            <SparkleIcon size={13} />
            Get started
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
