'use client'
import { type HTMLAttributes, type ButtonHTMLAttributes, type ReactNode, forwardRef, useState } from 'react'
import { clsx } from 'clsx'

// Button
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'solid', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
    const variants: Record<ButtonVariant, string> = {
      solid:   'bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] active:scale-[0.98]',
      outline: 'border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
      ghost:   'text-[var(--text-soft)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] active:bg-[var(--bg-active)]',
      subtle:  'bg-[var(--bg-sunken)] text-[var(--text-soft)] hover:bg-[var(--bg-active)] hover:text-[var(--text)]',
    }
    const sizes: Record<ButtonSize, string> = {
      sm: 'text-xs px-2.5 py-1.5 h-7',
      md: 'text-sm px-3.5 py-2 h-8',
      lg: 'text-sm px-4 py-2.5 h-10',
    }
    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <span className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Card
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ hover, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]',
        hover && 'cursor-pointer transition-shadow duration-150 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Chip / Badge
interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  color?: 'default' | 'accent' | 'green' | 'yellow' | 'red' | 'blue'
  size?: 'sm' | 'md'
}

export function Chip({ color = 'default', size = 'sm', className, children, ...props }: ChipProps) {
  const colors: Record<string, string> = {
    default: 'bg-[var(--bg-sunken)] text-[var(--text-soft)]',
    accent:  'bg-[var(--accent-soft)] text-[var(--accent)]',
    green:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    yellow:  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    red:     'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    blue:    'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  }
  const sizes = { sm: 'text-[11px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' }
  return (
    <span
      className={clsx('inline-flex items-center gap-1 font-medium rounded-full', colors[color], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}

// Segmented control
interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ options, value, onChange, size = 'sm' }: SegmentedProps<T>) {
  return (
    <div className="inline-flex bg-[var(--bg-sunken)] border border-[var(--border)] rounded-[var(--radius-sm)] p-0.5 gap-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            'rounded-[4px] font-medium transition-all duration-150',
            size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5',
            opt.value === value
              ? 'bg-[var(--bg-raised)] text-[var(--text)] shadow-[var(--shadow-sm)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-soft)]'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Modal / overlay
interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative z-10 w-full max-w-md bg-[var(--bg-raised)] border border-[var(--border)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6', className)}>
        {children}
      </div>
    </div>
  )
}

// Divider
export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px bg-[var(--border)]', className)} />
}

// Btn — icon-supporting button used by ChatTab / GenerateTab
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function Btn({ variant = 'ghost', size = 'sm', icon, children, className, ...props }: BtnProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-[var(--radius-sm)] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const variants: Record<ButtonVariant, string> = {
    solid:   'bg-[var(--accent)] text-white hover:bg-[var(--accent-deep)] active:scale-[0.98]',
    outline: 'border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
    ghost:   'text-[var(--text-soft)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] active:bg-[var(--bg-active)]',
    subtle:  'bg-[var(--bg-sunken)] text-[var(--text-soft)] hover:bg-[var(--bg-active)] hover:text-[var(--text)]',
  }
  const sizes: Record<ButtonSize, string> = {
    sm: 'text-xs px-2.5 py-1.5 h-7',
    md: 'text-sm px-3.5 py-2 h-8',
    lg: 'text-sm px-4 py-2.5 h-10',
  }
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </button>
  )
}

// Tooltip — hover label wrapper
interface TooltipProps {
  label: string
  children: ReactNode
}

export function Tooltip({ label, children }: TooltipProps) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] font-medium bg-[var(--text)] text-[var(--bg)] rounded-md whitespace-nowrap pointer-events-none z-50">
          {label}
        </div>
      )}
    </div>
  )
}
