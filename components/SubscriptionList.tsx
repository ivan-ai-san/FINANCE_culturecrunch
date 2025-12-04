import React, { useMemo } from 'react';
import { Subscription, BillingFrequency } from '../types';
import { Trash2, RefreshCw, Calendar, TrendingUp, Pause, Play } from 'lucide-react';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({ subscriptions, onDelete, onToggleActive }) => {
  const { monthlyTotal, annualTotal, projectedTotal } = useMemo(() => {
    const active = subscriptions.filter(s => s.isActive);

    let monthly = 0;
    let annual = 0;
    let projected = 0;

    active.forEach(s => {
      const monthlyAmount = s.frequency === BillingFrequency.MONTHLY
        ? s.amount
        : s.amount / 12;

      monthly += monthlyAmount;
      annual += monthlyAmount * 12;
      projected += monthlyAmount * s.projectionMonths;
    });

    return { monthlyTotal: monthly, annualTotal: annual, projectedTotal: projected };
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
        <RefreshCw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400">No subscriptions tracked yet.</p>
        <p className="text-slate-300 text-sm mt-1">Add recurring expenses like Vercel, Slack, etc.</p>
      </div>
    );
  }

  const sorted = [...subscriptions].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return b.amount - a.amount;
  });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monthly</p>
          <p className="text-xl font-bold text-slate-900 mt-1">${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Annual</p>
          <p className="text-xl font-bold text-slate-900 mt-1">${annualTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-violet-50 p-4 rounded-xl border border-violet-100 shadow-sm">
          <p className="text-xs font-medium text-violet-600 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp size={12} /> Projected
          </p>
          <p className="text-xl font-bold text-violet-700 mt-1">${projectedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Subscription Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Monthly</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((s) => {
                const monthlyEquiv = s.frequency === BillingFrequency.MONTHLY ? s.amount : s.amount / 12;
                return (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors group ${!s.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-full bg-violet-100 text-violet-600">
                          <RefreshCw size={12} />
                        </span>
                        <div>
                          <span className={!s.isActive ? 'line-through' : ''}>{s.name}</span>
                          {!s.isActive && <span className="ml-2 text-xs text-slate-400">(paused)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {s.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Calendar size={12} />
                        {s.frequency === BillingFrequency.MONTHLY ? 'Monthly' : 'Annual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                      ${s.amount.toFixed(2)}
                      {s.hasGST && <span className="text-xs text-slate-400 ml-1">inc GST</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-violet-600 text-right whitespace-nowrap font-medium">
                      ${monthlyEquiv.toFixed(2)}/mo
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onToggleActive(s.id)}
                          className={`p-1.5 rounded transition-all opacity-0 group-hover:opacity-100 ${
                            s.isActive
                              ? 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'
                              : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={s.isActive ? 'Pause Subscription' : 'Resume Subscription'}
                        >
                          {s.isActive ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => onDelete(s.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                          title="Delete Subscription"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
