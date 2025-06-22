
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Layout from './components/Layout';
import Index from './pages/Index';
import UserManagement from './components/UserManagement';
import PackageManagement from './components/PackageManagement';
import MikroTikManagement from './components/MikroTikManagement';
import ReferralPage from './components/ReferralPage';
import Settings from './components/Settings';
import LoginPage from './components/LoginPage';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="packages" element={<PackageManagement />} />
              <Route path="mikrotik" element={<MikroTikManagement />} />
              <Route path="referral" element={<ReferralPage />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
