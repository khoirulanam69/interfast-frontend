import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { getAuthHeaders } from '@/hooks/useAuth';
import AdminUserForm from './AdminUserForm';

const Settings = () => {
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const cached = localStorage.getItem('auth_user');
    if (cached) {
      const user = JSON.parse(cached);
      setAccountData(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
    }
  }, []);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountData.newPassword && accountData.newPassword !== accountData.confirmPassword) {
      toast({ title: 'Error', description: 'Password baru tidak cocok', variant: 'destructive' });
      return;
    }

    if (accountData.newPassword && accountData.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }

    if (accountData.newPassword && !accountData.currentPassword) {
      toast({ title: 'Error', description: 'Masukkan password saat ini untuk mengubah password', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {};
      if (accountData.name) body.name = accountData.name;
      if (accountData.email) body.email = accountData.email;
      if (accountData.newPassword) {
        body.currentPassword = accountData.currentPassword;
        body.newPassword = accountData.newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/account`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui akun');
      }

      // Update stored token and user
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }
      if (data.data?.user) {
        localStorage.setItem('auth_user', JSON.stringify(data.data.user));
      }

      setAccountData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));

      toast({ title: 'Berhasil', description: 'Akun berhasil diperbarui' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal memperbarui akun', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="registration" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            User Registration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    placeholder="Masukkan nama"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    placeholder="Masukkan email"
                  />
                </div>
                <div>
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={accountData.currentPassword}
                    onChange={(e) => setAccountData({ ...accountData, currentPassword: e.target.value })}
                    placeholder="Masukkan password saat ini"
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={accountData.newPassword}
                    onChange={(e) => setAccountData({ ...accountData, newPassword: e.target.value })}
                    placeholder="Masukkan password baru (min 6 karakter)"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={accountData.confirmPassword}
                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                    placeholder="Konfirmasi password baru"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                  ) : (
                    'Update Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration">
          <AdminUserForm />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
