
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserDetail from "./components/UserDetail";
import UserManagement from "./components/UserManagement";
import PackageManagement from "./components/PackageManagement";
import MikroTikManagement from "./components/MikroTikManagement";
import ReferralPage from "./components/ReferralPage";
import Settings from "./components/Settings";
import Analytics from "./components/Analytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/users/:nik" element={<UserDetail />} />
              <Route path="/packages" element={<PackageManagement />} />
              <Route path="/mikrotik" element={<MikroTikManagement />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/referrals" element={<ReferralPage />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
