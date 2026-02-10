import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { databaseService } from '@/services/databaseService';
import { Users, DollarSign, Search } from 'lucide-react';

const ReferralPage = () => {
  const [referralData, setReferralData] = useState<any[]>([]);
  const [filteredReferralData, setFilteredReferralData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalReferrers: 0,
    totalReferrals: 0,
    totalDiscounts: 0
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  useEffect(() => {
    filterReferralData();
  }, [referralData, searchTerm]);

  const filterReferralData = () => {
    if (!searchTerm) {
      setFilteredReferralData(referralData);
      return;
    }

    const filtered = referralData.filter((referrer: any) =>
      referrer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referrer.nik.includes(searchTerm) ||
      referrer.package.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredReferralData(filtered);
  };

  const fetchReferralData = async () => {
    try {
      const users = await databaseService.getUsers();

      // Process referral data
      const referrers = users.filter((user: any) => 
        users.some((u: any) => u.referred_by === user.id)
      );

      const referralStats = referrers.map((referrer: any) => {
        const referrals = users.filter((u: any) => u.referred_by === referrer.id);
        const activeReferrals = referrals.filter((r: any) => r.user_status === 'Active');
        const discount = activeReferrals.length * 10000;
        const finalPrice = referrer.price - discount;

        return {
          ...referrer,
          referrals: referrals,
          activeReferrals: activeReferrals.length,
          totalReferrals: referrals.length,
          discount: discount,
          finalPrice: Math.max(0, finalPrice)
        };
      });

      setReferralData(referralStats);
      setFilteredReferralData(referralStats);
      
      setStats({
        totalReferrers: referrers.length,
        totalReferrals: users.filter((u: any) => u.referred_by).length,
        totalDiscounts: referralStats.reduce((sum: number, r: any) => sum + r.discount, 0)
      });

    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Inactive': 'bg-yellow-100 text-yellow-800',
      'Terminate': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Referral Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalDiscounts)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, NIK, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Referral Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users with Referrals ({filteredReferralData.length})</CardTitle>
          <p className="text-sm text-gray-600">
            Each active referral provides Rp10,000 monthly discount to the referrer
          </p>
        </CardHeader>
        <CardContent className="w-full p-0">
          <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] w-[120px]">Referrer</TableHead>
                    <TableHead className="min-w-[100px] w-[100px]">Package</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Original Price</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Active Referrals</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Total Referrals</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Discount</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Final Price</TableHead>
                    <TableHead className="min-w-[80px] w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReferralData.map((referrer: any) => (
                    <TableRow key={referrer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm truncate">{referrer.name}</div>
                          <div className="text-xs text-gray-500">{referrer.nik}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{referrer.package}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(referrer.price)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {referrer.activeReferrals}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{referrer.totalReferrals}</TableCell>
                      <TableCell className="text-green-600 font-medium text-xs">
                        -{formatCurrency(referrer.discount)}
                      </TableCell>
                      <TableCell className="font-bold text-xs">
                        {formatCurrency(referrer.finalPrice)}
                      </TableCell>
                      <TableCell>{getStatusBadge(referrer.user_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {filteredReferralData.length === 0 && !searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No users with referrals found
            </div>
          )}

          {filteredReferralData.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No referrers found matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Details */}
      {filteredReferralData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <div className="space-y-6">
              {filteredReferralData.map((referrer: any) => (
                <div key={referrer.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">
                    {referrer.name} - Referrals ({referrer.totalReferrals})
                  </h3>
                  <div className="w-full overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[120px] w-[120px]">Name</TableHead>
                            <TableHead className="min-w-[100px] w-[100px]">NIK</TableHead>
                            <TableHead className="min-w-[100px] w-[100px]">Package</TableHead>
                            <TableHead className="min-w-[80px] w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[100px] w-[100px]">Installation Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referrer.referrals.map((referral: any) => (
                            <TableRow key={referral.id}>
                              <TableCell className="text-sm truncate">{referral.name}</TableCell>
                              <TableCell className="font-mono text-xs">{referral.nik}</TableCell>
                              <TableCell className="text-xs">{referral.package}</TableCell>
                              <TableCell>{getStatusBadge(referral.user_status)}</TableCell>
                              <TableCell className="text-xs">{new Date(referral.installation_date).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralPage;
