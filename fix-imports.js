const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/api/index.ts',
  'src/context/AuthContext.tsx',
  'src/context/WorkspaceContext.tsx',
  'src/pages/ChatPage.tsx',
  'src/pages/DebugPage.tsx',
  'src/pages/DocumentsPage.tsx',
  'src/pages/TasksPage.tsx',
  'src/pages/ToolHistoryPage.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, 'frontend', file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](?:\.\.\/)+types['"]/g, 'import type { $1 } from \'../types\'');
  fs.writeFileSync(filePath, content);
});
console.log('Fixed imports');

