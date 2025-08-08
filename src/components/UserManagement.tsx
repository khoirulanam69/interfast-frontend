import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserStatusUpdater } from '@/hooks/useUserStatusUpdater';
import { mikrotikService } from '@/services/mikrotikService';
import { Search, Plus, Edit, Trash2, Calendar, MessageSquare, Eye, Filter, Download, Upload } from 'lucide-react';
import UserFormModal from './UserFormModal';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  nik: string;
  name: string;
  address: string;
  rt_rw: string;
  village: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  package: string;
  price: number;
  referred_by: string | null;
  installation_date: string;
  expired_date: string;
  username_dial: string;
  payment_status: 'Paid' | 'Unpaid';
  user_status: 'Active' | 'Inactive' | 'Terminate';
  created_at: string;
  updated_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [retryQueue, setRetryQueue] = useState<Array<{ username: string; userId: string; attempts: number; originalStatus: 'Active' | 'Inactive' | 'Terminate'; originalPaymentStatus: 'Paid' | 'Unpaid' }>>([]);
  const { toast } = useToast();

  // Initialize the user status updater
  useUserStatusUpdater();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, paymentFilter]);

  useEffect(() => {
    if (retryQueue.length === 0) return;

    const processRetryQueue = async () => {
      const itemsToRetry = [...retryQueue];
      setRetryQueue([]);

      for (const item of itemsToRetry) {
        if (item.attempts >= 10) {
          console.error(`Max retry attempts reached for ${item.username}, reverting to original status`);
          
          // Revert user status back to original state in database
          try {
            await supabase
              .from('users')
              .update({
                user_status: item.originalStatus,
                payment_status: item.originalPaymentStatus
              })
              .eq('id', item.userId);

            toast({
              title: "Failed",
              description: `Failed to enable ${item.username} in MikroTik after 10 attempts. Status reverted to original state.`,
              variant: "destructive",
            });

            // Refresh users to show the reverted status
            fetchUsers();
          } catch (error) {
            console.error(`Failed to revert status for ${item.username}:`, error);
            toast({
              title: "Error",
              description: `Failed to enable ${item.username} in MikroTik and couldn't revert status. Please check manually.`,
              variant: "destructive",
            });
          }
          continue;
        }

        try {
          console.log(`Retry attempt ${item.attempts + 1} for ${item.username}`);
          await mikrotikService.updateUserStatus(item.username, 'Active');
          console.log(`Successfully enabled ${item.username} in MikroTik on retry attempt ${item.attempts + 1}`);
          
          toast({
            title: "Success",
            description: `${item.username} has been enabled in MikroTik after ${item.attempts + 1} attempts`,
          });
        } catch (error) {
          console.error(`Retry failed for ${item.username} (attempt ${item.attempts + 1}):`, error);
          
          // Add back to retry queue with incremented attempts, keeping original status info
          setRetryQueue(prev => [...prev, {
            ...item,
            attempts: item.attempts + 1
          }]);
        }
      }
    };

    // Process retry queue every 3 minutes
    const retryInterval = setInterval(processRetryQueue, 3 * 60 * 1000);

    return () => clearInterval(retryInterval);
  }, [retryQueue, toast]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nik.includes(searchTerm) ||
        user.phone.includes(searchTerm) ||
        user.username_dial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.user_status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(user => user.payment_status === paymentFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleExtendPeriod = async (user: User) => {
    // Store original status before making changes
    const originalStatus = user.user_status;
    const originalPaymentStatus = user.payment_status;

    try {
      const today = new Date();
      const expiredDate = new Date(user.expired_date);
      let newExpiredDate;
      
      if (today > expiredDate) {
        // Paying after expired date - use today's date + 1 month, keep the day
        newExpiredDate = new Date(today);
        newExpiredDate.setMonth(newExpiredDate.getMonth() + 1);
      } else {
        // Paying before expired date - use original expired date + 1 month, keep the day
        newExpiredDate = new Date(expiredDate);
        newExpiredDate.setMonth(newExpiredDate.getMonth() + 1);
      }

      // Update user in database first
      const { error } = await supabase
        .from('users')
        .update({
          expired_date: newExpiredDate.toISOString().split('T')[0],
          payment_status: 'Paid',
          user_status: 'Active'
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log(`Database updated successfully for ${user.username_dial}`);

      // Try to enable user in MikroTik
      try {
        console.log(`Enabling PPP secret for ${user.username_dial} in MikroTik`);
        await mikrotikService.updateUserStatus(user.username_dial, 'Active');
        console.log(`PPP secret enabled successfully for ${user.username_dial}`);
        
        toast({
          title: "Success",
          description: "Subscription extended and user enabled in MikroTik successfully",
        });
      } catch (mikrotikError) {
        console.error('Failed to enable PPP secret in MikroTik:', mikrotikError);
        
        // Add to retry queue for automatic retry every 3 minutes with original status info
        setRetryQueue(prev => [...prev, {
          username: user.username_dial,
          userId: user.id,
          attempts: 0,
          originalStatus: originalStatus,
          originalPaymentStatus: originalPaymentStatus
        }]);
        
        toast({
          title: "Partial Success",
          description: "Subscription extended successfully. Failed to enable PPP secret in MikroTik - will retry automatically every 3 minutes.",
          variant: "destructive",
        });
      }
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extend period",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppMessage = (user: User) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const message = `Yth. Bapak/Ibu ${user.name},

Kami informasikan bahwa masa aktif layanan internet Anda akan berakhir dalam 3 hari ke depan. Untuk menghindari gangguan layanan, segera lakukan pembayaran sebelum masa aktif berakhir.

Tagihan layanan WiFi Anda untuk bulan berikutnya telah diterbitkan dengan rincian sebagai berikut:

📶 Paket Layanan : ${user.package}
💰 Jumlah Tagihan : ${formatCurrency(user.price)}
📅 Jatuh Tempo : ${formatDate(user.expired_date)}

Pembayaran dapat dilakukan melalui berbagai metode berikut:
🔸 Dompet digital: ShopeePay, OVO, DANA
🔸 Gerai retail: Indomaret, Alfamart
🔸 Transfer bank: BCA, BRI, BNI, Mandiri

Rekening Tujuan:
🏦 Bank BCA
💳 No. Rekening: 1240640712
👤 a.n. Muhammad Khoirul Anam

Atau pembayaran dapat dilakukan langsung ke alamat berikut:
📞 WhatsApp: 0813-5733-3886
📌 Alamat: Jl. Blambangan No.35 RT 01 / RW 05, Dampit, Kab. Malang
🔗 Lokasi Google Maps: https://maps.app.goo.gl/UYwZdBPS8LKy9Gii6

📢 Setelah melakukan pembayaran, mohon segera konfirmasi kepada admin untuk mempercepat proses verifikasi.

Apabila Anda mengalami kendala atau memiliki keluhan terkait layanan internet selama satu bulan terakhir, silakan sampaikan kepada admin agar dapat segera ditindaklanjuti.

Terima kasih atas kepercayaan Anda menggunakan layanan kami.

Hormat kami,
Tim Interfast Media`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const exportToExcel = () => {
    const exportData = filteredUsers.map(user => ({
      NIK: user.nik,
      Name: user.name,
      Phone: user.phone,
      Address: user.address,
      'RT/RW': user.rt_rw,
      Village: user.village,
      City: user.city,
      Province: user.province,
      Package: user.package,
      Price: user.price,
      'Installation Date': user.installation_date,
      'Expired Date': user.expired_date,
      'Username Dial': user.username_dial,
      'Payment Status': user.payment_status,
      'User Status': user.user_status
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, 'users_export.xlsx');

    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process and validate data
        const usersToImport = jsonData.map((row: any) => ({
          nik: row.NIK || '',
          name: row.Name || '',
          phone: row.Phone || '',
          address: row.Address || '',
          rt_rw: row['RT/RW'] || '',
          village: row.Village || '',
          city: row.City || '',
          province: row.Province || '',
          country: 'Indonesia',
          package: row.Package || 'Interfast Bronze',
          price: row.Price || 100000,
          installation_date: row['Installation Date'] || new Date().toISOString().split('T')[0],
          expired_date: row['Expired Date'] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          username_dial: row['Username Dial'] || '',
          payment_status: row['Payment Status'] || 'Paid',
          user_status: row['User Status'] || 'Active'
        }));

        // Insert data to database
        const { error } = await supabase
          .from('users')
          .insert(usersToImport);

        if (error) throw error;

        toast({
          title: "Success",
          description: `${usersToImport.length} users imported successfully`,
        });

        fetchUsers();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to import data",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Active: 'default',
      Inactive: 'secondary',
      Terminate: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants = {
      Paid: 'default',
      Unpaid: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button onClick={exportToExcel} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label htmlFor="import-file">
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <input
            id="import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={importFromExcel}
            className="hidden"
          />
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, NIK, phone, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Terminate">Terminate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">NIK</TableHead>
                  <TableHead className="w-48">Name</TableHead>
                  <TableHead className="w-64">Address</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="w-36">Expired Date</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>User Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium w-32">{user.nik}</TableCell>
                    <TableCell className="w-48">{user.name}</TableCell>
                    <TableCell className="w-64 max-w-64 truncate" title={user.address}>{user.address}</TableCell>
                    <TableCell>{user.package}</TableCell>
                    <TableCell className="w-36">{user.expired_date}</TableCell>
                    <TableCell>{getPaymentBadge(user.payment_status)}</TableCell>
                    <TableCell>{getStatusBadge(user.user_status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/users/${user.nik}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendWhatsAppMessage(user)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={user.user_status === 'Terminate'}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Extend Subscription Period</AlertDialogTitle>
                              <AlertDialogDescription>
                                {(() => {
                                  const today = new Date();
                                  const expiredDate = new Date(user.expired_date);
                                  let newExpiredDate;
                                  let paymentTiming;
                                  
                                  if (today > expiredDate) {
                                    // Paying after expired date - use today's date + 1 month, keep the day
                                    newExpiredDate = new Date(today);
                                    newExpiredDate.setMonth(newExpiredDate.getMonth() + 1);
                                    paymentTiming = 'after expired date';
                                  } else {
                                    // Paying before expired date - use original expired date + 1 month, keep the day
                                    newExpiredDate = new Date(expiredDate);
                                    newExpiredDate.setMonth(newExpiredDate.getMonth() + 1);
                                    paymentTiming = 'before expired date';
                                  }
                                  
                                  return `Are you sure you want to extend the subscription for ${user.name}? This will change the expired date from ${user.expired_date} to ${newExpiredDate.toISOString().split('T')[0]} (paying ${paymentTiming}) and set payment status to Paid.`;
                                })()}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleExtendPeriod(user)}>
                                Extend Period
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSave={fetchUsers}
        users={users}
      />
    </div>
  );
};

export default UserManagement;
