import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import EntryPage from "@/pages/entry";
import { AuthProvider } from "./lib/auth";
import { PrivateRoute } from "./components/PrivateRoute";
import Login from "./components/Login";

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/new" element={<EntryPage />} />
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/entry/:id" element={<EntryPage />} />
            <Route path="*" element={<NotFound />} />
            {/* Add other routes later */}
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
