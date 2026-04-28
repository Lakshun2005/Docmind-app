import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { buildSummaryPrompt, buildActionsPrompt, type Mode } from './modes'

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
export const MODEL = 'llama-3.3-70b-versatile'
export const MAX_CONTEXT_CHARS = 96000  // ~128k tokens, leaving room for response

export interface SummaryJson {
  overview: string[]
  key_terms: Array<{ term: string; definition: string; page?: number }>
  [key: string]: unknown
}

export interface SuggestedAction {
  id: string
  label: string
  description: string
}

export async function summarizeDocument(
  text: string,
  mode: Mode
): Promise<SummaryJson | null> {
  const truncated = text.slice(0, MAX_CONTEXT_CHARS)
  try {
    const { text: raw } = await generateText({
      model: groq(MODEL),
      system: buildSummaryPrompt(mode),
      prompt: truncated,
      // @ts-ignore
      maxTokens: 1500,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0]) as SummaryJson
  } catch {
    return null
  }
}

export async function suggestActions(
  text: string,
  filename: string,
  mode: Mode
): Promise<SuggestedAction[]> {
  const truncated = text.slice(0, 20000)
  try {
    const { text: raw } = await generateText({
      model: groq(MODEL),
      system: buildActionsPrompt(mode, filename),
      prompt: truncated,
      // @ts-ignore
      maxTokens: 600,
    })
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0]) as { actions: SuggestedAction[] }
    return parsed.actions ?? []
  } catch {
    return []
  }
}
