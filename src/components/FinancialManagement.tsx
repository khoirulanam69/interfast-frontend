import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Trash2, Edit, ArrowUpCircle, ArrowDownCircle, Wallet, User } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { id } from 'date-fns/locale';

type TransactionType = 'income' | 'expense';
type TransactionCategory = 'subscription' | 'installation' | 'other_income' | 'operational' | 'salary' | 'equipment' | 'maintenance' | 'other_expense';

interface Transaction {
  id: string;
  transaction_type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string | null;
  transaction_date: string;
  user_id: string | null;
  created_at: string;
}

interface FinancialSummary {
  id: string;
  month: number;
  year: number;
  total_income: number;
  total_expense: number;
  net_profit: number;
}

interface Customer {
  id: string;
  name: string;
  username_dial: string;
  price: number;
  expired_date: string;
  payment_status: string;
  user_status: string;
}

const categoryLabels: Record<TransactionCategory, string> = {
  subscription: 'Langganan',
  installation: 'Instalasi',
  other_income: 'Pemasukan Lain',
  operational: 'Operasional',
  salary: 'Gaji',
  equipment: 'Peralatan',
  maintenance: 'Pemeliharaan',
  other_expense: 'Pengeluaran Lain',
};

const incomeCategories: TransactionCategory[] = ['subscription', 'installation', 'other_income'];
const expenseCategories: TransactionCategory[] = ['operational', 'salary', 'equipment', 'maintenance', 'other_expense'];

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const FinancialManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [monthlySummaries, setMonthlySummaries] = useState<FinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    transaction_type: 'income' as TransactionType,
    category: 'subscription' as TransactionCategory,
    amount: '',
    description: '',
    transaction_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const showCustomerSelector = formData.transaction_type === 'income' && formData.category === 'subscription';

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
    fetchMonthlySummaries();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (showCustomerSelector) {
      fetchCustomers();
    }
  }, [showCustomerSelector]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username_dial, price, expired_date, payment_status, user_status')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers((data || []) as Customer[]);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        amount: String(customer.price),
        description: `Pembayaran langganan - ${customer.name} (${customer.username_dial})`,
      }));
    }
  };

  const fetchTransactions = async () => {
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as Transaction[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data transaksi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_summary')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .maybeSingle();

      if (error) throw error;
      setSummary(data as FinancialSummary | null);
    } catch (error: any) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchMonthlySummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_summary')
        .select('*')
        .eq('year', selectedYear)
        .order('month', { ascending: true });

      if (error) throw error;
      setMonthlySummaries((data || []) as FinancialSummary[]);
    } catch (error: any) {
      console.error('Error fetching monthly summaries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Jumlah harus lebih dari 0',
        variant: 'destructive',
      });
      return;
    }

    // Validate customer selection for subscription payments
    if (showCustomerSelector && !selectedCustomerId && !editingTransaction) {
      toast({
        title: 'Error',
        description: 'Pilih pelanggan terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      const transactionData = {
        transaction_type: formData.transaction_type,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description || null,
        transaction_date: formData.transaction_date,
        user_id: showCustomerSelector && selectedCustomerId ? selectedCustomerId : null,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast({ title: 'Sukses', description: 'Transaksi berhasil diperbarui' });
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transactionData]);

        if (error) throw error;

        // If this is a subscription payment, update the customer data
        if (showCustomerSelector && selectedCustomerId) {
          const customer = customers.find(c => c.id === selectedCustomerId);
          if (customer) {
            // Calculate new expired date: add 1 calendar month to the current expired date
            const currentExpiredDate = new Date(customer.expired_date);
            const newExpiredDate = addMonths(currentExpiredDate, 1);
            
            const { error: updateError } = await supabase
              .from('users')
              .update({
                expired_date: format(newExpiredDate, 'yyyy-MM-dd'),
                payment_status: 'Paid',
                user_status: 'Active',
              })
              .eq('id', selectedCustomerId);

            if (updateError) {
              console.error('Error updating customer:', updateError);
              toast({ 
                title: 'Peringatan', 
                description: 'Transaksi tersimpan, tapi gagal update status pelanggan',
                variant: 'destructive',
              });
            } else {
              toast({ 
                title: 'Sukses', 
                description: `Transaksi berhasil & status ${customer.name} diperbarui` 
              });
            }
          }
        } else {
          toast({ title: 'Sukses', description: 'Transaksi berhasil ditambahkan' });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTransactions();
      fetchSummary();
      fetchMonthlySummaries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan transaksi',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sukses', description: 'Transaksi berhasil dihapus' });
      fetchTransactions();
      fetchSummary();
      fetchMonthlySummaries();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus transaksi',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: String(transaction.amount),
      description: transaction.description || '',
      transaction_date: transaction.transaction_date,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setSelectedCustomerId('');
    setFormData({
      transaction_type: 'income',
      category: 'subscription',
      amount: '',
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleTypeChange = (type: TransactionType) => {
    setSelectedCustomerId('');
    setFormData(prev => ({
      ...prev,
      transaction_type: type,
      category: type === 'income' ? 'subscription' : 'operational',
      amount: '',
      description: '',
    }));
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setSelectedCustomerId('');
    setFormData(prev => ({
      ...prev,
      category,
      amount: category === 'subscription' ? '' : prev.amount,
      description: category === 'subscription' ? '' : prev.description,
    }));
  };

  const currentIncome = summary?.total_income || 0;
  const currentExpense = summary?.total_expense || 0;
  const currentProfit = summary?.net_profit || 0;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Keuangan</h1>
          <p className="text-gray-500">Kelola pemasukan, pengeluaran, dan laba</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pilih Bulan" />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pemasukan</CardTitle>
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(currentIncome)}</div>
            <p className="text-xs text-gray-500 mt-1">{monthNames[selectedMonth - 1]} {selectedYear}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pengeluaran</CardTitle>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatRupiah(currentExpense)}</div>
            <p className="text-xs text-gray-500 mt-1">{monthNames[selectedMonth - 1]} {selectedYear}</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${currentProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Laba Bersih</CardTitle>
            <Wallet className={`h-5 w-5 ${currentProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatRupiah(currentProfit)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{monthNames[selectedMonth - 1]} {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="summary">Ringkasan Tahunan</TabsTrigger>
          </TabsList>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
                <DialogDescription>
                  {editingTransaction ? 'Perbarui data transaksi' : 'Masukkan data transaksi baru'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipe Transaksi</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.transaction_type === 'income' ? 'default' : 'outline'}
                      className={formData.transaction_type === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                      onClick={() => handleTypeChange('income')}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Pemasukan
                    </Button>
                    <Button
                      type="button"
                      variant={formData.transaction_type === 'expense' ? 'default' : 'outline'}
                      className={formData.transaction_type === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
                      onClick={() => handleTypeChange('expense')}
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Pengeluaran
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => handleCategoryChange(v as TransactionCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.transaction_type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryLabels[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Selector - Only show for subscription income */}
                {showCustomerSelector && !editingTransaction && (
                  <div className="space-y-2">
                    <Label htmlFor="customer">Pelanggan</Label>
                    <Select 
                      value={selectedCustomerId} 
                      onValueChange={handleCustomerSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pelanggan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{customer.name}</span>
                              <span className="text-muted-foreground">({customer.username_dial})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomerId && (
                      <p className="text-xs text-muted-foreground">
                        Expired: {format(new Date(customers.find(c => c.id === selectedCustomerId)?.expired_date || ''), 'dd MMM yyyy', { locale: id })}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100000"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    readOnly={showCustomerSelector && !!selectedCustomerId}
                    className={showCustomerSelector && selectedCustomerId ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction_date">Tanggal</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Keterangan transaksi..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    {editingTransaction ? 'Perbarui' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Transaksi</CardTitle>
              <CardDescription>
                Transaksi bulan {monthNames[selectedMonth - 1]} {selectedYear}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada transaksi untuk periode ini
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.transaction_date), 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.transaction_type === 'income' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.transaction_type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </TableCell>
                          <TableCell>{categoryLabels[transaction.category]}</TableCell>
                          <TableCell className="max-w-48 truncate">
                            {transaction.description || '-'}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'income' ? '+' : '-'}
                            {formatRupiah(transaction.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(transaction)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Transaksi ini akan dihapus secara permanen.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(transaction.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Keuangan Tahun {selectedYear}</CardTitle>
              <CardDescription>
                Perbandingan pemasukan, pengeluaran, dan laba per bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">Pemasukan</TableHead>
                      <TableHead className="text-right">Pengeluaran</TableHead>
                      <TableHead className="text-right">Laba Bersih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthNames.map((name, index) => {
                      const monthData = monthlySummaries.find(s => s.month === index + 1);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatRupiah(monthData?.total_income || 0)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatRupiah(monthData?.total_expense || 0)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            (monthData?.net_profit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {formatRupiah(monthData?.net_profit || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Total Row */}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatRupiah(monthlySummaries.reduce((sum, s) => sum + s.total_income, 0))}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatRupiah(monthlySummaries.reduce((sum, s) => sum + s.total_expense, 0))}
                      </TableCell>
                      <TableCell className={`text-right ${
                        monthlySummaries.reduce((sum, s) => sum + s.net_profit, 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {formatRupiah(monthlySummaries.reduce((sum, s) => sum + s.net_profit, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialManagement;
