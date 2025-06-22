
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserCheck, 
  RefreshCw,
  Trash2,
  UserX
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';

const PPPManagement = () => {
  const [pppSecrets, setPppSecrets] = useState([]);
  const [pppActive, setPppActive] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPPPSecrets = async () => {
    setLoading(true);
    try {
      const result = await mikrotikService.getPPPSecrets();
      if (result.success) {
        setPppSecrets(result.data || []);
        // Removed the success toast notification
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching PPP secrets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch PPP secrets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPPPActive = async () => {
    setLoading(true);
    try {
      const result = await mikrotikService.getPPPActive();
      if (result.success) {
        setPppActive(result.data || []);
        // Removed the success toast notification
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching PPP active:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active PPP connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSecret = async (secretId: string, secretName: string) => {
    try {
      const result = await mikrotikService.removePPPSecret(secretId);
      if (result.success) {
        toast({
          title: "Success",
          description: `PPP secret ${secretName} removed successfully`,
        });
        fetchPPPSecrets();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error removing PPP secret:', error);
      toast({
        title: "Error",
        description: `Failed to remove PPP secret ${secretName}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnectUser = async (activeId: string, userName: string) => {
    try {
      const result = await mikrotikService.disconnectPPPUser(activeId);
      if (result.success) {
        toast({
          title: "Success",
          description: `User ${userName} disconnected successfully`,
        });
        fetchPPPActive();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error disconnecting PPP user:', error);
      toast({
        title: "Error",
        description: `Failed to disconnect user ${userName}`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (disabled: boolean) => {
    if (disabled) {
      return <Badge variant="destructive">Disabled</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  useEffect(() => {
    fetchPPPSecrets();
    fetchPPPActive();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="secrets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="secrets">PPP Secrets</TabsTrigger>
          <TabsTrigger value="active">Active Connections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="secrets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  PPP Secrets
                </CardTitle>
                <Button 
                  onClick={fetchPPPSecrets}
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
                        <TableHead>Name</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Local Address</TableHead>
                        <TableHead>Remote Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pppSecrets.map((secret: any) => (
                        <TableRow key={secret['.id']}>
                          <TableCell className="font-medium">{secret.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{secret.service || 'any'}</Badge>
                          </TableCell>
                          <TableCell>{secret.profile || 'default'}</TableCell>
                          <TableCell>{secret['local-address'] || 'N/A'}</TableCell>
                          <TableCell>{secret['remote-address'] || 'N/A'}</TableCell>
                          <TableCell>
                            {getStatusBadge(secret.disabled === 'true')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveSecret(secret['.id'], secret.name)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {pppSecrets.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No PPP secrets found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Active PPP Connections
                </CardTitle>
                <Button 
                  onClick={fetchPPPActive}
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
                        <TableHead>Name</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Caller ID</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Encoding</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pppActive.map((active: any) => (
                        <TableRow key={active['.id']}>
                          <TableCell className="font-medium">{active.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{active.service}</Badge>
                          </TableCell>
                          <TableCell>{active['caller-id'] || 'N/A'}</TableCell>
                          <TableCell>{active.address || 'N/A'}</TableCell>
                          <TableCell>{active.uptime || 'N/A'}</TableCell>
                          <TableCell>{active.encoding || 'N/A'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDisconnectUser(active['.id'], active.name)}
                              className="h-8 w-8 p-0"
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {pppActive.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No active PPP connections
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PPPManagement;
