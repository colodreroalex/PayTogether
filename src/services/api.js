const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // En producción, usar la misma URL
  : 'http://localhost:3001'; // En desarrollo, usar el puerto del servidor

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Usuarios
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: userData,
    });
  }

  // Categorías
  async getCategories() {
    return this.request('/categories');
  }

  // Grupos
  async getGroups() {
    return this.request('/groups');
  }

  async createGroup(groupData) {
    return this.request('/groups', {
      method: 'POST',
      body: groupData,
    });
  }

  // Gastos
  async getGroupExpenses(groupId) {
    return this.request(`/groups/${groupId}/expenses`);
  }

  async createExpense(expenseData) {
    return this.request('/expenses', {
      method: 'POST',
      body: expenseData,
    });
  }

  async updateExpense(expenseId, expenseData) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: expenseData,
    });
  }

  async deleteExpense(expenseId) {
    return this.request(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;