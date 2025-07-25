import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Trash2, UserX, Monitor } from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';
import { useToast } from '@/hooks/use-toast';
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

const PPPManagement = () => {
  const [pppSecrets, setPppSecrets] = useState([]);
  const [activePPP, setActivePPP] = useState([]);
  const [filteredSecrets, setFilteredSecrets] = useState([]);
  const [filteredActive, setFilteredActive] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPPPData();
  }, []);

  useEffect(() => {
    filterData();
  }, [pppSecrets, activePPP, searchTerm]);

  const fetchPPPData = async () => {
    setLoading(true);
    try {
      const [secretsResult, activeResult] = await Promise.all([
        mikrotikService.getPPPSecrets(),
        mikrotikService.getPPPActive()
      ]);

      if (secretsResult.success) {
        setPppSecrets(secretsResult.data || []);
        setApiAvailable(true);
      } else {
        throw new Error('API not available');
      }

      if (activeResult.success) {
        setActivePPP(activeResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching PPP data:', error);
      setApiAvailable(false);
      
      // Show mock data when API is not available
      const mockSecrets = [
        {
          '.id': '*1',
          'name': 'user_12345',
          'service': 'pppoe',
          'profile': 'Interfast Bronze',
          'local-address': '10.10.10.1',
          'remote-address': '10.10.10.100',
          'disabled': 'false'
        },
        {
          '.id': '*2',
          'name': 'user_67890',
          'service': 'pppoe',
          'profile': 'Interfast Silver',
          'local-address': '10.10.10.1',
          'remote-address': '10.10.10.101',
          'disabled': 'false'
        }
      ];
      
      const mockActive = [
        {
          'name': 'user_12345',
          'service': 'pppoe',
          'address': '10.10.10.100',
          'uptime': '2d3h15m30s',
          'bytes-in': '1048576000',
          'bytes-out': '524288000'
        }
      ];
      
      setPppSecrets(mockSecrets);
      setActivePPP(mockActive);
      
      toast({
        title: "Warning",
        description: "MikroTik API not available, showing sample data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (!searchTerm) {
      setFilteredSecrets(pppSecrets);
      setFilteredActive(activePPP);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    setFilteredSecrets(pppSecrets.filter(secret => 
      secret.name?.toLowerCase().includes(term) ||
      secret.service?.toLowerCase().includes(term) ||
      secret.profile?.toLowerCase().includes(term)
    ));

    setFilteredActive(activePPP.filter(active =>
      active.name?.toLowerCase().includes(term) ||
      active.address?.toLowerCase().includes(term) ||
      active.service?.toLowerCase().includes(term)
    ));
  };

  const handleDisconnect = async (username: string) => {
    if (!apiAvailable) {
      toast({
        title: "Warning",
        description: "MikroTik API not available - cannot disconnect user",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await mikrotikService.disconnectPPPUser(username);
      
      if (result.success) {
        toast({
          title: "Success",
          description: `User ${username} disconnected successfully`,
        });
        fetchPPPData(); // Refresh data
      } else {
        throw new Error(result.message || 'Failed to disconnect user');
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      toast({
        title: "Error",
        description: `Failed to disconnect user: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleRemoveSecret = async (secretId: string) => {
    if (!apiAvailable) {
      toast({
        title: "Warning",
        description: "MikroTik API not available - cannot remove secret",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await mikrotikService.removePPPSecret(secretId);
      
      if (result.success) {
        toast({
          title: "Success",
          description: "PPP secret removed successfully",
        });
        fetchPPPData(); // Refresh data
      } else {
        throw new Error(result.message || 'Failed to remove PPP secret');
      }
    } catch (error) {
      console.error('Error removing PPP secret:', error);
      toast({
        title: "Error",
        description: `Failed to remove PPP secret: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  function formatUptime(uptime: string) {
    if (!uptime) return 'N/A';
    return uptime;
  }

  function formatBytes(bytes: string) {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes);
    if (num === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return parseFloat((num / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!apiAvailable && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Monitor className="h-4 w-4" />
              <span className="text-sm font-medium">
                MikroTik API is not available. Showing sample data for demonstration.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold">PPP Management</h2>
        <Button onClick={fetchPPPData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search PPP users by username, service, or profile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Active PPP Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Active PPP Connections ({filteredActive.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Bytes In</TableHead>
                  <TableHead>Bytes Out</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActive.map((connection, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{connection.name || 'N/A'}</TableCell>
                    <TableCell>{connection.service || 'N/A'}</TableCell>
                    <TableCell>{connection.address || 'N/A'}</TableCell>
                    <TableCell>{formatUptime(connection.uptime)}</TableCell>
                    <TableCell>{formatBytes(connection['bytes-in'])}</TableCell>
                    <TableCell>{formatBytes(connection['bytes-out'])}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={!apiAvailable}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to disconnect {connection.name}? 
                              This will terminate their current PPP session.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDisconnect(connection.name)}>
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActive.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No active PPP connections found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PPP Secrets */}
      <Card>
        <CardHeader>
          <CardTitle>PPP Secrets ({filteredSecrets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Local Address</TableHead>
                  <TableHead>Remote Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSecrets.map((secret, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{secret.name || 'N/A'}</TableCell>
                    <TableCell>{secret.service || 'N/A'}</TableCell>
                    <TableCell>{secret.profile || 'N/A'}</TableCell>
                    <TableCell>{secret['local-address'] || 'N/A'}</TableCell>
                    <TableCell>{secret['remote-address'] || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={secret.disabled === 'true' ? 'secondary' : 'default'}>
                        {secret.disabled === 'true' ? 'Disabled' : 'Enabled'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={!apiAvailable}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove PPP Secret</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove the PPP secret for {secret.name}? 
                              This action cannot be undone and will prevent the user from connecting.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveSecret(secret['.id'])}>
                              Remove Secret
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSecrets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      No PPP secrets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PPPManagement;
