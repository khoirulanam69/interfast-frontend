import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface MonthlyData {
  month: string;
  year: number;
  newUsers: number;
  revenue: number;
  totalUsers: number;
}

const Analytics = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get users data grouped by month
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('created_at, price, user_status, payment_status, installation_date, expired_date');

      if (usersError) throw usersError;

      console.log('Users data:', users);

      // Group data by month and calculate metrics
      const monthlyStats: { [key: string]: MonthlyData } = {};
      
      // First pass: calculate new users per month
      users?.forEach(user => {
        const date = new Date(user.created_at);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = {
            month: monthName,
            year: date.getFullYear(),
            newUsers: 0,
            revenue: 0,
            totalUsers: 0
          };
        }
        
        monthlyStats[monthKey].newUsers += 1;
      });

      // Second pass: calculate revenue for each month from ALL active users
      // For each month, count revenue from all users who were active during that month
      Object.keys(monthlyStats).forEach(monthKey => {
        const [year, monthStr] = monthKey.split('-');
        const targetMonth = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
        const targetMonthEnd = new Date(parseInt(year), parseInt(monthStr), 0); // Last day of the month
        
        let monthlyRevenue = 0;
        
        users?.forEach(user => {
          const installationDate = new Date(user.installation_date);
          const expiredDate = new Date(user.expired_date);
          
          // Check if user was active during this month
          // User is active if: installation_date <= last day of month AND expired_date >= first day of month
          const isActiveInMonth = installationDate <= targetMonthEnd && expiredDate >= targetMonth;
          
          // Calculate revenue from all active users regardless of payment_status
          // because payment_status is reset monthly but we want to show expected revenue
          if (isActiveInMonth && user.user_status === 'Active') {
            monthlyRevenue += user.price;
          }
        });
        
        monthlyStats[monthKey].revenue = monthlyRevenue;
        console.log(`Revenue for ${monthKey}: ${monthlyRevenue}`);
      });

      // Calculate cumulative total users
      let cumulativeUsers = 0;
      const sortedData = Object.values(monthlyStats)
        .sort((a, b) => {
          const aDate = new Date(a.year, a.month.split(' ')[0] === 'Januari' ? 0 : 
                                    a.month.split(' ')[0] === 'Februari' ? 1 :
                                    a.month.split(' ')[0] === 'Maret' ? 2 :
                                    a.month.split(' ')[0] === 'April' ? 3 :
                                    a.month.split(' ')[0] === 'Mei' ? 4 :
                                    a.month.split(' ')[0] === 'Juni' ? 5 :
                                    a.month.split(' ')[0] === 'Juli' ? 6 :
                                    a.month.split(' ')[0] === 'Agustus' ? 7 :
                                    a.month.split(' ')[0] === 'September' ? 8 :
                                    a.month.split(' ')[0] === 'Oktober' ? 9 :
                                    a.month.split(' ')[0] === 'November' ? 10 : 11);
          const bDate = new Date(b.year, b.month.split(' ')[0] === 'Januari' ? 0 : 
                                    b.month.split(' ')[0] === 'Februari' ? 1 :
                                    b.month.split(' ')[0] === 'Maret' ? 2 :
                                    b.month.split(' ')[0] === 'April' ? 3 :
                                    b.month.split(' ')[0] === 'Mei' ? 4 :
                                    b.month.split(' ')[0] === 'Juni' ? 5 :
                                    b.month.split(' ')[0] === 'Juli' ? 6 :
                                    b.month.split(' ')[0] === 'Agustus' ? 7 :
                                    b.month.split(' ')[0] === 'September' ? 8 :
                                    b.month.split(' ')[0] === 'Oktober' ? 9 :
                                    b.month.split(' ')[0] === 'November' ? 10 : 11);
          return aDate.getTime() - bDate.getTime();
        })
        .map(data => {
          cumulativeUsers += data.newUsers;
          return { ...data, totalUsers: cumulativeUsers };
        });

      console.log('Final sorted data:', sortedData);
      setMonthlyData(sortedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const chartConfig = {
    newUsers: {
      label: "New Users",
      color: "#3b82f6",
    },
    revenue: {
      label: "Revenue",
      color: "#10b981",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  const totalUsers = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].totalUsers : 0;
  const totalRevenue = monthlyData.reduce((sum, data) => sum + data.revenue, 0);
  const thisMonthUsers = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].newUsers : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {thisMonthUsers} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.length >= 2 ? 
                ((monthlyData[monthlyData.length - 1].newUsers / Math.max(monthlyData[monthlyData.length - 2].newUsers, 1) - 1) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Users Per Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div style={{ minWidth: `${Math.max(600, monthlyData.length * 80)}px` }}>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar 
                        dataKey="newUsers" 
                        fill="var(--color-newUsers)" 
                        name="New Users"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue (All Active Users)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div style={{ minWidth: `${Math.max(600, monthlyData.length * 80)}px` }}>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={10}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--color-revenue)" 
                        strokeWidth={3}
                        name="Revenue"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
