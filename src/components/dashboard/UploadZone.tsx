'use client'
import { useState, useRef } from 'react'
import { UploadIcon, SparkleIcon } from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import { clsx } from 'clsx'

type UploadStep = 'idle' | 'uploading' | 'extracting' | 'analysing' | 'done' | 'error'

interface UploadZoneProps {
  mode: Mode
  onUploaded: (doc: Document) => void
}

const STEPS: UploadStep[] = ['uploading', 'extracting', 'analysing']
const STEP_LABELS: Record<UploadStep, string> = {
  idle: '', uploading: 'Uploading…', extracting: 'Extracting text…',
  analysing: 'Analysing with AI…', done: 'Done', error: 'Upload failed',
}
const STEP_PROGRESS: Record<UploadStep, number> = {
  idle: 0, uploading: 15, extracting: 45, analysing: 80, done: 100, error: 0,
}

export function UploadZone({ mode, onUploaded }: UploadZoneProps) {
  const [drag, setDrag] = useState(false)
  const [step, setStep] = useState<UploadStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    setError(null)

    try {
      setStep('uploading')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mode', mode)
      setStep('extracting')

      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      setStep('analysing')

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Upload failed')
      }

      const doc = await res.json() as Document
      setStep('done')
      setTimeout(() => { setStep('idle'); onUploaded(doc) }, 600)
    } catch (e) {
      setStep('error')
      setError(e instanceof Error ? e.message : 'Upload failed')
      setTimeout(() => setStep('idle'), 3000)
    }
  }

  const isProcessing = step !== 'idle' && step !== 'done' && step !== 'error'
  const progress = STEP_PROGRESS[step]

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => !isProcessing && inputRef.current?.click()}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-[var(--radius-lg)] cursor-pointer transition-all duration-150',
        drag ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]',
        isProcessing && 'cursor-default pointer-events-none'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.txt"
        onChange={e => handleFiles(e.target.files)}
      />

      {step === 'idle' ? (
        <>
          <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center">
            <UploadIcon size={18} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text)]">Drop a document or click to browse</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">PDF, DOCX, XLSX, CSV, images — up to 50 MB</p>
          </div>
        </>
      ) : (
        <div className="w-full max-w-xs text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <SparkleIcon size={13} className="text-[var(--accent)] animate-pulse" />
            <span className="text-sm font-medium text-[var(--text)]">
              {step === 'error' ? error : STEP_LABELS[step]}
            </span>
          </div>
          {step !== 'error' && (
            <div className="h-1 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <div className="flex justify-center gap-3 mt-2">
            {STEPS.map(s => (
              <span key={s} className={clsx('text-[10px]', step === s ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-muted)]')}>
                {STEP_LABELS[s]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
