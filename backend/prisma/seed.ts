import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      passwordHash,
    },
  });
  console.log(`✅ Created user: ${user.email}`);

  // Create HR workspace
  const hrWorkspace = await prisma.workspace.create({
    data: {
      name: 'HR',
      ownerId: user.id,
    },
  });
  console.log(`✅ Created workspace: ${hrWorkspace.name}`);

  // Create Finance workspace
  const financeWorkspace = await prisma.workspace.create({
    data: {
      name: 'Finance',
      ownerId: user.id,
    },
  });
  console.log(`✅ Created workspace: ${financeWorkspace.name}`);

  // Create HR document
  const hrDoc = await prisma.document.create({
    data: {
      workspaceId: hrWorkspace.id,
      filename: 'HR_Policy.txt',
      originalFilename: 'HR_Policy.txt',
      mimeType: 'text/plain',
      fileSize: 512,
      contentHash: 'hr-seed-hash-001',
      status: 'COMPLETED',
    },
  });
  console.log(`✅ Created HR document: ${hrDoc.filename}`);

  // Create Finance document
  const financeDoc = await prisma.document.create({
    data: {
      workspaceId: financeWorkspace.id,
      filename: 'Finance_Report.txt',
      originalFilename: 'Finance_Report.txt',
      mimeType: 'text/plain',
      fileSize: 480,
      contentHash: 'finance-seed-hash-001',
      status: 'COMPLETED',
    },
  });
  console.log(`✅ Created Finance document: ${financeDoc.filename}`);

  // NOTE: Document chunks with embeddings will be created when actual documents
  // are uploaded through the application. The seed data above provides the
  // structure for testing the workspace isolation and UI.
  // 
  // To fully test RAG, upload actual documents through the frontend.
  // 
  // The demo user credentials are:
  // Email: demo@example.com
  // Password: password123

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Workspaces: HR, Finance');
  console.log('');
  console.log('To test RAG, upload documents through the frontend.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
