import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import NewAnalysis from './pages/NewAnalysis'
import AnalysisResult from './pages/AnalysisResult'
import MyAssignments from './pages/MyAssignments'
import TaskManager from './pages/TaskManager'
import AboutProject from './pages/AboutProject'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="new-analysis" element={<NewAnalysis />} />
          <Route path="assignments" element={<MyAssignments />} />
          <Route path="assignments/:id" element={<AnalysisResult />} />
          <Route path="tasks" element={<TaskManager />} />
          <Route path="about" element={<AboutProject />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

