
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Network, 
  Power, 
  PowerOff, 
  RefreshCw,
  Wifi,
  Cable
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';

const InterfaceManagement = () => {
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchInterfaces = async () => {
    setLoading(true);
    try {
      const result = await mikrotikService.getInterfaces();
      if (result.success) {
        setInterfaces(result.data || []);
        // Removed the success toast notification
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      toast({
        title: "Error",
        description: "Failed to fetch interfaces",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnableInterface = async (interfaceId: string, interfaceName: string) => {
    try {
      const result = await mikrotikService.enableInterface(interfaceId);
      if (result.success) {
        toast({
          title: "Success",
          description: `Interface ${interfaceName} enabled successfully`,
        });
        fetchInterfaces();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error enabling interface:', error);
      toast({
        title: "Error",
        description: `Failed to enable interface ${interfaceName}`,
        variant: "destructive",
      });
    }
  };

  const handleDisableInterface = async (interfaceId: string, interfaceName: string) => {
    try {
      const result = await mikrotikService.disableInterface(interfaceId);
      if (result.success) {
        toast({
          title: "Success",
          description: `Interface ${interfaceName} disabled successfully`,
        });
        fetchInterfaces();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error disabling interface:', error);
      toast({
        title: "Error",
        description: `Failed to disable interface ${interfaceName}`,
        variant: "destructive",
      });
    }
  };

  const getInterfaceIcon = (type: string) => {
    if (type?.toLowerCase().includes('wlan') || type?.toLowerCase().includes('wireless')) {
      return <Wifi className="h-4 w-4" />;
    }
    return <Cable className="h-4 w-4" />;
  };

  const getStatusBadge = (disabled: boolean, running: boolean) => {
    if (disabled) {
      return <Badge variant="destructive">Disabled</Badge>;
    }
    if (running) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>;
    }
    return <Badge variant="secondary">Stopped</Badge>;
  };

  useEffect(() => {
    fetchInterfaces();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Interface Management
            </CardTitle>
            <Button 
              onClick={fetchInterfaces}
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>MTU</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RX/TX</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interfaces.map((iface: any) => (
                    <TableRow key={iface['.id']}>
                      <TableCell className="flex items-center gap-2">
                        {getInterfaceIcon(iface.type)}
                        <span className="font-medium">{iface.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{iface.type || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {iface['mac-address'] || 'N/A'}
                      </TableCell>
                      <TableCell>{iface.mtu || 'N/A'}</TableCell>
                      <TableCell>
                        {getStatusBadge(iface.disabled === 'true', iface.running === 'true')}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>RX: {iface['rx-byte'] || '0'}</div>
                        <div>TX: {iface['tx-byte'] || '0'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {iface.disabled === 'true' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnableInterface(iface['.id'], iface.name)}
                              className="h-8 w-8 p-0"
                            >
                              <Power className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisableInterface(iface['.id'], iface.name)}
                              className="h-8 w-8 p-0"
                            >
                              <PowerOff className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {interfaces.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No interfaces found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InterfaceManagement;
