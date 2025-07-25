
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Router, Users, Settings, Activity, FileText, Network } from 'lucide-react';
import SystemManagement from './mikrotik/SystemManagement';
import PPPManagement from './mikrotik/PPPManagement';
import InterfaceManagement from './mikrotik/InterfaceManagement';
import LogManagement from './mikrotik/LogManagement';
import PingTool from './mikrotik/PingTool';

const MikroTikManagement = () => {
  const [connectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');

  const getStatusBadge = () => {
    const colors = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-red-100 text-red-800',
      connecting: 'bg-yellow-100 text-yellow-800'
    };
    
    return <Badge className={colors[connectionStatus]}>{connectionStatus}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MikroTik Management</h1>
          <p className="text-gray-600 mt-1">Manage your MikroTik router configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Status:</span>
          {getStatusBadge()}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5" />
            MikroTik RouterOS Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System
              </TabsTrigger>
              <TabsTrigger value="ppp" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                PPP
              </TabsTrigger>
              <TabsTrigger value="interfaces" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Interfaces
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="ping" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Ping
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="system" className="mt-6">
              <SystemManagement />
            </TabsContent>
            
            <TabsContent value="ppp" className="mt-6">
              <PPPManagement />
            </TabsContent>
            
            <TabsContent value="interfaces" className="mt-6">
              <InterfaceManagement />
            </TabsContent>

            <TabsContent value="logs" className="mt-6">
              <LogManagement />
            </TabsContent>

            <TabsContent value="ping" className="mt-6">
              <PingTool />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MikroTikManagement;
