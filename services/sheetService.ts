import { Transaction } from '../types';

// Auth state management
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  expiresAt: number | null;
}

let authState: AuthState = {
  accessToken: null,
  refreshToken: null,
  email: null,
  expiresAt: null,
};

/**
 * Initialize auth state from URL params (after OAuth callback)
 */
export const initAuth = (): boolean => {
  // Check URL for auth params
  const url = new URL(window.location.href);
  const authParam = url.searchParams.get('auth');

  if (authParam) {
    try {
      const decoded = atob(authParam);
      const params = new URLSearchParams(decoded);

      authState = {
        accessToken: params.get('access_token'),
        refreshToken: params.get('refresh_token'),
        email: params.get('email'),
        expiresAt: Date.now() + (parseInt(params.get('expires_in') || '3600') * 1000),
      };

      // Save to localStorage for persistence
      localStorage.setItem('cc_auth', JSON.stringify(authState));

      // Clean URL
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url.toString());

      return true;
    } catch (e) {
      console.error('Failed to parse auth params:', e);
    }
  }

  // Try to restore from localStorage
  const saved = localStorage.getItem('cc_auth');
  if (saved) {
    try {
      authState = JSON.parse(saved);
      return !!authState.accessToken;
    } catch {
      // Invalid saved state
    }
  }

  return false;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!authState.accessToken;
};

/**
 * Get current user email
 */
export const getUserEmail = (): string | null => {
  return authState.email;
};

/**
 * Redirect to login
 */
export const login = (): void => {
  window.location.href = '/api/auth/login';
};

/**
 * Logout and clear auth state
 */
export const logout = (): void => {
  authState = {
    accessToken: null,
    refreshToken: null,
    email: null,
    expiresAt: null,
  };
  localStorage.removeItem('cc_auth');
  localStorage.removeItem('cc_transactions');
};

/**
 * Make authenticated API request
 */
const apiRequest = async (method: string, path: string, body?: any): Promise<any> => {
  if (!authState.accessToken) {
    throw new Error('Not authenticated');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${authState.accessToken}`,
    'Content-Type': 'application/json',
  };

  if (authState.refreshToken) {
    headers['X-Refresh-Token'] = authState.refreshToken;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  // Handle token refresh
  if (response.status === 401 && data.new_access_token) {
    authState.accessToken = data.new_access_token;
    authState.expiresAt = Date.now() + 3600 * 1000;
    localStorage.setItem('cc_auth', JSON.stringify(authState));

    // Retry the request
    return apiRequest(method, path, body);
  }

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

/**
 * Fetch all transactions from Google Sheet
 */
export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (!isAuthenticated()) {
    // Return cached transactions if available in local mode
    console.warn("Not authenticated - using local cache");
    const saved = localStorage.getItem('cc_transactions');
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const transactions = await apiRequest('GET', '/api/transactions');
    // Cache locally
    localStorage.setItem('cc_transactions', JSON.stringify(transactions));
    return transactions;
  } catch (e) {
    console.error("API Error:", e);
    // Fallback to local cache
    const saved = localStorage.getItem('cc_transactions');
    return saved ? JSON.parse(saved) : [];
  }
};

/**
 * Add a transaction to Google Sheet
 */
export const addTransactionToSheet = async (t: Transaction): Promise<void> => {
  if (!isAuthenticated()) {
    console.log("Not authenticated - transaction saved locally only", t);
    // Save to local cache
    const saved = localStorage.getItem('cc_transactions');
    const transactions = saved ? JSON.parse(saved) : [];
    transactions.push(t);
    localStorage.setItem('cc_transactions', JSON.stringify(transactions));
    return;
  }

  await apiRequest('POST', '/api/transactions', t);

  // Update local cache
  const saved = localStorage.getItem('cc_transactions');
  const transactions = saved ? JSON.parse(saved) : [];
  transactions.push(t);
  localStorage.setItem('cc_transactions', JSON.stringify(transactions));
};

/**
 * Delete a transaction from Google Sheet
 */
export const deleteTransactionFromSheet = async (id: string): Promise<void> => {
  if (!isAuthenticated()) {
    console.log("Not authenticated - deleting locally only", id);
    const saved = localStorage.getItem('cc_transactions');
    const transactions = saved ? JSON.parse(saved) : [];
    const filtered = transactions.filter((t: Transaction) => t.id !== id);
    localStorage.setItem('cc_transactions', JSON.stringify(filtered));
    return;
  }

  await apiRequest('DELETE', `/api/transactions?id=${encodeURIComponent(id)}`);

  // Update local cache
  const saved = localStorage.getItem('cc_transactions');
  const transactions = saved ? JSON.parse(saved) : [];
  const filtered = transactions.filter((t: Transaction) => t.id !== id);
  localStorage.setItem('cc_transactions', JSON.stringify(filtered));
};
