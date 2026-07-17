import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Login from "./pages/Login";
import CourseList from "./pages/CourseList";
import CourseDetail from "./pages/CourseDetail";
import Quiz from "./pages/Quiz";

function RequireAuth({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="container muted">Loading your study space...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/courses"
        element={
          <RequireAuth>
            <CourseList />
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <RequireAuth>
            <CourseDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/courses/:id/quiz"
        element={
          <RequireAuth>
            <Quiz />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/courses" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
