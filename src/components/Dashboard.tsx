
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, Percent, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalDiscounts: 0,
    userGrowth: [],
    revenueGrowth: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Update current month analytics
      await supabase.rpc('update_monthly_analytics');
      
      // Fetch analytics data
      const { data: analytics } = await supabase
        .from('analytics')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      // Fetch current stats
      const { data: users } = await supabase
        .from('users')
        .select('*');

      if (users) {
        const activeUsers = users.filter(u => u.user_status === 'Active');
        const paidUsers = users.filter(u => u.payment_status === 'Paid' && u.user_status === 'Active');
        
        // Calculate gross revenue
        const grossRevenue = paidUsers.reduce((sum, user) => sum + user.price, 0);
        
        // Calculate total discounts
        let totalDiscounts = 0;
        for (const user of activeUsers) {
          const referrals = users.filter(u => u.referred_by === user.id && u.user_status === 'Active');
          totalDiscounts += referrals.length * 10000;
        }

        // Calculate net revenue (gross revenue - discounts)
        const netRevenue = grossRevenue - totalDiscounts;

        setStats({
          totalRevenue: netRevenue, // Now shows net revenue after discounts
          totalUsers: activeUsers.length,
          totalDiscounts,
          userGrowth: analytics?.map(a => ({
            month: `${a.month}/${a.year}`,
            users: a.total_users
          })) || [],
          revenueGrowth: analytics?.map(a => ({
            month: `${a.month}/${a.year}`,
            revenue: a.total_revenue
          })) || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDiscounts)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.userGrowth.length > 1 
                ? `${((stats.userGrowth[stats.userGrowth.length - 1]?.users - stats.userGrowth[stats.userGrowth.length - 2]?.users) || 0)}%`
                : '0%'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Growth per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
