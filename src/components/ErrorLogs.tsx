import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Trash2, AlertCircle, FileText } from 'lucide-react';
import { API_CONFIG } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

const ErrorLogs = () => {
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [combinedLogs, setCombinedLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('error');
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [errorResponse, combinedResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/logs/error`),
        fetch(`${API_CONFIG.BASE_URL}/logs/combined`)
      ]);

      const errorData = await errorResponse.json();
      const combinedData = await combinedResponse.json();

      if (errorData.success) {
        setErrorLogs(errorData.logs);
      }
      if (combinedData.success) {
        setCombinedLogs(combinedData.logs);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch logs"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async (type: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/logs/clear/${type}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `${type} logs cleared successfully`
        });
        fetchLogs();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear logs"
      });
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderLogs = (logs: string[]) => {
    if (logs.length === 0) {
      return (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>No logs found</AlertDescription>
        </Alert>
      );
    }

    return (
      <ScrollArea className="h-[600px] w-full rounded-md border p-4">
        <div className="space-y-2 font-mono text-sm">
          {logs.map((log, index) => {
            const isError = log.includes('[ERROR]');
            const isWarning = log.includes('[WARN]');
            
            return (
              <div
                key={index}
                className={`p-2 rounded ${
                  isError ? 'bg-red-50 text-red-900 border-l-4 border-red-500' :
                  isWarning ? 'bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500' :
                  'bg-gray-50 text-gray-900'
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor application logs and errors</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Logs</CardTitle>
          <CardDescription>View error logs and system activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="error" className="flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Error Logs ({errorLogs.length})
                </TabsTrigger>
                <TabsTrigger value="combined" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  All Logs ({combinedLogs.length})
                </TabsTrigger>
              </TabsList>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => clearLogs(activeTab)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear {activeTab === 'error' ? 'Error' : 'All'} Logs
              </Button>
            </div>

            <TabsContent value="error">
              {renderLogs(errorLogs)}
            </TabsContent>

            <TabsContent value="combined">
              {renderLogs(combinedLogs)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Logs are automatically refreshed every 30 seconds. Error logs show only errors, while All Logs shows complete system activity including info and warnings.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorLogs;
