# DocMind AI — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete DocMind AI MVP — mode-first document intelligence app with upload, structured summary, streaming chat, and AI-inferred content generation — matching the prototype visual design.

**Architecture:** Next.js 16 App Router + Supabase (PostgreSQL + Storage) + Groq (llama-3.3-70b-versatile, 128k context). Single-user, no auth. Full-context injection for docs ≤80 pages; truncation fallback + RAG skeleton for larger docs.

**Tech Stack:** Next.js 16, Supabase JS v2, Vercel AI SDK v6, @ai-sdk/groq, TailwindCSS 4, Framer Motion, react-pdf, mammoth, xlsx, tesseract.js, SWR, Vitest, @testing-library/react

**Working directory:** `C:\Users\acer\Documents\projects\idp-platform\docmind-app`

---

## Files Created / Modified

```
CREATED:
src/lib/modes.ts                        — 5 mode definitions, personas, prompt builders
src/lib/extractor.ts                    — unified file → text (PDF, DOCX, Excel, image)
src/lib/rag.ts                          — skeleton stubs (TODO: pgvector)
src/hooks/useAppState.ts                — global mode/theme state via SWR
src/hooks/useDocuments.ts               — document list with optimistic updates
src/app/api/app-state/route.ts          — GET/PATCH app_state row
src/components/onboarding/ModeSelect.tsx
src/components/mode/ModeSwitcher.tsx
src/components/dashboard/UploadZone.tsx
src/components/dashboard/DocCard.tsx
src/components/dashboard/WorkspaceRail.tsx
src/components/workspace/DocListPanel.tsx
src/components/workspace/AIPanel.tsx
vitest.config.ts
src/lib/__tests__/modes.test.ts
src/lib/__tests__/extractor.test.ts

MODIFIED:
package.json                            — add mammoth, xlsx, tesseract.js, swr, vitest deps
src/app/page.tsx                        — onboarding gate + useAppState integration
src/app/globals.css                     — add utility classes used by components
src/components/layout/Sidebar.tsx      — mode chip, search, recent docs
src/components/dashboard/Dashboard.tsx — use new UploadZone, DocCard, WorkspaceRail
src/components/workspace/Workspace.tsx  — integrate DocListPanel
src/components/workspace/SummaryTab.tsx — collapsible sections from summary_json
src/components/workspace/ChatTab.tsx   — load persisted history, save on complete
src/components/workspace/GenerateTab.tsx — AI-inferred templates, save outputs
src/components/ui/primitives.tsx        — Button, Card, Chip, Badge, Segmented, Modal
src/components/ui/icons.tsx             — full icon set matching prototype
src/lib/groq.ts                         — add suggestActions(), update summarize to use modes.ts
src/app/api/documents/upload/route.ts  — use extractor.ts, generate suggested_actions
src/app/api/chat/route.ts              — mode persona, persist messages
src/app/api/generate/route.ts          — type-specific prompts, save outputs
```

---

## Task 1: Install Dependencies + Set Up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install runtime dependencies**

```bash
cd C:\Users\acer\Documents\projects\idp-platform\docmind-app
npm install mammoth xlsx tesseract.js swr
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/mammoth
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Verify vitest runs**

```bash
npx vitest run
```

Expected: `No test files found` (exit 0, not an error — no tests yet)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test-setup.ts
git commit -m "chore: add testing deps and vitest config"
```

---

## Task 2: Supabase Schema Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migrations directory and SQL file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- App-wide state (single row, upserted on change)
create table if not exists app_state (
  id                integer primary key default 1,
  active_mode       text default null,
  onboarding_done   boolean default false,
  theme             text default 'light',
  sidebar_collapsed boolean default false,
  constraint app_state_single_row check (id = 1)
);

insert into app_state (id) values (1) on conflict (id) do nothing;

-- Documents
create table if not exists documents (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  mode              text not null,
  file_type         text not null,
  storage_path      text,
  full_text         text,
  page_count        integer default 0,
  file_size         integer,
  is_large          boolean default false,
  summary_json      jsonb,
  suggested_actions jsonb,
  starred           boolean default false,
  created_at        timestamptz default now()
);

-- Workspaces
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  mode        text not null,
  created_at  timestamptz default now()
);

-- Document <-> Workspace (many-to-many)
create table if not exists workspace_documents (
  workspace_id  uuid references workspaces(id) on delete cascade,
  document_id   uuid references documents(id) on delete cascade,
  added_at      timestamptz default now(),
  primary key (workspace_id, document_id)
);

-- Chat messages (persisted per document)
create table if not exists chat_messages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid references documents(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant')),
  content       text not null,
  created_at    timestamptz default now()
);

-- Generated outputs
create table if not exists generated_outputs (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid references documents(id) on delete cascade,
  type          text not null,
  content       text not null,
  length        text,
  tone          text,
  created_at    timestamptz default now()
);
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Open your Supabase project → SQL Editor → paste the contents of `001_initial_schema.sql` → Run.

- [ ] **Step 3: Create Storage bucket**

In Supabase dashboard → Storage → New bucket:
- Name: `documents`
- Public: **yes** (so `storage_path` URLs work directly in `<img>` / PDF viewer)

- [ ] **Step 4: Verify tables exist**

In Supabase dashboard → Table Editor, confirm these tables are present:
`app_state`, `documents`, `workspaces`, `workspace_documents`, `chat_messages`, `generated_outputs`

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema migration"
```

---

## Task 3: modes.ts — Mode Definitions, Personas, Prompts

**Files:**
- Create: `src/lib/modes.ts`
- Create: `src/lib/__tests__/modes.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/modes.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/__tests__/modes.test.ts
```

Expected: FAIL — `Cannot find module '../modes'`

- [ ] **Step 3: Create modes.ts**

Create `src/lib/modes.ts`:

```typescript
export type Mode = 'scholar' | 'legal' | 'finance' | 'medical' | 'business'

export interface SummarySection {
  key: string
  label: string
  icon: string
}

export interface ModeConfig {
  label: string
  icon: string
  description: string
  examples: string
  persona: string
  summaryStructure: SummarySection[]
  chatStarters: string[]
}

export const MODES: Record<Mode, ModeConfig> = {
  scholar: {
    label: 'Scholar',
    icon: '🎓',
    description: 'Papers, notes, research',
    examples: 'Academic papers, textbooks, lecture notes, theses',
    persona: `You are an analytical academic assistant. Help users understand scholarly documents. Focus on: core arguments and evidence, theoretical frameworks, methodology and research design, key citations, and limitations. Use precise academic language. Structure responses around the document's core intellectual contributions.`,
    summaryStructure: [
      { key: 'overview', label: 'Overview', icon: 'book' },
      { key: 'key_terms', label: 'Key Concepts', icon: 'tag' },
      { key: 'methodology', label: 'Methodology', icon: 'flask' },
      { key: 'findings', label: 'Findings', icon: 'chart' },
      { key: 'limitations', label: 'Limitations & Gaps', icon: 'warning' },
    ],
    chatStarters: [
      'What is the main argument of this document?',
      'What methodology was used?',
      'What are the key findings?',
      'What are the limitations of this study?',
    ],
  },
  legal: {
    label: 'Legal',
    icon: '⚖️',
    description: 'Contracts, policies, regulations',
    examples: 'Contracts, agreements, policies, regulations, terms of service',
    persona: `You are a precise legal analyst. Help users understand legal documents. Focus on: obligations and rights of each party, key dates and deadlines, termination and breach conditions, risk areas and ambiguous language, and compliance requirements. Use plain language to explain legal concepts. Always flag clauses that require careful attention or carry meaningful risk.`,
    summaryStructure: [
      { key: 'overview', label: 'Overview', icon: 'document' },
      { key: 'obligations', label: 'Obligations & Rights', icon: 'check' },
      { key: 'key_terms', label: 'Defined Terms', icon: 'tag' },
      { key: 'risks', label: 'Risks & Red Flags', icon: 'warning' },
      { key: 'deadlines', label: 'Dates & Deadlines', icon: 'calendar' },
    ],
    chatStarters: [
      'What are my main obligations under this agreement?',
      'What are the termination conditions?',
      'Are there any unusual or risky clauses?',
      'What are the key dates and deadlines?',
    ],
  },
  finance: {
    label: 'Finance',
    icon: '📊',
    description: 'Reports, loans, accounts',
    examples: 'Financial reports, loan documents, prospectuses, annual statements',
    persona: `You are a quantitative financial analyst. Help users understand financial documents. Focus on: key financial metrics and ratios, revenue, profit and cash flow trends, risk factors and their potential impact, debt structure and obligations, and any anomalies or items requiring scrutiny. Be precise with numbers. Contextualise metrics against industry norms where relevant.`,
    summaryStructure: [
      { key: 'overview', label: 'Overview', icon: 'document' },
      { key: 'key_metrics', label: 'Key Metrics', icon: 'chart' },
      { key: 'risks', label: 'Risk Factors', icon: 'warning' },
      { key: 'obligations', label: 'Financial Obligations', icon: 'dollar' },
      { key: 'anomalies', label: 'Items to Note', icon: 'eye' },
    ],
    chatStarters: [
      'What are the key financial metrics?',
      'What are the main risk factors?',
      'What is the debt structure?',
      'Are there any anomalies or red flags?',
    ],
  },
  medical: {
    label: 'Medical',
    icon: '🏥',
    description: 'Clinical, health, research',
    examples: 'Clinical studies, drug information, discharge summaries, health research',
    persona: `You are a clinical documentation specialist. Help users understand medical documents. Focus on: diagnoses and clinical findings, treatment plans and medications, contraindications and drug interactions, dosages and administration, and patient outcomes and follow-up. Present information clearly for both clinical and non-clinical audiences. Always flag critical safety information prominently.`,
    summaryStructure: [
      { key: 'overview', label: 'Overview', icon: 'document' },
      { key: 'findings', label: 'Clinical Findings', icon: 'stethoscope' },
      { key: 'treatments', label: 'Treatments & Medications', icon: 'pill' },
      { key: 'risks', label: 'Risks & Contraindications', icon: 'warning' },
      { key: 'followup', label: 'Follow-up Required', icon: 'calendar' },
    ],
    chatStarters: [
      'What is the primary diagnosis or finding?',
      'What treatments are recommended?',
      'Are there any contraindications or drug interactions?',
      'What follow-up is required?',
    ],
  },
  business: {
    label: 'Business',
    icon: '💼',
    description: 'Reports, proposals, meeting notes',
    examples: 'Meeting notes, proposals, strategies, market reports, board presentations',
    persona: `You are a strategic business analyst. Help users extract actionable intelligence from business documents. Focus on: key decisions and outcomes, action items and owners, strategic opportunities and risks, timelines and milestones, and financial implications. Be concise and action-oriented. Surface what matters most for decision-making.`,
    summaryStructure: [
      { key: 'overview', label: 'Overview', icon: 'document' },
      { key: 'decisions', label: 'Key Decisions', icon: 'check' },
      { key: 'actions', label: 'Action Items', icon: 'list' },
      { key: 'risks', label: 'Risks & Opportunities', icon: 'warning' },
      { key: 'timeline', label: 'Timeline', icon: 'calendar' },
    ],
    chatStarters: [
      'What were the key decisions made?',
      'What are the action items and who owns them?',
      'What are the main risks and opportunities?',
      'What is the timeline for next steps?',
    ],
  },
}

export function getPersona(mode: Mode): string {
  return MODES[mode].persona
}

export function getSummaryStructure(mode: Mode): SummarySection[] {
  return MODES[mode].summaryStructure
}

export function getChatStarters(mode: Mode): string[] {
  return MODES[mode].chatStarters
}

export function buildSummaryPrompt(mode: Mode): string {
  const structure = getSummaryStructure(mode)
  const extraKeys = structure.slice(2).map(s => `"${s.key}": ["point 1", "point 2", "point 3"]`).join(',\n  ')
  return `${getPersona(mode)}

Summarise the provided document. Respond with valid JSON only — no markdown, no explanation outside the JSON.

{
  "overview": ["key point 1", "key point 2", "key point 3"],
  "key_terms": [{"term": "Term", "definition": "Definition", "page": 1}],
  ${extraKeys}
}`
}

export function buildActionsPrompt(mode: Mode, documentName: string): string {
  return `${getPersona(mode)}

Based on the document "${documentName}", suggest 4-6 specific content generation actions a user would find valuable.
Each action must be relevant to this document's actual content — not generic.

Respond with valid JSON only:
{
  "actions": [
    {"id": "action_1", "label": "Short label (3-5 words)", "description": "One sentence describing what this generates"}
  ]
}`
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/lib/__tests__/modes.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/modes.ts src/lib/__tests__/modes.test.ts
git commit -m "feat: add mode definitions, personas, and prompt builders"
```

---

## Task 4: extractor.ts — Unified File → Text

**Files:**
- Create: `src/lib/extractor.ts`
- Create: `src/lib/__tests__/extractor.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/extractor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { detectFileType, isLargeDocument, type ExtractionResult } from '../extractor'

describe('detectFileType', () => {
  it('detects pdf', () => expect(detectFileType('report.pdf')).toBe('pdf'))
  it('detects docx', () => expect(detectFileType('doc.docx')).toBe('docx'))
  it('detects xlsx', () => expect(detectFileType('sheet.xlsx')).toBe('xlsx'))
  it('detects xls', () => expect(detectFileType('sheet.xls')).toBe('xlsx'))
  it('detects csv', () => expect(detectFileType('data.csv')).toBe('csv'))
  it('detects png as image', () => expect(detectFileType('photo.png')).toBe('image'))
  it('detects jpg as image', () => expect(detectFileType('photo.jpg')).toBe('image'))
  it('detects txt', () => expect(detectFileType('notes.txt')).toBe('txt'))
  it('defaults unknown to txt', () => expect(detectFileType('file.xyz')).toBe('txt'))
})

describe('isLargeDocument', () => {
  it('returns false for 80 pages', () => expect(isLargeDocument(80)).toBe(false))
  it('returns true for 81 pages', () => expect(isLargeDocument(81)).toBe(true))
  it('returns false for 0 pages', () => expect(isLargeDocument(0)).toBe(false))
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run src/lib/__tests__/extractor.test.ts
```

Expected: FAIL — `Cannot find module '../extractor'`

- [ ] **Step 3: Create extractor.ts**

Create `src/lib/extractor.ts`:

```typescript
export type FileType = 'pdf' | 'docx' | 'xlsx' | 'csv' | 'image' | 'txt'

export interface ExtractionResult {
  text: string
  pageCount: number
  fileType: FileType
  isLarge: boolean
}

const LARGE_DOC_THRESHOLD = 80

export function detectFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'csv') return 'csv'
  if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'].includes(ext)) return 'image'
  return 'txt'
}

export function isLargeDocument(pageCount: number): boolean {
  return pageCount > LARGE_DOC_THRESHOLD
}

export async function extractFromBuffer(
  buffer: Buffer,
  filename: string
): Promise<ExtractionResult> {
  const fileType = detectFileType(filename)

  switch (fileType) {
    case 'pdf':   return extractPdf(buffer)
    case 'docx':  return extractDocx(buffer)
    case 'xlsx':  return extractExcel(buffer)
    case 'csv':   return extractCsv(buffer)
    case 'image': return extractImage(buffer)
    default:      return extractPlainText(buffer)
  }
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs' as string)
  const uint8 = new Uint8Array(buffer)
  const pdf = await getDocument({ data: uint8 }).promise
  const pageCount = pdf.numPages
  const isLarge = isLargeDocument(pageCount)

  const pagesToExtract = isLarge ? Math.min(20, pageCount) : pageCount
  const pageTexts: string[] = []

  for (let i = 1; i <= pagesToExtract; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .filter((item: { str?: string }) => 'str' in item)
      .map((item: { str: string }) => item.str)
      .join(' ')
    pageTexts.push(pageText)
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount,
    fileType: 'pdf',
    isLarge,
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  const text = result.value
  const approxPageCount = Math.ceil(text.split(' ').length / 300)
  return {
    text,
    pageCount: approxPageCount,
    fileType: 'docx',
    isLarge: isLargeDocument(approxPageCount),
  }
}

async function extractExcel(buffer: Buffer): Promise<ExtractionResult> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sections: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    if (csv.trim()) sections.push(`## Sheet: ${sheetName}\n\n${csv}`)
  }

  const text = sections.join('\n\n')
  return { text, pageCount: workbook.SheetNames.length, fileType: 'xlsx', isLarge: false }
}

async function extractCsv(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8')
  return { text, pageCount: 1, fileType: 'csv', isLarge: false }
}

async function extractImage(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const Tesseract = await import('tesseract.js')
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng')
    return { text: text.trim() || '[No text detected in image]', pageCount: 1, fileType: 'image', isLarge: false }
  } catch {
    return { text: '[Image: OCR extraction failed]', pageCount: 1, fileType: 'image', isLarge: false }
  }
}

async function extractPlainText(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8')
  const approxPageCount = Math.ceil(text.split(' ').length / 300)
  return { text, pageCount: approxPageCount, fileType: 'txt', isLarge: isLargeDocument(approxPageCount) }
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
npx vitest run src/lib/__tests__/extractor.test.ts
```

Expected: All tests PASS (pure-function tests only — extraction functions tested manually)

- [ ] **Step 5: Commit**

```bash
git add src/lib/extractor.ts src/lib/__tests__/extractor.test.ts
git commit -m "feat: add unified file extractor (PDF, DOCX, Excel, CSV, image OCR)"
```

---

## Task 5: rag.ts Skeleton + Update groq.ts

**Files:**
- Create: `src/lib/rag.ts`
- Modify: `src/lib/groq.ts`

- [ ] **Step 1: Create RAG skeleton**

Create `src/lib/rag.ts`:

```typescript
// RAG skeleton — replace with Supabase pgvector implementation for large doc support
// See spec: docs/superpowers/specs/2026-04-25-docmind-design.md section 7

export async function embedChunks(_chunks: string[], _docId: string): Promise<void> {
  // TODO:
  // 1. Enable pgvector extension in Supabase
  // 2. Create document_embeddings table (id, doc_id, chunk_text, embedding vector(1536), page_ref)
  // 3. Embed via OpenAI text-embedding-3-small
  // 4. Upsert vectors into document_embeddings
  throw new Error('RAG embedChunks not yet implemented')
}

export async function retrieveRelevant(
  _query: string,
  _docId: string,
  _topK = 5
): Promise<string> {
  // TODO:
  // 1. Embed query with same model
  // 2. Cosine similarity search: select chunk_text from document_embeddings
  //    where doc_id = $1 order by embedding <=> $2 limit $3
  // 3. Return joined chunk texts
  return '[RAG not implemented — large document context is truncated]'
}
```

- [ ] **Step 2: Update groq.ts to use modes.ts**

Replace `src/lib/groq.ts` with:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/rag.ts src/lib/groq.ts
git commit -m "feat: add RAG skeleton and update groq.ts with mode-aware prompts"
```

---

## Task 6: app-state API Route

**Files:**
- Create: `src/app/api/app-state/route.ts`

- [ ] **Step 1: Create route**

Create `src/app/api/app-state/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('app_state')
    .select('*')
    .eq('id', 1)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return defaults if no row exists yet
  return NextResponse.json(data ?? {
    id: 1,
    active_mode: null,
    onboarding_done: false,
    theme: 'light',
    sidebar_collapsed: false,
  })
}

export async function PATCH(req: Request) {
  const supabase = createServerClient()
  const body = await req.json() as Record<string, unknown>

  const allowed = ['active_mode', 'onboarding_done', 'theme', 'sidebar_collapsed']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('app_state')
    .upsert({ id: 1, ...updates })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Verify route responds correctly**

```bash
cd C:\Users\acer\Documents\projects\idp-platform\docmind-app
npm run dev
```

In a new terminal:
```bash
curl http://localhost:3000/api/app-state
```

Expected: `{"id":1,"active_mode":null,"onboarding_done":false,"theme":"light","sidebar_collapsed":false}`

- [ ] **Step 3: Test PATCH**

```bash
curl -X PATCH http://localhost:3000/api/app-state \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark"}'
```

Expected: JSON with `"theme":"dark"`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/app-state/
git commit -m "feat: add app-state GET/PATCH API route"
```

---

## Task 7: useAppState + useDocuments Hooks

**Files:**
- Create: `src/hooks/useAppState.ts`
- Create: `src/hooks/useDocuments.ts`

- [ ] **Step 1: Create useAppState**

Create `src/hooks/useAppState.ts`:

```typescript
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
```

- [ ] **Step 2: Create useDocuments**

Create `src/hooks/useDocuments.ts`:

```typescript
'use client'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase'

export interface Document {
  id: string
  name: string
  mode: string
  file_type: string
  storage_path: string | null
  full_text: string | null
  page_count: number
  file_size: number
  is_large: boolean
  summary_json: Record<string, unknown> | null
  suggested_actions: Array<{ id: string; label: string; description: string }> | null
  starred: boolean
  created_at: string
}

async function fetchDocuments(): Promise<Document[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as Document[]) ?? []
}

export function useDocuments() {
  const { data, mutate, error, isLoading } = useSWR<Document[]>('documents', fetchDocuments)

  function addOptimistic(doc: Document) {
    mutate(prev => [doc, ...(prev ?? [])], false)
  }

  async function toggleStar(id: string) {
    const doc = data?.find(d => d.id === id)
    if (!doc) return
    const supabase = createClient()
    mutate(
      async (prev) => {
        await supabase.from('documents').update({ starred: !doc.starred }).eq('id', id)
        return (prev ?? []).map(d => d.id === id ? { ...d, starred: !d.starred } : d)
      },
      { optimisticData: (data ?? []).map(d => d.id === id ? { ...d, starred: !d.starred } : d) }
    )
  }

  async function deleteDocument(id: string) {
    const supabase = createClient()
    mutate(
      async (prev) => {
        await supabase.from('documents').delete().eq('id', id)
        return (prev ?? []).filter(d => d.id !== id)
      },
      { optimisticData: (data ?? []).filter(d => d.id !== id) }
    )
  }

  return {
    documents: data ?? [],
    loading: isLoading,
    error,
    refetch: () => mutate(),
    addOptimistic,
    toggleStar,
    deleteDocument,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add useAppState and useDocuments hooks"
```

---

## Task 8: Update Upload API Route

**Files:**
- Modify: `src/app/api/documents/upload/route.ts`

- [ ] **Step 1: Replace upload route**

Replace the entire contents of `src/app/api/documents/upload/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { extractFromBuffer } from '@/lib/extractor'
import { summarizeDocument, suggestActions } from '@/lib/groq'
import type { Mode } from '@/lib/modes'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = createServerClient()
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as Mode | null) ?? 'business'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 1. Extract text
  const extraction = await extractFromBuffer(buffer, file.name)

  // 2. Generate summary and suggested actions (non-fatal)
  const groqKeyValid = process.env.GROQ_API_KEY?.startsWith('gsk_') &&
    (process.env.GROQ_API_KEY?.length ?? 0) > 20

  let summaryJson = null
  let suggestedActions: Array<{ id: string; label: string; description: string }> = []

  if (groqKeyValid && extraction.text.length > 50) {
    const [summary, actions] = await Promise.allSettled([
      summarizeDocument(extraction.text, mode),
      suggestActions(extraction.text, file.name, mode),
    ])
    summaryJson = summary.status === 'fulfilled' ? summary.value : null
    suggestedActions = actions.status === 'fulfilled' ? actions.value : []
  }

  // 3. Upload file to Supabase Storage
  const storagePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, { contentType: file.type })

  const storedPath = storageError ? null : storagePath

  // 4. Insert document row
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: file.name,
      mode,
      file_type: extraction.fileType,
      storage_path: storedPath,
      full_text: extraction.isLarge ? null : extraction.text,
      page_count: extraction.pageCount,
      file_size: file.size,
      is_large: extraction.isLarge,
      summary_json: summaryJson,
      suggested_actions: suggestedActions.length > 0 ? suggestedActions : null,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json(doc)
}
```

- [ ] **Step 2: Test upload manually**

Ensure dev server is running (`npm run dev`), then upload a PDF via the dashboard. Check Supabase Table Editor → `documents` table to confirm a row was inserted with `summary_json` and `suggested_actions` populated.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/upload/route.ts
git commit -m "feat: update upload route to use extractor.ts and generate suggested_actions"
```

---

## Task 9: Update Chat API Route

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Replace chat route**

Replace the entire contents of `src/app/api/chat/route.ts`:

```typescript
import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { groq, MODEL, MAX_CONTEXT_CHARS } from '@/lib/groq'
import { getPersona, type Mode } from '@/lib/modes'
import { retrieveRelevant } from '@/lib/rag'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey?.startsWith('gsk_') || apiKey.length < 20) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured. Add it to .env.local.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createServerClient()
  const { messages, documentId } = await req.json() as {
    messages: UIMessage[]
    documentId: string
  }

  // Fetch document
  const { data: doc } = await supabase
    .from('documents')
    .select('name, full_text, is_large, mode')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Build context
  let context: string
  if (doc.is_large) {
    const lastMsg = messages[messages.length - 1]
    const lastText = typeof lastMsg?.content === 'string'
      ? lastMsg.content
      : lastMsg?.parts?.find((p: { type: string }) => p.type === 'text')?.text ?? ''
    context = await retrieveRelevant(lastText, documentId)
  } else {
    context = (doc.full_text ?? '').slice(0, MAX_CONTEXT_CHARS)
  }

  const mode = (doc.mode as Mode) ?? 'business'
  const persona = getPersona(mode)

  const systemPrompt = `${persona}

You are answering questions about the document: "${doc.name}".
Answer based only on the document content provided. If the answer is not in the document, say so clearly.
When citing information, reference the relevant section or concept from the document.

Document content:
${context}`

  // Convert UIMessages to model messages (AI SDK v6)
  const modelMessages = convertToModelMessages(messages)

  // Extract last user text for persistence
  const lastUserText = (() => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'user') return ''
    if (typeof last.content === 'string') return last.content
    return last.parts?.find((p: { type: string; text?: string }) => p.type === 'text')?.text ?? ''
  })()

  const result = streamText({
    model: groq(MODEL),
    system: systemPrompt,
    messages: modelMessages,
    maxTokens: 1200,
    onFinish: async ({ text }) => {
      if (!lastUserText) return
      await supabase.from('chat_messages').insert([
        { document_id: documentId, role: 'user', content: lastUserText },
        { document_id: documentId, role: 'assistant', content: text },
      ])
    },
  })

  return result.toUIMessageStreamResponse()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: update chat route with mode persona and message persistence"
```

---

## Task 10: Update Generate API Route

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Replace generate route**

Replace the entire contents of `src/app/api/generate/route.ts`:

```typescript
import { streamText } from 'ai'
import { groq, MODEL, MAX_CONTEXT_CHARS } from '@/lib/groq'
import { getPersona, type Mode } from '@/lib/modes'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey?.startsWith('gsk_') || apiKey.length < 20) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY is not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createServerClient()
  const { documentId, type, label, description, length = 'medium', tone = 'formal' } =
    await req.json() as {
      documentId: string
      type: string
      label: string
      description: string
      length?: 'short' | 'medium' | 'long'
      tone?: 'formal' | 'neutral' | 'casual'
    }

  const { data: doc } = await supabase
    .from('documents')
    .select('name, full_text, mode')
    .eq('id', documentId)
    .single()

  if (!doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const mode = (doc.mode as Mode) ?? 'business'
  const context = (doc.full_text ?? '').slice(0, MAX_CONTEXT_CHARS)

  const lengthGuide = { short: '200-300 words', medium: '400-600 words', long: '800-1200 words' }[length]
  const toneGuide = { formal: 'formal and professional', neutral: 'clear and neutral', casual: 'conversational and accessible' }[tone]

  const systemPrompt = `${getPersona(mode)}

Generate the following from the document "${doc.name}": ${label}
${description}

Requirements:
- Length: ${lengthGuide}
- Tone: ${toneGuide}
- Format: Use Markdown (headings, bullet points, bold for key terms)
- Base your response entirely on the document content below

Document content:
${context}`

  const result = streamText({
    model: groq(MODEL),
    system: systemPrompt,
    prompt: `Generate: ${label}`,
    maxTokens: 2000,
    onFinish: async ({ text }) => {
      await supabase.from('generated_outputs').insert({
        document_id: documentId,
        type,
        content: text,
        length,
        tone,
      })
    },
  })

  return result.toTextStreamResponse()
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: update generate route with type-specific prompts and output persistence"
```

---

## Task 11: UI Primitives + Icons

**Files:**
- Modify: `src/components/ui/primitives.tsx`
- Modify: `src/components/ui/icons.tsx`

- [ ] **Step 1: Replace primitives.tsx**

Replace `src/components/ui/primitives.tsx`:

```typescript
'use client'
import { type HTMLAttributes, type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react'
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
```

- [ ] **Step 2: Replace icons.tsx with prototype icon set**

Replace `src/components/ui/icons.tsx`:

```typescript
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }
const icon = (path: string) => ({ size = 14, ...props }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path.split('|').map((d, i) => <path key={i} d={d} />)}
  </svg>
)

export const HomeIcon        = icon('M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2z')
export const FolderIcon      = icon('M2 4.5a1 1 0 011-1h3.5l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1z')
export const FileIcon        = icon('M4 2h5.5L12 4.5V14H4V2z|M9.5 2v3H12')
export const ChatIcon        = icon('M2 3.5h12v7.5H9l-3 2v-2H2z')
export const SparkleIcon     = icon('M8 1v3|M8 12v3|M1 8h3|M12 8h3|M3.5 3.5l2 2|M10.5 10.5l2 2|M10.5 3.5l-2 2|M5.5 8.5l-2 2')
export const StarIcon        = icon('M8 1l1.8 4h4.2l-3.4 2.5 1.3 4L8 9 4.1 11.5l1.3-4L2 5h4.2z')
export const PlusIcon        = icon('M8 2v12|M2 8h12')
export const ChevronRightIcon= icon('M6 4l4 4 -4 4')
export const ChevronDownIcon = icon('M4 6l4 4 4 -4')
export const ChevronLeftIcon = icon('M10 4L6 8l4 4')
export const UploadIcon      = icon('M8 10V3|M5 6l3-3 3 3|M3 12h10')
export const DownloadIcon    = icon('M8 3v7|M5 7l3 3 3-3|M3 12h10')
export const ShareIcon       = icon('M11 2a2 2 0 100 4 2 2 0 000-4zM5 8a2 2 0 100 4 2 2 0 000-4zM11 10a2 2 0 100 4 2 2 0 000-4z|M7 9.5l-4.5 3.5|M7 6.5L11.5 4')
export const CopyIcon        = icon('M11 4H5a1 1 0 00-1 1v8a1 1 0 001 1h6a1 1 0 001-1V5a1 1 0 00-1-1z|M10 4V3H4a1 1 0 00-1 1v8')
export const TrashIcon       = icon('M2 4h12|M6 4V2h4v2|M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4')
export const SearchIcon      = icon('M7 12A5 5 0 107 2a5 5 0 000 10z|M11 11l3 3')
export const SettingsIcon    = icon('M8 10a2 2 0 100-4 2 2 0 000 4z|M13.2 8c0-.2 0-.3-.1-.5l1.4-1.1-1.4-2.4-1.7.7c-.3-.2-.6-.4-.9-.5L10 2H7.9l-.5 2.2c-.3.1-.6.3-.9.5l-1.7-.7L3.4 6.5l1.4 1.1c0 .2-.1.3-.1.5s0 .3.1.5L3.4 9.5l1.4 2.4 1.7-.7c.3.2.6.4.9.5l.5 2.2H10l.5-2.2c.3-.1.6-.3.9-.5l1.7.7 1.4-2.4-1.4-1.1c.1-.2.1-.3.1-.5z')
export const SunIcon         = icon('M8 4V2|M8 14v-2|M4 8H2|M14 8h-2|M5.5 5.5l-1.4-1.4|M11.9 11.9l-1.4-1.4|M5.5 10.5l-1.4 1.4|M11.9 4.1l-1.4 1.4|M8 11a3 3 0 100-6 3 3 0 000 6z')
export const MoonIcon        = icon('M6 2a6 6 0 106 10.4A7 7 0 016 2z')
export const DotsIcon        = icon('M4 8a1 1 0 100-2 1 1 0 000 2z|M8 8a1 1 0 100-2 1 1 0 000 2z|M12 8a1 1 0 100-2 1 1 0 000 2z')
export const HighlightIcon   = icon('M10.5 2l3.5 3.5-7 7H3.5V9z|M7.5 4.5l4 4')
export const SendIcon        = icon('M2 8l12-6-4 12-3-4.5z|M14 2L8 8')
export const RefreshIcon     = icon('M12.5 3.5A6 6 0 012 8h2|M3.5 12.5A6 6 0 0014 8h-2|M2 5V3h2|M12 13h2v-2')
export const XIcon           = icon('M3 3l10 10|M13 3L3 13')
export const CheckIcon       = icon('M2.5 8l4 4 7 -7')
export const WarningIcon     = icon('M8 2L1 14h14L8 2z|M8 6v4|M8 11.5v1')
export const EyeIcon         = icon('M1 8s3-6 7-6 7 6 7 6-3 6-7 6-7-6-7-6z|M8 10a2 2 0 100-4 2 2 0 000 4z')
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add Button, Card, Chip, Segmented, Modal primitives and full icon set"
```

---

## Task 12: ModeSelect Onboarding Component

**Files:**
- Create: `src/components/onboarding/ModeSelect.tsx`

- [ ] **Step 1: Create ModeSelect**

Create `src/components/onboarding/ModeSelect.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/onboarding/
git commit -m "feat: add ModeSelect onboarding screen"
```

---

## Task 13: ModeSwitcher Bottom Sheet

**Files:**
- Create: `src/components/mode/ModeSwitcher.tsx`

- [ ] **Step 1: Create ModeSwitcher**

Create `src/components/mode/ModeSwitcher.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/mode/
git commit -m "feat: add ModeSwitcher bottom-sheet component"
```

---

## Task 14: Sidebar Update

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace Sidebar**

Replace the entire contents of `src/components/layout/Sidebar.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { MODES, type Mode } from '@/lib/modes'
import { ModeSwitcher } from '@/components/mode/ModeSwitcher'
import { Button } from '@/components/ui/primitives'
import {
  HomeIcon, FolderIcon, ChatIcon, SearchIcon,
  ChevronRightIcon, StarIcon, SunIcon, MoonIcon, SparkleIcon,
} from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import { clsx } from 'clsx'

interface SidebarProps {
  view: 'dashboard' | 'workspace'
  onViewChange: (view: 'dashboard' | 'workspace') => void
  onDocSelect: (id: string) => void
  recentDocs: Document[]
}

export function Sidebar({ view, onViewChange, onDocSelect, recentDocs }: SidebarProps) {
  const { state, setTheme, setMode, setSidebarCollapsed } = useAppState()
  const [search, setSearch] = useState('')
  const [modeSwitcherOpen, setModeSwitcherOpen] = useState(false)

  const collapsed = state?.sidebar_collapsed ?? false
  const activeMode = state?.active_mode as Mode | null
  const theme = state?.theme ?? 'light'

  const filtered = recentDocs
    .filter(d => search ? d.name.toLowerCase().includes(search.toLowerCase()) : true)
    .slice(0, 7)

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'workspace' as const, label: 'Workspace', icon: <FolderIcon /> },
  ]

  const thumbColors = ['#c85a3b', '#6b7eb5', '#5a8e6e', '#b58b4f', '#8a7a9e']

  return (
    <>
      <aside
        className="flex flex-col h-full bg-[var(--bg-raised)] border-r border-[var(--border)] transition-[width] duration-200 shrink-0 overflow-hidden"
        style={{ width: collapsed ? 56 : 228 }}
      >
        {/* Logo */}
        <div className={clsx('flex items-center h-12 px-3 border-b border-[var(--border)] shrink-0', collapsed ? 'justify-center' : 'gap-2')}>
          <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center shrink-0">
            <SparkleIcon size={12} className="text-white" />
          </div>
          {!collapsed && <span className="font-semibold text-sm text-[var(--text)] truncate">DocMind AI</span>}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-[var(--radius-sm)]">
              <SearchIcon size={12} className="text-[var(--text-muted)] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents…"
                className="flex-1 text-xs bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="px-2 pt-2 shrink-0">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors duration-100 mb-0.5',
                view === item.id
                  ? 'bg-[var(--bg-active)] text-[var(--text)] font-medium'
                  : 'text-[var(--text-soft)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Recent docs */}
        {!collapsed && filtered.length > 0 && (
          <div className="flex-1 overflow-y-auto px-2 pt-4 min-h-0">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] px-2 mb-1.5 font-medium">Recent</p>
            {filtered.map((doc, i) => (
              <button
                key={doc.id}
                onClick={() => onDocSelect(doc.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] group mb-0.5"
              >
                <span
                  className="w-5 h-5 rounded-[4px] shrink-0 flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ background: thumbColors[i % thumbColors.length] }}
                >
                  {doc.file_type.toUpperCase().slice(0, 2)}
                </span>
                <span className="flex-1 text-xs text-[var(--text-soft)] group-hover:text-[var(--text)] truncate text-left">{doc.name}</span>
                {doc.starred && <StarIcon size={10} className="text-[var(--accent)] shrink-0" />}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className={clsx('px-2 pb-3 pt-2 border-t border-[var(--border)] shrink-0 mt-auto', collapsed ? 'flex flex-col items-center gap-2' : 'space-y-1')}>
          {/* Mode chip */}
          {!collapsed && activeMode && (
            <button
              onClick={() => setModeSwitcherOpen(true)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] group"
            >
              <span className="text-base leading-none">{MODES[activeMode].icon}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[11px] font-medium text-[var(--text)] truncate">{MODES[activeMode].label} mode</div>
                <div className="text-[10px] text-[var(--text-muted)]">Tap to change</div>
              </div>
            </button>
          )}

          {/* Theme + collapse */}
          <div className={clsx('flex gap-1', collapsed ? 'flex-col' : '')}>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="flex-1 flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              title="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon size={13} /> : <SunIcon size={13} />}
            </button>
            <button
              onClick={() => setSidebarCollapsed(!collapsed)}
              className="flex-1 flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRightIcon size={13} className={collapsed ? '' : 'rotate-180'} />
            </button>
          </div>
        </div>
      </aside>

      {activeMode && (
        <ModeSwitcher
          open={modeSwitcherOpen}
          currentMode={activeMode}
          onSwitch={(m) => setMode(m as Mode)}
          onClose={() => setModeSwitcherOpen(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: update Sidebar with mode chip, search, theme toggle, collapse"
```

---

## Task 15: Dashboard — UploadZone + DocCard + WorkspaceRail + Dashboard

**Files:**
- Create: `src/components/dashboard/UploadZone.tsx`
- Create: `src/components/dashboard/DocCard.tsx`
- Create: `src/components/dashboard/WorkspaceRail.tsx`
- Modify: `src/components/dashboard/Dashboard.tsx`

- [ ] **Step 1: Create UploadZone**

Create `src/components/dashboard/UploadZone.tsx`:

```typescript
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
```

- [ ] **Step 2: Create DocCard**

Create `src/components/dashboard/DocCard.tsx`:

```typescript
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
```

- [ ] **Step 3: Create WorkspaceRail**

Create `src/components/dashboard/WorkspaceRail.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button, Chip } from '@/components/ui/primitives'
import { FolderIcon, PlusIcon, XIcon } from '@/components/ui/icons'
import type { Mode } from '@/lib/modes'
import { MODES } from '@/lib/modes'

interface Workspace {
  id: string
  name: string
  mode: string
  created_at: string
}

interface WorkspaceRailProps {
  activeMode: Mode
}

export function WorkspaceRail({ activeMode }: WorkspaceRailProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('workspaces').select('*').order('created_at').then(({ data }) => {
      if (data) setWorkspaces(data as Workspace[])
    })
  }, [])

  async function createWorkspace() {
    if (!newName.trim()) return
    const { data } = await supabase
      .from('workspaces')
      .insert({ name: newName.trim(), mode: activeMode })
      .select()
      .single()
    if (data) setWorkspaces(ws => [...ws, data as Workspace])
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-2 min-w-max">
        {workspaces.map(ws => {
          const m = MODES[ws.mode as Mode]
          return (
            <div
              key={ws.id}
              className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] hover:border-[var(--border-strong)] cursor-pointer transition-colors"
            >
              <FolderIcon size={13} className="text-[var(--text-muted)] shrink-0" />
              <span className="text-xs font-medium text-[var(--text)] whitespace-nowrap">{ws.name}</span>
              {m && <Chip color="accent" size="sm">{m.label}</Chip>}
            </div>
          )
        })}

        {creating ? (
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-[var(--bg-raised)] border border-[var(--accent)] rounded-[var(--radius)]">
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createWorkspace(); if (e.key === 'Escape') setCreating(false) }}
              placeholder="Workspace name"
              className="text-xs bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none w-28"
            />
            <button onClick={() => setCreating(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              <XIcon size={11} />
            </button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setCreating(true)}>
            <PlusIcon size={12} />
            New workspace
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Replace Dashboard.tsx**

Replace `src/components/dashboard/Dashboard.tsx`:

```typescript
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
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add UploadZone, DocCard, WorkspaceRail, update Dashboard"
```

---

## Task 16: Workspace — DocListPanel + AIPanel Shell

**Files:**
- Create: `src/components/workspace/DocListPanel.tsx`
- Create: `src/components/workspace/AIPanel.tsx`
- Modify: `src/components/workspace/Workspace.tsx`

- [ ] **Step 1: Create DocListPanel**

Create `src/components/workspace/DocListPanel.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useDocuments } from '@/hooks/useDocuments'
import { FileIcon, StarIcon, PlusIcon } from '@/components/ui/icons'
import { Chip } from '@/components/ui/primitives'
import type { Document } from '@/hooks/useDocuments'
import { MODES } from '@/lib/modes'
import type { Mode } from '@/lib/modes'
import { clsx } from 'clsx'

interface Workspace {
  id: string
  name: string
  mode: string
}

interface DocListPanelProps {
  activeDocId: string | null
  onSelect: (id: string) => void
}

export function DocListPanel({ activeDocId, onSelect }: DocListPanelProps) {
  const { documents } = useDocuments()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWs, setSelectedWs] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('workspaces').select('*').order('created_at').then(({ data }) => {
      if (data) setWorkspaces(data as Workspace[])
    })
  }, [])

  const filtered = selectedWs
    ? documents.filter(d => {
        // Would need workspace_documents join — simplified: show all for MVP
        return true
      })
    : documents

  const THUMB_COLORS = ['#c85a3b', '#6b7eb5', '#5a8e6e', '#b58b4f', '#8a7a9e']

  return (
    <div className="flex flex-col h-full w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-raised)] overflow-hidden">
      {/* Workspace selector */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedWs(null)}
            className={clsx('text-[11px] px-2 py-1 rounded-full whitespace-nowrap transition-colors', !selectedWs ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}
          >
            All
          </button>
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => setSelectedWs(ws.id)}
              className={clsx('text-[11px] px-2 py-1 rounded-full whitespace-nowrap transition-colors', selectedWs === ws.id ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}
            >
              {ws.name}
            </button>
          ))}
        </div>
      </div>

      {/* Doc list */}
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <FileIcon size={20} className="text-[var(--border-strong)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No documents</p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const modeConfig = MODES[doc.mode as Mode]
            const isActive = doc.id === activeDocId
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={clsx(
                  'w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-100',
                  isActive ? 'bg-[var(--bg-active)]' : 'hover:bg-[var(--bg-hover)]'
                )}
              >
                <span
                  className="w-7 h-7 rounded-[5px] shrink-0 flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
                  style={{ background: THUMB_COLORS[i % THUMB_COLORS.length] }}
                >
                  {doc.file_type.toUpperCase().slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--text)] truncate leading-snug">{doc.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {modeConfig && <span className="text-[10px] text-[var(--text-muted)]">{modeConfig.label}</span>}
                    <span className="text-[10px] text-[var(--text-muted)]">· {doc.page_count}p</span>
                  </div>
                </div>
                {doc.starred && <StarIcon size={10} className="text-[var(--accent)] shrink-0 mt-1" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AIPanel**

Create `src/components/workspace/AIPanel.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { SummaryTab } from './SummaryTab'
import { ChatTab } from './ChatTab'
import { GenerateTab } from './GenerateTab'
import { SparkleIcon, ChatIcon, FileIcon } from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import { clsx } from 'clsx'

type Tab = 'summary' | 'generate' | 'chat'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'summary',  label: 'Summary',  icon: <FileIcon size={12} /> },
  { id: 'generate', label: 'Generate', icon: <SparkleIcon size={12} /> },
  { id: 'chat',     label: 'Chat',     icon: <ChatIcon size={12} /> },
]

interface AIPanelProps {
  doc: Document
  mode: Mode
}

export function AIPanel({ doc, mode }: AIPanelProps) {
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <div className="flex flex-col h-full w-[340px] xl:w-[400px] shrink-0 border-l border-[var(--border)] bg-[var(--bg-raised)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
              tab === t.id
                ? 'text-[var(--accent)] border-[var(--accent)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)]'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {tab === 'summary'  && <SummaryTab doc={doc} mode={mode} />}
        {tab === 'generate' && <GenerateTab doc={doc} mode={mode} onSwitchToChat={() => setTab('chat')} />}
        {tab === 'chat'     && <ChatTab doc={doc} mode={mode} />}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update Workspace.tsx**

Replace `src/components/workspace/Workspace.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import { DocListPanel } from './DocListPanel'
import { AIPanel } from './AIPanel'
import { useDocuments } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/primitives'
import { StarIcon, DownloadIcon, ShareIcon, HighlightIcon } from '@/components/ui/icons'
import { clsx } from 'clsx'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface WorkspaceProps {
  activeDocId: string | null
  onDocSelect: (id: string) => void
  mode: Mode
}

export function Workspace({ activeDocId, onDocSelect, mode }: WorkspaceProps) {
  const { documents, toggleStar } = useDocuments()
  const [pdfPages, setPdfPages] = useState(0)
  const supabase = createClient()

  const doc = documents.find(d => d.id === activeDocId) ?? null

  function getPdfUrl(): string | null {
    if (!doc?.storage_path) return null
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.storage_path)
    return data.publicUrl
  }

  return (
    <div className="flex flex-1 min-w-0 h-full overflow-hidden">
      {/* Left: doc list */}
      <DocListPanel activeDocId={activeDocId} onSelect={onDocSelect} />

      {/* Centre: preview */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {doc ? (
          <>
            {/* Doc header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text)] truncate">{doc.name}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{doc.page_count} pages · {doc.file_type.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => toggleStar(doc.id)} className={doc.starred ? 'text-[var(--accent)]' : ''}>
                  <StarIcon size={13} />
                </Button>
                <Button variant="ghost" size="sm"><HighlightIcon size={13} /></Button>
                <Button variant="ghost" size="sm"><DownloadIcon size={13} /></Button>
                <Button variant="ghost" size="sm"><ShareIcon size={13} /></Button>
              </div>
            </div>

            {/* PDF / text viewer */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-sunken)] p-4">
              {doc.file_type === 'pdf' && getPdfUrl() ? (
                <PdfDocument
                  file={getPdfUrl()!}
                  onLoadSuccess={({ numPages }) => setPdfPages(numPages)}
                  className="flex flex-col items-center gap-3"
                >
                  {Array.from({ length: pdfPages }, (_, i) => (
                    <Page
                      key={i + 1}
                      pageNumber={i + 1}
                      width={560}
                      className="shadow-[var(--shadow-md)] rounded-sm"
                    />
                  ))}
                </PdfDocument>
              ) : doc.full_text ? (
                <div className="max-w-2xl mx-auto bg-[var(--bg-raised)] border border-[var(--border)] rounded-[var(--radius)] p-8 shadow-[var(--shadow-sm)]">
                  <pre className="text-xs text-[var(--text-soft)] whitespace-pre-wrap font-mono leading-relaxed">{doc.full_text.slice(0, 8000)}</pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                  Preview not available
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <p className="text-sm text-[var(--text-soft)]">Select a document from the list</p>
          </div>
        )}
      </div>

      {/* Right: AI panel */}
      {doc && <AIPanel doc={doc} mode={mode} />}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/workspace/
git commit -m "feat: add DocListPanel, AIPanel, update Workspace with PDF viewer"
```

---

## Task 17: SummaryTab

**Files:**
- Modify: `src/components/workspace/SummaryTab.tsx`

- [ ] **Step 1: Replace SummaryTab**

Replace `src/components/workspace/SummaryTab.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { getSummaryStructure, type Mode } from '@/lib/modes'
import { Button, Chip } from '@/components/ui/primitives'
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, SparkleIcon, WarningIcon, CheckIcon } from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import { clsx } from 'clsx'

interface SummaryTabProps {
  doc: Document
  mode: Mode
}

type SeverityColor = 'red' | 'yellow' | 'green' | 'blue' | 'default'

function guessSeverity(key: string): SeverityColor {
  if (key.includes('risk') || key.includes('warning') || key.includes('anomal')) return 'red'
  if (key.includes('deadline') || key.includes('obligation') || key.includes('limit')) return 'yellow'
  if (key.includes('finding') || key.includes('metric') || key.includes('overview')) return 'blue'
  return 'default'
}

export function SummaryTab({ doc, mode }: SummaryTabProps) {
  const structure = getSummaryStructure(mode)
  const summary = doc.summary_json as Record<string, unknown> | null
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <SparkleIcon size={20} className="text-[var(--border-strong)] mb-3 animate-pulse" />
        <p className="text-sm text-[var(--text-soft)]">Generating summary…</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">This may take a moment for larger documents</p>
      </div>
    )
  }

  function toggle(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function copyAll() {
    const lines: string[] = []
    structure.forEach(s => {
      const items = summary[s.key]
      if (!items) return
      lines.push(`## ${s.label}`)
      if (Array.isArray(items)) {
        items.forEach((item: unknown) => {
          if (typeof item === 'string') lines.push(`• ${item}`)
          else if (typeof item === 'object' && item !== null) {
            const obj = item as Record<string, unknown>
            lines.push(`• ${obj.term ?? obj.label ?? JSON.stringify(obj)}`)
          }
        })
      }
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set())}>Expand all</Button>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set(structure.map(s => s.key)))}>Collapse all</Button>
        </div>
        <Button variant="ghost" size="sm" onClick={copyAll}>
          {copied ? <CheckIcon size={12} className="text-emerald-600" /> : <CopyIcon size={12} />}
        </Button>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        {structure.map(section => {
          const items = summary[section.key]
          const isCollapsed = collapsed.has(section.key)
          const count = Array.isArray(items) ? items.length : 0
          const severityColor = guessSeverity(section.key)

          return (
            <div key={section.key} className="border-b border-[var(--border)] last:border-0">
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
              >
                {isCollapsed
                  ? <ChevronRightIcon size={12} className="text-[var(--text-muted)] shrink-0" />
                  : <ChevronDownIcon size={12} className="text-[var(--text-muted)] shrink-0" />
                }
                <span className="flex-1 text-xs font-semibold text-[var(--text)] text-left">{section.label}</span>
                {count > 0 && <Chip color={severityColor} size="sm">{count}</Chip>}
              </button>

              {!isCollapsed && Array.isArray(items) && items.length > 0 && (
                <div className="px-4 pb-3 space-y-1.5">
                  {items.map((item: unknown, i) => {
                    if (typeof item === 'string') {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                          <p className="text-xs text-[var(--text-soft)] leading-relaxed">{item}</p>
                        </div>
                      )
                    }
                    if (typeof item === 'object' && item !== null) {
                      const obj = item as Record<string, unknown>
                      return (
                        <div key={i} className="p-2.5 bg-[var(--bg-sunken)] rounded-[var(--radius-sm)]">
                          {obj.term && <p className="text-xs font-medium text-[var(--text)] mb-0.5">{obj.term as string}</p>}
                          {obj.definition && <p className="text-[11px] text-[var(--text-soft)]">{obj.definition as string}</p>}
                          {obj.page && <p className="text-[10px] text-[var(--text-muted)] mt-1">Page {obj.page as number}</p>}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workspace/SummaryTab.tsx
git commit -m "feat: update SummaryTab with collapsible sections, mode-aware structure, copy"
```

---

## Task 18: ChatTab — Load History + Persist

**Files:**
- Modify: `src/components/workspace/ChatTab.tsx`

- [ ] **Step 1: Replace ChatTab**

Replace `src/components/workspace/ChatTab.tsx`:

```typescript
'use client'
import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { createClient } from '@/lib/supabase'
import { getChatStarters, type Mode } from '@/lib/modes'
import { SendIcon, SparkleIcon, WarningIcon } from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import { clsx } from 'clsx'

interface ChatTabProps {
  doc: Document
  mode: Mode
}

export function ChatTab({ doc, mode }: ChatTabProps) {
  const supabase = createClient()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { documentId: doc.id },
    }),
    id: doc.id,
  })

  const isStreaming = status === 'streaming'

  // Load persisted history on mount
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('document_id', doc.id)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0 && messages.length === 0) {
          setMessages(data.map((m, i) => ({
            id: String(i),
            role: m.role as 'user' | 'assistant',
            content: m.content,
            parts: [{ type: 'text' as const, text: m.content }],
          })))
        }
      })
  }, [doc.id])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const starters = getChatStarters(mode)
  const groqError = error?.message?.toLowerCase().includes('groq') || error?.message?.includes('503')

  function getMessageText(msg: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
    const textPart = msg.parts?.find(p => p.type === 'text')
    return textPart?.text ?? (typeof msg.content === 'string' ? msg.content : '')
  }

  function renderContent(text: string) {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="font-semibold text-[var(--text)]">{part.slice(2, -2)}</strong>
        : <span key={i}>{part}</span>
    )
  }

  function submit() {
    if (!input.trim() || isStreaming) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-[11px] text-[var(--text-muted)] text-center mb-4">Ask anything about this document</p>
            {starters.map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); setTimeout(() => textareaRef.current?.focus(), 50) }}
                className="w-full text-left px-3 py-2 text-xs text-[var(--text-soft)] bg-[var(--bg-sunken)] border border-[var(--border)] rounded-[var(--radius-sm)] hover:border-[var(--border-strong)] hover:text-[var(--text)] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {groqError && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-[var(--radius-sm)]">
            <WarningIcon size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">GROQ_API_KEY not configured. Add it to <code>.env.local</code>.</p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={clsx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <SparkleIcon size={10} className="text-[var(--accent)]" />
              </div>
            )}
            <div
              className={clsx(
                'max-w-[85%] rounded-[var(--radius)] px-3 py-2 text-xs leading-relaxed',
                m.role === 'user'
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-sunken)] text-[var(--text-soft)]'
              )}
            >
              {renderContent(getMessageText(m))}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
              <SparkleIcon size={10} className="text-[var(--accent)]" />
            </div>
            <div className="flex gap-1 px-3 py-2 bg-[var(--bg-sunken)] rounded-[var(--radius)]">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex items-end gap-2 bg-[var(--bg-sunken)] border border-[var(--border)] rounded-[var(--radius)] p-2 focus-within:border-[var(--border-strong)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Ask about this document…"
            rows={1}
            className="flex-1 text-xs bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none resize-none leading-relaxed"
            style={{ maxHeight: 96 }}
          />
          <button
            onClick={submit}
            disabled={isStreaming || !input.trim()}
            className="p-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] text-white disabled:opacity-40 hover:bg-[var(--accent-deep)] transition-colors"
          >
            <SendIcon size={12} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-1 text-center">Shift+Enter for new line</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workspace/ChatTab.tsx
git commit -m "feat: update ChatTab with persisted history, mode starters, streaming"
```

---

## Task 19: GenerateTab — AI-Inferred Templates

**Files:**
- Modify: `src/components/workspace/GenerateTab.tsx`

- [ ] **Step 1: Replace GenerateTab**

Replace `src/components/workspace/GenerateTab.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { useCompletion } from '@ai-sdk/react'
import { Button, Segmented, Card } from '@/components/ui/primitives'
import { SparkleIcon, CopyIcon, DownloadIcon, CheckIcon, WarningIcon, ChatIcon } from '@/components/ui/icons'
import type { Document } from '@/hooks/useDocuments'
import type { Mode } from '@/lib/modes'
import { clsx } from 'clsx'

type Length = 'short' | 'medium' | 'long'
type Tone = 'formal' | 'neutral' | 'casual'

interface SuggestedAction {
  id: string
  label: string
  description: string
}

interface GenerateTabProps {
  doc: Document
  mode: Mode
  onSwitchToChat: () => void
}

function renderMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h2 key={i} className="text-sm font-semibold text-[var(--text)] mb-1 mt-3 first:mt-0">{line.slice(2)}</h2>
    if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-semibold text-[var(--text)] mb-1 mt-2">{line.slice(3)}</h3>
    if (line.startsWith('- ') || line.startsWith('• ')) return (
      <div key={i} className="flex items-start gap-1.5 my-0.5">
        <span className="w-1 h-1 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
        <span className="text-xs text-[var(--text-soft)] leading-relaxed">{line.slice(2)}</span>
      </div>
    )
    if (!line.trim()) return <div key={i} className="h-2" />
    return <p key={i} className="text-xs text-[var(--text-soft)] leading-relaxed my-0.5">{
      line.split(/(\*\*[^*]+\*\*)/).map((p, j) =>
        p.startsWith('**') ? <strong key={j} className="font-semibold text-[var(--text)]">{p.slice(2, -2)}</strong> : p
      )
    }</p>
  })
}

export function GenerateTab({ doc, mode, onSwitchToChat }: GenerateTabProps) {
  const [selected, setSelected] = useState<SuggestedAction | null>(null)
  const [length, setLength] = useState<Length>('medium')
  const [tone, setTone] = useState<Tone>('formal')
  const [copied, setCopied] = useState(false)
  const [output, setOutput] = useState('')

  const actions = (doc.suggested_actions as SuggestedAction[] | null) ?? []

  const { complete, isLoading, error } = useCompletion({
    api: '/api/generate',
    onFinish: (_prompt, completion) => setOutput(completion),
  })

  const groqError = error?.message?.toLowerCase().includes('groq') || error?.message?.includes('503')

  async function generate() {
    if (!selected) return
    setOutput('')
    await complete('generate', {
      body: {
        documentId: doc.id,
        type: selected.id,
        label: selected.label,
        description: selected.description,
        length,
        tone,
      },
    })
  }

  function copyOutput() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadOutput() {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected?.label ?? 'output'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {groqError && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-[var(--radius-sm)]">
            <WarningIcon size={13} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">GROQ_API_KEY not configured.</p>
          </div>
        )}

        {/* Action picker */}
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <SparkleIcon size={18} className="text-[var(--border-strong)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No AI suggestions yet.</p>
            <p className="text-xs text-[var(--text-muted)]">Re-upload the document to generate actions.</p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-[var(--text-muted)] mb-2 font-medium uppercase tracking-wider">AI-suggested actions</p>
            <div className="grid grid-cols-2 gap-1.5">
              {actions.map(action => (
                <button
                  key={action.id}
                  onClick={() => setSelected(action)}
                  className={clsx(
                    'flex flex-col items-start p-2.5 rounded-[var(--radius-sm)] border text-left transition-all duration-100',
                    selected?.id === action.id
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                  )}
                >
                  <span className="text-xs font-medium text-[var(--text)] leading-snug">{action.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        {selected && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Length</span>
              <Segmented
                options={[{ value: 'short', label: 'Short' }, { value: 'medium', label: 'Medium' }, { value: 'long', label: 'Long' }]}
                value={length}
                onChange={setLength}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)]">Tone</span>
              <Segmented
                options={[{ value: 'formal', label: 'Formal' }, { value: 'neutral', label: 'Neutral' }, { value: 'casual', label: 'Casual' }]}
                value={tone}
                onChange={setTone}
              />
            </div>
            <Button
              onClick={generate}
              loading={isLoading}
              disabled={isLoading}
              className="w-full justify-center"
            >
              <SparkleIcon size={12} />
              Generate {selected.label}
            </Button>
          </div>
        )}

        {/* Output */}
        {(output || isLoading) && (
          <Card className="p-4">
            {isLoading && !output ? (
              <div className="space-y-2">
                {[80, 60, 90, 50, 70].map((w, i) => (
                  <div key={i} className="h-2.5 bg-[var(--bg-sunken)] rounded animate-pulse" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-end gap-1 mb-3">
                  <Button variant="ghost" size="sm" onClick={copyOutput}>
                    {copied ? <CheckIcon size={12} className="text-emerald-600" /> : <CopyIcon size={12} />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={downloadOutput}>
                    <DownloadIcon size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onSwitchToChat}>
                    <ChatIcon size={12} />
                  </Button>
                </div>
                <div>{renderMarkdown(output)}</div>
              </>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/workspace/GenerateTab.tsx
git commit -m "feat: update GenerateTab with AI-inferred templates, copy, download"
```

---

## Task 20: Update globals.css + Root page.tsx

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add utility classes to globals.css**

Append to `src/app/globals.css` (after existing content):

```css
@layer utilities {
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .animate-pulse-slow {
    animation: pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-sunken) 25%,
    var(--bg-hover) 50%,
    var(--bg-sunken) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

- [ ] **Step 2: Replace page.tsx**

Replace `src/app/page.tsx`:

```typescript
'use client'
import { useEffect } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useDocuments } from '@/hooks/useDocuments'
import { ModeSelect } from '@/components/onboarding/ModeSelect'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Workspace } from '@/components/workspace/Workspace'
import { useState } from 'react'
import type { Mode } from '@/lib/modes'

export default function Home() {
  const { state, loading, completeOnboarding, setTheme } = useAppState()
  const { documents } = useDocuments()
  const [view, setView] = useState<'dashboard' | 'workspace'>('dashboard')
  const [activeDocId, setActiveDocId] = useState<string | null>(null)

  // Sync theme to DOM
  useEffect(() => {
    if (state?.theme) {
      document.documentElement.dataset.theme = state.theme
    }
  }, [state?.theme])

  function openDoc(id: string) {
    setActiveDocId(id)
    setView('workspace')
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Onboarding
  if (!state?.onboarding_done) {
    return <ModeSelect onSelect={(mode: Mode) => completeOnboarding(mode)} />
  }

  const activeMode = (state.active_mode ?? 'business') as Mode

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar
        view={view}
        onViewChange={setView}
        onDocSelect={openDoc}
        recentDocs={documents.slice(0, 7)}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {view === 'dashboard' ? (
          <Dashboard mode={activeMode} onDocOpen={openDoc} />
        ) : (
          <Workspace activeDocId={activeDocId} onDocSelect={setActiveDocId} mode={activeMode} />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/page.tsx
git commit -m "feat: wire up root page with onboarding gate, sidebar, dashboard, workspace"
```

---

## Task 21: Environment Variables + Final Verification

**Files:**
- Create: `.env.local` (if not exists)

- [ ] **Step 1: Ensure .env.local has all required variables**

Create or update `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your-groq-key
```

Find these values in:
- Supabase dashboard → Project Settings → API
- Groq console → API Keys → `https://console.groq.com/keys`

- [ ] **Step 2: Verify .env.local is gitignored**

```bash
cat .gitignore | grep env
```

Expected output includes `.env.local`. If not:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS

- [ ] **Step 4: Run dev server and smoke test**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
- [ ] First visit shows `ModeSelect` onboarding screen
- [ ] Selecting a mode dismisses onboarding, shows Dashboard
- [ ] Dashboard shows upload zone, empty doc grid, workspace rail
- [ ] Uploading a PDF completes the progress steps and opens Workspace
- [ ] Workspace shows 3-panel layout: doc list, PDF preview, AI panel
- [ ] Summary tab shows collapsible sections populated from `summary_json`
- [ ] Generate tab shows AI-inferred action cards from `suggested_actions`
- [ ] Clicking a Generate action streams markdown output
- [ ] Chat tab loads with mode-specific starter questions
- [ ] Sending a chat message streams a response
- [ ] Dark/light theme toggle works
- [ ] Sidebar collapse works
- [ ] Mode switcher opens and changes mode

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: Builds without type errors

- [ ] **Step 6: Final commit**

```bash
git add .gitignore
git commit -m "feat: complete DocMind AI MVP — mode-first document intelligence app"
```

---

## Task 22: Delete Old Worktree Code (Cleanup)

- [ ] **Step 1: Delete the old FastAPI + Vite worktree**

The old `backend/` and `frontend/` code lives in a git worktree at:
`C:\Users\acer\Documents\projects\idp-platform\docmind-app\.claude\worktrees\nifty-germain-85f137`

This can be removed after the MVP is verified working:

```bash
cd C:\Users\acer\Documents\projects\idp-platform\docmind-app
git worktree remove .claude/worktrees/nifty-germain-85f137 --force
git branch -D claude/nifty-germain-85f137
```

- [ ] **Step 2: Confirm removal**

```bash
git worktree list
```

Expected: Only the main worktree listed.

---

## Summary

| Task | What it produces |
|---|---|
| 1 | Vitest + testing deps installed |
| 2 | Supabase schema migrated |
| 3 | modes.ts — 5 domain personas + prompt builders |
| 4 | extractor.ts — PDF, DOCX, Excel, CSV, image OCR |
| 5 | rag.ts skeleton + groq.ts updated |
| 6 | app-state API route |
| 7 | useAppState + useDocuments hooks |
| 8 | Upload route — full extraction pipeline |
| 9 | Chat route — mode persona + persistence |
| 10 | Generate route — type-specific streaming |
| 11 | UI primitives + full icon set |
| 12 | ModeSelect onboarding screen |
| 13 | ModeSwitcher bottom sheet |
| 14 | Sidebar — mode chip, search, collapse |
| 15 | Dashboard — UploadZone, DocCard, WorkspaceRail |
| 16 | Workspace — DocListPanel, AIPanel, PDF viewer |
| 17 | SummaryTab — collapsible, mode-aware |
| 18 | ChatTab — history, streaming, starters |
| 19 | GenerateTab — AI templates, copy, download |
| 20 | globals.css utilities + root page.tsx wired up |
| 21 | Env vars + full smoke test |
| 22 | Old worktree cleanup |
