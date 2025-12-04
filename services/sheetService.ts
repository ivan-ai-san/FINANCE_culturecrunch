import { Transaction } from '../types';

/**
 * Checks if the app is running inside Google Apps Script iframe
 */
const isGAS = () => {
  return typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run;
};

/**
 * Helper to promisify google.script.run calls
 */
const runGAS = (functionName: keyof import('../types').GoogleScriptRun, ...args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isGAS()) {
      reject("Not running in GAS environment");
      return;
    }
    // @ts-ignore - dynamic access
    (window.google.script.run
      .withSuccessHandler((response: any) => resolve(response))
      .withFailureHandler((error: Error) => reject(error))
      [functionName] as any)(...args);
  });
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  if (isGAS()) {
    try {
      const data = await runGAS('getTransactions');
      // Normalize dates from GAS
      return data.map((t: any) => ({
        ...t,
        date: typeof t.date === 'string' && t.date.includes('T') ? t.date.split('T')[0] : new Date(t.date).toISOString().split('T')[0]
      }));
    } catch (e) {
      console.error("GAS Error:", e);
      throw e;
    }
  } else {
    // Local Dev Mock
    console.warn("Running in Local Mode (Offline)");
    const saved = localStorage.getItem('cc_transactions');
    return saved ? JSON.parse(saved) : [];
  }
};

export const addTransactionToSheet = async (t: Transaction) => {
  if (isGAS()) {
    await runGAS('addTransaction', t);
  } else {
    console.log("Local Mode: Transaction would be saved to sheet", t);
  }
};

export const deleteTransactionFromSheet = async (id: string) => {
  if (isGAS()) {
    await runGAS('deleteTransaction', id);
  } else {
    console.log("Local Mode: Transaction would be deleted", id);
  }
};