
// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.interfast.mkaindo.com/api',
  ENDPOINTS: {
    MIKROTIK: {
      TEST_CONNECTION: '/mikrotik/test-connection',
      INTERFACES: '/mikrotik/interfaces',
      PPP_SECRETS: '/mikrotik/ppp/secrets',
      PPP_ACTIVE: '/mikrotik/ppp/active',
      WIRELESS: '/mikrotik/wireless',
      IP_ADDRESSES: '/mikrotik/ip/addresses',
      IP_ROUTES: '/mikrotik/ip/routes',
      SYSTEM_RESOURCE: '/mikrotik/system/resource',
      SYSTEM_IDENTITY: '/mikrotik/system/identity',
      QUEUES: '/mikrotik/queues',
      MONITORING: '/mikrotik/monitoring',
      // User management endpoints - updated paths
      UPDATE_USER_STATUS: '/mikrotik/user/update-status',
      REGENERATE_CREDENTIALS: '/mikrotik/user/regenerate-credentials',
      CREATE_PPP_SECRET: '/mikrotik/user/create-secret',
      REMOVE_USER: '/mikrotik/user',
      DELETE_PPP_SECRET: '/mikrotik/ppp/secret',
      DISCONNECT_PPP_USER: '/mikrotik/ppp/active'
    }
  }
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// API Error Handler
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
