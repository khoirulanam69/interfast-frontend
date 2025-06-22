import { API_CONFIG, ApiResponse, handleApiError } from '@/config/api';

interface MikroTikConfig {
  ip: string;
  port: number;
  username: string;
  password: string;
}

// Helper function untuk API calls
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

export const mikrotikService = {
  async updateUserStatus(usernameDialer: string, status: 'Active' | 'Inactive' | 'Terminate') {
    try {
      console.log(`Updating MikroTik user status for ${usernameDialer} to ${status}`);
      
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.UPDATE_USER_STATUS, {
        method: 'POST',
        body: JSON.stringify({ usernameDialer, status })
      });
      
      console.log(`User ${usernameDialer} status successfully updated to ${status}`);
      return result;
      
    } catch (error) {
      console.error('MikroTik API error:', error);
      throw new Error(`Failed to update MikroTik status: ${handleApiError(error)}`);
    }
  },

  async regenerateUserCredentials(oldUsername: string, newUsername: string, newPassword: string, profile: string = 'Interfast Bronze') {
    try {
      console.log(`Regenerating credentials from ${oldUsername} to ${newUsername} with profile ${profile}`);
      
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.REGENERATE_CREDENTIALS, {
        method: 'POST',
        body: JSON.stringify({ oldUsername, newUsername, newPassword, profile })
      });
      
      console.log(`Credentials regenerated successfully for ${newUsername}`);
      return result;
      
    } catch (error) {
      console.error('Error regenerating credentials:', error);
      throw new Error(`Failed to regenerate credentials: ${handleApiError(error)}`);
    }
  },

  async testConnection() {
    try {
      console.log('Testing MikroTik connection...');
      
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.TEST_CONNECTION);
      
      console.log('MikroTik connection test result:', result);
      return result;
      
    } catch (error) {
      console.error('MikroTik connection error:', error);
      return { 
        success: false, 
        message: `Connection failed: ${handleApiError(error)}` 
      };
    }
  },

  async createPPPSecret(usernameDialer: string, password: string, profile: string = 'Interfast Bronze') {
    try {
      console.log(`Creating PPP secret for ${usernameDialer} with profile ${profile}`);
      
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.CREATE_PPP_SECRET, {
        method: 'POST',
        body: JSON.stringify({ usernameDialer, password, profile })
      });
      
      console.log(`PPP secret created for ${usernameDialer}`);
      return result;
      
    } catch (error) {
      console.error('Error creating PPP secret:', error);
      return { 
        success: false, 
        message: `Failed to create PPP secret: ${handleApiError(error)}` 
      };
    }
  },

  async removeUser(username: string) {
    try {
      console.log(`Removing user ${username} from MikroTik`);
      
      const result = await apiCall(`${API_CONFIG.ENDPOINTS.MIKROTIK.REMOVE_USER}/${username}`, {
        method: 'DELETE'
      });
      
      console.log(`User ${username} removed successfully`);
      return result;
      
    } catch (error) {
      console.error('Error removing user:', error);
      throw new Error(`Failed to remove user: ${handleApiError(error)}`);
    }
  },

  async deletePPPSecret(username: string) {
    try {
      console.log(`Deleting PPP secret for ${username}`);
      
      const result = await apiCall(`${API_CONFIG.ENDPOINTS.MIKROTIK.DELETE_PPP_SECRET}/${username}`, {
        method: 'DELETE'
      });
      
      console.log(`PPP secret deleted for ${username}`);
      return result;
      
    } catch (error) {
      console.error('Error deleting PPP secret:', error);
      throw new Error(`Failed to delete PPP secret: ${handleApiError(error)}`);
    }
  },

  async disconnectPPPUser(username: string) {
    try {
      console.log(`Disconnecting PPP user ${username}`);
      
      const result = await apiCall(`${API_CONFIG.ENDPOINTS.MIKROTIK.DISCONNECT_PPP_USER}/${username}`, {
        method: 'DELETE'
      });
      
      console.log(`PPP user ${username} disconnected`);
      return result;
      
    } catch (error) {
      console.error('Error disconnecting PPP user:', error);
      throw new Error(`Failed to disconnect PPP user: ${handleApiError(error)}`);
    }
  },

  // Interface Management
  async getInterfaces() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.INTERFACES);
      return result;
    } catch (error) {
      console.error('Error fetching interfaces:', error);
      throw new Error(`Failed to fetch interfaces: ${handleApiError(error)}`);
    }
  },

  async enableInterface(interfaceId: string) {
    try {
      const result = await apiCall(`/mikrotik/interfaces/${interfaceId}/enable`, {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Error enabling interface:', error);
      throw new Error(`Failed to enable interface: ${handleApiError(error)}`);
    }
  },

  async disableInterface(interfaceId: string) {
    try {
      const result = await apiCall(`/mikrotik/interfaces/${interfaceId}/disable`, {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Error disabling interface:', error);
      throw new Error(`Failed to disable interface: ${handleApiError(error)}`);
    }
  },

  // PPP Management
  async getPPPSecrets() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.PPP_SECRETS);
      return result;
    } catch (error) {
      console.error('Error fetching PPP secrets:', error);
      throw new Error(`Failed to fetch PPP secrets: ${handleApiError(error)}`);
    }
  },

  async getPPPActive() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.PPP_ACTIVE);
      return result;
    } catch (error) {
      console.error('Error fetching PPP active:', error);
      throw new Error(`Failed to fetch PPP active: ${handleApiError(error)}`);
    }
  },

  async removePPPSecret(secretId: string) {
    try {
      const result = await apiCall(`/mikrotik/ppp/secret/${secretId}`, {
        method: 'DELETE'
      });
      return result;
    } catch (error) {
      console.error('Error removing PPP secret:', error);
      throw new Error(`Failed to remove PPP secret: ${handleApiError(error)}`);
    }
  },

  // Wireless Management
  async getWirelessInterfaces() {
    try {
      const result = await apiCall('/mikrotik/wireless/interfaces');
      return result;
    } catch (error) {
      console.error('Error fetching wireless interfaces:', error);
      throw new Error(`Failed to fetch wireless interfaces: ${handleApiError(error)}`);
    }
  },

  async enableWireless(interfaceId: string) {
    try {
      const result = await apiCall(`/mikrotik/wireless/${interfaceId}/enable`, {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Error enabling wireless:', error);
      throw new Error(`Failed to enable wireless: ${handleApiError(error)}`);
    }
  },

  async disableWireless(interfaceId: string) {
    try {
      const result = await apiCall(`/mikrotik/wireless/${interfaceId}/disable`, {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Error disabling wireless:', error);
      throw new Error(`Failed to disable wireless: ${handleApiError(error)}`);
    }
  },

  // IP Management
  async getIPAddresses() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.IP_ADDRESSES);
      return result;
    } catch (error) {
      console.error('Error fetching IP addresses:', error);
      throw new Error(`Failed to fetch IP addresses: ${handleApiError(error)}`);
    }
  },

  async getIPRoutes() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.IP_ROUTES);
      return result;
    } catch (error) {
      console.error('Error fetching IP routes:', error);
      throw new Error(`Failed to fetch IP routes: ${handleApiError(error)}`);
    }
  },

  async addIPAddress(address: string, network: string, interfaceName: string) {
    try {
      const result = await apiCall('/mikrotik/ip/addresses', {
        method: 'POST',
        body: JSON.stringify({ address, network, interface: interfaceName })
      });
      return result;
    } catch (error) {
      console.error('Error adding IP address:', error);
      throw new Error(`Failed to add IP address: ${handleApiError(error)}`);
    }
  },

  // System Management
  async getSystemResource() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.SYSTEM_RESOURCE);
      return result;
    } catch (error) {
      console.error('Error fetching system resource:', error);
      throw new Error(`Failed to fetch system resource: ${handleApiError(error)}`);
    }
  },

  async getSystemIdentity() {
    try {
      const result = await apiCall(API_CONFIG.ENDPOINTS.MIKROTIK.SYSTEM_IDENTITY);
      return result;
    } catch (error) {
      console.error('Error fetching system identity:', error);
      throw new Error(`Failed to fetch system identity: ${handleApiError(error)}`);
    }
  },

  async rebootSystem() {
    try {
      const result = await apiCall('/mikrotik/system/reboot', {
        method: 'POST'
      });
      return result;
    } catch (error) {
      console.error('Error rebooting system:', error);
      throw new Error(`Failed to reboot system: ${handleApiError(error)}`);
    }
  },

  // Queue Management
  async getSimpleQueues() {
    try {
      const result = await apiCall('/mikrotik/queue/simple');
      return result;
    } catch (error) {
      console.error('Error fetching simple queues:', error);
      throw new Error(`Failed to fetch simple queues: ${handleApiError(error)}`);
    }
  },

  async addSimpleQueue(name: string, target: string, maxLimit: string) {
    try {
      const result = await apiCall('/mikrotik/queue/simple', {
        method: 'POST',
        body: JSON.stringify({ name, target, maxLimit })
      });
      return result;
    } catch (error) {
      console.error('Error adding simple queue:', error);
      throw new Error(`Failed to add simple queue: ${handleApiError(error)}`);
    }
  },

  async removeSimpleQueue(queueId: string) {
    try {
      const result = await apiCall(`/mikrotik/queue/simple/${queueId}`, {
        method: 'DELETE'
      });
      return result;
    } catch (error) {
      console.error('Error removing simple queue:', error);
      throw new Error(`Failed to remove simple queue: ${handleApiError(error)}`);
    }
  },

  // Monitoring
  async getInterfaceTraffic() {
    try {
      const result = await apiCall(`/mikrotik/monitor/traffic/eth0`);
      return result;
    } catch (error) {
      console.error('Error fetching interface traffic:', error);
      throw new Error(`Failed to fetch interface traffic: ${handleApiError(error)}`);
    }
  },

  async getCPUUsage() {
    try {
      const result = await apiCall(`/mikrotik/monitor/resource`);
      return result;
    } catch (error) {
      console.error('Error fetching CPU usage:', error);
      throw new Error(`Failed to fetch CPU usage: ${handleApiError(error)}`);
    }
  },

  async getMemoryUsage() {
    try {
      const result = await apiCall(`/mikrotik/monitor/resource`);
      return result;
    } catch (error) {
      console.error('Error fetching memory usage:', error);
      throw new Error(`Failed to fetch memory usage: ${handleApiError(error)}`);
    }
  }
};
