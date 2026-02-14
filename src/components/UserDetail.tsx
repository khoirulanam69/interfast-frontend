import React, { useState, useEffect, useCallback } from 'react';
import { formatDateWIB } from '@/utils/dateUtils';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { databaseService } from '@/services/databaseService';
import { mikrotikService } from '@/services/mikrotikService';
import { useToast } from '@/hooks/use-toast';

interface BandwidthData {
  time: string;
  download: number;
  upload: number;
}

const UserDetail = () => {
  const { nik } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [bandwidthData, setBandwidthData] = useState<BandwidthData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    if (!nik) return;
    
    try {
      setLoading(true);
      const data = await databaseService.getUserByNik(nik);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [nik, toast]);

  const fetchBandwidthData = useCallback(async () => {
    if (!user?.username_dial) return;

    try {
      // Get PPP active connections to find interface traffic
      const result = await mikrotikService.getPPPActive();
      
      if (result.success && result.data) {
        const activeConnection = result.data.find((conn: any) => 
          conn.name === user.username_dial
        );

        if (activeConnection) {
          // Simulate bandwidth data - in real implementation, you'd get this from MikroTik interface monitoring
          const currentTime = new Date().toLocaleTimeString();
          const newData: BandwidthData = {
            time: currentTime,
            download: Math.random() * 10 + 5, // Simulated download in Mbps (5-15 Mbps range)
            upload: Math.random() * 5 + 1,    // Simulated upload in Mbps (1-6 Mbps range)
          };

          setBandwidthData(prev => {
            const updated = [...prev, newData];
            // Keep only last 20 data points for better visualization
            return updated.slice(-20);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching bandwidth data:', error);
    }
  }, [user?.username_dial]);

  // Fetch user data only once when component mounts
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Set up bandwidth monitoring only after user is loaded
  useEffect(() => {
    if (!user?.username_dial) return;

    // Initial fetch
    fetchBandwidthData();
    
    // Set up interval for real-time updates every 3 seconds
    const interval = setInterval(fetchBandwidthData, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user?.username_dial, fetchBandwidthData]);

  const chartConfig = {
    download: {
      label: "Download",
      color: "#3b82f6",
    },
    upload: {
      label: "Upload", 
      color: "#ef4444",
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading user details...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">User not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/users')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-2xl font-bold">User Detail - {user.name}</h1>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>NIK:</strong> {user.nik}</div>
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Phone:</strong> {user.phone}</div>
            <div><strong>Address:</strong> {user.address}</div>
            <div><strong>Package:</strong> {user.package}</div>
            <div><strong>Username PPPoE:</strong> {user.username_dial}</div>
            <div><strong>Password PPPoE:</strong> {user.password_pppoe || '-'}</div>
            <div><strong>Status:</strong> {user.user_status}</div>
            <div><strong>Payment:</strong> {user.payment_status}</div>
            {user.installation_date && (
              <div><strong>Installation Date:</strong> {formatDateWIB(user.installation_date)}</div>
            )}
            {user.expired_date && (
              <div><strong>Expired Date:</strong> {formatDateWIB(user.expired_date)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bandwidthData.length > 0 ? (
              <>
                <div><strong>Current Download:</strong> {bandwidthData[bandwidthData.length - 1].download.toFixed(2)} Mbps</div>
                <div><strong>Current Upload:</strong> {bandwidthData[bandwidthData.length - 1].upload.toFixed(2)} Mbps</div>
                <div><strong>Last Updated:</strong> {bandwidthData[bandwidthData.length - 1].time}</div>
              </>
            ) : (
              <div>No bandwidth data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Real-time Bandwidth Monitoring (Per 3 Seconds)</CardTitle>
        </CardHeader>
        <CardContent>
          {bandwidthData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bandwidthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: 'Mbps', angle: -90, position: 'insideLeft' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="download" 
                    stroke="var(--color-download)" 
                    strokeWidth={2}
                    name="Download"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="upload" 
                    stroke="var(--color-upload)" 
                    strokeWidth={2}
                    name="Upload"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-80">
              <div className="text-gray-500">Loading bandwidth data...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDetail;
