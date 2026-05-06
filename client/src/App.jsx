import "./App.css";
import { Routes, Route } from "react-router";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Courses from "./pages/Courses";
import Calendar from "./pages/Calendar";
import Records from "./pages/Records";
import PlannedPayments from "./pages/PlannedPayments";
import Category from "./pages/Category";
import Projects from "./pages/Projects";
import Habits from "./pages/Habits";
import Trips from "./pages/Trips";
import AdminUsers from "./pages/AdminUsers";
import AdminTasks from "./pages/AdminTasks";

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
          <Route
            path="/dashboard/records"
            element={
              <ProtectedRoute>
                <Records />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/planned-payments"
            element={
              <ProtectedRoute>
                <PlannedPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/category"
            element={
              <ProtectedRoute>
                <Category />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/habits"
            element={
              <ProtectedRoute>
                <Habits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/tasks"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminTasks />
                </AdminRoute>
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
