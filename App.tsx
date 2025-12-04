import React, { useState, useEffect } from 'react';
import { Transaction, Subscription } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { SubscriptionForm } from './components/SubscriptionForm';
import { SubscriptionList } from './components/SubscriptionList';
import { FinancialCoach } from './components/FinancialCoach';
import { LayoutDashboard, Receipt, Sparkles, PlusCircle, ShieldCheck, CloudOff, LogIn, LogOut, User, RefreshCw } from 'lucide-react';
import {
  fetchTransactions, addTransactionToSheet, deleteTransactionFromSheet,
  fetchSubscriptions, addSubscriptionToSheet, updateSubscriptionInSheet, deleteSubscriptionFromSheet,
  initAuth, isAuthenticated, getUserEmail, login, logout
} from './services/sheetService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'subscriptions' | 'coach'>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Initialize auth and data
  useEffect(() => {
    const authenticated = initAuth();
    setIsLoggedIn(authenticated);
    setUserEmail(getUserEmail());
    setIsCheckingAuth(false);
    if (authenticated) {
      loadData();
    }
  }, []);

  // Sync to local storage as backup/cache
  useEffect(() => {
    localStorage.setItem('cc_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [transData, subData] = await Promise.all([
        fetchTransactions(),
        fetchSubscriptions()
      ]);
      setTransactions(transData || []);
      setSubscriptions(subData || []);
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
    setSubscriptions([]);
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

  // Subscription handlers
  const handleAddSubscription = async (s: Subscription) => {
    setSubscriptions(prev => [s, ...prev]);
    setShowAddSubModal(false);

    try {
      await addSubscriptionToSheet(s);
    } catch (e) {
      console.error("Failed to save subscription", e);
    }
  };

  const handleToggleSubscription = async (id: string) => {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;

    const newStatus = !sub.isActive;
    setSubscriptions(prev => prev.map(s =>
      s.id === id ? { ...s, isActive: newStatus } : s
    ));

    try {
      await updateSubscriptionInSheet(id, { isActive: newStatus });
    } catch (e) {
      console.error("Failed to update subscription", e);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));

    try {
      await deleteSubscriptionFromSheet(id);
    } catch (e) {
      console.error("Failed to delete subscription", e);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-3xl">C</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Culture Crunch</h1>
            <p className="text-slate-500 mb-8">Financial insights for your business</p>

            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="mt-6 text-xs text-slate-400">
              Only available for @culturecrunch.io accounts
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                  onClick={() => setActiveTab('subscriptions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'subscriptions' ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <RefreshCw size={16} className={activeTab === 'subscriptions' ? 'text-violet-500' : 'text-slate-400'} />
                  Subscriptions
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
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`flex flex-col items-center gap-1 ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Receipt size={20} />
            <span className="text-[10px] font-medium">Txns</span>
        </button>
        <button onClick={() => setActiveTab('subscriptions')} className={`flex flex-col items-center gap-1 ${activeTab === 'subscriptions' ? 'text-violet-600' : 'text-slate-400'}`}>
            <RefreshCw size={20} />
            <span className="text-[10px] font-medium">Subs</span>
        </button>
        <button onClick={() => setActiveTab('coach')} className={`flex flex-col items-center gap-1 ${activeTab === 'coach' ? 'text-teal-600' : 'text-slate-400'}`}>
            <Sparkles size={20} />
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
                <Dashboard transactions={transactions} subscriptions={subscriptions} />
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

        {activeTab === 'subscriptions' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="hidden md:flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Recurring Subscriptions</h2>
                    <button
                        onClick={() => setShowAddSubModal(!showAddSubModal)}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                    >
                        {showAddSubModal ? 'Cancel' : 'Add Subscription'}
                    </button>
                </div>

                {/* Mobile Add Button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setShowAddSubModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
                    >
                        <PlusCircle size={18} />
                        Add Subscription
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className={`lg:col-span-3 ${showAddSubModal ? 'lg:col-span-2' : ''}`}>
                        <SubscriptionList
                            subscriptions={subscriptions}
                            onDelete={handleDeleteSubscription}
                            onToggleActive={handleToggleSubscription}
                        />
                    </div>
                    {showAddSubModal && (
                        <div className="hidden lg:block lg:col-span-1 animate-in slide-in-from-right-8 fade-in duration-300">
                            <SubscriptionForm onAddSubscription={handleAddSubscription} />
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

      {/* Mobile Add Transaction Modal */}
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

      {/* Mobile Add Subscription Modal */}
      {showAddSubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 lg:hidden backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 sticky top-0 bg-white">
                    <h3 className="font-bold text-slate-900">Add Subscription</h3>
                    <button onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                </div>
                <div className="p-4">
                    <SubscriptionForm onAddSubscription={handleAddSubscription} />
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;