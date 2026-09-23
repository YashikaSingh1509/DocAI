import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import TasksPage from './pages/TasksPage';
import ToolHistoryPage from './pages/ToolHistoryPage';
import DebugPage from './pages/DebugPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<ChatPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tool-history" element={<ToolHistoryPage />} />
          <Route path="debug" element={<DebugPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
