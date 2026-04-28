'use client'
import useSWR from 'swr'
import type { Mode } from '@/lib/modes'

interface AppState {
  id: number
  active_mode: Mode | null
  onboarding_done: boolean
  theme: 'light' | 'dark'
  sidebar_collapsed: boolean
}

const fetcher = (url: string) => fetch(url).then(r => r.json()) as Promise<AppState>

export function useAppState() {
  const { data, mutate, error } = useSWR<AppState>('/api/app-state', fetcher)

  async function update(patch: Partial<AppState>) {
    const optimistic = { ...(data as AppState), ...patch }
    await mutate(
      async () => {
        const res = await fetch('/api/app-state', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        return res.json() as Promise<AppState>
      },
      { optimisticData: optimistic, rollbackOnError: true }
    )
  }

  return {
    state: data,
    loading: !data && !error,
    update,
    setMode: (mode: Mode) => update({ active_mode: mode }),
    setTheme: (theme: 'light' | 'dark') => update({ theme }),
    completeOnboarding: (mode: Mode) => update({ active_mode: mode, onboarding_done: true }),
    setSidebarCollapsed: (collapsed: boolean) => update({ sidebar_collapsed: collapsed }),
  }
}
