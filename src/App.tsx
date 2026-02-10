import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UserDetail from "./components/UserDetail";
import UserManagement from "./components/UserManagement";
import PackageManagement from "./components/PackageManagement";
import ReferralPage from "./components/ReferralPage";
import Settings from "./components/Settings";
import Analytics from "./components/Analytics";
import FinancialManagement from "./components/FinancialManagement";

const queryClient = new QueryClient();

// Component to handle SPA redirect from 404.html
const RedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath && location.pathname === '/') {
      sessionStorage.removeItem('redirectPath');
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, location.pathname]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RedirectHandler>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:nik" element={<UserDetail />} />
              <Route path="packages" element={<PackageManagement />} />
              <Route path="finance" element={<FinancialManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="referrals" element={<ReferralPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RedirectHandler>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
