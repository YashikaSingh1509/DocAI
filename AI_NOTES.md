# AI Development Notes

## 1. AI Tools and Models Used
- **Agent**: Antigravity AI Agent (Google DeepMind advanced agentic coding environment).
- **LLM / Generation**: Google Gemini 3.6 Flash (via Google AI Studio) for chat and tool calling.
- **Embeddings**: Google Gemini Embedding 2 (`gemini-embedding-2` with `outputDimensionality: 768`) for document vectorization.
- **Role Split**: The AI agent acted as the primary full-stack engineer, scaffolding the NestJS backend, Prisma schema, and Vite/React frontend. I directed the architecture requirements, tested the application locally, and identified the deployment constraints (Vercel/Neon).

## 2. Key Technical Decisions
1. **Enforcing Workspace Isolation at the Database Level**: Instead of retrieving a broad set of chunks and filtering them in memory, I added a `workspaceId` column directly to the `document_chunks` table. The RAG vector search is executed via a raw SQL query (`$queryRawUnsafe`) that applies a hard `WHERE workspace_id = $1` clause *before* evaluating cosine similarity. This guarantees absolute data isolation between tenants.
2. **In-Memory File Ingestion**: To ensure the app can be deployed on Vercel (which uses ephemeral serverless functions), I designed the `DocumentsService` and `IngestionService` to process PDF/TXT uploads entirely in memory using Multer buffers. Files are hashed, parsed by `pdf-parse-new`, chunked, embedded, and pushed to PostgreSQL without ever touching the local file system.
3. **Idempotent Document Uploads**: I implemented a composite unique constraint (`@@unique([workspaceId, contentHash])`) in the Prisma schema. Before ingestion, the backend calculates a SHA-256 hash of the file buffer; if a matching hash already exists in the same workspace, the upload is safely rejected.

## 3. The Hardest Bug (and Wrong Turn)
**The Bug**: During the initial implementation, document ingestion worked perfectly, but the chat interface threw a catastrophic `TypeError: pdfParse is not a function`. 
**What the AI got wrong**: The AI confidently suggested installing the standard `pdf-parse` package (v1.1.1). However, the internal PDF.js engine bundled in that specific version is over six years old. When I generated a valid, modern PDF using `pdfkit` to test the system, the ancient parser threw a `bad XRef entry` format error and completely crashed the ingestion pipeline. 
**How it was noticed and fixed**: I noticed the `FAILED` status on the document in the database and tracked the error stack trace back to the cross-reference parsing in `pdf.js`. To fix it, I replaced the library with `pdf-parse-new`, a modern maintained fork that uses an updated PDF.js engine, which seamlessly processed the modern PDF buffers without crashing.

Another major roadblock was the Gemini API deprecating the `text-embedding-004` and `gemini-2.0-flash` models mid-development. I had to dynamically re-wire the embeddings service to use `gemini-embedding-2` and explicitly down-sample it using `outputDimensionality: 768` so it wouldn't break the existing PostgreSQL `vector(768)` schema.

## 4. What I'd Improve with More Time
- **Streaming Responses**: I would implement Server-Sent Events (SSE) to stream the Gemini response tokens to the React frontend to drastically reduce perceived latency.
- **Advanced Chunking**: Currently, the chunking strategy splits text at ~600 tokens with a 100-token overlap. I would upgrade this to a semantic chunking strategy (respecting headers, paragraphs, and markdown boundaries) to improve retrieval quality.
- **Multi-step Agentic Tool Use**: I would expand the tool-calling loop to allow the LLM to execute a tool, read the result, and immediately execute *another* tool before finally answering the user. Currently, it executes the queued tools in a single batch.
