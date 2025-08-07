
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Network, 
  Play,
  Square
} from 'lucide-react';

const PingTool = () => {
  const [target, setTarget] = useState('');
  const [count, setCount] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();

  const handleStartPing = async () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target address",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setResults([]);
    
    try {
      // Note: This would need to be implemented in the mikrotikService
      // For now, we'll show a placeholder
      toast({
        title: "Info",
        description: "Ping tool is not implemented yet",
        variant: "default",
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

  const handleStopPing = () => {
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Ping Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter IP address or hostname"
                disabled={isRunning}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="1"
                max="100"
                disabled={isRunning}
              />
            </div>
            
            <div className="flex items-end">
              {!isRunning ? (
                <Button onClick={handleStartPing} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Start Ping
                </Button>
              ) : (
                <Button onClick={handleStopPing} variant="destructive" className="w-full">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>
          
          {results.length > 0 && (
            <div className="mt-6">
              <Label>Results</Label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
                {results.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {results.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              Enter a target address and click "Start Ping" to begin
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PingTool;
