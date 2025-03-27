import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GanttView from './components/GanttView';
import EnhancedGanttView from './components/EnhancedGanttView';
import KanbanBoard from './components/KanbanBoard';
import FeatureForm from './components/FeatureForm';
import ReleaseForm from './components/ReleaseForm';
import ReleaseList from './components/ReleaseList';
import './styles/App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="app">
        <Header toggleSidebar={toggleSidebar} />
        <div className="app-container">
          <Sidebar isOpen={sidebarOpen} />
          <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gantt" element={<GanttView />} />
              <Route path="/enhanced-gantt" element={<EnhancedGanttView />} />
              <Route path="/kanban" element={<KanbanBoard />} />
              <Route path="/features/new" element={<FeatureForm />} />
              <Route path="/features/edit/:id" element={<FeatureForm />} />
              <Route path="/releases" element={<ReleaseList />} />
              <Route path="/releases/new" element={<ReleaseForm />} />
              <Route path="/releases/edit/:id" element={<ReleaseForm />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
