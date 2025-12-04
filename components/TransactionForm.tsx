import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, GST_RATE } from '../constants';
import { categorizeTransaction } from '../services/geminiService';
import { Plus, Loader2, Sparkles } from 'lucide-react';

interface TransactionFormProps {
  onAddTransaction: (t: Transaction) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [hasGST, setHasGST] = useState(true);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const categories = type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || !description) return;

    // Calculate GST based on inclusive amount
    // If Total = 110, GST = 10 (1/11th)
    const gstAmount = hasGST ? (val / 11) : 0;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      description,
      amount: val,
      type,
      category,
      hasGST,
      gstAmount
    };

    onAddTransaction(newTransaction);
    setDescription('');
    setAmount('');
    // Reset defaults
    setCategory(type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  };

  const handleDescriptionBlur = async () => {
    if (description.length > 3 && type === TransactionType.EXPENSE) {
      setIsSuggesting(true);
      try {
        const suggested = await categorizeTransaction(description);
        if (EXPENSE_CATEGORIES.includes(suggested)) {
            setCategory(suggested);
        }
      } finally {
        setIsSuggesting(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
        New Transaction
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { setType(TransactionType.EXPENSE); setCategory(EXPENSE_CATEGORIES[0]); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === TransactionType.EXPENSE ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => { setType(TransactionType.INCOME); setCategory(INCOME_CATEGORIES[0]); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Revenue
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="space-y-1">
             <label className="text-xs font-medium text-slate-500">Amount (AUD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 flex justify-between">
            <span>Description</span>
            {isSuggesting && <span className="text-blue-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin"/> AI Suggesting...</span>}
          </label>
          <div className="relative">
            <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="e.g. Office Lunch, Canva Subscription"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
            {!isSuggesting && description.length === 0 && (
                <Sparkles className="absolute right-3 top-3 text-slate-300 w-4 h-4 pointer-events-none" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-end pb-3">
             <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                    type="checkbox" 
                    checked={hasGST} 
                    onChange={(e) => setHasGST(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Includes GST (10%)</span>
             </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </form>
    </div>
  );
};
