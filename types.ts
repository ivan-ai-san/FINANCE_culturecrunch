export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  hasGST: boolean;
  gstAmount: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  gstCollected: number;
  gstPaid: number;
  gstPayable: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// Type definitions for Google Apps Script Client-side Runner
export interface GoogleScriptRun {
  withSuccessHandler: (callback: (result: any) => void) => GoogleScriptRun;
  withFailureHandler: (callback: (error: Error) => void) => GoogleScriptRun;
  getTransactions: () => void;
  addTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
}

declare global {
  interface Window {
    google?: {
      script: {
        run: GoogleScriptRun;
      };
    };
  }
}
