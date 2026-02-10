
// API Configuration
export const API_BASE_URL = 'https://interfast-api.mkaindo.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    MIKROTIK: {
      TEST_CONNECTION: '/api/mikrotik/test-connection',
      INTERFACES: '/api/mikrotik/interfaces',
      PPP_SECRETS: '/api/mikrotik/ppp/secrets',
      PPP_ACTIVE: '/api/mikrotik/ppp/active',
      WIRELESS: '/api/mikrotik/wireless',
      IP_ADDRESSES: '/api/mikrotik/ip/addresses',
      IP_ROUTES: '/api/mikrotik/ip/routes',
      SYSTEM_RESOURCE: '/api/mikrotik/system/resource',
      SYSTEM_IDENTITY: '/api/mikrotik/system/identity',
      QUEUES: '/api/mikrotik/queues',
      MONITORING: '/api/mikrotik/monitoring',
      // User management endpoints
      UPDATE_USER_STATUS: '/api/mikrotik/user/update-status',
      REGENERATE_CREDENTIALS: '/api/mikrotik/user/regenerate-credentials',
      CREATE_PPP_SECRET: '/api/mikrotik/user/create-secret',
      REMOVE_USER: '/api/mikrotik/user',
      DELETE_PPP_SECRET: '/api/mikrotik/ppp/secret',
      DISCONNECT_PPP_USER: '/api/mikrotik/ppp/active'
    },
    DATABASE: {
      USERS: '/db/users',
      PACKAGES: '/db/packages',
      TRANSACTIONS: '/db/transactions',
      FINANCIAL_SUMMARY: '/db/financial-summary',
      ANALYTICS: '/db/analytics',
      DASHBOARD_STATS: '/db/stats/dashboard'
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
