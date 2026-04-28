# DocMind AI — Full Application Design Spec
**Date:** 2026-04-25  
**Status:** Approved

---

## 1. Product Vision

DocMind AI is an intelligent document processing tool that turns any uploaded document into structured intelligence: a summary, a conversational interface, and a content generation engine — all personalised to the user's professional domain.

**Core loop:** Upload document → AI extracts meaning → User reads summary, chats with doc, generates derivative content.

**Design philosophy:** Mode-first, focused UI. Users choose their domain on first visit and get a tool that feels purpose-built for their workflow, not a generic "AI for documents" that tries to do everything for everyone.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Database + Storage | Supabase (PostgreSQL + Storage, future pgvector) |
| LLM | Groq `llama-3.3-70b-versatile` (128k context window) |
| AI SDK | Vercel AI SDK v6 (`useChat`, `useCompletion`, `streamText`) |
| Styling | TailwindCSS 4 + CSS custom properties |
| Animations | Framer Motion |
| PDF Rendering | react-pdf + pdfjs-dist |
| File Extraction | pdfjs (PDF), mammoth (DOCX), xlsx (Excel/CSV), Tesseract.js (image OCR) |

---

## 3. Modes

Five domain modes. Users pick one at onboarding. All documents, AI personas, generation templates, and summary structures adapt to the active mode.

| Mode | Target users | Typical documents |
|---|---|---|
| **Scholar** | Students, researchers, academics | Papers, textbooks, lecture notes, theses |
| **Legal** | Professionals, founders, anyone reviewing contracts | Contracts, agreements, policies, regulations |
| **Finance** | Analysts, accountants, investors | Financial reports, loan docs, prospectuses, statements |
| **Medical** | Healthcare workers, researchers, patients | Clinical studies, drug info, discharge summaries |
| **Business** | Managers, consultants, executives | Meeting notes, proposals, strategies, market reports |

Each mode has:
- A distinct **AI persona** (system prompt tuned to domain language and priorities)
- **Summary section structure** (what counts as a "risk" differs per domain)
- **AI-inferred generation templates** (Groq analyses uploaded doc and suggests relevant actions)
- **Suggested chat starters** (contextual questions shown in the chat tab)

### Mode-specific personas (system prompt flavours)

- **Scholar**: Analytical academic assistant. Focuses on methodology, arguments, citations, key concepts.
- **Legal**: Precise legal analyst. Highlights obligations, rights, deadlines, risk clauses, ambiguities.
- **Finance**: Quantitative financial analyst. Extracts metrics, ratios, risk indicators, anomalies.
- **Medical**: Clinical documentation specialist. Prioritises diagnoses, treatments, contraindications, dosages.
- **Business**: Strategic business analyst. Surfaces decisions, action items, risks, opportunities.

---

## 4. Supabase Schema

```sql
-- Single row. Persists mode, theme, onboarding state.
app_state (
  id                int primary key default 1,
  active_mode       text default null,
  onboarding_done   boolean default false,
  theme             text default 'light',
  sidebar_collapsed boolean default false
)

-- Every uploaded document.
documents (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  mode              text not null,
  file_type         text not null,        -- 'pdf'|'docx'|'xlsx'|'csv'|'image'|'txt'
  storage_path      text,
  full_text         text,                 -- null if is_large=true
  page_count        int default 0,
  file_size         int,
  is_large          boolean default false, -- true if page_count > 80
  summary_json      jsonb,                -- { overview[], key_terms[], risks[] }
  suggested_actions jsonb,                -- [{ id, label, description }]
  starred           boolean default false,
  created_at        timestamptz default now()
)

-- Named workspaces, auto-tagged by active mode at creation.
workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  mode        text not null,
  created_at  timestamptz default now()
)

-- Many-to-many: documents <-> workspaces
workspace_documents (
  workspace_id  uuid references workspaces(id) on delete cascade,
  document_id   uuid references documents(id) on delete cascade,
  added_at      timestamptz default now(),
  primary key (workspace_id, document_id)
)

-- Chat messages persisted per document.
chat_messages (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  role         text not null,   -- 'user'|'assistant'
  content      text not null,
  created_at   timestamptz default now()
)

-- Saved generated outputs.
generated_outputs (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid references documents(id) on delete cascade,
  type         text not null,   -- e.g. 'quiz', 'risk_analysis', 'study_guide'
  content      text not null,   -- markdown
  length       text,            -- 'short'|'medium'|'long'
  tone         text,            -- 'formal'|'neutral'|'casual'
  created_at   timestamptz default now()
)
```

---

## 5. File Structure

```
src/
├── app/
│   ├── page.tsx                         # Root: onboarding gate + main layout
│   ├── layout.tsx                       # HTML shell, fonts, theme
│   ├── globals.css                      # CSS vars, warm rust palette, animations
│   └── api/
│       ├── app-state/route.ts           # GET/PATCH mode, theme, onboarding flag
│       ├── documents/upload/route.ts    # Upload + extract + summarise
│       ├── chat/route.ts                # Streaming chat with doc context
│       └── generate/route.ts           # Streaming content generation
│
├── components/
│   ├── onboarding/
│   │   └── ModeSelect.tsx              # Full-screen first-time mode picker
│   ├── layout/
│   │   ├── Sidebar.tsx                 # Nav, recent docs, mode chip, search
│   │   └── TopBar.tsx                  # Breadcrumbs, theme toggle, new button
│   ├── dashboard/
│   │   ├── Dashboard.tsx               # Stats, upload zone, workspace rail, doc grid
│   │   ├── UploadZone.tsx              # Drag-drop, multi-file, progress steps
│   │   ├── WorkspaceRail.tsx           # Horizontal scroll, create workspace
│   │   └── DocCard.tsx                 # Document card in grid
│   ├── workspace/
│   │   ├── Workspace.tsx               # 3-panel layout controller
│   │   ├── DocListPanel.tsx            # Left: doc list + workspace selector
│   │   ├── PreviewPanel.tsx            # Centre: PDF/text viewer
│   │   ├── AIPanel.tsx                 # Right: tab container
│   │   ├── SummaryTab.tsx              # Collapsible structured summary
│   │   ├── GenerateTab.tsx             # AI-inferred templates + output
│   │   └── ChatTab.tsx                 # Streaming chat, persisted history
│   ├── mode/
│   │   └── ModeSwitcher.tsx            # Bottom-sheet mode changer
│   └── ui/
│       ├── primitives.tsx              # Button, Card, Chip, Badge, Segmented
│       └── icons.tsx                   # SVG icon set
│
├── lib/
│   ├── supabase.ts                     # Browser Supabase client
│   ├── supabase-server.ts              # Server Supabase client
│   ├── groq.ts                         # Groq client + model config
│   ├── extractor.ts                    # Unified file → text extraction
│   ├── modes.ts                        # Mode definitions, personas, prompts
│   ├── rag.ts                          # RAG skeleton (stubs, TODO pgvector)
│   └── data.ts                         # Static fallbacks, sample data
│
└── hooks/
    ├── useAppState.ts                  # Global mode/theme (SWR-based)
    └── useDocuments.ts                 # Document list with optimistic updates
```

---

## 6. Core Data Flows

### Upload
```
User drops file(s) in UploadZone
→ POST /api/documents/upload { file, mode }
    → extractor.ts: detect file type → extract full_text, page_count
        PDF:        pdfjs page-by-page text extraction
        DOCX:       mammoth → markdown
        Excel/CSV:  xlsx → markdown table
        Image:      Tesseract.js OCR → text
    → page_count > 80 → is_large=true, store first 20 pages only
    → Groq (mode persona): generate summary_json + suggested_actions
    → Supabase Storage: upload file → storage_path
    → INSERT into documents
→ Client: optimistic add to doc list → open Workspace
```

### Chat
```
User sends message in ChatTab
→ useChat → POST /api/chat { messages, documentId }
    → fetch document.full_text, is_large, mode
    → is_large=false: inject full_text into system prompt (≤128k tokens)
    → is_large=true:  inject truncated text + log RAG TODO
    → streamText(groq, mode persona) → stream to client
→ On stream complete: INSERT both turns into chat_messages
→ Next ChatTab open: fetch chat_messages → restore history
```

### Generate
```
User clicks AI-inferred template in GenerateTab
→ useCompletion → POST /api/generate { documentId, type, length, tone }
    → fetch document.full_text, mode, suggested_actions
    → build mode+type-specific prompt with tone/length modifiers
    → streamText(groq) → stream markdown to client
→ User can copy to clipboard, download as .txt, or save
→ On save: INSERT into generated_outputs
```

### Mode Switch
```
User clicks ModeChip in Sidebar → ModeSwitcher sheet opens
→ User selects new mode → confirm
→ PATCH /api/app-state { active_mode }
→ useAppState revalidates
→ Sidebar, empty states, AI personas, chat starters all update
→ Existing documents keep their original mode tag
→ New uploads + new chat/generate actions use new mode
```

---

## 7. Hybrid Pipeline (Full Context → RAG)

### MVP: Full Context
- All documents with `page_count ≤ 80` use full text injection
- Groq 128k context window handles up to ~96,000 words (≈ 200 pages of plain text)
- In practice covers the vast majority of real documents

### Large Document Handling (MVP fallback)
- `page_count > 80`: set `is_large=true`, store only first 20 pages of text
- Chat and generate use this truncated text with a visible "Large document — partial context" warning in the UI
- `full_text` column is null; `storage_path` always present for preview

### RAG Skeleton (future, in `src/lib/rag.ts`)
```typescript
// TODO: replace with Supabase pgvector implementation
export async function embedChunks(chunks: string[], docId: string) {
  // 1. Enable pgvector extension in Supabase
  // 2. Create document_embeddings table
  // 3. Embed via OpenAI text-embedding-3-small
  // 4. Store vectors with chunk text + page reference
  throw new Error('RAG not yet implemented')
}

export async function retrieveRelevant(query: string, docId: string, topK = 5): Promise<string> {
  // 1. Embed query
  // 2. Cosine similarity search in pgvector
  // 3. Return top-k chunk texts joined
  // MVP fallback:
  return '[RAG not implemented — using truncated text]'
}
```

---

## 8. First-Time Onboarding UX

Triggered when `app_state.onboarding_done = false` (or row does not exist).

**Screen**: Full-viewport overlay, dismisses into dashboard on selection.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   What will you primarily use DocMind for?              │
│   You can always change this later.                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Scholar │  │  Legal   │  │ Finance  │              │
│  │    🎓    │  │   ⚖️     │  │    📊    │              │
│  │ Papers,  │  │Contracts,│  │ Reports, │              │
│  │  notes   │  │ policies │  │  loans   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                         │
│        ┌──────────┐  ┌──────────┐                      │
│        │ Medical  │  │Business  │                      │
│        │   🏥     │  │   💼     │                      │
│        │Clinical, │  │Reports,  │                      │
│        │  health  │  │proposals │                      │
│        └──────────┘  └──────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

On selection:
1. PATCH `/api/app-state` → `{ active_mode, onboarding_done: true }`
2. Modal animates out, dashboard fades in
3. Sidebar footer shows mode chip immediately

---

## 9. Mode Switching UX

**Entry point**: ModeChip in sidebar footer (always visible).

```
┌─────────────────────────────┐
│  ● Scholar mode  [Change]   │
└─────────────────────────────┘
```

**ModeSwitcher**: Bottom-sheet slide-up panel.

```
┌─────────────────────────────────────┐
│  Switch Mode                    ✕  │
│  ─────────────────────────────────  │
│  Your documents stay. Only the AI   │
│  lens and templates will change.    │
│                                     │
│  ● Scholar      (current)           │
│  ○ Legal                            │
│  ○ Finance                          │
│  ○ Medical                          │
│  ○ Business                         │
│                                     │
│         [ Switch to Legal ]         │
└─────────────────────────────────────┘
```

Switch is instant. No confirmation dialog (reversible). Sidebar and AI panel update immediately via `useAppState` revalidation.

---

## 10. UI Visual Spec

Follows the prototype (`pdf-summarizer`) exactly:

- **Accent colour**: `#c85a3b` (rust/terracotta), dark mode: `#e07451`
- **Backgrounds**: Stone palette (CSS vars `--bg`, `--bg-raised`, `--bg-sunken`)
- **Typography**: Geist (body/UI), Instrument Serif (headings/doc names)
- **Radius**: 8–12px cards, 999px chips/badges
- **Shadows**: `var(--shadow-sm)` on cards
- **Transitions**: 0.12–0.25s ease on hover/toggle, 0.3s fade-in on view change
- **Layout**: 3-panel (56–248px sidebar | flexible main | 300–440px AI panel)
- **Density**: Compact — 8px grid baseline, 16–18px card padding

---

## 11. What Is Out of Scope (MVP)

- User authentication / multi-user support
- Email verification, password reset
- PDF text highlighting / annotation
- Real-time collaboration
- Mobile app
- RAG (pgvector) — skeleton only
- Webhook / API access
- Billing / usage limits
