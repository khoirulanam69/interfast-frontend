
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  RefreshCw,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';

const LogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Note: This endpoint needs to be implemented in the mikrotikService
      // For now, we'll show empty state
      setLogs([]);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (topics: string) => {
    if (topics?.includes('error')) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (topics?.includes('warning')) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else if (topics?.includes('info')) {
      return <Info className="h-4 w-4 text-blue-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getLogBadge = (topics: string) => {
    if (topics?.includes('error')) {
      return <Badge variant="destructive">Error</Badge>;
    } else if (topics?.includes('warning')) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    } else if (topics?.includes('info')) {
      return <Badge variant="default">Info</Badge>;
    }
    return <Badge variant="outline">Debug</Badge>;
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              System Logs
            </CardTitle>
            <Button 
              onClick={fetchLogs}
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
                    <TableHead>Time</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {log.time || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLogIcon(log.topics)}
                          {getLogBadge(log.topics)}
                        </div>
                      </TableCell>
                      <TableCell>{log.message || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {logs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No logs available
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogManagement;
