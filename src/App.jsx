import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ToastProvider, ConfirmProvider } from "@/components/ui/Misc";
import { seedDatabase } from "@/lib/db";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import MastersDashboard from "@/pages/MastersDashboard";
import UserDashboard from "@/pages/UserDashboard";
import Play from "@/pages/Play";
import ParentSpace from "@/pages/ParentSpace";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import VersionWatcher from "@/components/shared/VersionWatcher";
import { startRealtime } from "@/lib/db";

function App() {
  useEffect(() => {
    seedDatabase();
    startRealtime();
  }, []);

  return (
    <LanguageProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <VersionWatcher />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/masters" element={<MastersDashboard />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/play" element={<Play />} />
              <Route path="/parent" element={<ParentSpace />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ConfirmProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;
