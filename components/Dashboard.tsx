import React, { useMemo } from 'react';
import { Transaction, TransactionType, Subscription, BillingFrequency } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, FileText, RefreshCw } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  subscriptions?: Subscription[];
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, subscriptions = [] }) => {
  const summary = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) {
        acc.revenue += t.amount;
        acc.gstCollected += t.gstAmount;
      } else {
        acc.expenses += t.amount;
        acc.gstPaid += t.gstAmount;
      }
      return acc;
    }, { revenue: 0, expenses: 0, gstCollected: 0, gstPaid: 0 });
  }, [transactions]);

  const profit = summary.revenue - summary.expenses;
  const gstPayable = summary.gstCollected - summary.gstPaid;

  // Calculate monthly subscription costs
  const subscriptionSummary = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(s => s.isActive);

    let monthlyTotal = 0;
    let annualTotal = 0;
    let monthlyGST = 0;

    activeSubscriptions.forEach(s => {
      if (s.frequency === BillingFrequency.MONTHLY) {
        monthlyTotal += s.amount;
        monthlyGST += s.gstAmount;
      } else {
        // Annual - convert to monthly
        monthlyTotal += s.amount / 12;
        monthlyGST += s.gstAmount / 12;
        annualTotal += s.amount;
      }
    });

    return {
      monthlyTotal,
      annualTotal,
      monthlyGST,
      count: activeSubscriptions.length
    };
  }, [subscriptions]);

  const chartData = useMemo(() => {
    // Group last 6 months
    const now = new Date();
    const data: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('default', { month: 'short' });
      
      // Filter transactions for this month
      const monthTrans = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear();
      });

      const inc = monthTrans.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
      const exp = monthTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

      data.push({ name: monthKey, Income: inc, Expense: exp });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">${summary.revenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp size={20} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Gross income inc. GST</p>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">${summary.expenses.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-rose-100 rounded-lg">
                <TrendingDown size={20} className="text-rose-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Total spend inc. GST</p>
        </div>

        {/* Card 3: Net Position */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Net Position</p>
              <h3 className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Revenue minus Expenses</p>
        </div>

        {/* Card 4: GST Payable */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-100 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Est. BAS Payable</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">${gstPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
                <FileText size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 relative z-10">GST Collected - GST Paid</p>
        </div>
      </div>

      {/* Subscription Summary */}
      {subscriptions.length > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-xl border border-violet-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={18} className="text-violet-600" />
            <h4 className="text-sm font-semibold text-slate-800">Recurring Subscriptions</h4>
            <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
              {subscriptionSummary.count} active
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Monthly Cost</p>
              <p className="text-lg font-bold text-slate-900">
                ${subscriptionSummary.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Annual Projection</p>
              <p className="text-lg font-bold text-slate-900">
                ${(subscriptionSummary.monthlyTotal * 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Monthly GST</p>
              <p className="text-lg font-bold text-slate-900">
                ${subscriptionSummary.monthlyGST.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">vs Expenses</p>
              <p className="text-lg font-bold text-violet-600">
                {summary.expenses > 0 ? ((subscriptionSummary.monthlyTotal / summary.expenses) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="text-sm font-semibold text-slate-800 mb-6">Cash Flow (Last 6 Months)</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
