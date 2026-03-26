import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./stores/auth"
import { Layout } from "./components/layout/Layout"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ForgotPassword } from "./pages/ForgotPassword"
import { ResetPassword } from "./pages/ResetPassword"
import { Dashboard } from "./pages/Dashboard"
import { OrgChart } from "./pages/OrgChart"
import { Goals } from "./pages/Goals"
import { Tickets } from "./pages/Tickets"
import { Agents } from "./pages/Agents"
import { Budget } from "./pages/Budget"
import { Skills } from "./pages/Skills"
import { Approvals } from "./pages/Approvals"
import { Files } from "./pages/Files"
import { Terminal } from "./pages/Terminal"
import { Settings } from "./pages/Settings"
import { AuditLog } from "./pages/AuditLog"
import { LLMProviders } from "./pages/LLMProviders"
import { Channels } from "./pages/Channels";

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/" replace />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <Register /> : <Navigate to="/" replace />
      } />
      <Route path="/forgot-password" element={
        !isAuthenticated ? <ForgotPassword /> : <Navigate to="/" replace />
      } />
      <Route path="/reset-password" element={
        !isAuthenticated ? <ResetPassword /> : <Navigate to="/" replace />
      } />
      <Route path="/" element={
        isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
      }>
        <Route index element={<Dashboard />} />
        <Route path="org-chart" element={<OrgChart />} />
        <Route path="goals" element={<Goals />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="agents" element={<Agents />} />
        <Route path="budget" element={<Budget />} />
        <Route path="files" element={<Files />} />
        <Route path="skills" element={<Skills />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="terminal" element={<Terminal />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="llm-providers" element={<LLMProviders />} />
        <Route path="channels" element={<Channels />} />
      </Route>
    </Routes>
  )
}

export default App
