import { API_BASE_URL } from '@/config/api';

// Database service for PostgreSQL API calls
class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/db`;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Request failed');
    }

    return data.data;
  }

  // ==================== USERS ====================

  async getUsers(): Promise<any[]> {
    return this.request('/users');
  }

  async getUserById(id: string): Promise<any> {
    return this.request(`/users/${id}`);
  }

  async getUserByNik(nik: string): Promise<any> {
    return this.request(`/users/nik/${nik}`);
  }

  async createUser(user: any): Promise<any> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, updates: any): Promise<any> {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<any> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkInsertUsers(users: any[]): Promise<any> {
    return this.request('/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
  }

  // ==================== PACKAGES ====================

  async getPackages(): Promise<any[]> {
    return this.request('/packages');
  }

  async createPackage(pkg: any): Promise<any> {
    return this.request('/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  async updatePackage(id: string, pkg: any): Promise<any> {
    return this.request(`/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pkg),
    });
  }

  async deletePackage(id: string): Promise<any> {
    return this.request(`/packages/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FINANCIAL TRANSACTIONS ====================

  async getTransactions(month?: number, year?: number): Promise<any[]> {
    let endpoint = '/transactions';
    if (month && year) {
      endpoint += `?month=${month}&year=${year}`;
    }
    return this.request(endpoint);
  }

  async createTransaction(transaction: any): Promise<any> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id: string, transaction: any): Promise<any> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  async deleteTransaction(id: string): Promise<any> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FINANCIAL SUMMARY ====================

  async getFinancialSummary(month?: number, year?: number): Promise<any> {
    let endpoint = '/financial-summary';
    const params = [];
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    return this.request(endpoint);
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<any[]> {
    return this.request('/analytics');
  }

  // ==================== DASHBOARD ====================

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalRevenue: number;
  }> {
    return this.request('/stats/dashboard');
  }

  // ==================== CRON JOBS ====================

  async resetPaymentStatus(): Promise<any> {
    return this.request('/cron/reset-payment-status', {
      method: 'POST',
    });
  }

  async updateExpiredUsers(): Promise<any> {
    return this.request('/cron/update-expired-users', {
      method: 'POST',
    });
  }
}

export const databaseService = new DatabaseService();
