# Multi-Workspace Document AI Assistant

A production-ready web application for document-grounded AI chat with workspace isolation, built using React, NestJS, PostgreSQL + pgvector, and Google Gemini.

## Features

- **Multi-Workspace Isolation**: Documents and chats are strictly isolated per workspace. The vector search query forces this isolation at the database level.
- **RAG Pipeline**: Upload PDFs, TXTs, or Markdown files. Text is extracted, chunked, embedded, and stored in pgvector.
- **Grounded AI Answers**: The assistant only uses provided document context. It explicitly says "I don't know" if the context lacks the answer.
- **Citations**: Citations point to the specific document name and page number.
- **Tool Calling**: The assistant can invoke tools such as `save_task` and `send_notification`. Results are fed back into the conversation.
- **Prompt Injection Protection**: The system prompt instructs the AI to treat document context as data, not instructions.
- **Clean Dashboard**: A modern React application using Tailwind CSS, featuring workspaces, chat, document management, and a tool history log.

## Architecture

```
React (Vite, Tailwind, React Router) -> Frontend
  |
  v
NestJS (REST API, JWT, Multer) -> Backend
  |
  v
PostgreSQL + pgvector (Prisma ORM) -> Database
  |
  v
Google Gemini (Embeddings & Chat) -> AI Provider
```

## Local Setup

### 1. Database

You need a PostgreSQL database with the `pgvector` extension. Since this app is designed for deployment on Vercel, **Neon** (neon.tech) is highly recommended as it provides a free tier with `pgvector` pre-installed.

1. Create a project in Neon.
2. Get the connection string.
3. Update `backend/.env` and set `DATABASE_URL` to your Neon connection string.

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

**First time setup**: You must apply the database schema.

```bash
cd backend
npx prisma db push
npx prisma db seed
```
*(Note: Run the raw SQL migration in `backend/prisma/migrations/enable_pgvector.sql` manually on your database to enable vector search if `db push` doesn't do it automatically).*

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Environment Variables

**Backend (`backend/.env`)**:
- `DATABASE_URL`: PostgreSQL connection string (with pgvector).
- `JWT_SECRET`: Secret key for JWT signing.
- `GEMINI_API_KEY`: Google Gemini API key.
- `FRONTEND_URL`: URL of the frontend (default `http://localhost:5173`).
- `SLACK_WEBHOOK_URL` / `DISCORD_WEBHOOK_URL`: (Optional) Webhook for notifications.

**Frontend (`frontend/.env`)**:
- `VITE_API_URL`: Backend URL (leave empty for Vite proxy in development).

## RAG Architecture & Workspace Isolation

1. **Extraction**: `pdf-parse` reads PDF files.
2. **Chunking**: Text is split into ~600 token chunks with 100 token overlap.
3. **Embeddings**: `gemini-embedding-2` from Gemini embeds the chunks (with `outputDimensionality: 768`).
4. **pgvector**: Chunks and embeddings are saved in the `document_chunks` table. Crucially, the `workspace_id` is stored on every chunk.
5. **Retrieval**: The SQL query enforces `WHERE workspace_id = $1` BEFORE calculating vector similarities, ensuring strict data isolation.

## Tool Calling

Gemini is provided with tool declarations. When it returns a function call, the backend validates the request, executes the tool (e.g., creating a task in Postgres), logs it to `ToolCall`, and returns the output to Gemini for a final natural language summary.

## Testing & Evaluation (For Reviewers)

### Throwaway Account
A database seed script (`backend/prisma/seed.ts`) has been provided to automatically generate a throwaway test account and two isolated workspaces.

- **Email**: `demo@example.com`
- **Password**: `password123`
- **Preloaded Workspaces**: `HR` and `Finance`

### How to Test Workspace Isolation
1. Log in with the throwaway account.
2. In the **HR** workspace, upload a document containing a distinct fact (e.g., "The emergency override code is ALPHA-99-OMEGA").
3. Ask the chat: *"What is the emergency override code?"* (It will successfully cite the document).
4. Use the sidebar dropdown to switch to the **Finance** workspace.
5. Ask the exact same question. 
6. **Result**: The assistant will reply: *"I couldn't find enough information to answer this question from the documents in the current workspace."*

### How to Test Tool Calling
1. In the chat, type: *"Create a task for me to review the Q3 budget next week."*
2. The AI will trigger the `save_task` tool. You will see an `Executed: save_task` badge in the UI.
3. Check the **Tasks** tab to see the database record, and the **Tool History** tab to see the execution log.

### How to Verify Retrieval (Debug View)
Click the **Debug** tab in the sidebar. This page exposes the exact vector search results from your last query, showing the chunks, cosine similarity scores, and verifying that all chunks strictly belong to the active workspace.

