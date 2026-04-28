export const SAMPLE_DOCS = [
  {
    id: "loan-agreement",
    name: "Meridian Credit Agreement — 2026 Revision.pdf",
    short: "Meridian Credit Agreement",
    pages: 47,
    size: "3.2 MB",
    uploadedAt: "2 hours ago",
    category: "Banking",
    starred: true,
    thumbColor: "#c85a3b",
  },
  {
    id: "research-paper",
    name: "Neural Compression via Learned Priors.pdf",
    short: "Neural Compression",
    pages: 18,
    size: "1.4 MB",
    uploadedAt: "Yesterday",
    category: "Research",
    starred: false,
    thumbColor: "#6b7eb5",
  },
  {
    id: "textbook",
    name: "Intro to Macroeconomics — Chapter 7.pdf",
    short: "Macroeconomics Ch. 7",
    pages: 34,
    size: "2.8 MB",
    uploadedAt: "3 days ago",
    category: "Education",
    starred: true,
    thumbColor: "#5a8e6e",
  },
];

export const SUMMARY_SECTIONS = [
  {
    id: "overview",
    icon: "Book",
    title: "Overview",
    accent: "#c85a3b",
    items: [
      { text: "Senior secured revolving credit facility for $120M between Meridian Bank (Lender) and Halcyon Logistics Holdings (Borrower).", page: 1 },
      { text: "36-month commitment period beginning March 1, 2026, with optional 12-month extension subject to lender consent.", page: 2 },
      { text: "Third revision — supersedes MCR-2025-1203 and all prior amendments in full.", page: 1 },
    ]
  },
  {
    id: "key-terms",
    icon: "Target",
    title: "Key Terms",
    accent: "#6b7eb5",
    items: [
      { text: "Interest: Adjusted Term SOFR + 275 bps, re-priced quarterly.", page: 7, tag: "Rate" },
      { text: "Unused commitment fee: 0.35% per annum on undrawn balance.", page: 7, tag: "Fee" },
      { text: "Default interest: Base Rate + 500 bps.", page: 8, tag: "Penalty" },
      { text: "First-priority lien on substantially all Borrower assets, plus specified real estate at 1401 Harbor Way, Oakland.", page: 11, tag: "Collateral" },
    ]
  },
  {
    id: "risks",
    icon: "Bolt",
    title: "Risks & Red Flags",
    accent: "#b54a3a",
    items: [
      { text: "Financial covenants tested quarterly — two consecutive breaches trigger an Event of Default with no cure period.", page: 19, severity: "high" },
      { text: "Material Adverse Change clause in § 7.3 is broadly drafted; lender has sole discretion to invoke.", page: 24, severity: "medium" },
      { text: "Cross-default to any indebtedness exceeding $5M (low threshold relative to facility size).", page: 26, severity: "medium" },
      { text: "Mandatory prepayment from asset sales > $2M not subject to reinvestment right.", page: 28, severity: "low" },
    ]
  }
];

export const SEED_CHAT = [
  { role: "user", text: "What's the headline risk in this agreement?" },
  { role: "assistant", text: "The single biggest exposure is the **financial covenant package in § 4**. Three covenants are tested quarterly — FCCR ≥ 1.25×, Total Leverage ≤ 3.50×, and Liquidity ≥ $15M — and **two consecutive breaches trigger an immediate Event of Default with no cure period**. Given the Borrower's seasonal cash cycle in logistics, a single weak quarter could leave very little margin.\n\nI'd recommend negotiating a 30-day cure right before default, and pushing the Leverage threshold to 3.75× to absorb normal volatility.", citations: [{ page: 19, snippet: "two consecutive test periods" }, { page: 18, snippet: "Fixed Charge Coverage Ratio" }] },
  { role: "user", text: "Summarize the collateral structure in one line." },
  { role: "assistant", text: "First-priority lien on substantially all personal property (AR, inventory, equipment) plus specified real estate at 1401 Harbor Way, Oakland, with a minimum 1.35× collateral coverage ratio.", citations: [{ page: 11, snippet: "1401 Harbor Way, Oakland CA" }] },
];

export const MODES = [
  { id: "general",   label: "General",   icon: "Globe",     desc: "Summaries, Q&A, and writing aids" },
  { id: "academic",  label: "Academic",  icon: "Book",      desc: "Quizzes, question papers, assignments" },
  { id: "banking",   label: "Banking",   icon: "Bank",      desc: "Risk, covenants, policy analysis" },
] as const;

export const GENERATE_OPTIONS = {
  general: [
    { id: "summary-1p",  title: "One-page brief",      desc: "Executive summary, 300-400 words",         icon: "File" },
    { id: "keypoints",   title: "Key points digest",   desc: "10 bullet points, ranked by importance",   icon: "Stack" },
  ],
  academic: [
    { id: "question-paper", title: "Question paper", desc: "Mixed MCQ + short + long answer", icon: "File" },
    { id: "quiz",           title: "Quick quiz",      desc: "10-question multiple choice",         icon: "Target" },
  ],
  banking: [
    { id: "financial", title: "Financial summary", desc: "Key terms, rates, and economics",          icon: "Briefcase" },
    { id: "risk",      title: "Risk analysis",     desc: "Covenants and defaults review", icon: "Bolt" },
  ],
};
