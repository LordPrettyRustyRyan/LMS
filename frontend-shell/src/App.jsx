import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

import Entry from "./pages/Entry";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import ClassroomDetail from "./pages/ClassroomDetail";
import CreateAssignment from "./pages/CreateAssignment";
import AssignmentPlayer from "./pages/AssignmentPlayer";
import AttemptDetail from "./pages/AttemptDetail";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Entry />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classes" element={<Classrooms />} />
          <Route path="/classes/:id" element={<ClassroomDetail />} />
          <Route path="/assignments/create" element={<CreateAssignment />} />
          <Route path="/classes/:id/assignments/create" element={<CreateAssignment />} />
          <Route path="/assignments/:assignmentId/play" element={<AssignmentPlayer />} />
          <Route path="/attempts/:attemptId" element={<AttemptDetail />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;