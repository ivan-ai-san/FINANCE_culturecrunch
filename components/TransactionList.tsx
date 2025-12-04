import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) {
    return (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
            <p className="text-slate-400">No transactions recorded yet.</p>
        </div>
    );
  }

  // Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">GST</th>
            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                {new Date(t.date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                <div className="flex items-center gap-2">
                    <span className={`p-1 rounded-full ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {t.type === TransactionType.INCOME ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                    </span>
                    {t.description}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {t.category}
                </span>
              </td>
              <td className={`px-6 py-4 text-sm font-semibold text-right whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-900'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-400 text-right whitespace-nowrap">
                ${t.gstAmount.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                  title="Delete Transaction"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
