import React, { useState, useEffect } from 'react';
import { Transaction } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { FinancialCoach } from './components/FinancialCoach';
import { LayoutDashboard, Receipt, Sparkles, PlusCircle, ShieldCheck, CloudOff, LogIn, LogOut, User } from 'lucide-react';
import { fetchTransactions, addTransactionToSheet, deleteTransactionFromSheet, initAuth, isAuthenticated, getUserEmail, login, logout } from './services/sheetService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'coach'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Initialize auth and data
  useEffect(() => {
    const authenticated = initAuth();
    setIsLoggedIn(authenticated);
    setUserEmail(getUserEmail());
    loadData();
  }, []);

  // Sync to local storage as backup/cache
  useEffect(() => {
    localStorage.setItem('cc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTransactions();
      if (data && data.length > 0) {
          setTransactions(data);
      } else if (!isAuthenticated()) {
          // Only seed if not authenticated and empty
           const seed: Transaction[] = [
            { id: '1', date: '2023-10-15', description: 'Seed Funding', amount: 50000, type: 'INCOME' as any, category: 'Grants (R&D / EMDG)', hasGST: false, gstAmount: 0 },
            { id: '2', date: '2023-10-20', description: 'MacBook Pro', amount: 3500, type: 'EXPENSE' as any, category: 'Equipment', hasGST: true, gstAmount: 318.18 },
        ];
        setTransactions(seed);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setUserEmail(null);
    setTransactions([]);
  };

  const handleAddTransaction = async (t: Transaction) => {
    // 1. Optimistic Update (Immediate UI feedback)
    setTransactions(prev => [t, ...prev]);
    setShowAddModal(false);
    
    // 2. Persist to Sheet
    try {
        await addTransactionToSheet(t);
    } catch (e) {
        console.error("Failed to save to sheet", e);
        // Optional: Revert optimistic update or show toast error
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    // 1. Optimistic Update
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    // 2. Persist to Sheet
    try {
        await deleteTransactionFromSheet(id);
    } catch (e) {
        console.error("Failed to delete from sheet", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 leading-none">
                Culture Crunch
              </h1>
              <span className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${isLoggedIn ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isLoggedIn ? <ShieldCheck size={10} /> : <CloudOff size={10} />}
                {isLoggedIn ? 'Connected to Google Sheets' : 'Local / Demo Mode'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1">
              <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Dashboard
              </button>
              <button 
                  onClick={() => setActiveTab('transactions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  Transactions
              </button>
              <button
                  onClick={() => setActiveTab('coach')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'coach' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Sparkles size={16} className={activeTab === 'coach' ? 'text-teal-500' : 'text-slate-400'} />
                  AI Coach
              </button>
            </nav>

            {/* Auth Button */}
            <div className="ml-4 pl-4 border-l border-slate-200">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                    <User size={14} />
                    <span className="max-w-[150px] truncate">{userEmail}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <LogIn size={16} />
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around p-3 pb-safe">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center gap-1 text-blue-600 -mt-6">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30 text-white">
                <PlusCircle size={24} />
            </div>
            <span className="text-[10px] font-medium">Add</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1 ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Receipt size={24} />
            <span className="text-[10px] font-medium">List</span>
        </button>
        <button onClick={() => setActiveTab('coach')} className={`flex flex-col items-center gap-1 ${activeTab === 'coach' ? 'text-teal-600' : 'text-slate-400'}`}>
            <Sparkles size={24} />
            <span className="text-[10px] font-medium">Coach</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Mobile Header / Title specific to tab */}
        <div className="mb-6 md:hidden">
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab === 'coach' ? 'Culture Coach' : activeTab}</h2>
        </div>

        {activeTab === 'dashboard' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Dashboard transactions={transactions} />
            </div>
        )}

        {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="hidden md:flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
                    <button 
                        onClick={() => setShowAddModal(!showAddModal)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                    >
                        {showAddModal ? 'Cancel' : 'Add New'}
                    </button>
                </div>

                {isLoading && (
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                    <ShieldCheck size={16} /> {isLoggedIn ? 'Syncing with Google Sheets...' : 'Loading...'}
                  </div>
                )}

                {!isLoggedIn && !isLoading && (
                  <div className="p-4 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center gap-2">
                    <CloudOff size={16} />
                    <span>You're in demo mode. <button onClick={handleLogin} className="underline font-medium hover:text-amber-900">Sign in with Google</button> to sync with your spreadsheet.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-3 ${showAddModal ? 'lg:col-span-2' : ''}`}>
                        <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
                    </div>
                    {/* Desktop Side Form */}
                    {showAddModal && (
                        <div className="lg:col-span-1 animate-in slide-in-from-right-8 fade-in duration-300">
                             <TransactionForm onAddTransaction={handleAddTransaction} />
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'coach' && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <FinancialCoach transactions={transactions} />
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                        <h4 className="font-semibold text-slate-800 mb-2">Listen</h4>
                        <p className="text-sm text-slate-500">I analyze your spending patterns to detect team energy levels.</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                        <h4 className="font-semibold text-slate-800 mb-2">Interpret</h4>
                        <p className="text-sm text-slate-500">High 'Meals' budget? Maybe connection is high, or maybe burnout is looming.</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                        <h4 className="font-semibold text-slate-800 mb-2">Reflect</h4>
                        <p className="text-sm text-slate-500">I help you turn financial data into leadership questions.</p>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* Mobile Add Modal */}
      {showAddModal && activeTab !== 'transactions' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:hidden backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Add Transaction</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                </div>
                <div className="p-4">
                    <TransactionForm onAddTransaction={handleAddTransaction} />
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;