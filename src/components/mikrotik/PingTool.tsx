
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Network } from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';
import { useToast } from '@/hooks/use-toast';

interface PingResult {
  id: string;
  sequence: number;
  time: string;
  status: 'success' | 'timeout' | 'error';
  responseTime?: number;
  size: number;
  ttl?: number;
}

const PingTool = () => {
  const [targetHost, setTargetHost] = useState('8.8.8.8');
  const [count, setCount] = useState(4);
  const [interval, setInterval] = useState(1);
  const [size, setSize] = useState(64);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<PingResult[]>([]);
  const [summary, setSummary] = useState<{
    sent: number;
    received: number;
    lost: number;
    lossPercent: number;
    minTime?: number;
    maxTime?: number;
    avgTime?: number;
  } | null>(null);
  const { toast } = useToast();

  const startPing = async () => {
    if (!targetHost.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target host",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      // In real implementation, this would call mikrotikService.ping()
      // For demo purposes, we'll simulate ping results
      const pingResults: PingResult[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < count; i++) {
        await new Promise(resolve => setTimeout(resolve, interval * 1000));
        
        const isSuccess = Math.random() > 0.1; // 90% success rate
        const responseTime = isSuccess ? Math.random() * 50 + 10 : undefined; // 10-60ms
        
        const result: PingResult = {
          id: `${Date.now()}-${i}`,
          sequence: i + 1,
          time: new Date().toLocaleTimeString(),
          status: isSuccess ? 'success' : 'timeout',
          responseTime,
          size,
          ttl: isSuccess ? Math.floor(Math.random() * 10) + 54 : undefined // 54-64
        };

        if (responseTime) {
          responseTimes.push(responseTime);
        }

        pingResults.push(result);
        setResults([...pingResults]);
      }

      // Calculate summary
      const sent = pingResults.length;
      const received = pingResults.filter(r => r.status === 'success').length;
      const lost = sent - received;
      const lossPercent = (lost / sent) * 100;

      setSummary({
        sent,
        received,
        lost,
        lossPercent,
        minTime: responseTimes.length > 0 ? Math.min(...responseTimes) : undefined,
        maxTime: responseTimes.length > 0 ? Math.max(...responseTimes) : undefined,
        avgTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : undefined
      });

      toast({
        title: "Ping completed",
        description: `${received}/${sent} packets received (${lossPercent.toFixed(1)}% loss)`,
      });

    } catch (error) {
      console.error('Error running ping:', error);
      toast({
        title: "Error",
        description: "Failed to run ping test",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stopPing = () => {
    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
    setSummary(null);
  };

  const getStatusBadge = (status: PingResult['status']) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      timeout: 'bg-red-100 text-red-800',
      error: 'bg-yellow-100 text-yellow-800'
    };
    
    return <Badge className={colors[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Network className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Ping Tool</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ping Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target">Target Host/IP</Label>
              <Input
                id="target"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                placeholder="e.g., google.com or 8.8.8.8"
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 4)}
                min="1"
                max="100"
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="interval">Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                disabled={isRunning}
              />
            </div>
            <div>
              <Label htmlFor="size">Packet Size (bytes)</Label>
              <Input
                id="size"
                type="number"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value) || 64)}
                min="32"
                max="1500"
                disabled={isRunning}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={startPing} disabled={isRunning}>
              <Play className="h-4 w-4 mr-2" />
              Start Ping
            </Button>
            <Button onClick={stopPing} disabled={!isRunning} variant="outline">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
            <Button onClick={clearResults} variant="outline" disabled={isRunning}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Ping Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{summary.sent}</div>
                <div className="text-sm text-gray-500">Sent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.received}</div>
                <div className="text-sm text-gray-500">Received</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.lost}</div>
                <div className="text-sm text-gray-500">Lost</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{summary.lossPercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Loss</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {summary.avgTime ? summary.avgTime.toFixed(1) : '-'}ms
                </div>
                <div className="text-sm text-gray-500">Avg Time</div>
              </div>
            </div>
            
            {summary.minTime && summary.maxTime && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Min: {summary.minTime.toFixed(1)}ms | Max: {summary.maxTime.toFixed(1)}ms
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ping Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {results.map((result) => (
                <div key={result.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm">#{result.sequence}</span>
                      {getStatusBadge(result.status)}
                      {result.responseTime && (
                        <span className="text-sm">
                          <strong>{result.responseTime.toFixed(1)}ms</strong>
                        </span>
                      )}
                      {result.ttl && (
                        <span className="text-sm text-gray-500">
                          TTL={result.ttl}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{result.time}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result.size} bytes → {targetHost}
                    {result.status === 'timeout' && ' (Request timeout)'}
                  </div>
                </div>
              ))}
              
              {results.length === 0 && !isRunning && (
                <div className="text-center py-8 text-gray-500">
                  No ping results yet. Click "Start Ping" to begin.
                </div>
              )}
              
              {isRunning && (
                <div className="text-center py-4 text-blue-600">
                  Ping in progress... ({results.length}/{count})
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PingTool;
