
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  Network, 
  Shield, 
  Settings, 
  Users, 
  Clock, 
  BarChart3, 
  Database,
  Router,
  Globe,
  Lock,
  Activity
} from 'lucide-react';
import { mikrotikService } from '@/services/mikrotikService';
import InterfaceManagement from './mikrotik/InterfaceManagement';
import PPPManagement from './mikrotik/PPPManagement';
import SystemManagement from './mikrotik/SystemManagement';

const MikroTikManagement = () => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState('');
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const result = await mikrotikService.testConnection();
      if (result.success) {
        setConnectionStatus('success');
        setTestResult(result.message);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        setConnectionStatus('error');
        setTestResult(result.message);
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setTestResult('Connection test failed');
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">MikroTik Management</h1>
      </div>

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="connection" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Connection
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Interfaces
          </TabsTrigger>
          <TabsTrigger value="ppp" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            PPP
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="menus" className="flex items-center gap-2">
            <Router className="h-4 w-4" />
            All Menus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Connection Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className="w-auto"
                >
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                </Button>
                
                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Connected</span>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Connection Failed</span>
                  </div>
                )}
              </div>
              
              {testResult && (
                <div className={`p-4 rounded-lg ${
                  connectionStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-sm">{testResult}</p>
                </div>
              )}
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Connection Information</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>• Test koneksi ke MikroTik RouterOS API</p>
                  <p>• Verifikasi kredensial dan akses</p>
                  <p>• Mengecek status sistem MikroTik</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interfaces">
          <InterfaceManagement />
        </TabsContent>

        <TabsContent value="ppp">
          <PPPManagement />
        </TabsContent>

        <TabsContent value="system">
          <SystemManagement />
        </TabsContent>

        <TabsContent value="menus">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Interface Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Network className="h-5 w-5" />
                  Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Interface List', 'Wireless', 'Ethernet', 'Bridge', 'VLAN', 'Bonding', 'VRRP', 'PPP'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wireless Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wifi className="h-5 w-5" />
                  Wireless
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['WiFi Interfaces', 'Security Profiles', 'Access List', 'Connect List', 'Registration Table', 'Scan', 'Snooper', 'Frequency Scanner'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PPP Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  PPP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Interface', 'Profiles', 'Secrets', 'Active', 'AAA', 'L2TP Server', 'PPTP Server', 'PPPoE Server', 'SSTP Server'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* IP Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5" />
                  IP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Addresses', 'Routes', 'DNS', 'DHCP Server', 'DHCP Client', 'Pool', 'ARP', 'Firewall', 'NAT', 'Mangle', 'Services', 'UPnP', 'Proxy', 'Socks', 'Web Proxy'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Users', 'Groups', 'Packages', 'Resource', 'Clock', 'NTP Client', 'Logging', 'Watchdog', 'Scheduler', 'Script', 'Netwatch', 'Console', 'Identity', 'Routerboard', 'License', 'Backup', 'Reset Configuration', 'Shutdown', 'Reboot'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Queues Menu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Queues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Simple Queue', 'Queue Tree', 'Queue Types', 'Queue Interface'].map((item, itemIndex) => (
                    <div 
                      key={itemIndex}
                      className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MikroTikManagement;
