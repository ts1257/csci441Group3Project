import "./App.css";
import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Courses from "./pages/Courses";
import Calendar from "./pages/Calendar";

function App() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/courses"
            element={
              <ProtectedRoute>
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
