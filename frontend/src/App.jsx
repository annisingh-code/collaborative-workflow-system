import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import Auth from './components/Auth';

import ProjectDashboard from './components/ProjectDashboard';

import TaskBoard from './components/TaskBoard';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route
          path="/"
          element={<Auth />}
        />

        {/* Protected Dashboard */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Task Board */}
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <TaskBoard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;