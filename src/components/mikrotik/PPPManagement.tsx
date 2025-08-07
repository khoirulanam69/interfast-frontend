
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  RefreshCw,
  UserX,
  Trash2
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';

const PPPManagement = () => {
  const [pppSecrets, setPppSecrets] = useState([]);
  const [pppActive, setPppActive] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPPPData = async () => {
    setLoading(true);
    try {
      const [secretsResult, activeResult] = await Promise.all([
        mikrotikService.getPPPSecrets(),
        mikrotikService.getPPPActive()
      ]);
      
      if (secretsResult.success) {
        setPppSecrets(secretsResult.data || []);
      }
      
      if (activeResult.success) {
        setPppActive(activeResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching PPP data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch PPP data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSecret = async (secretId: string, username: string) => {
    if (!confirm(`Are you sure you want to remove PPP secret for ${username}?`)) {
      return;
    }
    
    try {
      const result = await mikrotikService.removePPPSecret(secretId);
      if (result.success) {
        toast({
          title: "Success",
          description: `PPP secret for ${username} removed successfully`,
        });
        fetchPPPData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error removing PPP secret:', error);
      toast({
        title: "Error",
        description: `Failed to remove PPP secret for ${username}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnectUser = async (username: string) => {
    if (!confirm(`Are you sure you want to disconnect ${username}?`)) {
      return;
    }
    
    try {
      const result = await mikrotikService.disconnectPPPUser(username);
      if (result.success) {
        toast({
          title: "Success",
          description: `User ${username} disconnected successfully`,
        });
        fetchPPPData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error disconnecting user:', error);
      toast({
        title: "Error",
        description: `Failed to disconnect user ${username}`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPPPData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">PPP Management</h2>
        <Button 
          onClick={fetchPPPData}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              PPP Secrets ({pppSecrets.length})
            </CardTitle>
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
                      <TableHead>Username</TableHead>
                      <TableHead>Profile</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pppSecrets.map((secret: any) => (
                      <TableRow key={secret['.id']}>
                        <TableCell className="font-medium">{secret.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{secret.profile || 'Default'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Connections ({pppActive.length})
            </CardTitle>
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
                      <TableHead>Username</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pppActive.map((connection: any) => (
                      <TableRow key={connection['.id']}>
                        <TableCell className="font-medium">{connection.name}</TableCell>
                        <TableCell className="font-mono text-xs">{connection.address || 'N/A'}</TableCell>
                        <TableCell>{connection.uptime || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnectUser(connection.name)}
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
                    No active connections found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PPPManagement;
