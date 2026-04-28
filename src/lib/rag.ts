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
