import { describe, it, expect } from 'vitest'
import { MODES, getPersona, getChatStarters, buildSummaryPrompt, buildActionsPrompt, type Mode } from '../modes'

const ALL_MODES: Mode[] = ['scholar', 'legal', 'finance', 'medical', 'business']

describe('MODES', () => {
  it('has all five modes', () => {
    expect(Object.keys(MODES)).toEqual(ALL_MODES)
  })

  it.each(ALL_MODES)('%s has required fields', (mode) => {
    const m = MODES[mode]
    expect(m.label).toBeTruthy()
    expect(m.icon).toBeTruthy()
    expect(m.description).toBeTruthy()
    expect(m.persona.length).toBeGreaterThan(50)
    expect(m.summaryStructure.length).toBeGreaterThanOrEqual(4)
    expect(m.chatStarters.length).toBeGreaterThanOrEqual(4)
  })
})

describe('getPersona', () => {
  it('returns persona string for each mode', () => {
    ALL_MODES.forEach(mode => {
      expect(getPersona(mode).length).toBeGreaterThan(50)
    })
  })
})

describe('getChatStarters', () => {
  it('returns at least 4 starters per mode', () => {
    ALL_MODES.forEach(mode => {
      expect(getChatStarters(mode).length).toBeGreaterThanOrEqual(4)
    })
  })
})

describe('buildSummaryPrompt', () => {
  it('includes the mode persona', () => {
    const prompt = buildSummaryPrompt('legal')
    expect(prompt).toContain('legal')
    expect(prompt).toContain('JSON')
  })
})

describe('buildActionsPrompt', () => {
  it('includes document name', () => {
    const prompt = buildActionsPrompt('finance', 'Q3 Financial Report.pdf')
    expect(prompt).toContain('Q3 Financial Report.pdf')
  })
})
