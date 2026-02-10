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

import { Search, Plus, Edit, Trash2, MessageSquare, Eye, Filter, Download, Upload, ArrowUpDown } from 'lucide-react';
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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, paymentFilter, sortOrder]);


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

    // Apply sorting by expired date
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.expired_date).getTime();
        const dateB = new Date(b.expired_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredUsers(filtered);
  };

  const toggleSortOrder = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
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
                  <TableHead className="w-36">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleSortOrder}
                      className="h-8 p-0 hover:bg-transparent"
                    >
                      Expired Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
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
