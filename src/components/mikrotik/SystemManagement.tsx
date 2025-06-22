
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Activity,
  HardDrive,
  Cpu,
  RefreshCw,
  Power,
  Monitor
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';
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

const SystemManagement = () => {
  const [systemResource, setSystemResource] = useState<any>(null);
  const [systemIdentity, setSystemIdentity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSystemResource = async () => {
    setLoading(true);
    try {
      const result = await mikrotikService.getSystemResource();
      if (result.success) {
        setSystemResource(result.data?.[0] || null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching system resource:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system resource",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemIdentity = async () => {
    try {
      const result = await mikrotikService.getSystemIdentity();
      if (result.success) {
        setSystemIdentity(result.data?.[0] || null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching system identity:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system identity",
        variant: "destructive",
      });
    }
  };

  const handleReboot = async () => {
    try {
      const result = await mikrotikService.rebootSystem();
      if (result.success) {
        toast({
          title: "Success",
          description: "System reboot initiated successfully",
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

  const formatUptime = (uptime: string) => {
    if (!uptime) return 'N/A';
    return uptime;
  };

  const formatBytes = (bytes: string) => {
    if (!bytes || bytes === '0') return '0 B';
    const num = parseInt(bytes);
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(1024));
    return Math.round(num / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getCPUUsagePercentage = () => {
    if (!systemResource || !systemResource['cpu-load']) return 0;
    return parseInt(systemResource['cpu-load']);
  };

  const getMemoryUsagePercentage = () => {
    if (!systemResource || !systemResource['total-memory'] || !systemResource['free-memory']) return 0;
    const total = parseInt(systemResource['total-memory']);
    const free = parseInt(systemResource['free-memory']);
    const used = total - free;
    return Math.round((used / total) * 100);
  };

  const getStorageUsagePercentage = () => {
    if (!systemResource || !systemResource['total-hdd-space'] || !systemResource['free-hdd-space']) return 0;
    const total = parseInt(systemResource['total-hdd-space']);
    const free = parseInt(systemResource['free-hdd-space']);
    const used = total - free;
    return Math.round((used / total) * 100);
  };

  useEffect(() => {
    fetchSystemResource();
    fetchSystemIdentity();
  }, []);

  return (
    <div className="space-y-6">
      {/* System Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              System Identity
            </CardTitle>
            <Button 
              onClick={() => {
                fetchSystemResource();
                fetchSystemIdentity();
              }}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systemIdentity ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Router Name</p>
                <p className="font-medium">{systemIdentity.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-medium">{systemResource?.version || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No system identity information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Resource */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : systemResource ? (
            <div className="space-y-6">
              {/* CPU Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm text-gray-600">{getCPUUsagePercentage()}%</span>
                </div>
                <Progress value={getCPUUsagePercentage()} className="w-full" />
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatBytes(systemResource['total-memory'] || '0')} total
                  </span>
                </div>
                <Progress value={getMemoryUsagePercentage()} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Used: {formatBytes((parseInt(systemResource['total-memory'] || '0') - parseInt(systemResource['free-memory'] || '0')).toString())}</span>
                  <span>Free: {formatBytes(systemResource['free-memory'] || '0')}</span>
                </div>
              </div>

              {/* Storage Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm font-medium">Storage Usage</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatBytes(systemResource['total-hdd-space'] || '0')} total
                  </span>
                </div>
                <Progress value={getStorageUsagePercentage()} className="w-full" />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Used: {formatBytes((parseInt(systemResource['total-hdd-space'] || '0') - parseInt(systemResource['free-hdd-space'] || '0')).toString())}</span>
                  <span>Free: {formatBytes(systemResource['free-hdd-space'] || '0')}</span>
                </div>
              </div>

              {/* System Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Uptime</p>
                  <p className="font-medium">{formatUptime(systemResource.uptime)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Board Name</p>
                  <p className="font-medium">{systemResource['board-name'] || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Architecture</p>
                  <p className="font-medium">{systemResource['architecture-name'] || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">CPU Count</p>
                  <p className="font-medium">{systemResource['cpu-count'] || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">CPU Frequency</p>
                  <p className="font-medium">{systemResource['cpu-frequency'] ? `${systemResource['cpu-frequency']} MHz` : 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Platform</p>
                  <p className="font-medium">{systemResource['platform'] || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No system resource information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Power className="h-4 w-4" />
                  Reboot System
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reboot System</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reboot the MikroTik system? This will temporarily disconnect all users and services.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReboot} className="bg-red-600 hover:bg-red-700">
                    Reboot Now
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemManagement;
