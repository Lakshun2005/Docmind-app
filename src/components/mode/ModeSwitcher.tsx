'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MODES, type Mode } from '@/lib/modes'
import { Modal, Button, Chip } from '@/components/ui/primitives'
import { XIcon, CheckIcon } from '@/components/ui/icons'

interface ModeSwitcherProps {
  open: boolean
  currentMode: Mode
  onSwitch: (mode: Mode) => void
  onClose: () => void
}

export function ModeSwitcher({ open, currentMode, onSwitch, onClose }: ModeSwitcherProps) {
  const [pending, setPending] = useState<Mode>(currentMode)

  function handleSwitch() {
    onSwitch(pending)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text)]">Switch Mode</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Your documents stay. Only the AI lens changes.</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]">
          <XIcon size={13} />
        </button>
      </div>

      {/* Mode list */}
      <div className="flex flex-col gap-1.5 mb-5">
        {(Object.entries(MODES) as [Mode, typeof MODES[Mode]][]).map(([key, m]) => {
          const isCurrent = key === currentMode
          const isSelected = key === pending
          return (
            <button
              key={key}
              onClick={() => setPending(key)}
              className={[
                'flex items-center gap-3 p-3 rounded-[var(--radius)] border text-left transition-all duration-100',
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                  : 'border-transparent hover:bg-[var(--bg-hover)]',
              ].join(' ')}
            >
              <span className="text-xl leading-none w-6">{m.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--text)]">{m.label}</span>
                  {isCurrent && <Chip color="accent" size="sm">current</Chip>}
                </div>
                <span className="text-[11px] text-[var(--text-muted)]">{m.description}</span>
              </div>
              {isSelected && !isCurrent && (
                <CheckIcon size={13} className="text-[var(--accent)] shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      <Button
        onClick={handleSwitch}
        disabled={pending === currentMode}
        className="w-full justify-center"
      >
        Switch to {MODES[pending].label}
      </Button>
    </Modal>
  )
}
