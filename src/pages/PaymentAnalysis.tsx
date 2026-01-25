import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, CreditCard, Wallet, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentData {
    mode: string;
    count: number;
    amount: number;
    percentage: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function PaymentAnalysis() {
    const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<PaymentData[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: salesData } = await supabase
                .from('sales')
                .select('payment_mode, amount')
                .gte('bill_date', fromDate + ' 00:00:00')
                .lte('bill_date', toDate + ' 23:59:59');

            if (salesData && salesData.length > 0) {
                const grouped = salesData.reduce((acc: any, record: any) => {
                    const mode = record.payment_mode || 'CASH';
                    if (!acc[mode]) {
                        acc[mode] = { mode, count: 0, amount: 0 };
                    }
                    acc[mode].count += 1;
                    acc[mode].amount += Number(record.amount) || 0;
                    return acc;
                }, {});

                const total = salesData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                const result = Object.values(grouped).map((item: any) => ({
                    ...item,
                    percentage: total > 0 ? (item.amount / total * 100) : 0
                }));

                setData(result as PaymentData[]);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error:', error);
            setData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const total = data.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Payment Mode Analysis</h1>
                <p className="text-slate-400">Track payment method preferences</p>
            </div>

            {/* Filters */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 mb-8">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-400 mb-2"><Calendar size={16} className="inline mr-2" />From Date</label>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-slate-400 mb-2"><Calendar size={16} className="inline mr-2" />To Date</label>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none" />
                    </div>
                    <button onClick={fetchData} disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 px-6 py-2 rounded-lg font-semibold transition">
                        {loading ? 'Loading...' : 'Generate Report'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold mb-6">Payment Distribution</h2>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={data} dataKey="amount" nameKey="mode" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${entry.mode} (${entry.percentage.toFixed(1)}%)`}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-slate-500">
                            No data available
                        </div>
                    )}
                </div>

                {/* Summary Table */}
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h2 className="text-xl font-bold">Breakdown</h2>
                    </div>
                    <table className="w-full">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="text-left p-4 text-sm font-semibold">Mode</th>
                                <th className="text-right p-4 text-sm font-semibold">Count</th>
                                <th className="text-right p-4 text-sm font-semibold">Amount</th>
                                <th className="text-right p-4 text-sm font-semibold">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-t border-slate-800">
                                    <td className="p-4 flex items-center gap-2">
                                        {row.mode === 'CASH' && <Wallet className="text-emerald-400" size={18} />}
                                        {row.mode === 'CARD' && <CreditCard className="text-blue-400" size={18} />}
                                        {row.mode !== 'CASH' && row.mode !== 'CARD' && <FileText className="text-orange-400" size={18} />}
                                        <span className="font-medium">{row.mode}</span>
                                    </td>
                                    <td className="p-4 text-right">{row.count}</td>
                                    <td className="p-4 text-right font-semibold text-emerald-400">₹{row.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td className="p-4 text-right">
                                        <span className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm font-semibold">
                                            {row.percentage.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-slate-700 bg-slate-800/30">
                                <td className="p-4 font-bold">TOTAL</td>
                                <td className="p-4 text-right font-bold">{data.reduce((sum, d) => sum + d.count, 0)}</td>
                                <td className="p-4 text-right font-bold text-emerald-400">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                <td className="p-4 text-right font-bold">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
