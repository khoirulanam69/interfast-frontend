
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mikrotikService } from '@/services/mikrotikService';
import { useToast } from '@/hooks/use-toast';

interface LogEntry {
  id: string;
  time: string;
  topics: string;
  message: string;
  level?: string;
}

const LogManagement = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Try to fetch logs from MikroTik API
      try {
        const result = await fetch('/api/mikrotik/log');
        if (result.ok) {
          const data = await result.json();
          setLogs(data.data || []);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        // If API fails, show mock data with warning
        console.log('MikroTik API not available, showing mock data');
        const mockLogs: LogEntry[] = [
          {
            id: '1',
            time: new Date().toISOString(),
            topics: 'ppp,info',
            message: 'user user_12345 logged in',
            level: 'info'
          },
          {
            id: '2',
            time: new Date(Date.now() - 60000).toISOString(),
            topics: 'system,info',
            message: 'system startup completed',
            level: 'info'
          },
          {
            id: '3',
            time: new Date(Date.now() - 120000).toISOString(),
            topics: 'ppp,warning',
            message: 'authentication failed for user test',
            level: 'warning'
          },
          {
            id: '4',
            time: new Date(Date.now() - 180000).toISOString(),
            topics: 'interface,error',
            message: 'interface ether1 link down',
            level: 'error'
          },
          {
            id: '5',
            time: new Date(Date.now() - 240000).toISOString(),
            topics: 'dhcp,info',
            message: 'DHCP lease assigned to 192.168.1.100',
            level: 'info'
          }
        ];

        setLogs(mockLogs);
        
        toast({
          title: "Warning",
          description: "MikroTik API not available, showing sample data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Time', 'Level', 'Topics', 'Message'].join(','),
      ...filteredLogs.map(log => [
        log.time,
        log.level || '',
        log.topics,
        `"${log.message}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrotik-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const topicMatch = filterTopic === 'all' || log.topics.includes(filterTopic);
    return levelMatch && topicMatch;
  });

  const getLevelBadge = (level?: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    };
    
    if (!level) return <Badge className="bg-gray-100 text-gray-800">unknown</Badge>;
    
    return <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>{level}</Badge>;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('id-ID');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">MikroTik Logs</h2>
        <div className="flex gap-2">
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Level</label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Topic</label>
              <Select value={filterTopic} onValueChange={setFilterTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All topics</SelectItem>
                  <SelectItem value="ppp">PPP</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="interface">Interface</SelectItem>
                  <SelectItem value="dhcp">DHCP</SelectItem>
                  <SelectItem value="wireless">Wireless</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLevelBadge(log.level)}
                      <Badge variant="outline">{log.topics}</Badge>
                    </div>
                    <span className="text-sm text-gray-500">{formatTime(log.time)}</span>
                  </div>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{log.message}</p>
                </div>
              ))}
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No logs found matching the current filters
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogManagement;
