import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Edit, Trash2, Calendar, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mikrotikService } from '@/services/mikrotikService';
import { generateUniqueUsernameDial } from '@/utils/usernameGenerator';
import { useUserStatusUpdater } from '@/hooks/useUserStatusUpdater';
import UserFormModal from './UserFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPackage, setFilterPackage] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const { toast } = useToast();

  // Use the auto status updater hook
  useUserStatusUpdater();

  // Generate username dial format: [nama panggilan]_[address]_[nomor urut jika diperlukan]
  const generateUsernameDial = async (namaPanggilan: string, address: string) => {
    return await generateUniqueUsernameDial(namaPanggilan, address, users);
  };

  // Format date to dd-mm-yyyy
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Calculate discount for user
  const calculateDiscount = (userId: string) => {
    const referrals = users.filter(u => u.referred_by === userId && u.user_status === 'Active');
    return referrals.length * 10000; // Rp10,000 per active referral
  };

  // Calculate final price after discount
  const calculateFinalPrice = (user: any) => {
    const discount = calculateDiscount(user.id);
    return Math.max(0, user.price - discount);
  };

  // Get profile from package name - corrected mapping
  const getProfileFromPackage = (packageName: string) => {
    const profileMap = {
      'Interfast Bronze': 'Interfast Bronze',
      'Interfast Silver': 'Interfast Silver', 
      'Interfast Gold': 'Interfast Gold',
      'Interfast Platinum': 'Interfast Platinum'
    };
    return profileMap[packageName] || 'Interfast Bronze'; // Default to Interfast Bronze
  };

  useEffect(() => {
    fetchUsers();
    // Check for expired users on component mount
    checkExpiredUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus, filterPackage, filterPayment, sortOrder]);

  const checkExpiredUsers = async () => {
    try {
      // Call the database function to update expired users
      const { error } = await supabase.rpc('update_expired_users');
      if (error) {
        console.error('Error checking expired users:', error);
      }
    } catch (error) {
      console.error('Error calling update_expired_users:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nik.includes(searchTerm) ||
        user.username_dial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      filtered = filtered.filter(user => user.user_status === filterStatus);
    }

    if (filterPackage) {
      filtered = filtered.filter(user => user.package === filterPackage);
    }

    if (filterPayment) {
      filtered = filtered.filter(user => user.payment_status === filterPayment);
    }

    // Sort by expired_date if sort order is set
    if (sortOrder) {
      filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.expired_date).getTime();
        const dateB = new Date(b.expired_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      
      if (user) {
        // First disconnect from MikroTik
        try {
          await mikrotikService.disconnectPPPUser(user.username_dial);
        } catch (error) {
          console.error('Error disconnecting PPP user:', error);
        }

        // Then delete PPP secret
        try {
          await mikrotikService.deletePPPSecret(user.username_dial);
        } catch (error) {
          console.error('Error deleting PPP secret:', error);
        }

        // Finally update user status to terminate
        try {
          await mikrotikService.updateUserStatus(user.username_dial, 'Terminate');
        } catch (error) {
          console.error('Error updating MikroTik status:', error);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User deleted successfully and removed from MikroTik",
      });
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
    }
  };

  const handleStatusChange = async (user: any, newStatus: 'Active' | 'Inactive' | 'Terminate') => {
    try {
      // Update MikroTik first
      const mikrotikResult = await mikrotikService.updateUserStatus(user.username_dial, newStatus);
      
      if (!mikrotikResult.success) {
        throw new Error('Failed to update MikroTik status');
      }

      // Then update database
      const { error } = await supabase
        .from('users')
        .update({ user_status: newStatus })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `User status updated to ${newStatus} and MikroTik access updated`,
      });
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
    }
  };

  const handleExtendPeriod = async (user: any) => {
    try {
      const currentExpiredDate = new Date(user.expired_date);
      const newExpiredDate = new Date(currentExpiredDate);
      newExpiredDate.setMonth(newExpiredDate.getMonth() + 1);

      const { error } = await supabase
        .from('users')
        .update({ 
          expired_date: newExpiredDate.toISOString().split('T')[0],
          payment_status: 'Paid', // Set to paid when extending
          user_status: 'Active' // Set to active when extending
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Update MikroTik status to Active
      await handleStatusChange(user, 'Active');
      
      toast({
        title: "Success",
        description: `Extended period for ${user.name} to ${formatDate(newExpiredDate.toISOString().split('T')[0])}, set payment status to Paid, and activated user`,
      });
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
      
      fetchUsers();
    } catch (error) {
      console.error('Error extending period:', error);
      toast({
        title: "Error",
        description: "Failed to extend period",
        variant: "destructive",
      });
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
    }
  };

  const handleRegenerateUsername = async (user: any) => {
    try {
      const oldUsername = user.username_dial;
      const newUsername = await generateUniqueUsernameDial(user.name, user.address, users);
      const newPassword = user.nik.slice(-6); // Use last 6 digits of NIK as password
      const profile = getProfileFromPackage(user.package);
      
      console.log('Regenerating with profile:', profile); // Debug log
      
      // Update MikroTik first
      const mikrotikResult = await mikrotikService.regenerateUserCredentials(oldUsername, newUsername, newPassword, profile);
      
      if (!mikrotikResult.success) {
        throw new Error('Failed to update MikroTik credentials');
      }

      // Then update database
      const { error } = await supabase
        .from('users')
        .update({ username_dial: newUsername })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Username dial regenerated to: ${newUsername} and MikroTik credentials updated`,
      });
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
      
      fetchUsers();
    } catch (error) {
      console.error('Error regenerating username:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate username",
        variant: "destructive",
      });
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        toast({
          title: "",
          description: "",
        });
      }, 3000);
    }
  };

  const handleUserSaved = async (userData?: any) => {
    try {
      // If this is a new user, create PPP secret in MikroTik
      if (!editingUser && userData && userData.username_dial) {
        const password = userData.nik.slice(-6); // Last 6 digits of NIK
        const profile = getProfileFromPackage(userData.package);
        
        console.log('Creating PPP secret with profile:', profile); // Debug log
        
        try {
          await mikrotikService.createPPPSecret(userData.username_dial, password, profile);
          
          toast({
            title: "Success",
            description: `User created and PPP secret added to MikroTik with profile: ${profile}`,
          });
        } catch (error) {
          console.error('Error creating PPP secret:', error);
          toast({
            title: "Warning", 
            description: "User created but failed to add PPP secret to MikroTik",
            variant: "destructive",
          });
        }
        
        // Auto dismiss after 3 seconds
        setTimeout(() => {
          toast({
            title: "",
            description: "",
          });
        }, 3000);
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Error in handleUserSaved:', error);
    }
  };

  const handleSendWhatsApp = (user: any) => {
    const discount = calculateDiscount(user.id);
    const finalPrice = calculateFinalPrice(user);
    
    const message = `Yth. Bapak/Ibu ${user.name},

Kami informasikan bahwa masa aktif layanan internet Anda akan berakhir dalam 3 hari ke depan. Untuk menghindari gangguan layanan, segera lakukan pembayaran sebelum masa aktif berakhir.

Tagihan layanan WiFi Anda untuk bulan berikutnya telah diterbitkan dengan rincian sebagai berikut:

📶 Paket Layanan : ${user.package}
💰 Jumlah Tagihan : ${formatCurrency(finalPrice)}
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

  const toggleSort = () => {
    if (sortOrder === null) {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder(null);
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="h-4 w-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUpDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-yellow-100 text-yellow-800',
      'Terminate': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors = {
      'Paid': 'bg-green-100 text-green-800',
      'Unpaid': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="w-full max-w-none space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
        <Button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Search and Filters</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="space-y-4">
            {/* Search bar at the top */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Filters below search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminate">Terminate</option>
              </select>
              <select
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="">All Packages</option>
                <option value="Interfast Bronze">Bronze</option>
                <option value="Interfast Silver">Silver</option>
                <option value="Interfast Gold">Gold</option>
                <option value="Interfast Platinum">Platinum</option>
              </select>
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="">All Payment Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent className="w-full p-0">
          <div className="overflow-x-auto w-full">
            <div className="min-w-full">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px] w-[100px]">NIK</TableHead>
                    <TableHead className="min-w-[120px] w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[100px] w-[100px]">Phone</TableHead>
                    <TableHead className="min-w-[150px] w-[150px]">Address</TableHead>
                    <TableHead className="min-w-[100px] w-[100px]">Package</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Price</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Discount</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Final Price</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Payment</TableHead>
                    <TableHead className="min-w-[100px] w-[100px]">Installation Date</TableHead>
                    <TableHead className="min-w-[100px] w-[100px]">
                      <Button variant="ghost" onClick={toggleSort} className="h-auto p-0 font-medium">
                        Expired Date {getSortIcon()}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[120px] w-[120px]">Username Dial</TableHead>
                    <TableHead className="min-w-[200px] w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const discount = calculateDiscount(user.id);
                    const finalPrice = calculateFinalPrice(user);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-xs">{user.nik}</TableCell>
                        <TableCell>
                          <div className="font-medium text-sm truncate">{user.name}</div>
                        </TableCell>
                        <TableCell className="text-xs">{user.phone}</TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate text-xs" title={`${user.address}, RT/RW: ${user.rt_rw}, ${user.village}, ${user.city}, ${user.province}, ${user.country}`}>
                            {`${user.address}, RT/RW: ${user.rt_rw}, ${user.village}, ${user.city}, ${user.province}, ${user.country}`}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{user.package}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(user.price)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(discount)}</TableCell>
                        <TableCell className="text-xs font-medium">{formatCurrency(finalPrice)}</TableCell>
                        <TableCell>
                          <select
                            value={user.user_status}
                            onChange={(e) => handleStatusChange(user, e.target.value as 'Active' | 'Inactive' | 'Terminate')}
                            className="px-1 py-1 text-xs border rounded w-full"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Terminate">Terminate</option>
                          </select>
                        </TableCell>
                        <TableCell>{getPaymentBadge(user.payment_status)}</TableCell>
                        <TableCell className="text-xs">{formatDate(user.installation_date)}</TableCell>
                        <TableCell className="text-xs">{formatDate(user.expired_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs truncate max-w-[100px]" title={user.username_dial}>{user.username_dial}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Regenerate Username Dial</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to regenerate the username dial for {user.name}? 
                                    This will update both the database and MikroTik PPP secret with new credentials.
                                    Current username: {user.username_dial}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRegenerateUsername(user)}>
                                    Regenerate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                  <Calendar className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Extend Subscription</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to extend the subscription for {user.name}? 
                                    The expired date will be changed from {formatDate(user.expired_date)} to {formatDate(new Date(new Date(user.expired_date).setMonth(new Date(user.expired_date).getMonth() + 1)).toISOString().split('T')[0])}.
                                    User status will be set to Active and payment status will be set to Paid.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleExtendPeriod(user)}>
                                    Extend Subscription
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendWhatsApp(user)}
                              className="h-7 w-7 p-0"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {user.name}? 
                                    This will also remove their PPP secret and disconnect any active connections from MikroTik.
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSave={handleUserSaved}
        users={users}
      />
    </div>
  );
};

export default UserManagement;
