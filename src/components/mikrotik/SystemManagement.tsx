
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Server, HardDrive, Cpu, MemoryStick, Activity } from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';
import { useToast } from '@/hooks/use-toast';

const SystemManagement = () => {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [resourceInfo, setResourceInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMockData, setShowMockData] = useState(false);
  const { toast } = useToast();

  const fetchSystemInfo = async () => {
    setLoading(true);
    try {
      const [identityResult, resourceResult] = await Promise.all([
        mikrotikService.getSystemIdentity(),
        mikrotikService.getSystemResource()
      ]);

      if (identityResult.success && resourceResult.success) {
        setSystemInfo(identityResult.data);
        setResourceInfo(resourceResult.data);
        setShowMockData(false);
      } else {
        throw new Error('Failed to fetch system information');
      }
    } catch (error) {
      console.error('Error fetching system info:', error);
      setShowMockData(true);
      toast({
        title: "Connection Issue",
        description: "Cannot connect to MikroTik. Showing sample data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  // Mock data for when API is unavailable
  const mockSystemInfo = {
    name: 'MikroTik-Sample',
    'board-name': 'RB750Gr3',
    version: '6.49.6 (stable)',
    'build-time': 'Nov/26/2021 13:12:03',
    'factory-software': '6.45.9',
    'free-memory': '134217728',
    'total-memory': '268435456',
    'cpu': 'MIPS 1004Kc V2.15',
    'cpu-count': '4',
    'cpu-frequency': '716',
    'cpu-load': '5',
    uptime: '2w3d04:23:15',
    'architecture-name': 'mipsbe',
    'bad-blocks': '0',
    'writing-blocks-limit': '1311',
    'free-hdd-space': '104857600',
    'total-hdd-space': '134217728'
  };

  const mockResourceInfo = {
    uptime: '2w3d04:23:15',
    version: '6.49.6 (stable)',
    'free-memory': '134217728',
    'total-memory': '268435456',
    cpu: '5',
    'free-hdd-space': '104857600',
    'total-hdd-space': '134217728',
    'architecture-name': 'mipsbe',
    'board-name': 'RB750Gr3',
    platform: 'MikroTik'
  };

  const displaySystemInfo = showMockData ? mockSystemInfo : systemInfo;
  const displayResourceInfo = showMockData ? mockResourceInfo : resourceInfo;

  const formatUptime = (uptime: string) => {
    if (!uptime) return 'N/A';
    return uptime;
  };

  const formatBytes = (bytes: string | number) => {
    if (!bytes) return 'N/A';
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let value = size;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    return `${value.toFixed(1)} ${units[i]}`;
  };

  const getCPUUsagePercentage = (cpuLoad: string | number) => {
    if (!cpuLoad) return 0;
    return typeof cpuLoad === 'string' ? parseInt(cpuLoad) : cpuLoad;
  };

  const getMemoryUsagePercentage = (free: string | number, total: string | number) => {
    if (!free || !total) return 0;
    const freeBytes = typeof free === 'string' ? parseInt(free) : free;
    const totalBytes = typeof total === 'string' ? parseInt(total) : total;
    return Math.round(((totalBytes - freeBytes) / totalBytes) * 100);
  };

  const getStorageUsagePercentage = (free: string | number, total: string | number) => {
    if (!free || !total) return 0;
    const freeBytes = typeof free === 'string' ? parseInt(free) : free;
    const totalBytes = typeof total === 'string' ? parseInt(total) : total;
    return Math.round(((totalBytes - freeBytes) / totalBytes) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading system information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Management</h2>
        <Button onClick={fetchSystemInfo} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {showMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              <strong>Demo Mode:</strong> Cannot connect to MikroTik backend. Showing sample data.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getCPUUsagePercentage(displayResourceInfo?.cpu || '0')}%
            </div>
            <p className="text-xs text-muted-foreground">
              {displaySystemInfo?.['cpu-count'] || 'N/A'} cores at {displaySystemInfo?.['cpu-frequency'] || 'N/A'}MHz
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getMemoryUsagePercentage(
                displayResourceInfo?.['free-memory'],
                displayResourceInfo?.['total-memory']
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(displayResourceInfo?.['free-memory'] || '0')} free of{' '}
              {formatBytes(displayResourceInfo?.['total-memory'] || '0')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStorageUsagePercentage(
                displayResourceInfo?.['free-hdd-space'],
                displayResourceInfo?.['total-hdd-space']
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              {formatBytes(displayResourceInfo?.['free-hdd-space'] || '0')} free of{' '}
              {formatBytes(displayResourceInfo?.['total-hdd-space'] || '0')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(displayResourceInfo?.uptime || 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground">
              System uptime
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Identity:</div>
              <div>{displaySystemInfo?.name || 'N/A'}</div>
              
              <div className="font-medium">Board:</div>
              <div>{displaySystemInfo?.['board-name'] || 'N/A'}</div>
              
              <div className="font-medium">Version:</div>
              <div>{displaySystemInfo?.version || 'N/A'}</div>
              
              <div className="font-medium">Architecture:</div>
              <div>{displaySystemInfo?.['architecture-name'] || 'N/A'}</div>
              
              <div className="font-medium">CPU:</div>
              <div>{displaySystemInfo?.cpu || 'N/A'}</div>
              
              <div className="font-medium">Build Time:</div>
              <div>{displaySystemInfo?.['build-time'] || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Platform:</div>
              <div>{displayResourceInfo?.platform || 'MikroTik'}</div>
              
              <div className="font-medium">Free Memory:</div>
              <div>{formatBytes(displayResourceInfo?.['free-memory'] || '0')}</div>
              
              <div className="font-medium">Total Memory:</div>
              <div>{formatBytes(displayResourceInfo?.['total-memory'] || '0')}</div>
              
              <div className="font-medium">Free Storage:</div>
              <div>{formatBytes(displayResourceInfo?.['free-hdd-space'] || '0')}</div>
              
              <div className="font-medium">Total Storage:</div>
              <div>{formatBytes(displayResourceInfo?.['total-hdd-space'] || '0')}</div>
              
              <div className="font-medium">Bad Blocks:</div>
              <div>{displaySystemInfo?.['bad-blocks'] || '0'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemManagement;
