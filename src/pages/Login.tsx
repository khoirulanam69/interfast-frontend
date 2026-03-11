import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
import { Lock, Mail, Loader2, ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Login gagal");

      localStorage.setItem("auth_token", data.data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.data.user));
      toast({ title: "Login berhasil", description: `Selamat datang, ${data.data.user.name}` });
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({ title: "Login gagal", description: error.message || "Email atau password salah", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Masukkan email Anda", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      if (data.data?.resetToken) {
        setResetToken(data.data.resetToken);
        setMode("reset");
        toast({ title: "Token dibuat", description: "Silakan masukkan password baru" });
      } else {
        toast({ title: "Info", description: data.message });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message);

      toast({ title: "Berhasil", description: "Password berhasil direset. Silakan login." });
      setMode("login");
      setEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal mereset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Interfast Media</CardTitle>
          <CardDescription>
            {mode === "login" && "Masuk ke dashboard manajemen"}
            {mode === "forgot" && "Reset password akun Anda"}
            {mode === "reset" && "Buat password baru"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="admin@interfast.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : "Masuk"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setMode("forgot")} className="text-sm text-primary hover:underline">
                  Lupa Password?
                </button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="forgot-email" type="email" placeholder="Masukkan email Anda" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : "Kirim Reset Token"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Kembali ke Login
                </button>
              </div>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="new-password" type="password" placeholder="Min 6 karakter" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-9" required minLength={6} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm-new-password" type="password" placeholder="Konfirmasi password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-9" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : "Reset Password"}
              </Button>
              <div className="text-center">
                <button type="button" onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto">
                  <ArrowLeft className="h-3 w-3" /> Kembali ke Login
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
