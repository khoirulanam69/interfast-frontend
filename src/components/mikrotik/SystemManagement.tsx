
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Server, 
  RefreshCw, 
  Power,
  Cpu,
  HardDrive,
  Clock
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';

const SystemManagement = () => {
  const [systemResource, setSystemResource] = useState(null);
  const [systemIdentity, setSystemIdentity] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const [resourceResult, identityResult] = await Promise.all([
        mikrotikService.getSystemResource(),
        mikrotikService.getSystemIdentity()
      ]);
      
      if (resourceResult.success) {
        setSystemResource(resourceResult.data);
      }
      
      if (identityResult.success) {
        setSystemIdentity(identityResult.data);
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReboot = async () => {
    if (!confirm('Are you sure you want to reboot the system? This will disconnect all users.')) {
      return;
    }
    
    try {
      const result = await mikrotikService.rebootSystem();
      if (result.success) {
        toast({
          title: "Success",
          description: "System reboot initiated",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error rebooting system:', error);
      toast({
        title: "Error",
        description: "Failed to reboot system",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Management</h2>
        <div className="flex gap-2">
          <Button 
            onClick={fetchSystemInfo}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleReboot}
            variant="destructive"
            size="sm"
          >
            <Power className="h-4 w-4 mr-2" />
            Reboot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : systemIdentity ? (
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Name: </span>
                  <span>{systemIdentity.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">Version: </span>
                  <Badge variant="outline">{systemIdentity.version || 'N/A'}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No system identity data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : systemResource ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">CPU Load:</span>
                  <Badge variant="outline">{systemResource.cpuLoad || '0'}%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Free Memory:</span>
                  <span>{systemResource.freeMemory || '0'} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Memory:</span>
                  <span>{systemResource.totalMemory || '0'} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Uptime:</span>
                  <span>{systemResource.uptime || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No system resource data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemManagement;
