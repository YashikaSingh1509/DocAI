-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the vector index for document_chunks
-- This index supports workspace-filtered vector search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
