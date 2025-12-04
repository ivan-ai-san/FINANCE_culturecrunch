import React, { useState } from 'react';
import { Subscription, BillingFrequency } from '../types';
import { SUBSCRIPTION_CATEGORIES } from '../constants';
import { Plus } from 'lucide-react';

interface SubscriptionFormProps {
  onAddSubscription: (s: Subscription) => void;
}

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ onAddSubscription }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<BillingFrequency>(BillingFrequency.MONTHLY);
  const [category, setCategory] = useState(SUBSCRIPTION_CATEGORIES[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectionMonths, setProjectionMonths] = useState('12');
  const [hasGST, setHasGST] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || !name) return;

    const gstAmount = hasGST ? (val / 11) : 0;

    const newSubscription: Subscription = {
      id: crypto.randomUUID(),
      name,
      amount: val,
      frequency,
      category,
      startDate,
      projectionMonths: parseInt(projectionMonths) || 12,
      hasGST,
      gstAmount,
      isActive: true
    };

    onAddSubscription(newSubscription);
    setName('');
    setAmount('');
    setProjectionMonths('12');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-violet-500 rounded-full"></div>
        New Subscription
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">Service Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vercel, Google Workspace, Slack"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                className="w-full pl-7 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none font-mono"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Billing</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setFrequency(BillingFrequency.MONTHLY)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  frequency === BillingFrequency.MONTHLY ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setFrequency(BillingFrequency.ANNUAL)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  frequency === BillingFrequency.ANNUAL ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Start Date</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Project (months)</label>
            <select
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
              <option value="36">36 months</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
            >
              {SUBSCRIPTION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasGST}
                onChange={(e) => setHasGST(e.target.checked)}
                className="w-4 h-4 rounded text-violet-600 border-slate-300 focus:ring-violet-500"
              />
              <span className="text-sm text-slate-700">Includes GST (10%)</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Add Subscription
        </button>
      </form>
    </div>
  );
};
