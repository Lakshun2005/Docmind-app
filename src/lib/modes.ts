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
